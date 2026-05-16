import { Adb, AdbDaemonTransport } from "@yume-chan/adb";
import AdbWebCredentialStore from "@yume-chan/adb-credential-web";
import {
  AdbDaemonWebUsbDevice,
  AdbDaemonWebUsbDeviceManager
} from "@yume-chan/adb-daemon-webusb";
import { AdbScrcpyClient, AdbScrcpyOptions2_4 } from "@yume-chan/adb-scrcpy";
import { Consumable, ReadableStream } from "@yume-chan/stream-extra";

export type DeviceConnection = {
  adb: Adb;
  serial: string;
  name: string;
  model: string;
  dispose: () => Promise<void>;
};

export type WebAdbErrorCode = "usbTransferInterrupted" | "deviceDisconnected" | "usbAborted" | "notAdbDevice" | "scrcpyStartFailed";

export class WebAdbError extends Error {
  code: WebAdbErrorCode;
  constructor(code: WebAdbErrorCode, message?: string) {
    super(message ?? code);
    this.code = code;
  }
}

const Manager = AdbDaemonWebUsbDeviceManager.BROWSER;

// 定义扩展的接口标识符类型，匹配 AdbDaemonWebUsbDevice 的构造函数需求
type UsbInterfaceIdentifier = {
  configuration: any;
  interface_: any;
  alternate: any;
};

async function ensureDeviceConfigurations(device: any) {
  if (device.configurations.length > 0) return;
  const wasOpened = device.opened;
  try {
    if (!wasOpened) {
      await device.open();
    }
    if (!device.configuration && device.configurations.length > 0) {
      try {
        await device.selectConfiguration(device.configurations[0]!.configurationValue);
      } catch (e) {
        console.error("Failed to select device configuration:", e);
      }
    }
  } finally {
    if (!wasOpened) {
      try {
        await device.close();
      } catch (e) {
        console.error("Failed to close device:", e);
      }
    }
  }
}

function scoreAdbInterfaceCandidate(candidate: UsbInterfaceIdentifier) {
  const a = candidate.alternate;
  let score = 0;
  if (a.interfaceClass === 0xff) score += 10;
  if (a.interfaceProtocol === 1) score += 10;
  if (a.interfaceSubclass === 0x42) score += 10;
  const endpoints: any[] = a.endpoints ?? [];
  const bulkCount = endpoints.filter((e) => e.type === "bulk").length;
  if (bulkCount >= 2) score += 10;
  if (bulkCount === 2 && endpoints.length === 2) score += 10;
  if (a.alternateSetting === 0) score += 2;
  return score;
}

async function getAdbInterfaceCandidates(device: any): Promise<UsbInterfaceIdentifier[]> {
  await ensureDeviceConfigurations(device);
  const candidates: UsbInterfaceIdentifier[] = [];
  for (const configuration of device.configurations) {
    for (const interface_ of configuration.interfaces) {
      for (const alternate of interface_.alternates) {
        if (alternate.interfaceClass !== 0xff) continue;
        const endpoints = alternate.endpoints ?? [];
        if (endpoints.length < 2) continue;
        const hasIn = endpoints.some((e: any) => e.direction === "in" && e.type === "bulk");
        const hasOut = endpoints.some((e: any) => e.direction === "out" && e.type === "bulk");
        if (!hasIn || !hasOut) continue;
        candidates.push({ configuration, interface_, alternate });
      }
    }
  }
  candidates.sort((a, b) => scoreAdbInterfaceCandidate(b) - scoreAdbInterfaceCandidate(a));
  return candidates;
}

function normalizeUsbError(error: any) {
  const message = error?.message ?? String(error);
  if (message.includes("transferOut") || message.includes("transfer error")) {
    return new WebAdbError("usbTransferInterrupted", "USB transfer interrupted. Replug the device and grant permission again.");
  }
  if (message.includes("transferIn")) {
    return new WebAdbError("usbTransferInterrupted", "USB transfer interrupted. Replug the device and grant permission again.");
  }
  if (message.includes("NotFoundError") || message.includes("disconnected")) {
    return new WebAdbError("deviceDisconnected", "Device disconnected. Please reconnect.");
  }
  if (message.includes("AbortError") || message.includes("signal is aborted")) {
    return new WebAdbError("usbAborted", "USB connection was interrupted. Please reconnect.");
  }
  if (error instanceof Error) return error;
  return new Error(message);
}

function isTransientUsbError(error: any) {
  const message = error?.message ?? String(error);
  return (
    message.includes("transferOut") ||
    message.includes("transferIn") ||
    message.includes("transfer error") ||
    message.includes("AbortError") ||
    message.includes("signal is aborted") ||
    message.includes("NotFoundError") ||
    message.includes("disconnected") ||
    message.includes("Unknown command")
  );
}

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function readDeviceModel(adb: Adb): Promise<string> {
  try {
    const output = await adb.subprocess.noneProtocol.spawnWaitText(["getprop", "ro.product.model"]);
    if (output && output.trim()) return output.trim();
  } catch (e) {
    console.warn("Failed to read device model:", e);
  }
  return "Android Device";
}

export class WebADB {
  private static instance: WebADB;
  private disposing = new Map<string, Promise<void>>();
  private requestingDevice: Promise<DeviceConnection | null> | null = null;

  private constructor() {}

  static getInstance() {
    if (!WebADB.instance) WebADB.instance = new WebADB();
    return WebADB.instance;
  }

  isSupported() {
    return Boolean(Manager);
  }

  isTransientError(error: any) {
    return isTransientUsbError(error);
  }

  private async waitForRelease(serial: string) {
    const task = this.disposing.get(serial);
    if (task) {
      await task;
    }
  }

  private async connectUsbDeviceWithCandidates(usbDevice: any) {
    const candidates = await getAdbInterfaceCandidates(usbDevice);
    if (!candidates.length) {
      throw new WebAdbError("notAdbDevice", "Selected device was not recognized as an ADB device.");
    }
    let lastError: any;
    for (let i = 0; i < candidates.length; i++) {
      const candidate = candidates[i]!;
      const device = new AdbDaemonWebUsbDevice(usbDevice, candidate, (navigator as any).usb);
      try {
        await this.waitForRelease(device.serial);
        return await this.#connectToDevice(device);
      } catch (e: any) {
        lastError = e;
        if (i < candidates.length - 1) {
          await delay(100);
          continue;
        }
      }
    }
    throw normalizeUsbError(lastError);
  }

  async requestDevice(): Promise<DeviceConnection | null> {
    if (!Manager) return null;
    if (this.requestingDevice) return this.requestingDevice;

    this.requestingDevice = (async () => {
      let usbDevice: any | undefined;
      try {
        try {
          usbDevice = await (navigator as any).usb.requestDevice({
            filters: [{}],
            exclusionFilters: [{ classCode: 3 }]
          });
        } catch {
          usbDevice = await (navigator as any).usb.requestDevice({ filters: [{}] });
        }
      } catch {
        return null;
      }
      if (!usbDevice) return null;

      return await this.connectUsbDeviceWithCandidates(usbDevice);
    })().finally(() => {
      this.requestingDevice = null;
    });

    return this.requestingDevice;
  }

  async connectGranted(serial?: string): Promise<DeviceConnection | null> {
    if (!Manager) return null;
    const devices: any[] = [];
    const allUsbDevices = await (navigator as any).usb.getDevices();
    for (const usbDevice of allUsbDevices) {
      const candidates = await getAdbInterfaceCandidates(usbDevice);
      if (!candidates.length) continue;
      const best = candidates[0]!;
      devices.push(new AdbDaemonWebUsbDevice(usbDevice, best, (navigator as any).usb));
    }

    if (!devices.length) return null;
    const pick = serial ? devices.find((d) => d.serial === serial) : devices[0];
    if (!pick) return null;

    await this.waitForRelease(pick.serial);
    return this.#connectToDevice(pick);
  }

  async startScrcpy(adb: Adb, opts?: { audio?: boolean; displayId?: number }) {
    const serverUrl = chrome.runtime.getURL("scrcpy-server-v2.4");
    const response = await fetch(serverUrl);
    if (!response.body) {
      throw new Error("Failed to fetch scrcpy server");
    }

    const reader = response.body.getReader();
    const stream = new ReadableStream<Consumable<Uint8Array>>({
      async pull(controller) {
        const { done, value } = await reader.read();
        if (done) {
          controller.close();
          return;
        }
        controller.enqueue(new Consumable(value));
      },
      async cancel() {
        await reader.cancel();
      }
    });

    try {
      await adb.subprocess.noneProtocol.spawnWait("pkill app_process");
    } catch (e) {
      console.warn("Failed to kill existing scrcpy process:", e);
    }

    await AdbScrcpyClient.pushServer(adb, stream);
    
    const options = new AdbScrcpyOptions2_4({
      videoCodec: "h264" as any,
      audio: Boolean(opts?.audio),
      audioCodec: "raw" as any,
      maxSize: 1024,
      videoBitRate: 4_000_000,
      displayId: opts?.displayId ?? 0,
      tunnelForward: true,
      scid: "12345",
      sendDeviceMeta: false,
      sendFrameMeta: true,
      sendDummyByte: true
    } as any);

    try {
      const client = await AdbScrcpyClient.start(adb, "/data/local/tmp/scrcpy-server.jar", options);
      return client;
    } catch (e: any) {
      console.error("Scrcpy start failed:", e);
      
      let details = "";
      if (e.output && Array.isArray(e.output)) {
        details = "\nServer Output:\n" + e.output.join("\n");
      } else {
        try {
          const logcat = await adb.subprocess.noneProtocol.spawnWaitText("logcat -d -s scrcpy");
          if (logcat) {
            details = "\nLogcat (scrcpy):\n" + logcat;
          }
        } catch (logcatError) {
          console.warn("Failed to retrieve logcat:", logcatError);
        }
      }

      throw new WebAdbError(
        "scrcpyStartFailed",
        `Failed to start scrcpy server: ${e.message || "Unknown error"}${details}\nThe device may be incompatible or background-restricted.`
      );
    }
  }

  async #connectToDevice(device: any, attempt = 0): Promise<DeviceConnection> {
    let connection: any;
    try {
      connection = await device.connect();
    } catch (e) {
      if (attempt < 3 && isTransientUsbError(e)) {
        await delay(500 * (attempt + 1));
        return this.#connectToDevice(device, attempt + 1);
      }
      throw normalizeUsbError(e);
    }
    try {
      const credentialStore = new AdbWebCredentialStore();
      const transport = await AdbDaemonTransport.authenticate({
        serial: device.serial,
        connection,
        credentialStore
      });
      const adb = new Adb(transport);
      const model = await readDeviceModel(adb);
      return {
        adb,
        serial: device.serial,
        name: device.name,
        model,
        dispose: async () => {
          const task = (async () => {
            try {
              await adb.close();
            } catch (e) {
              console.error("Failed to close ADB connection:", e);
            }
            // Wait for ADB transport to close
            await delay(50);
            if (typeof connection.close === "function") {
              try {
                await connection.close();
              } catch (e) {
                console.error("Failed to close USB connection:", e);
              }
            }
            // Wait for USB device to reset/close
            await delay(200);
          })();
          this.disposing.set(device.serial, task);
          try {
            await task;
          } finally {
            this.disposing.delete(device.serial);
          }
        }
      };
    } catch (e) {
      try {
        await connection?.close?.();
      } catch (closeError) {
        console.error("Failed to close connection after error:", closeError);
      }
      if (attempt < 3 && isTransientUsbError(e)) {
        await delay(500 * (attempt + 1));
        return this.#connectToDevice(device, attempt + 1);
      }
      throw normalizeUsbError(e);
    }
  }
}
