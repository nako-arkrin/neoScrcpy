export type FastbootConnection = {
  serial: string;
  name: string;
  model: string;
  execute: (command: string) => Promise<string>;
  dispose: () => Promise<void>;
};

type UsbInterfaceIdentifier = {
  configuration: any;
  interface_: any;
  alternate: any;
};

const FASTBOOT_CLASS = 0xff;
const FASTBOOT_SUBCLASS = 0x42;
const FASTBOOT_PROTOCOL = 0x03;
const textEncoder = new TextEncoder();
const textDecoder = new TextDecoder();

function getUsb() {
  return (navigator as any).usb;
}

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function ensureDeviceConfigurations(device: any) {
  if (device.configurations.length > 0) return;
  const wasOpened = device.opened;
  try {
    if (!wasOpened) await device.open();
    if (!device.configuration && device.configurations.length > 0) {
      await device.selectConfiguration(device.configurations[0]!.configurationValue).catch(() => {});
    }
  } finally {
    if (!wasOpened) await device.close().catch(() => {});
  }
}

async function getFastbootInterfaceCandidates(device: any): Promise<UsbInterfaceIdentifier[]> {
  await ensureDeviceConfigurations(device);
  const candidates: UsbInterfaceIdentifier[] = [];
  for (const configuration of device.configurations) {
    for (const interface_ of configuration.interfaces) {
      for (const alternate of interface_.alternates) {
        if (
          alternate.interfaceClass !== FASTBOOT_CLASS ||
          alternate.interfaceSubclass !== FASTBOOT_SUBCLASS ||
          alternate.interfaceProtocol !== FASTBOOT_PROTOCOL
        ) {
          continue;
        }
        const endpoints: any[] = alternate.endpoints ?? [];
        const hasIn = endpoints.some((e) => e.direction === "in" && e.type === "bulk");
        const hasOut = endpoints.some((e) => e.direction === "out" && e.type === "bulk");
        if (hasIn && hasOut) candidates.push({ configuration, interface_, alternate });
      }
    }
  }
  return candidates;
}

function readPacket(data: DataView) {
  const text = textDecoder.decode(data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength));
  return {
    status: text.slice(0, 4),
    payload: text.slice(4)
  };
}

function normalizeFastbootError(error: any) {
  const message = error?.message ?? String(error);
  if (message.includes("Access denied")) {
    return new Error(
      "Fastboot USB access denied. On Windows, install or switch the Fastboot/Bootloader interface driver to WinUSB, then close adb.exe/fastboot.exe and replug the device."
    );
  }
  return error instanceof Error ? error : new Error(message);
}

async function connectUsbFastbootDevice(usbDevice: any): Promise<FastbootConnection | null> {
  const candidates = await getFastbootInterfaceCandidates(usbDevice);
  if (!candidates.length) return null;
  let lastError: any;

  for (const candidate of candidates) {
    const inEndpoint = candidate.alternate.endpoints.find((e: any) => e.direction === "in" && e.type === "bulk");
    const outEndpoint = candidate.alternate.endpoints.find((e: any) => e.direction === "out" && e.type === "bulk");
    if (!inEndpoint || !outEndpoint) continue;

    try {
      if (!usbDevice.opened) await usbDevice.open();
      if (usbDevice.configuration?.configurationValue !== candidate.configuration.configurationValue) {
        await usbDevice.selectConfiguration(candidate.configuration.configurationValue);
      }
      await usbDevice.claimInterface(candidate.interface_.interfaceNumber);
      if (candidate.alternate.alternateSetting !== 0) {
        await usbDevice.selectAlternateInterface(candidate.interface_.interfaceNumber, candidate.alternate.alternateSetting);
      }

      const execute = async (command: string) => {
        const trimmed = command.trim();
        if (!trimmed) return "";
        await usbDevice.transferOut(outEndpoint.endpointNumber, textEncoder.encode(trimmed));
        const info: string[] = [];
        for (let i = 0; i < 256; i += 1) {
          const result = await usbDevice.transferIn(inEndpoint.endpointNumber, 64);
          const packet = readPacket(result.data);
          if (packet.status === "INFO") {
            if (packet.payload) info.push(packet.payload);
            continue;
          }
          if (packet.status === "OKAY") {
            if (packet.payload) info.push(packet.payload);
            return info.join("\n").trim();
          }
          if (packet.status === "FAIL") {
            throw new Error(packet.payload || "Fastboot command failed");
          }
          if (packet.status === "DATA") {
            throw new Error("Fastboot DATA responses are not supported in this command line.");
          }
          throw new Error(`Unexpected Fastboot response: ${packet.status}${packet.payload}`);
        }
        throw new Error("Fastboot response timed out.");
      };

      const serial = usbDevice.serialNumber || usbDevice.serial || "fastboot-device";
      let model = usbDevice.productName || "Fastboot Device";
      try {
        model = (await execute("getvar product")) || model;
      } catch {
        await delay(60);
      }

      return {
        serial,
        name: usbDevice.productName || model,
        model,
        execute,
        dispose: async () => {
          try {
            await usbDevice.releaseInterface(candidate.interface_.interfaceNumber);
          } catch {}
          try {
            await usbDevice.close();
          } catch {}
        }
      };
    } catch (error) {
      lastError = error;
      try {
        await usbDevice.close();
      } catch {}
      await delay(80);
    }
  }

  if (lastError) throw normalizeFastbootError(lastError);
  return null;
}

export class WebFastboot {
  private static instance: WebFastboot;

  static getInstance() {
    if (!WebFastboot.instance) WebFastboot.instance = new WebFastboot();
    return WebFastboot.instance;
  }

  isSupported() {
    return Boolean(getUsb());
  }

  async requestDevice(): Promise<FastbootConnection | null> {
    const usb = getUsb();
    if (!usb) return null;
    let device: any;
    try {
      try {
        device = await usb.requestDevice({
          filters: [{}],
          exclusionFilters: [{ classCode: 3 }]
        });
      } catch {
        device = await usb.requestDevice({ filters: [{}] });
      }
    } catch {
      return null;
    }
    return connectUsbFastbootDevice(device);
  }

  async listGranted(): Promise<FastbootConnection[]> {
    const usb = getUsb();
    if (!usb) return [];
    const devices: any[] = await usb.getDevices();
    const connections: FastbootConnection[] = [];
    for (const device of devices) {
      const connection = await connectUsbFastbootDevice(device).catch(() => null);
      if (connection) connections.push(connection);
    }
    return connections;
  }

  async connectGranted(serial?: string): Promise<FastbootConnection | null> {
    const connections = await this.listGranted();
    const picked = serial ? connections.find((device) => device.serial === serial) : connections[0];
    await Promise.all(connections.filter((device) => device !== picked).map((device) => device.dispose().catch(() => {})));
    return picked ?? null;
  }
}
