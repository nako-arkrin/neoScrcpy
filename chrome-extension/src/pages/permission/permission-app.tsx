import React, { useEffect, useState } from "react";
import { addRecentDevice, getState, Locale, ThemeMode } from "../../shared/storage";
import { resolveTheme } from "../../shared/theme";
import { WebFastboot } from "../../shared/fastboot";
import { WebADB } from "../../shared/webadb";
import { IconUsb } from "../../ui/icons";
import { type I18nKey, t } from "../../shared/i18n";

type Status =
  | { type: "ready" | "unsupported" | "requesting" | "cancelled" | "connected" }
  | { type: "failed"; error?: { i18nKey?: I18nKey; message?: string } };

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

function ActionButton({
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

export function PermissionApp() {
  const [locale, setLocale] = useState<Locale>("zh-CN");
  const [status, setStatus] = useState<Status>({ type: "ready" });
  const [busy, setBusy] = useState(false);
  const [fastbootScanEnabled, setFastbootScanEnabled] = useState(false);
  const [showDeviceModePicker, setShowDeviceModePicker] = useState(false);

  useEffect(() => {
    let mounted = true;
    void (async () => {
      const state = await getState();
      if (!mounted) return;
      const mql = window.matchMedia("(prefers-color-scheme: dark)");
      document.documentElement.dataset.theme = resolveTheme(state.themeMode, mql.matches);
      document.documentElement.lang = state.locale;
      document.title = `${t(state.locale, "permission.title")} - neoScrcpy`;
      setLocale(state.locale);
      setFastbootScanEnabled(state.fastbootScanEnabled);
    })();
    const listener = (changes: Record<string, chrome.storage.StorageChange>, areaName: string) => {
      if (areaName !== "local") return;
      if (changes.locale?.newValue) {
        const nextLocale = changes.locale.newValue as Locale;
        document.documentElement.lang = nextLocale;
        document.title = `${t(nextLocale, "permission.title")} - neoScrcpy`;
        setLocale(nextLocale);
      }
      if (changes.themeMode?.newValue) {
        const mql = window.matchMedia("(prefers-color-scheme: dark)");
        document.documentElement.dataset.theme = resolveTheme(changes.themeMode.newValue as ThemeMode, mql.matches);
      }
      if (changes.fastbootScanEnabled) {
        setFastbootScanEnabled(Boolean(changes.fastbootScanEnabled.newValue));
      }
    };
    chrome.storage.onChanged.addListener(listener);
    return () => {
      mounted = false;
      chrome.storage.onChanged.removeListener(listener);
    };
  }, []);

  const normalizeErrorInfo = (error: any): { i18nKey?: I18nKey; message?: string } => {
    const message = error?.message ?? String(error);
    const code = (error && typeof error === "object" && "code" in error ? (error as any).code : undefined) as
      | "usbTransferInterrupted"
      | "deviceDisconnected"
      | "usbAborted"
      | "notAdbDevice"
      | undefined;
    if (code === "usbTransferInterrupted") return { i18nKey: "error.usbTransferInterrupted" };
    if (code === "deviceDisconnected") return { i18nKey: "error.deviceDisconnected" };
    if (code === "usbAborted") return { i18nKey: "error.usbAborted" };
    if (code === "notAdbDevice") return { i18nKey: "error.notAdbDevice" };
    return { message };
  };

  const openAfterConnected = async () => {
    setStatus({ type: "connected" });
    const win = await chrome.windows.getCurrent();
    await chrome.runtime.sendMessage({ type: "OPEN_SIDEPANEL", windowId: win.id });
  };

  const connectAdb = async () => {
    const webadb = WebADB.getInstance();
    if (!webadb.isSupported()) {
      setStatus({ type: "unsupported" });
      return;
    }

    setShowDeviceModePicker(false);
    setBusy(true);
    setStatus({ type: "requesting" });
    try {
      const device = await webadb.requestDevice();
      if (!device) {
        setStatus({ type: "cancelled" });
        return;
      }
      await addRecentDevice({ serial: device.serial, name: device.name, model: device.model, mode: "adb" });
      try {
        await device.dispose();
      } catch {}
      await openAfterConnected();
    } catch (error: any) {
      setStatus({ type: "failed", error: normalizeErrorInfo(error) });
    } finally {
      setBusy(false);
    }
  };

  const connectFastboot = async () => {
    if (!WebFastboot.getInstance().isSupported()) {
      setStatus({ type: "unsupported" });
      return;
    }

    setShowDeviceModePicker(false);
    setBusy(true);
    setStatus({ type: "requesting" });
    try {
      const device = await WebFastboot.getInstance().requestDevice();
      if (!device) {
        setStatus({ type: "cancelled" });
        return;
      }
      await addRecentDevice({
        serial: device.serial,
        name: device.name,
        model: device.model,
        mode: "fastboot"
      });
      await device.dispose().catch(() => {});
      await openAfterConnected();
    } catch (error: any) {
      setStatus({ type: "failed", error: { message: error?.message ?? String(error) } });
    } finally {
      setBusy(false);
    }
  };

  const connect = async () => {
    if (fastbootScanEnabled) {
      setShowDeviceModePicker(true);
      setStatus({ type: "ready" });
      return;
    }
    await connectAdb();
  };

  const openSidePanel = async () => {
    const win = await chrome.windows.getCurrent();
    await chrome.runtime.sendMessage({ type: "OPEN_SIDEPANEL", windowId: win.id });
  };

  const forceReset = () => {
    window.location.reload();
  };

  const statusText =
    status.type === "ready"
      ? t(locale, "permission.status.ready")
      : status.type === "unsupported"
        ? t(locale, "permission.status.unsupported")
        : status.type === "requesting"
          ? t(locale, "permission.status.requesting")
          : status.type === "cancelled"
            ? t(locale, "common.cancelled")
            : status.type === "connected"
              ? t(locale, "permission.status.connected")
              : t(locale, "error.connectFailed", {
                  message: status.type === "failed" ? (status.error?.i18nKey ? t(locale, status.error.i18nKey) : status.error?.message ?? "") : ""
                });

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
            {t(locale, "permission.title")}
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
            {t(locale, "permission.desc")}
          </p>

          <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap", marginBottom: 18 }}>
            <ActionButton onClick={connect} disabled={busy}>
              {busy ? t(locale, "permission.connecting") : t(locale, "permission.connect")}
            </ActionButton>
            <ActionButton variant="secondary" onClick={openSidePanel}>
              {t(locale, "permission.openSidePanel")}
            </ActionButton>
            <ActionButton variant="ghost" onClick={forceReset}>
              {t(locale, "permission.reset")}
            </ActionButton>
          </div>

          <div style={{ color: "var(--color-on-surface-variant)", fontSize: 13, lineHeight: 1.6 }}>
            {t(locale, "permission.statusLabel", { status: statusText })}
          </div>
        </section>

        {showDeviceModePicker && (
          <div
            role="dialog"
            aria-modal="true"
            style={{
              position: "fixed",
              inset: 0,
              zIndex: 40,
              display: "grid",
              placeItems: "center",
              padding: 24,
              background: "rgba(0,0,0,0.36)"
            }}
            onClick={() => setShowDeviceModePicker(false)}
          >
            <div
              style={{
                width: "min(100%, 420px)",
                borderRadius: 18,
                background: "var(--color-surface)",
                color: "var(--color-on-surface)",
                boxShadow: "0 18px 50px rgba(0,0,0,0.26)",
                border: "1px solid var(--color-outline-variant)",
                padding: 18
              }}
              onClick={(event) => event.stopPropagation()}
            >
              <div style={{ fontSize: 18, fontWeight: 900 }}>{t(locale, "permission.modePicker.title")}</div>
              <div className="muted" style={{ marginTop: 8, fontSize: 13, lineHeight: 1.55 }}>
                {t(locale, "permission.modePicker.subtitle")}
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 16 }}>
                <ActionButton variant="secondary" disabled={busy} onClick={() => void connectAdb()}>
                  {t(locale, "permission.modePicker.adb")}
                </ActionButton>
                <ActionButton variant="secondary" disabled={busy} onClick={() => void connectFastboot()}>
                  {t(locale, "permission.modePicker.fastboot")}
                </ActionButton>
              </div>
              <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 12 }}>
                <ActionButton variant="ghost" disabled={busy} onClick={() => setShowDeviceModePicker(false)}>
                  {t(locale, "common.cancel")}
                </ActionButton>
              </div>
            </div>
          </div>
        )}

        <hr style={{ border: 0, borderTop: "1px solid var(--color-outline-variant)", margin: "0 0 42px" }} />

        <section>
          <h2 style={{ margin: "0 0 28px", fontSize: 22, lineHeight: 1.25, fontWeight: 900 }}>{t(locale, "permission.faq.title")}</h2>

          <div style={{ display: "flex", flexDirection: "column", gap: 30 }}>
            <div style={{ paddingLeft: 20, borderLeft: "2px solid var(--color-on-surface)" }}>
              <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800 }}>{t(locale, "permission.faq.deviceMissing.title")}</h3>
              <div style={{ marginTop: 8, fontSize: 14, lineHeight: 1.75, color: "var(--color-on-surface-variant)", whiteSpace: "pre-wrap" }}>
                {t(locale, "permission.faq.deviceMissing.body")}
              </div>
            </div>

            <div style={{ paddingLeft: 20, borderLeft: "2px solid var(--color-outline-variant)" }}>
              <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800 }}>{t(locale, "permission.faq.driver.title")}</h3>
              <p style={{ margin: "8px 0 0", fontSize: 14, lineHeight: 1.75, color: "var(--color-on-surface-variant)" }}>
                {t(locale, "permission.faq.driver.body")}{" "}
                <a href="https://zadig.akeo.ie/" target="_blank" rel="noopener noreferrer" style={{ color: "var(--color-on-surface)" }}>
                  Zadig
                </a>{" "}
                <strong>WinUSB</strong>
              </p>
            </div>

            <div style={{ paddingLeft: 20, borderLeft: "2px solid var(--color-outline-variant)" }}>
              <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800 }}>{t(locale, "permission.faq.other.title")}</h3>
              <p style={{ margin: "8px 0 0", fontSize: 14, lineHeight: 1.75, color: "var(--color-on-surface-variant)" }}>
                {t(locale, "permission.faq.other.body")}
              </p>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
