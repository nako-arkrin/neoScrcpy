import {
  AndroidKeyCode,
  AndroidKeyEventAction,
  AndroidKeyEventMeta,
  AndroidMotionEventAction,
  AndroidMotionEventButton
} from "@yume-chan/scrcpy";

export type PipMode = "none" | "document";

type MapFn = (args: { clientX: number; clientY: number; target: HTMLElement }) => {
  x: number;
  y: number;
  vw: number;
  vh: number;
} | null;

const PIP_BAR_HEIGHT = 56;

export function isDocumentPipSupported(): boolean {
  return typeof (window as any).documentPictureInPicture?.requestWindow === "function";
}

export function isCaptureStreamSupported(canvas: HTMLCanvasElement): boolean {
  return typeof canvas.captureStream === "function";
}

function iconSvg(name: "back" | "power" | "pip" | "soundOn" | "soundOff") {
  if (name === "back") {
    return `<svg width="20" height="20" stroke-width="1.8" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" color="currentColor" aria-hidden="true"><path d="M15 6L9 12L15 18" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"></path></svg>`;
  }
  if (name === "power") {
    return `<svg width="20" height="20" stroke-width="1.8" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" color="currentColor" aria-hidden="true"><path d="M12 7V17" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"></path><path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"></path></svg>`;
  }
  if (name === "soundOn") {
    return `<svg width="20" height="20" stroke-width="1.8" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" color="currentColor" aria-hidden="true"><path d="M2 14.5V9.5C2 8.67157 2.67157 8 3.5 8H6L10.4 4.7C11.0592 4.20561 12 4.67602 12 5.5V18.5C12 19.324 11.0592 19.7944 10.4 19.3L6 16H3.5C2.67157 16 2 15.3284 2 14.5Z" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"></path><path d="M16 8.5C17.3333 10.2778 17.3333 13.7222 16 15.5" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"></path><path d="M19 6C21.6667 9.55556 21.6667 14.4444 19 18" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"></path></svg>`;
  }
  if (name === "soundOff") {
    return `<svg width="20" height="20" stroke-width="1.8" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" color="currentColor" aria-hidden="true"><path d="M2 14.5V9.5C2 8.67157 2.67157 8 3.5 8H6L10.4 4.7C11.0592 4.20561 12 4.67602 12 5.5V18.5C12 19.324 11.0592 19.7944 10.4 19.3L6 16H3.5C2.67157 16 2 15.3284 2 14.5Z" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"></path><path d="M16 10L21 15" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"></path><path d="M21 10L16 15" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"></path></svg>`;
  }
  return `<svg width="20" height="20" viewBox="0 0 24 24" stroke-width="1.8" fill="none" xmlns="http://www.w3.org/2000/svg" color="currentColor" aria-hidden="true"><path d="M2 19V5C2 3.89543 2.89543 3 4 3H20C21.1046 3 22 3.89543 22 5V19C22 20.1046 21.1046 21 20 21H4C2.89543 21 2 20.1046 2 19Z" stroke="currentColor"></path><path d="M2 7L22 7" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"></path><path d="M5 5.01L5.01 4.99889" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"></path><path d="M8 5.01L8.01 4.99889" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"></path><path d="M11 5.01L11.01 4.99889" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"></path></svg>`;
}

function getMetaState(event: KeyboardEvent) {
  let meta = AndroidKeyEventMeta.None;
  if (event.shiftKey) meta |= AndroidKeyEventMeta.Shift;
  if (event.ctrlKey) meta |= AndroidKeyEventMeta.Ctrl;
  if (event.altKey) meta |= AndroidKeyEventMeta.Alt;
  if (event.metaKey) meta |= AndroidKeyEventMeta.Meta;
  return meta;
}

function mapKeyCode(code: string): AndroidKeyCode | undefined {
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
    const key = code[3];
    const letterMap: Record<string, AndroidKeyCode> = {
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
    return letterMap[key];
  }

  if (code.startsWith("Digit") && code.length === 6) {
    const digit = code[5];
    const digitMap: Record<string, AndroidKeyCode> = {
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
    return digitMap[digit];
  }

  return table[code];
}

function getInitialPipSize(canvas: HTMLCanvasElement) {
  const canvasWidth = canvas.width || 360;
  const canvasHeight = canvas.height || 640;
  const videoAspect = canvasWidth / canvasHeight;
  const maxHeight = Math.max(420, Math.min(900, Math.floor(window.screen.availHeight * 0.86)));
  const maxWidth = Math.max(320, Math.min(720, Math.floor(window.screen.availWidth * 0.46)));
  const maxVideoHeight = Math.max(280, maxHeight - PIP_BAR_HEIGHT);
  const scale = Math.min(maxWidth / canvasWidth, maxVideoHeight / canvasHeight);
  const width = Math.max(280, Math.min(maxWidth, Math.round(canvasWidth * scale)));
  const videoHeight = Math.max(280, Math.min(maxVideoHeight, Math.round(width / videoAspect)));

  return { width, height: videoHeight + PIP_BAR_HEIGHT };
}

export async function openDocumentPip(args: {
  canvas: HTMLCanvasElement;
  title: string;
  getController: () => any | null;
  mapClientToVideo: MapFn;
  audioEnabled?: boolean;
  labels?: {
    back: string;
    audioOn: string;
    audioOff: string;
    power: string;
    pip: string;
  };
  onToolbarClose?: () => void | Promise<void>;
  onClosed: () => void;
}) {
  const log = (...parts: unknown[]) => console.log("[neoScrcpy:PiP]", ...parts);
  const docPip = (window as any).documentPictureInPicture;

  log("open requested", {
    documentPipSupported: isDocumentPipSupported(),
    captureStreamSupported: isCaptureStreamSupported(args.canvas),
    canvasWidth: args.canvas.width,
    canvasHeight: args.canvas.height
  });

  if (!docPip?.requestWindow) {
    console.error("[neoScrcpy:PiP] Document Picture-in-Picture is unavailable. Use Chrome 116+ or enable Document PiP support.");
    return null;
  }

  if (!isCaptureStreamSupported(args.canvas)) {
    console.error("[neoScrcpy:PiP] Canvas captureStream is not supported.");
    return null;
  }

  const stream = args.canvas.captureStream(30);
  if (!stream) {
    console.error("[neoScrcpy:PiP] Failed to capture canvas stream.");
    return null;
  }

  let cleaned = false;
  let win: Window | null = null;
  let video: HTMLVideoElement | null = null;

  const cleanup = () => {
    if (cleaned) return;
    cleaned = true;
    log("cleanup");
    stream.getTracks().forEach((track) => {
      try {
        track.stop();
      } catch (error) {
        console.error("[neoScrcpy:PiP] Failed to stop capture track:", error);
      }
    });
    if (video) {
      video.srcObject = null;
    }
  };

  try {
    log("requestWindow start");
    const initialSize = getInitialPipSize(args.canvas);
    const pipWindow: Window = await docPip.requestWindow({
      width: initialSize.width,
      height: initialSize.height,
      disallowReturnToOpener: false
    });
    win = pipWindow;
    log("requestWindow success");

    const doc = pipWindow.document;
    const applyTheme = () => {
      const theme = document.documentElement.dataset.theme === "dark" ? "dark" : "light";
      doc.documentElement.dataset.theme = theme;
      doc.documentElement.style.colorScheme = theme;
    };
    applyTheme();

    const themeListener = (changes: Record<string, chrome.storage.StorageChange>, areaName: string) => {
      if (areaName === "local" && changes.themeMode) {
        window.setTimeout(applyTheme, 0);
      }
    };
    chrome.storage?.onChanged?.addListener(themeListener);

    const style = doc.createElement("style");
    style.textContent = `
      :root {
        color-scheme: light;
        --pip-bar-bg: #fff;
        --pip-bar-border: rgba(0,0,0,0.08);
        --pip-text: #111827;
        --pip-muted: #6b7280;
        --pip-button-bg: transparent;
        --pip-button-hover: rgba(0,0,0,0.08);
        --pip-button-disabled: rgba(17,24,39,0.36);
      }
      :root[data-theme="dark"] {
        color-scheme: dark;
        --pip-bar-bg: #1b1b1f;
        --pip-bar-border: rgba(255,255,255,0.1);
        --pip-text: #f4f4f5;
        --pip-muted: #a1a1aa;
        --pip-button-bg: transparent;
        --pip-button-hover: rgba(255,255,255,0.1);
        --pip-button-disabled: rgba(244,244,245,0.36);
      }
      html, body { height: 100%; margin: 0; font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial; }
      body { background: #0b0b0c; overflow: hidden; }
      .root { display: flex; flex-direction: column; height: 100%; width: 100%; }
      .videoWrap { flex: 1 1 auto; background: #000; display: flex; align-items: center; justify-content: center; overflow: hidden; position: relative; }
      .video { width: 100%; height: 100%; object-fit: contain; touch-action: none; cursor: default; outline: none; }
      .pipBar { flex: 0 0 auto; min-height: ${PIP_BAR_HEIGHT}px; padding: 8px 10px; box-sizing: border-box; background: var(--pip-bar-bg); border-top: 1px solid var(--pip-bar-border); display: flex; align-items: center; justify-content: space-between; gap: 8px; }
      .pipLeft { display: flex; align-items: center; gap: 6px; min-width: 0; }
      .pipActions { display: flex; gap: 6px; }
      .headerTitle { min-width: 0; font-size: 15px; font-weight: 800; color: var(--pip-text); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
      .iconBtn { width: 40px; height: 40px; border-radius: 999px; border: 0; background: var(--pip-button-bg); color: var(--pip-text); display: inline-flex; align-items: center; justify-content: center; padding: 0; cursor: pointer; }
      .iconBtn:hover { background: var(--pip-button-hover); }
      .iconBtn:disabled { color: var(--pip-button-disabled); cursor: default; }
      .iconBtn:disabled:hover { background: transparent; }
    `;
    doc.head.appendChild(style);

    doc.body.innerHTML = "";
    const root = doc.createElement("div");
    root.className = "root";

    const videoWrap = doc.createElement("div");
    videoWrap.className = "videoWrap";

    video = doc.createElement("video");
    video.className = "video";
    video.autoplay = true;
    video.muted = true;
    video.playsInline = true;
    video.tabIndex = 0;
    video.srcObject = stream;
    videoWrap.appendChild(video);

    const bar = doc.createElement("div");
    bar.className = "pipBar";
    const left = doc.createElement("div");
    left.className = "pipLeft";
    const backButton = doc.createElement("button");
    backButton.className = "iconBtn";
    backButton.title = args.labels?.back ?? "Back";
    backButton.type = "button";
    backButton.innerHTML = iconSvg("back");
    const titleEl = doc.createElement("div");
    titleEl.className = "headerTitle";
    titleEl.textContent = args.title;
    left.appendChild(backButton);
    left.appendChild(titleEl);

    const actions = doc.createElement("div");
    actions.className = "pipActions";
    const audioButton = doc.createElement("button");
    audioButton.className = "iconBtn";
    audioButton.title = args.audioEnabled ? args.labels?.audioOff ?? "Disable ADB audio" : args.labels?.audioOn ?? "Enable ADB audio";
    audioButton.type = "button";
    audioButton.innerHTML = iconSvg(args.audioEnabled ? "soundOn" : "soundOff");
    const powerButton = doc.createElement("button");
    powerButton.className = "iconBtn";
    powerButton.title = args.labels?.power ?? "Power";
    powerButton.type = "button";
    powerButton.innerHTML = iconSvg("power");
    const pipButton = doc.createElement("button");
    pipButton.className = "iconBtn";
    pipButton.title = args.labels?.pip ?? "PiP";
    pipButton.type = "button";
    pipButton.innerHTML = iconSvg("pip");
    actions.appendChild(audioButton);
    actions.appendChild(powerButton);
    actions.appendChild(pipButton);
    bar.appendChild(left);
    bar.appendChild(actions);

    root.appendChild(videoWrap);
    root.appendChild(bar);
    doc.body.appendChild(root);

    const onDown = async (event: PointerEvent) => {
      const controller = args.getController();
      if (!controller || !video) {
        console.warn("[neoScrcpy:PiP] pointerdown ignored: controller/video is not ready");
        return;
      }
      const mapped = args.mapClientToVideo({ clientX: event.clientX, clientY: event.clientY, target: video });
      if (!mapped) {
        console.warn("[neoScrcpy:PiP] pointerdown ignored: outside video content");
        return;
      }
      log("pointerdown", mapped);
      event.preventDefault();
      video.focus();
      video.setPointerCapture?.(event.pointerId);
      const actionButton = event.button === 0 ? AndroidMotionEventButton.Primary : AndroidMotionEventButton.Secondary;
      const buttons = event.buttons & 1 ? AndroidMotionEventButton.Primary : AndroidMotionEventButton.None;
      await controller.injectTouch({
        action: AndroidMotionEventAction.Down,
        pointerId: BigInt(event.pointerId),
        pointerX: mapped.x,
        pointerY: mapped.y,
        videoWidth: mapped.vw,
        videoHeight: mapped.vh,
        pressure: event.pressure || 1,
        actionButton,
        buttons
      });
    };

    const onMove = async (event: PointerEvent) => {
      const controller = args.getController();
      if (!controller || !video) return;
      const mapped = args.mapClientToVideo({ clientX: event.clientX, clientY: event.clientY, target: video });
      if (!mapped) return;
      event.preventDefault();
      const buttons = event.buttons & 1 ? AndroidMotionEventButton.Primary : AndroidMotionEventButton.None;
      await controller.injectTouch({
        action: AndroidMotionEventAction.Move,
        pointerId: BigInt(event.pointerId),
        pointerX: mapped.x,
        pointerY: mapped.y,
        videoWidth: mapped.vw,
        videoHeight: mapped.vh,
        pressure: event.pressure || (buttons ? 1 : 0),
        actionButton: 0,
        buttons
      });
    };

    const onUp = async (event: PointerEvent) => {
      const controller = args.getController();
      if (!controller || !video) {
        console.warn("[neoScrcpy:PiP] pointerup ignored: controller/video is not ready");
        return;
      }
      const mapped = args.mapClientToVideo({ clientX: event.clientX, clientY: event.clientY, target: video });
      if (!mapped) {
        console.warn("[neoScrcpy:PiP] pointerup ignored: outside video content");
        return;
      }
      log("pointerup", mapped);
      event.preventDefault();
      const actionButton = event.button === 0 ? AndroidMotionEventButton.Primary : AndroidMotionEventButton.Secondary;
      await controller.injectTouch({
        action: AndroidMotionEventAction.Up,
        pointerId: BigInt(event.pointerId),
        pointerX: mapped.x,
        pointerY: mapped.y,
        videoWidth: mapped.vw,
        videoHeight: mapped.vh,
        pressure: 0,
        actionButton,
        buttons: AndroidMotionEventButton.None
      });
      try {
        video.releasePointerCapture?.(event.pointerId);
      } catch {}
    };

    const onKeyDown = async (event: KeyboardEvent) => {
      const controller = args.getController();
      if (!controller) return;
      const meta = getMetaState(event);
      const code = mapKeyCode(event.code);
      if (code !== undefined) {
        event.preventDefault();
        log("keydown", { code: event.code, key: event.key });
        await controller.injectKeyCode({
          action: AndroidKeyEventAction.Down,
          keyCode: code,
          repeat: event.repeat ? 1 : 0,
          metaState: meta
        });
        return;
      }
      if (event.key.length === 1 && !event.ctrlKey && !event.metaKey) {
        event.preventDefault();
        log("text input", { key: event.key });
        await controller.injectText(event.key);
      }
    };

    const onKeyUp = async (event: KeyboardEvent) => {
      const controller = args.getController();
      if (!controller) return;
      const code = mapKeyCode(event.code);
      if (code === undefined) return;
      event.preventDefault();
      await controller.injectKeyCode({
        action: AndroidKeyEventAction.Up,
        keyCode: code,
        repeat: 0,
        metaState: getMetaState(event)
      });
    };

    const onCloseButton = () => {
      log("close requested from PiP toolbar");
      void args.onToolbarClose?.();
      notifyClosed();
      try {
        pipWindow.close();
      } catch {}
    };

    const onPowerButton = async () => {
      const controller = args.getController();
      if (!controller) {
        console.warn("[neoScrcpy:PiP] power ignored: controller is not ready");
        return;
      }
      log("power button clicked");
      await controller.injectKeyCode({
        action: AndroidKeyEventAction.Down,
        keyCode: AndroidKeyCode.Power,
        repeat: 0,
        metaState: AndroidKeyEventMeta.None
      });
      await controller.injectKeyCode({
        action: AndroidKeyEventAction.Up,
        keyCode: AndroidKeyCode.Power,
        repeat: 0,
        metaState: AndroidKeyEventMeta.None
      });
    };

    const onAudioButton = () => {
      console.log("[neoScrcpy:Audio] audio can be changed before connecting. Reopen PiP to apply a different audio state.");
    };

    let closePoll: number | undefined;
    let closedNotified = false;

    const notifyClosed = () => {
      if (closedNotified) return;
      closedNotified = true;
      cleanupWithListeners();
      args.onClosed();
    };

    const onPageHide = (event: PageTransitionEvent) => {
      log("window pagehide observed", {
        persisted: event.persisted,
        closed: pipWindow.closed,
        visibilityState: pipWindow.document.visibilityState
      });

      window.setTimeout(() => {
        if (pipWindow.closed) {
          log("window close confirmed after pagehide");
          notifyClosed();
          return;
        }
        log("pagehide ignored because PiP window is still open");
      }, 250);
    };

    const cleanupWithListeners = () => {
      pipWindow.removeEventListener("pagehide", onPageHide);
      doc.removeEventListener("keydown", onKeyDown);
      doc.removeEventListener("keyup", onKeyUp);
      if (closePoll !== undefined) {
        window.clearInterval(closePoll);
        closePoll = undefined;
      }
      video?.removeEventListener("pointerdown", onDown);
      video?.removeEventListener("pointermove", onMove);
      video?.removeEventListener("pointerup", onUp);
      video?.removeEventListener("pointercancel", onUp);
      backButton.removeEventListener("click", onCloseButton);
      audioButton.removeEventListener("click", onAudioButton);
      pipButton.removeEventListener("click", onCloseButton);
      powerButton.removeEventListener("click", onPowerButton);
      chrome.storage?.onChanged?.removeListener(themeListener);
      cleanup();
    };

    video.addEventListener("pointerdown", onDown, { passive: false });
    video.addEventListener("pointermove", onMove, { passive: false });
    video.addEventListener("pointerup", onUp, { passive: false });
    video.addEventListener("pointercancel", onUp, { passive: false });
    doc.addEventListener("keydown", onKeyDown);
    doc.addEventListener("keyup", onKeyUp);
    backButton.addEventListener("click", onCloseButton);
    audioButton.addEventListener("click", onAudioButton);
    pipButton.addEventListener("click", onCloseButton);
    powerButton.addEventListener("click", onPowerButton);
    video.addEventListener("error", (event) => {
      console.error("[neoScrcpy:PiP] video error:", event);
      status.textContent = "ERROR";
      status.style.background = "rgba(239,68,68,0.9)";
    });

    pipWindow.addEventListener("pagehide", onPageHide, { once: true });
    closePoll = window.setInterval(() => {
      if (pipWindow.closed) {
        log("window close detected by poll");
        notifyClosed();
      }
    }, 500);

    log("ready");
    log("video.play start");
    void video.play().then(
      () => {
        video?.focus();
        log("video.play success");
      },
      (error) => {
        console.error("[neoScrcpy:PiP] video.play failed, keeping Document PiP window open for debugging:", error);
        status.textContent = "VIDEO ERROR";
        status.style.background = "rgba(239,68,68,0.9)";
      }
    );

    return { win: pipWindow, cleanup: cleanupWithListeners };
  } catch (error) {
    console.error("[neoScrcpy:PiP] failed:", error);
    cleanup();
    try {
      win?.close();
    } catch {}
    return null;
  }
}
