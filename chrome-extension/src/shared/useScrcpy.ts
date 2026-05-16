import { useCallback, useEffect, useRef, useState, useMemo } from "react";
import { WebADB, DeviceConnection } from "./webadb";
import type { AdbScrcpyAudioStreamMetadata, AdbScrcpyClient } from "@yume-chan/adb-scrcpy";
import { WebCodecsVideoDecoder, WebGLVideoFrameRenderer } from "@yume-chan/scrcpy-decoder-webcodecs";
import {
  AndroidKeyCode,
  AndroidKeyEventAction,
  AndroidKeyEventMeta,
  AndroidMotionEventAction,
  AndroidMotionEventButton
} from "@yume-chan/scrcpy";
import type { Locale } from "./storage";
import { t, type I18nKey } from "./i18n";

type Size = { width: number; height: number };
type ConnectOptions = ({ mode: "prompt" } | { mode: "granted"; serial?: string }) & {
  audio?: boolean;
  displayId?: number;
};

type Status =
  | { type: "disconnected" }
  | { type: "connecting"; retry: boolean }
  | { type: "cancelled" }
  | { type: "connectedStarting" }
  | { type: "decoderInit" }
  | { type: "webglUnavailable" }
  | { type: "mirroringActive" }
  | { type: "noVideoStream" }
  | { type: "videoStreamError"; message: string }
  | { type: "connectFailed"; error: { i18nKey?: I18nKey; message?: string } };

function normalizeErrorInfo(error: any): { i18nKey?: I18nKey; message?: string } {
  const message = error?.message ?? String(error);
  const code = (error && typeof error === "object" && "code" in error ? (error as any).code : undefined) as
    | "usbTransferInterrupted"
    | "deviceDisconnected"
    | "usbAborted"
    | "notAdbDevice"
    | "scrcpyStartFailed"
    | undefined;
  if (code === "usbTransferInterrupted") return { i18nKey: "error.usbTransferInterrupted" };
  if (code === "deviceDisconnected") return { i18nKey: "error.deviceDisconnected" };
  if (code === "usbAborted") return { i18nKey: "error.usbAborted" };
  if (code === "notAdbDevice") return { i18nKey: "error.notAdbDevice" };
  if (code === "scrcpyStartFailed") return { i18nKey: "error.scrcpyStartFailed", message };
  if (message.includes("transferOut") || message.includes("transfer error") || message.includes("transferIn")) {
    return { i18nKey: "error.usbTransferInterruptedLong" };
  }
  if (message.includes("AbortError") || message.includes("signal is aborted")) {
    return { i18nKey: "error.usbTimeout" };
  }
  return { message };
}

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function readScrcpyOutput(client: AdbScrcpyClient<any>, timeoutMs = 700) {
  const output = client.output;
  if (!output) return "";
  const reader = output.getReader();
  const lines: string[] = [];
  const timeout = new Promise<"timeout">((resolve) => window.setTimeout(() => resolve("timeout"), timeoutMs));
  try {
    while (lines.join("\n").length < 4000) {
      const result = await Promise.race([reader.read(), timeout]);
      if (result === "timeout") break;
      if (result.done) break;
      if (result.value) lines.push(result.value);
    }
  } catch (error) {
    console.warn("[neoScrcpy] failed to read scrcpy server output:", error);
  } finally {
    reader.releaseLock();
  }
  return lines.join("\n").trim();
}

function startAudioPlayback(metadata: AdbScrcpyAudioStreamMetadata) {
  if (metadata.type !== "success") {
    console.warn("[neoScrcpy:Audio] audio stream unavailable:", metadata.type);
    return () => {};
  }
  if (metadata.codec.optionValue !== "raw") {
    console.warn("[neoScrcpy:Audio] unsupported audio codec for direct playback:", metadata.codec.optionValue);
    metadata.stream.cancel().catch(() => {});
    return () => {};
  }

  const AudioContextCtor = (globalThis as any).AudioContext || (globalThis as any).webkitAudioContext;
  if (!AudioContextCtor) {
    console.warn("[neoScrcpy:Audio] Web Audio is not supported in this browser.");
    metadata.stream.cancel().catch(() => {});
    return () => {};
  }

  const reader = metadata.stream.getReader();
  const audioContext: AudioContext = new AudioContextCtor({ sampleRate: 48000 });
  let stopped = false;
  let nextPlayTime = audioContext.currentTime + 0.08;
  const channels = 2;
  const sampleRate = 48000;
  const bytesPerSample = 2;
  const bytesPerFrame = channels * bytesPerSample;

  console.log("[neoScrcpy:Audio] raw PCM playback started", {
    codec: metadata.codec.optionValue,
    mimeType: metadata.codec.mimeType,
    sampleRate,
    channels
  });
  void audioContext.resume().catch((e) => console.warn("[neoScrcpy:Audio] audio context resume failed:", e));

  void (async () => {
    try {
      while (!stopped) {
        const { done, value } = await reader.read();
        if (done) break;
        if (value.type !== "data" || !value.data.byteLength) continue;

        const frameCount = Math.floor(value.data.byteLength / bytesPerFrame);
        if (!frameCount) continue;

        const buffer = audioContext.createBuffer(channels, frameCount, sampleRate);
        const left = buffer.getChannelData(0);
        const right = buffer.getChannelData(1);
        const view = new DataView(value.data.buffer, value.data.byteOffset, frameCount * bytesPerFrame);
        for (let i = 0; i < frameCount; i++) {
          left[i] = view.getInt16(i * bytesPerFrame, true) / 32768;
          right[i] = view.getInt16(i * bytesPerFrame + bytesPerSample, true) / 32768;
        }

        const source = audioContext.createBufferSource();
        source.buffer = buffer;
        source.connect(audioContext.destination);
        const startAt = Math.max(audioContext.currentTime, nextPlayTime);
        source.start(startAt);
        nextPlayTime = startAt + buffer.duration;
      }
    } catch (e) {
      if (!stopped) {
        console.error("[neoScrcpy:Audio] stream error:", e);
      }
    }
  })();

  return () => {
    stopped = true;
    reader.cancel().catch(() => {});
    void audioContext.close().catch(() => {});
  };
}

export function useScrcpy(locale: Locale) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [status, setStatus] = useState<Status>({ type: "disconnected" });
  const [deviceModel, setDeviceModel] = useState("");
  const [videoSize, setVideoSize] = useState<Size | null>(null);
  const videoSizeRef = useRef<Size | null>(null);
  const clientRef = useRef<AdbScrcpyClient<any> | null>(null);
  const controllerRef = useRef<any | null>(null);
  const adbRef = useRef<any | null>(null);
  const deviceConnectionRef = useRef<DeviceConnection | null>(null);
  const audioCleanupRef = useRef<(() => void) | null>(null);
  const isConnectingRef = useRef(false);

  const connect = useCallback(
    async (opts?: ConnectOptions) => {
      if (isConnectingRef.current) return null;
      if (adbRef.current) {
        return {
          adb: adbRef.current,
          serial: opts?.mode === "granted" ? opts.serial ?? "" : "",
          name: "Connected Device",
          model: deviceModel
        };
      }
      isConnectingRef.current = true;
      const webadb = WebADB.getInstance();
      let preferredSerial = opts?.mode === "granted" ? opts.serial : undefined;
      const cleanupFailedConnection = async () => {
        audioCleanupRef.current?.();
        audioCleanupRef.current = null;

        try {
          if (clientRef.current) {
            await clientRef.current.close();
          }
        } catch (closeError) {
          console.error("Failed to close scrcpy client:", closeError);
        }

        try {
          if (deviceConnectionRef.current) {
            await deviceConnectionRef.current.dispose();
          }
        } catch (disposeError) {
          console.error("Failed to dispose device connection:", disposeError);
        } finally {
          clientRef.current = null;
          controllerRef.current = null;
          adbRef.current = null;
          deviceConnectionRef.current = null;
          videoSizeRef.current = null;
          setVideoSize(null);
          setIsConnected(false);
        }
      };
      try {
        for (let attempt = 0; attempt < 3; attempt++) {
          try {
            setStatus({ type: "connecting", retry: attempt !== 0 });
            let device: DeviceConnection | null =
              attempt === 0
                ? opts?.mode === "granted"
                  ? await webadb.connectGranted(opts.serial)
                  : await webadb.requestDevice()
                : preferredSerial
                  ? await webadb.connectGranted(preferredSerial)
                  : await webadb.requestDevice();
            if (!device && attempt === 0 && opts?.mode === "granted") {
              device = await webadb.requestDevice();
            }

            if (!device) {
              setStatus({ type: "cancelled" });
              return null;
            }

            preferredSerial = device.serial;
            adbRef.current = device.adb;
            deviceConnectionRef.current = device;
            setDeviceModel(device.model);
            setStatus({ type: "connectedStarting" });

            const client = await webadb.startScrcpy(device.adb, {
              audio: opts?.audio,
              displayId: opts?.displayId
            });
            clientRef.current = client;

            if (opts?.audio && client.audioStream) {
              void client.audioStream
                .then((metadata) => {
                  audioCleanupRef.current = startAudioPlayback(metadata);
                })
                .catch((e) => console.error("[neoScrcpy:Audio] failed to start audio stream:", e));
            }

            if (client.videoStream && canvasRef.current) {
              setStatus({ type: "decoderInit" });
              let videoStream: Awaited<NonNullable<typeof client.videoStream>>;
              try {
                videoStream = await client.videoStream;
              } catch (videoError: any) {
                const serverOutput = await readScrcpyOutput(client);
                throw new Error(
                  `${videoError?.message ?? String(videoError)}${
                    serverOutput ? `\nServer Output:\n${serverOutput}` : ""
                  }`
                );
              }

              const canvas = canvasRef.current;
              const gl =
                canvas.getContext("webgl", { preserveDrawingBuffer: true }) ||
                canvas.getContext("experimental-webgl", { preserveDrawingBuffer: true });
              if (!gl) {
                setStatus({ type: "webglUnavailable" });
                await cleanupFailedConnection();
                return null;
              }

              const renderer = new WebGLVideoFrameRenderer(canvas);
              const decoder = new WebCodecsVideoDecoder({
                codec: videoStream.metadata.codec,
                renderer
              });

              videoStream.sizeChanged(({ width, height }: Size) => {
                canvas.width = width;
                canvas.height = height;
                videoSizeRef.current = { width, height };
                setVideoSize({ width, height });
              });

              videoStream.stream.pipeTo(decoder.writable).catch(async (e: any) => {
                console.error("Video stream error", e);
                let logDetails = "";
                if (adbRef.current) {
                  try {
                    const logcat = await adbRef.current.subprocess.noneProtocol.spawnWaitText("logcat -d -s scrcpy");
                    if (logcat) {
                      logDetails = "\nLogcat:\n" + logcat;
                    }
                  } catch (logcatError) {
                    console.warn("Failed to retrieve logcat:", logcatError);
                  }
                }
                setStatus({ type: "videoStreamError", message: `${e?.message ?? String(e)}${logDetails}` });
              });

              if (client.controller) {
                controllerRef.current = client.controller;
              }

              setIsConnected(true);
              setStatus({ type: "mirroringActive" });
              return device;
            }

            setStatus({ type: "noVideoStream" });
            await cleanupFailedConnection();
            return null;
          } catch (e: any) {
            console.error("Connection failed:", e);
            await cleanupFailedConnection();
            if (attempt === 2 || !webadb.isTransientError(e)) {
              setStatus({ type: "connectFailed", error: normalizeErrorInfo(e) });
              setIsConnected(false);
              return null;
            }
            await delay(300 * (attempt + 1));
          }
        }
        return null;
      } catch (e: any) {
        console.error("Connection failed:", e);

        let logDetails = "";
        if (
          adbRef.current &&
          (String(e).includes("readable was ended") ||
            String(e).includes("stream error") ||
            String(e).includes("AbortError"))
        ) {
          try {
            const logcat = await adbRef.current.subprocess.noneProtocol.spawnWaitText("logcat -d -s scrcpy");
            if (logcat) {
              logDetails = "\nLogcat:\n" + logcat;
            }
          } catch (logcatError) {
            console.warn("Failed to retrieve logcat:", logcatError);
          }
        }

        await cleanupFailedConnection();
        setStatus({ type: "connectFailed", error: normalizeErrorInfo({ ...(e ?? {}), message: `${e?.message ?? String(e)}${logDetails}` }) });
        setIsConnected(false);
        return null;
      } finally {
        isConnectingRef.current = false;
      }
    },
    []
  );

  const disconnect = useCallback(async () => {
    audioCleanupRef.current?.();
    audioCleanupRef.current = null;

    try {
      if (clientRef.current) {
        await clientRef.current.close();
      }
    } catch (e) {
      console.error("Failed to close scrcpy client:", e);
    }
    
    try {
      if (deviceConnectionRef.current) {
        await deviceConnectionRef.current.dispose();
      }
    } catch (e) {
      console.error("Failed to dispose device connection:", e);
    } finally {
      clientRef.current = null;
      controllerRef.current = null;
      adbRef.current = null;
      deviceConnectionRef.current = null;
      videoSizeRef.current = null;
      setVideoSize(null);
      setIsConnected(false);
      setStatus({ type: "disconnected" });
    }
  }, []);

  useEffect(() => () => void disconnect(), [disconnect]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const handleWheel = (ev: WheelEvent) => {
      if (!controllerRef.current) return;
      ev.preventDefault();
      const rect = canvas.getBoundingClientRect();
      const size = videoSizeRef.current ?? { width: rect.width, height: rect.height };
      const x = Math.max(0, Math.min(size.width - 1, Math.round(((ev.clientX - rect.left) * size.width) / rect.width)));
      const y = Math.max(0, Math.min(size.height - 1, Math.round(((ev.clientY - rect.top) * size.height) / rect.height)));
      const scrollX = Math.sign(ev.deltaX);
      const scrollY = Math.sign(ev.deltaY);
      void controllerRef.current.injectScroll({
        pointerX: x,
        pointerY: y,
        videoWidth: size.width,
        videoHeight: size.height,
        scrollX,
        scrollY
      });
    };
    canvas.addEventListener("wheel", handleWheel, { passive: false });
    return () => {
      canvas.removeEventListener("wheel", handleWheel as any);
    };
  }, [isConnected]);

  const mapToVideo = useCallback((e: React.PointerEvent<HTMLCanvasElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const size = videoSizeRef.current ?? { width: rect.width, height: rect.height };
    const x = Math.max(0, Math.min(size.width - 1, Math.round(((e.clientX - rect.left) * size.width) / rect.width)));
    const y = Math.max(0, Math.min(size.height - 1, Math.round(((e.clientY - rect.top) * size.height) / rect.height)));
    return { x, y, vw: size.width, vh: size.height };
  }, []);

  const onPointerDown = useCallback(
    async (e: React.PointerEvent<HTMLCanvasElement>) => {
      if (!controllerRef.current) return;
      e.preventDefault();
      e.currentTarget.focus();
      e.currentTarget.setPointerCapture(e.pointerId);
      const { x, y, vw, vh } = mapToVideo(e);
      const actionButton = e.button === 0 ? AndroidMotionEventButton.Primary : AndroidMotionEventButton.Secondary;
      const buttons = e.buttons & 1 ? AndroidMotionEventButton.Primary : AndroidMotionEventButton.None;
      await controllerRef.current.injectTouch({
        action: AndroidMotionEventAction.Down,
        pointerId: BigInt(e.pointerId),
        pointerX: x,
        pointerY: y,
        videoWidth: vw,
        videoHeight: vh,
        pressure: e.pressure || 1,
        actionButton,
        buttons
      });
    },
    [mapToVideo]
  );

  const onPointerMove = useCallback(
    async (e: React.PointerEvent<HTMLCanvasElement>) => {
      if (!controllerRef.current) return;
      e.preventDefault();
      const { x, y, vw, vh } = mapToVideo(e);
      const buttons = e.buttons & 1 ? AndroidMotionEventButton.Primary : AndroidMotionEventButton.None;
      await controllerRef.current.injectTouch({
        action: AndroidMotionEventAction.Move,
        pointerId: BigInt(e.pointerId),
        pointerX: x,
        pointerY: y,
        videoWidth: vw,
        videoHeight: vh,
        pressure: e.pressure || (buttons ? 1 : 0),
        actionButton: 0,
        buttons
      });
    },
    [mapToVideo]
  );

  const onPointerUp = useCallback(
    async (e: React.PointerEvent<HTMLCanvasElement>) => {
      if (!controllerRef.current) return;
      e.preventDefault();
      const { x, y, vw, vh } = mapToVideo(e);
      const actionButton = e.button === 0 ? AndroidMotionEventButton.Primary : AndroidMotionEventButton.Secondary;
      await controllerRef.current.injectTouch({
        action: AndroidMotionEventAction.Up,
        pointerId: BigInt(e.pointerId),
        pointerX: x,
        pointerY: y,
        videoWidth: vw,
        videoHeight: vh,
        pressure: 0,
        actionButton,
        buttons: AndroidMotionEventButton.None
      });
      try {
        e.currentTarget.releasePointerCapture(e.pointerId);
      } catch (captureError) {
        // Ignore pointer capture release errors
      }
    },
    [mapToVideo]
  );

  const onWheel = useCallback((e: React.WheelEvent<HTMLCanvasElement>) => {
    // Wheel events are handled by the native event listener
    // This callback is kept for React event compatibility
  }, []);

  const getMetaState = (e: React.KeyboardEvent<HTMLCanvasElement>) => {
    let meta = AndroidKeyEventMeta.None;
    if (e.shiftKey) meta |= AndroidKeyEventMeta.Shift;
    if (e.ctrlKey) meta |= AndroidKeyEventMeta.Ctrl;
    if (e.altKey) meta |= AndroidKeyEventMeta.Alt;
    if (e.metaKey) meta |= AndroidKeyEventMeta.Meta;
    return meta;
  };

  const mapKeyCode = (code: string): AndroidKeyCode | undefined => {
    const table: Record<string, AndroidKeyCode> = {
      Enter: AndroidKeyCode.Enter,
      Backspace: AndroidKeyCode.Backspace,
      Escape: AndroidKeyCode.Escape,
      Space: AndroidKeyCode.Space,
      Tab: AndroidKeyCode.Tab,
      ArrowUp: AndroidKeyCode.ArrowUp,
      ArrowDown: AndroidKeyCode.ArrowDown,
      ArrowLeft: AndroidKeyCode.ArrowLeft,
      ArrowRight: AndroidKeyCode.ArrowRight,
      Home: AndroidKeyCode.Home,
      End: AndroidKeyCode.End,
      PageUp: AndroidKeyCode.PageUp,
      PageDown: AndroidKeyCode.PageDown,
      Insert: AndroidKeyCode.Insert,
      Delete: AndroidKeyCode.Delete,
      F1: AndroidKeyCode.F1,
      F2: AndroidKeyCode.F2,
      F3: AndroidKeyCode.F3,
      F4: AndroidKeyCode.F4,
      F5: AndroidKeyCode.F5,
      F6: AndroidKeyCode.F6,
      F7: AndroidKeyCode.F7,
      F8: AndroidKeyCode.F8,
      F9: AndroidKeyCode.F9,
      F10: AndroidKeyCode.F10,
      F11: AndroidKeyCode.F11,
      F12: AndroidKeyCode.F12,
      Period: AndroidKeyCode.Period,
      Comma: AndroidKeyCode.Comma,
      Minus: AndroidKeyCode.Minus,
      Equal: AndroidKeyCode.Equal,
      BracketLeft: AndroidKeyCode.BracketLeft,
      BracketRight: AndroidKeyCode.BracketRight,
      Backslash: AndroidKeyCode.Backslash,
      Semicolon: AndroidKeyCode.Semicolon,
      Quote: AndroidKeyCode.Quote,
      Slash: AndroidKeyCode.Slash,
      Backquote: AndroidKeyCode.Backquote
    };
    if (code.startsWith("Key") && code.length === 4) {
      const ch = code[3];
      const map: Record<string, AndroidKeyCode> = {
        A: AndroidKeyCode.KeyA,
        B: AndroidKeyCode.KeyB,
        C: AndroidKeyCode.KeyC,
        D: AndroidKeyCode.KeyD,
        E: AndroidKeyCode.KeyE,
        F: AndroidKeyCode.KeyF,
        G: AndroidKeyCode.KeyG,
        H: AndroidKeyCode.KeyH,
        I: AndroidKeyCode.KeyI,
        J: AndroidKeyCode.KeyJ,
        K: AndroidKeyCode.KeyK,
        L: AndroidKeyCode.KeyL,
        M: AndroidKeyCode.KeyM,
        N: AndroidKeyCode.KeyN,
        O: AndroidKeyCode.KeyO,
        P: AndroidKeyCode.KeyP,
        Q: AndroidKeyCode.KeyQ,
        R: AndroidKeyCode.KeyR,
        S: AndroidKeyCode.KeyS,
        T: AndroidKeyCode.KeyT,
        U: AndroidKeyCode.KeyU,
        V: AndroidKeyCode.KeyV,
        W: AndroidKeyCode.KeyW,
        X: AndroidKeyCode.KeyX,
        Y: AndroidKeyCode.KeyY,
        Z: AndroidKeyCode.KeyZ
      };
      return map[ch];
    }
    if (code.startsWith("Digit") && code.length === 6) {
      const d = code[5];
      const map: Record<string, AndroidKeyCode> = {
        "0": AndroidKeyCode.Digit0,
        "1": AndroidKeyCode.Digit1,
        "2": AndroidKeyCode.Digit2,
        "3": AndroidKeyCode.Digit3,
        "4": AndroidKeyCode.Digit4,
        "5": AndroidKeyCode.Digit5,
        "6": AndroidKeyCode.Digit6,
        "7": AndroidKeyCode.Digit7,
        "8": AndroidKeyCode.Digit8,
        "9": AndroidKeyCode.Digit9
      };
      return map[d];
    }
    return table[code];
  };

  const onKeyDown = useCallback(async (e: React.KeyboardEvent<HTMLCanvasElement>) => {
    if (!controllerRef.current) return;
    const meta = getMetaState(e);
    const code = mapKeyCode(e.code);
    if (code !== undefined) {
      e.preventDefault();
      await controllerRef.current.injectKeyCode({
        action: AndroidKeyEventAction.Down,
        keyCode: code,
        repeat: e.repeat ? 1 : 0,
        metaState: meta
      });
      return;
    }
    if (e.key.length === 1 && !e.ctrlKey && !e.metaKey) {
      e.preventDefault();
      await controllerRef.current.injectText(e.key);
    }
  }, []);

  const onKeyUp = useCallback(async (e: React.KeyboardEvent<HTMLCanvasElement>) => {
    if (!controllerRef.current) return;
    const meta = getMetaState(e);
    const code = mapKeyCode(e.code);
    if (code !== undefined) {
      e.preventDefault();
      await controllerRef.current.injectKeyCode({
        action: AndroidKeyEventAction.Up,
        keyCode: code,
        repeat: 0,
        metaState: meta
      });
    }
  }, []);

  const onCompositionEnd = useCallback(async (e: React.CompositionEvent<HTMLCanvasElement>) => {
    if (!controllerRef.current) return;
    const text = e.data;
    if (text) await controllerRef.current.injectText(text);
  }, []);

  const sendPowerKey = useCallback(async () => {
    if (!controllerRef.current) return;
    await controllerRef.current.injectKeyCode({
      action: AndroidKeyEventAction.Down,
      keyCode: AndroidKeyCode.Power,
      repeat: 0,
      metaState: AndroidKeyEventMeta.None
    });
    await controllerRef.current.injectKeyCode({
      action: AndroidKeyEventAction.Up,
      keyCode: AndroidKeyCode.Power,
      repeat: 0,
      metaState: AndroidKeyEventMeta.None
    });
  }, []);

  const getVideoSize = useCallback(() => videoSizeRef.current, []);

  const statusText = useMemo(() => {
    if (status.type === "disconnected") return t(locale, "scrcpy.status.disconnected");
    if (status.type === "connecting") return t(locale, status.retry ? "scrcpy.status.retrying" : "scrcpy.status.connecting");
    if (status.type === "cancelled") return t(locale, "scrcpy.status.cancelled");
    if (status.type === "connectedStarting") return t(locale, "scrcpy.status.connectedStarting");
    if (status.type === "decoderInit") return t(locale, "scrcpy.status.decoderInit");
    if (status.type === "webglUnavailable") return t(locale, "scrcpy.status.webglUnavailable");
    if (status.type === "mirroringActive") return t(locale, "scrcpy.status.mirroringActive");
    if (status.type === "noVideoStream") return t(locale, "scrcpy.status.noVideoStream");
    if (status.type === "videoStreamError") return t(locale, "scrcpy.status.videoStreamError", { message: status.message });
    const message = status.error.i18nKey
      ? status.error.message
        ? t(locale, status.error.i18nKey, { message: status.error.message })
        : t(locale, status.error.i18nKey)
      : status.error.message ?? "";
    return t(locale, "error.connectFailed", { message });
  }, [locale, status]);

  return useMemo(
    () => ({
      canvasRef,
      isConnected,
      status: statusText,
      deviceModel,
      videoSize,
      connect,
      disconnect,
      adbRef,
      controllerRef,
      getVideoSize,
      onPointerDown,
      onPointerMove,
      onPointerUp,
      onWheel,
      onKeyDown,
      onKeyUp,
      onCompositionEnd,
      sendPowerKey
    }),
    [
      isConnected,
      statusText,
      deviceModel,
      videoSize,
      connect,
      disconnect,
      getVideoSize,
      onPointerDown,
      onPointerMove,
      onPointerUp,
      onWheel,
      onKeyDown,
      onKeyUp,
      onCompositionEnd,
      sendPowerKey
    ]
  );
}
