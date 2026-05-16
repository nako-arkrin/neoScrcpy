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
  const [message, setMessage] = useState(() => t("zh-CN", "pip.status.ready"));
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
      document.documentElement.lang = state.locale;
      document.title = `${t(state.locale, "common.pip")} - neoScrcpy`;
      setLocale(state.locale);
    })();
    const listener = (changes: Record<string, chrome.storage.StorageChange>, areaName: string) => {
      if (areaName !== "local") return;
      if (changes.locale?.newValue) {
        const nextLocale = changes.locale.newValue as Locale;
        document.documentElement.lang = nextLocale;
        document.title = `${t(nextLocale, "common.pip")} - neoScrcpy`;
        setLocale(nextLocale);
      }
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
        setMessage(t(locale, "pip.status.closed"));
        closingRef.current = false;
      }
    }
  };

  const openPipWindow = async () => {
    const canvas = scrcpy.canvasRef.current;
    if (!canvas || busy) return;
    setBusy(true);
    setMessage(t(locale, "pip.status.opening"));
    const pip = await openDocumentPip({
      canvas,
      title: launchParams.title,
      getController: () => scrcpy.controllerRef.current,
      audioEnabled,
      labels: {
        back: t(locale, "common.back"),
        audioOn: t(locale, "control.audioOn"),
        audioOff: t(locale, "control.audioOff"),
        power: t(locale, "common.power"),
        pip: t(locale, "common.pip")
      },
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
      setMessage(t(locale, "pip.status.openFailed"));
      setBusy(false);
      return;
    }

    setPipHandle(pip);
    setPhase("pip");
    setMessage(t(locale, "pip.status.active"));
    setBusy(false);
    await notifySidepanel("PIP_WINDOW_OPENED");
  };

  const connectAndOpenPip = async () => {
    if (busy) return;
    setBusy(true);
    setPhase("connecting");
    setMessage(t(locale, "pip.status.connecting"));

    try {
      const mode = launchParams.serial ? { mode: "granted" as const, serial: launchParams.serial } : { mode: "prompt" as const };
      const device = await scrcpy.connect({ ...mode, audio: audioEnabled });
      if (!device) {
        setPhase("error");
        setMessage(scrcpy.status || t(locale, "pip.status.connectFailed"));
        setBusy(false);
        return;
      }

      setPhase("connected");
      setMessage(t(locale, "pip.status.keepOpen"));
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
      ? t(locale, "pip.title.error")
      : phase === "connected" || phase === "pip"
        ? t(locale, "pip.title.connected")
        : t(locale, "pip.title.launch");

  const heroDescription =
    phase === "error"
      ? message
      : phase === "connected" || phase === "pip"
        ? t(locale, "pip.status.keepOpen")
        : t(locale, "pip.description.launch");

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
              {phase === "connected" || phase === "pip" ? t(locale, "common.openPip") : busy ? t(locale, "common.processing") : t(locale, "pip.connectAndOpen")}
            </LauncherButton>

            {phase === "connected" && (
              <LauncherButton
                variant="secondary"
                onClick={() => {
                  void scrcpy.disconnect().then(() => {
                    setPhase("idle");
                    setMessage(t(locale, "pip.status.disconnected"));
                  });
                }}
                disabled={busy}
              >
                {t(locale, "common.disconnect")}
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
                {t(locale, "common.closePip")}
              </LauncherButton>
            )}

            <LauncherButton
              variant="ghost"
              onClick={() => {
                void scrcpy.disconnect().finally(() => window.close());
              }}
            >
              {t(locale, "common.closeTab")}
            </LauncherButton>

            {(phase === "connected" || phase === "pip") && (
              <LauncherButton variant="secondary" onClick={() => void requestSidepanelOpen()}>
                {t(locale, "common.openSidePanel")}
              </LauncherButton>
            )}

            <IconButton
              onClick={() => setAudioEnabled((next) => !next)}
              title={audioEnabled ? t(locale, "control.audioOff") : t(locale, "control.audioOn")}
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
              <h2 style={{ margin: "0 0 28px", fontSize: 22, lineHeight: 1.25, fontWeight: 900 }}>{t(locale, "pip.faq.title")}</h2>

              <div style={{ display: "flex", flexDirection: "column", gap: 30 }}>
                <div style={{ paddingLeft: 20, borderLeft: "2px solid var(--color-on-surface)" }}>
                  <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800 }}>{t(locale, "pip.faq.autoPip.title")}</h3>
                  <p style={{ margin: "8px 0 0", fontSize: 14, lineHeight: 1.75, color: "var(--color-on-surface-variant)" }}>
                    {t(locale, "pip.faq.autoPip.body")}
                  </p>
                </div>

                <div style={{ paddingLeft: 20, borderLeft: "2px solid var(--color-outline-variant)" }}>
                  <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800 }}>{t(locale, "pip.faq.deviceMissing.title")}</h3>
                  <p style={{ margin: "8px 0 0", fontSize: 14, lineHeight: 1.75, color: "var(--color-on-surface-variant)" }}>
                    {t(locale, "pip.faq.deviceMissing.body")}
                  </p>
                </div>

                <div style={{ paddingLeft: 20, borderLeft: "2px solid var(--color-outline-variant)" }}>
                  <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800 }}>{t(locale, "pip.faq.closeTab.title")}</h3>
                  <p style={{ margin: "8px 0 0", fontSize: 14, lineHeight: 1.75, color: "var(--color-on-surface-variant)" }}>
                    {t(locale, "pip.faq.closeTab.body")}
                  </p>
                </div>

                <div style={{ paddingLeft: 20, borderLeft: "2px solid var(--color-outline-variant)" }}>
                  <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800 }}>{t(locale, "pip.faq.permission.title")}</h3>
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

