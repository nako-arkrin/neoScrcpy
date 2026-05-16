import React, { useEffect, useState } from "react";
import { Card, PillButton } from "../../ui/m3";
import { getState, Locale, ThemeMode } from "../../shared/storage";
import { resolveTheme } from "../../shared/theme";
import { t } from "../../shared/i18n";

export function OptionsApp() {
  const [ready, setReady] = useState(false);
  const [locale, setLocale] = useState<Locale>("zh-CN");

  useEffect(() => {
    let mounted = true;
    void (async () => {
      const s = await getState();
      if (!mounted) return;
      const mql = window.matchMedia("(prefers-color-scheme: dark)");
      document.documentElement.dataset.theme = resolveTheme(s.themeMode, mql.matches);
      document.documentElement.lang = s.locale;
      document.title = `${t(s.locale, "options.title")} - neoScrcpy`;
      setLocale(s.locale);
      setReady(true);
    })();
    const listener = (changes: Record<string, chrome.storage.StorageChange>, areaName: string) => {
      if (areaName !== "local") return;
      if (changes.locale?.newValue) {
        const nextLocale = changes.locale.newValue as Locale;
        document.documentElement.lang = nextLocale;
        document.title = `${t(nextLocale, "options.title")} - neoScrcpy`;
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

  const openSidePanel = async () => {
    const win = await chrome.windows.getCurrent();
    await chrome.runtime.sendMessage({ type: "OPEN_SIDEPANEL", windowId: win.id });
  };

  if (!ready) return null;

  return (
    <div className="page">
      <div className="container" style={{ maxWidth: 760, margin: "0 auto" }}>
        <Card>
          <div style={{ padding: 18 }}>
            <div style={{ fontSize: 18, fontWeight: 900 }}>{t(locale, "options.title")}</div>
            <div className="muted" style={{ marginTop: 8, fontSize: 13, lineHeight: 1.45 }}>
              {t(locale, "options.subtitle")}
            </div>
            <div style={{ marginTop: 14 }}>
              <PillButton onClick={openSidePanel}>{t(locale, "common.openSidePanel")}</PillButton>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
