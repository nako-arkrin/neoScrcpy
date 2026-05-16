import React, { useCallback, useEffect, useState } from "react";
import { Card, ListItem, PillButton } from "../../ui/m3";
import { IconCode, IconExternalLink, IconRefresh } from "../../ui/icons";
import { WebADB } from "../../shared/webadb";
import {
  activateShizukuAdbMode,
  getShizukuStatus,
  openShizuku,
  SHIZUKU_ACTIVATE_COMMAND,
  type ShizukuStatus
} from "../../shared/androidDeviceTools";
import type { Locale } from "../../shared/storage";
import { t } from "../../shared/i18n";

export function ShizukuAdbScreen({
  locale,
  serial,
  onNeedPermission
}: {
  locale: Locale;
  serial?: string;
  onNeedPermission: () => void;
}) {
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState(() => t(locale, "shizuku.status.checkingDevice"));
  const [shizuku, setShizuku] = useState<ShizukuStatus | null>(null);

  const withConnection = useCallback(
    async <T,>(task: (adb: any) => Promise<T>) => {
      const connection = serial ? await WebADB.getInstance().connectGranted(serial) : await WebADB.getInstance().requestDevice();
      if (!connection) {
        onNeedPermission();
        throw new Error(t(locale, "shizuku.status.permissionRequired"));
      }
      try {
        return await task(connection.adb);
      } finally {
        await connection.dispose();
      }
    },
    [locale, onNeedPermission, serial]
  );

  const check = useCallback(async () => {
    if (busy) return;
    setBusy(true);
    setStatus(t(locale, "shizuku.status.checkingInstall"));
    try {
      const next = await withConnection((adb) => getShizukuStatus(adb));
      setShizuku(next);
      setStatus(
        next.installed
          ? t(locale, "shizuku.status.installed", { version: next.versionName ? ` ${next.versionName}` : "" })
          : t(locale, "shizuku.status.notInstalled")
      );
    } catch (error) {
      setStatus(error instanceof Error ? error.message : String(error));
    } finally {
      setBusy(false);
    }
  }, [busy, locale, withConnection]);

  useEffect(() => {
    void check();
  }, []);

  const openApp = useCallback(async () => {
    if (busy) return;
    setBusy(true);
    setStatus(t(locale, "shizuku.status.opening"));
    try {
      const output = await withConnection((adb) => openShizuku(adb));
      setStatus(output || t(locale, "shizuku.status.opened"));
    } catch (error) {
      setStatus(error instanceof Error ? error.message : String(error));
    } finally {
      setBusy(false);
    }
  }, [busy, locale, withConnection]);

  const activate = useCallback(async () => {
    if (busy || !shizuku?.installed) return;
    setBusy(true);
    setStatus(t(locale, "shizuku.status.activating"));
    try {
      const output = await withConnection((adb) => activateShizukuAdbMode(adb));
      setStatus(output || t(locale, "shizuku.status.activated"));
    } catch (error) {
      setStatus(error instanceof Error ? error.message : String(error));
    } finally {
      setBusy(false);
    }
  }, [busy, locale, shizuku?.installed, withConnection]);

  return (
    <div className="container" style={{ paddingTop: 12, gap: 14 }}>
      <Card>
        <ListItem
          icon={<IconCode size={20} />}
          title={t(locale, "deviceHome.shizuku.title")}
          subtitle={t(locale, "deviceHome.shizuku.subtitle")}
        />
        <div style={{ padding: "0 16px 16px", display: "flex", flexDirection: "column", gap: 12 }}>
          <div className="muted" style={{ fontSize: 12, lineHeight: 1.6, whiteSpace: "pre-wrap" }}>
            {t(locale, "shizuku.command", { command: SHIZUKU_ACTIVATE_COMMAND })}
          </div>
          <div className="muted" style={{ fontSize: 12, lineHeight: 1.6, whiteSpace: "pre-wrap" }}>{status}</div>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <PillButton variant="secondary" onClick={() => void check()} disabled={busy}>
              <IconRefresh size={18} />
              {t(locale, "shizuku.recheck")}
            </PillButton>
            {shizuku?.installed ? (
              <>
                <PillButton variant="secondary" onClick={() => void openApp()} disabled={busy}>
                  {t(locale, "shizuku.open")}
                </PillButton>
                <PillButton onClick={() => void activate()} disabled={busy}>
                  {busy ? t(locale, "common.processing") : t(locale, "shizuku.activate")}
                </PillButton>
              </>
            ) : (
              <PillButton onClick={() => window.open("https://shizuku.rikka.app/", "_blank")}>
                <IconExternalLink size={18} />
                {t(locale, "shizuku.learn")}
              </PillButton>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
}
