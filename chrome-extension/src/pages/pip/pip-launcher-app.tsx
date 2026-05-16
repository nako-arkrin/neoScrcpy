import React, { useEffect, useMemo, useRef, useState } from "react";
import { IconButton } from "../../ui/m3";
import { IconSoundOff, IconSoundOn, IconUsb } from "../../ui/icons";
import { getState, Locale, ThemeMode } from "../../shared/storage";
import { resolveTheme } from "../../shared/theme";
import { openDocumentPip } from "../../shared/pip";
import { useScrcpy } from "../../shared/useScrcpy";
import { WebADB } from "../../shared/webadb";
import { t } from "../../shared/i18n";

function getLaunchParams() {
  const params = new URLSearchParams(window.location.search);
  return {
    serial: params.get("serial") || undefined,
    title: params.get("title") || "Android Device",
    audio: params.get("audio") === "1"
  };
}

const primaryButton: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  minHeight: 46,
  border: 0,
  borderRadius: 12,
  padding: "0 24px",
  background: "var(--color-on-surface)",
  color: "var(--color-surface)",
  fontSize: 14,
  fontWeight: 700,
  cursor: "pointer",
  boxShadow: "var(--shadow-1)",
  transition: "transform 120ms ease, opacity 120ms ease"
};

const secondaryButton: React.CSSProperties = {
  ...primaryButton,
  background: "var(--color-surface-container-high)",
  color: "var(--color-on-surface)",
  boxShadow: "none"
};

const ghostButton: React.CSSProperties = {
  ...primaryButton,
  background: "transparent",
  color: "var(--color-on-surface-variant)",
  boxShadow: "none",
  padding: "0 16px"
};

function LauncherButton({
  children,
  disabled,
  onClick,
  variant = "primary"
}: React.PropsWithChildren<{ disabled?: boolean; onClick?: () => void; variant?: "primary" | "secondary" | "ghost" }>) {
  const style = variant === "primary" ? primaryButton : variant === "secondary" ? secondaryButton : ghostButton;
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      style={{
        ...style,
        opacity: disabled ? 0.42 : 1,
        cursor: disabled ? "not-allowed" : "pointer"
      }}
    >
      {children}
    </button>
  );
}

export function PipLauncherApp() {
  const launchParams = useMemo(getLaunchParams, []);
  const [locale, setLocale] = useState<Locale>("zh-CN");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("准备就绪");
  const [phase, setPhase] = useState<"idle" | "connecting" | "connected" | "pip" | "error">("idle");
  const [pipHandle, setPipHandle] = useState<{ cleanup: () => void; win?: Window } | null>(null);
  const [audioEnabled, setAudioEnabled] = useState(launchParams.audio);
  const closingRef = useRef(false);
  const scrcpy = useScrcpy(locale);
  const webUsbSupported = WebADB.getInstance().isSupported();

  useEffect(() => {
    let mounted = true;
    void (async () => {
      const state = await getState();
      if (!mounted) return;
      const mql = window.matchMedia("(prefers-color-scheme: dark)");
      document.documentElement.dataset.theme = resolveTheme(state.themeMode, mql.matches);
      setLocale(state.locale);
    })();
    const listener = (changes: Record<string, chrome.storage.StorageChange>, areaName: string) => {
      if (areaName !== "local") return;
      if (changes.locale?.newValue) setLocale(changes.locale.newValue as Locale);
      if (changes.themeMode?.newValue) {
        const mql = window.matchMedia("(prefers-color-scheme: dark)");
        document.documentElement.dataset.theme = resolveTheme(changes.themeMode.newValue as ThemeMode, mql.matches);
      }
    };
    chrome.storage.onChanged.addListener(listener);
    return () => {
      mounted = false;
      chrome.storage.onChanged.removeListener(listener);
    };
  }, []);

  const notifySidepanel = async (type: "PIP_WINDOW_OPENED" | "PIP_WINDOW_CLOSED") => {
    try {
      await chrome.runtime.sendMessage({ type });
    } catch (error) {
      console.warn("[neoScrcpy:PiP:Launcher] failed to notify sidepanel:", error);
    }
  };

  const requestSidepanelOpen = async () => {
    const currentWindow = await chrome.windows.getCurrent();
    console.log("[neoScrcpy:PiP:Launcher] reopening sidepanel", {
      windowId: currentWindow.id
    });
    try {
      await chrome.runtime.sendMessage({
        type: "OPEN_SIDEPANEL",
        windowId: currentWindow.id
      });
    } catch (error) {
      console.warn("[neoScrcpy:PiP:Launcher] failed to reopen sidepanel:", error);
    }
  };

  const returnToSidepanel = async (reopenSidepanel: boolean) => {
    if (closingRef.current) return;
    closingRef.current = true;
    await notifySidepanel("PIP_WINDOW_CLOSED");
    if (reopenSidepanel) {
      await requestSidepanelOpen();
    }
    try {
      await scrcpy.disconnect();
    } finally {
      if (reopenSidepanel) {
        window.close();
      } else {
        setPipHandle(null);
        setPhase("connected");
        setBusy(false);
        setMessage("小窗已关闭。请点击“打开侧边栏”回到控制页。");
        closingRef.current = false;
      }
    }
  };

  const openPipWindow = async () => {
    const canvas = scrcpy.canvasRef.current;
    if (!canvas || busy) return;
    setBusy(true);
    setMessage("正在打开浏览器级小窗...");
    const pip = await openDocumentPip({
      canvas,
      title: launchParams.title,
      getController: () => scrcpy.controllerRef.current,
      audioEnabled,
      mapClientToVideo: ({ clientX, clientY, target }) => {
        const rect = target.getBoundingClientRect();
        const size = scrcpy.getVideoSize() ?? { width: rect.width, height: rect.height };
        const videoAspect = size.width / size.height;
        const targetAspect = rect.width / rect.height;
        const contentWidth = targetAspect > videoAspect ? rect.height * videoAspect : rect.width;
        const contentHeight = targetAspect > videoAspect ? rect.height : rect.width / videoAspect;
        const contentLeft = rect.left + (rect.width - contentWidth) / 2;
        const contentTop = rect.top + (rect.height - contentHeight) / 2;
        const localX = clientX - contentLeft;
        const localY = clientY - contentTop;
        if (localX < 0 || localY < 0 || localX > contentWidth || localY > contentHeight) return null;
        const x = Math.max(0, Math.min(size.width - 1, Math.round((localX * size.width) / contentWidth)));
        const y = Math.max(0, Math.min(size.height - 1, Math.round((localY * size.height) / contentHeight)));
        return { x, y, vw: size.width, vh: size.height };
      },
      onToolbarClose: () => {
        void requestSidepanelOpen();
      },
      onClosed: () => {
        void returnToSidepanel(false);
      }
    });

    if (!pip) {
      setPhase("error");
      setMessage("未能打开 Document PiP。请再次点击按钮，并查看控制台日志。");
      setBusy(false);
      return;
    }

    setPipHandle(pip);
    setPhase("pip");
    setMessage("正在小窗使用设备，请不要关闭此窗口。");
    setBusy(false);
    await notifySidepanel("PIP_WINDOW_OPENED");
  };

  const connectAndOpenPip = async () => {
    if (busy) return;
    setBusy(true);
    setPhase("connecting");
    setMessage("正在连接设备...");

    try {
      const mode = launchParams.serial ? { mode: "granted" as const, serial: launchParams.serial } : { mode: "prompt" as const };
      const device = await scrcpy.connect({ ...mode, audio: audioEnabled });
      if (!device) {
        setPhase("error");
        setMessage(scrcpy.status || "未能建立设备连接。请确认 USB 调试授权后重试。");
        setBusy(false);
        return;
      }

      setPhase("connected");
      setMessage("你可以安全的隐藏此页面，但请不要关闭页面。");
      setBusy(false);
      await openPipWindow();
    } catch (error) {
      setPhase("error");
      setBusy(false);
      setMessage(error instanceof Error ? error.message : String(error));
    }
  };

  useEffect(
    () => () => {
      pipHandle?.cleanup();
    },
    [pipHandle]
  );

  const heroTitle =
    phase === "error"
      ? "连接错误"
      : phase === "connected" || phase === "pip"
        ? "设备已连接"
        : "连接设备并启动 PiP";

  const heroDescription =
    phase === "error"
      ? message
      : phase === "connected" || phase === "pip"
        ? "你可以安全的隐藏此页面，但请不要关闭页面。"
        : "点击按钮后会立即申请 WebUSB/ADB 权限，连接设备，并在成功后直接打开浏览器级小窗。";

  return (
    <div
      className="page"
      style={{
        minHeight: "100vh",
        background: "var(--color-surface)",
        color: "var(--color-on-surface)",
        padding: "clamp(24px, 7vw, 80px)",
        alignItems: "center"
      }}
    >
      <canvas
        ref={scrcpy.canvasRef}
        width={456}
        height={1024}
        aria-hidden="true"
        style={{
          position: "fixed",
          left: -10000,
          top: 0,
          width: 456,
          height: 1024,
          opacity: 0,
          pointerEvents: "none"
        }}
      />

      <main style={{ width: "100%", maxWidth: 720 }}>
        <section style={{ marginBottom: 56 }}>
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: 18,
              background: "var(--color-surface-container-high)",
              color: "var(--color-on-surface)",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              marginBottom: 30
            }}
          >
            <IconUsb size={28} />
          </div>

          <h1
            style={{
              margin: "0 0 16px",
              fontSize: "clamp(32px, 6vw, 44px)",
              lineHeight: 1.08,
              fontWeight: 900,
              letterSpacing: 0
            }}
          >
            {heroTitle}
          </h1>

          <p
            style={{
              margin: "0 0 34px",
              maxWidth: 620,
              color: "var(--color-on-surface-variant)",
              fontSize: 17,
              lineHeight: 1.72
            }}
          >
            {heroDescription}
          </p>

          <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap", marginBottom: 18 }}>
            <LauncherButton
              onClick={() => {
                if (phase === "connected" || phase === "pip") {
                  void openPipWindow();
                  return;
                }
                void connectAndOpenPip();
              }}
              disabled={busy || !webUsbSupported}
            >
              {phase === "connected" || phase === "pip" ? "打开小窗" : busy ? "正在处理..." : "连接设备并打开小窗"}
            </LauncherButton>

            {phase === "connected" && (
              <LauncherButton
                variant="secondary"
                onClick={() => {
                  void scrcpy.disconnect().then(() => {
                    setPhase("idle");
                    setMessage("连接已断开。可以重新连接设备。");
                  });
                }}
                disabled={busy}
              >
                断开连接
              </LauncherButton>
            )}

            {phase === "pip" && (
              <LauncherButton
                variant="secondary"
                onClick={() => {
                  void requestSidepanelOpen();
                  pipHandle?.cleanup();
                  setPipHandle(null);
                  void returnToSidepanel(true);
                }}
              >
                关闭小窗
              </LauncherButton>
            )}

            <LauncherButton
              variant="ghost"
              onClick={() => {
                void scrcpy.disconnect().finally(() => window.close());
              }}
            >
              关闭标签页
            </LauncherButton>

            {(phase === "connected" || phase === "pip") && (
              <LauncherButton variant="secondary" onClick={() => void requestSidepanelOpen()}>
                打开侧边栏
              </LauncherButton>
            )}

            <IconButton
              onClick={() => setAudioEnabled((next) => !next)}
              title={audioEnabled ? "关闭 ADB 音频" : "开启 ADB 音频"}
              disabled={phase !== "idle"}
              style={{
                background: "var(--color-surface-container-high)",
                color: "var(--color-on-surface)"
              }}
            >
              {audioEnabled ? <IconSoundOn size={20} /> : <IconSoundOff size={20} />}
            </IconButton>
          </div>

          <div style={{ color: "var(--color-on-surface-variant)", fontSize: 13, lineHeight: 1.6 }}>
            {message} / {scrcpy.status}
          </div>
        </section>

        {(phase === "idle" || phase === "error") && (
          <>
            <hr style={{ border: 0, borderTop: "1px solid var(--color-outline-variant)", margin: "0 0 42px" }} />

            <section>
              <h2 style={{ margin: "0 0 28px", fontSize: 22, lineHeight: 1.25, fontWeight: 900 }}>常见问题排查</h2>

              <div style={{ display: "flex", flexDirection: "column", gap: 30 }}>
                <div style={{ paddingLeft: 20, borderLeft: "2px solid var(--color-on-surface)" }}>
                  <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800 }}>为什么没有自动弹出小窗？</h3>
                  <p style={{ margin: "8px 0 0", fontSize: 14, lineHeight: 1.75, color: "var(--color-on-surface-variant)" }}>
                    Chrome 通常要求真实用户交互才能调用 Document PiP。这里会在你点击按钮后立刻完成连接和开窗，尽量减少中间步骤。
                  </p>
                </div>

                <div style={{ paddingLeft: 20, borderLeft: "2px solid var(--color-outline-variant)" }}>
                  <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800 }}>找不到设备？</h3>
                  <p style={{ margin: "8px 0 0", fontSize: 14, lineHeight: 1.75, color: "var(--color-on-surface-variant)" }}>
                    重新插拔 USB 数据线，在手机上重新开启“USB 调试”，并确认没有其他手机助手或 adb.exe 正在占用设备。
                  </p>
                </div>

                <div style={{ paddingLeft: 20, borderLeft: "2px solid var(--color-outline-variant)" }}>
                  <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800 }}>此标签页可以关闭吗？</h3>
                  <p style={{ margin: "8px 0 0", fontSize: 14, lineHeight: 1.75, color: "var(--color-on-surface-variant)" }}>
                    使用 PiP 时请保持此标签页打开。它负责持有 ADB 连接、视频捕获和音频播放；关闭小窗后，标签页会自动回收并恢复侧边栏。
                  </p>
                </div>

                <div style={{ paddingLeft: 20, borderLeft: "2px solid var(--color-outline-variant)" }}>
                  <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800 }}>当前权限提示</h3>
                  <p style={{ margin: "8px 0 0", fontSize: 14, lineHeight: 1.75, color: "var(--color-on-surface-variant)" }}>
                    {phase === "error" ? message : t(locale, "control.permissionHint")}
                  </p>
                </div>
              </div>
            </section>
          </>
        )}
      </main>
    </div>
  );
}

