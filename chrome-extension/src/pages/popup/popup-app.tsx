import React, { useEffect, useState } from "react";
import { Card, ListItem, PillButton } from "../../ui/m3";
import { IconInfo, IconSettings } from "../../ui/icons";
import { getState, Locale, ThemeMode } from "../../shared/storage";
import { resolveTheme } from "../../shared/theme";
import { t } from "../../shared/i18n";

export function PopupApp() {
  const [locale, setLocale] = useState<Locale>("zh-CN");

  useEffect(() => {
    let mounted = true;
    void (async () => {
      const s = await getState();
      if (!mounted) return;
      setLocale(s.locale);
      const mql = window.matchMedia("(prefers-color-scheme: dark)");
      document.documentElement.dataset.theme = resolveTheme(s.themeMode, mql.matches);
      document.documentElement.dataset.page = "popup";
      document.body.dataset.page = "popup";
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

  const openSidePanel = async () => {
    const win = await chrome.windows.getCurrent();
    await chrome.runtime.sendMessage({ type: "OPEN_SIDEPANEL", windowId: win.id });
    window.close();
  };

  const openPermission = async () => {
    await chrome.runtime.sendMessage({ type: "OPEN_PERMISSION_TAB" });
    window.close();
  };

  return (
    <div className="page">
      <div className="container" style={{ paddingTop: 12 }}>
        <Card>
          <div style={{ padding: 16, display: "flex", flexDirection: "column", gap: 10 }}>
            <div style={{ fontSize: 16, fontWeight: 900 }}>{t(locale, "app.name")}</div>
            <div className="muted" style={{ fontSize: 13 }}>
              WebADB + WebScrcpy
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <PillButton onClick={openSidePanel}>{t(locale, "popup.openSidePanel")}</PillButton>
              <PillButton variant="secondary" onClick={openPermission}>
                {t(locale, "popup.connectDevice")}
              </PillButton>
            </div>
          </div>
        </Card>

        <Card>
          <ListItem icon={<IconInfo size={20} />} title={t(locale, "popup.version.title")} subtitle={t(locale, "popup.version.subtitle")} />
          <ListItem
            icon={<IconSettings size={20} />}
            title={t(locale, "popup.settings.title")}
            subtitle={t(locale, "popup.settings.subtitle")}
            isNav
            onClick={openSidePanel}
          />
        </Card>
      </div>
    </div>
  );
}
