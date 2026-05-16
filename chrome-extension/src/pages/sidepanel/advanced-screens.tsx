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

export function ShizukuAdbScreen({
  serial,
  onNeedPermission
}: {
  serial?: string;
  onNeedPermission: () => void;
}) {
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState("正在检查设备上的 Shizuku...");
  const [shizuku, setShizuku] = useState<ShizukuStatus | null>(null);

  const withConnection = useCallback(
    async <T,>(task: (adb: any) => Promise<T>) => {
      const connection = serial ? await WebADB.getInstance().connectGranted(serial) : await WebADB.getInstance().requestDevice();
      if (!connection) {
        onNeedPermission();
        throw new Error("未能连接设备，请重新授权。");
      }
      try {
        return await task(connection.adb);
      } finally {
        await connection.dispose();
      }
    },
    [onNeedPermission, serial]
  );

  const check = useCallback(async () => {
    if (busy) return;
    setBusy(true);
    setStatus("正在检查 Shizuku 是否已安装...");
    try {
      const next = await withConnection((adb) => getShizukuStatus(adb));
      setShizuku(next);
      setStatus(
        next.installed
          ? `已安装 Shizuku${next.versionName ? ` ${next.versionName}` : ""}。该激活命令仅适用于 Shizuku v11.2.0+。`
          : "未检测到 Shizuku。请先安装 Shizuku 后再使用 ADB 激活。"
      );
    } catch (error) {
      setStatus(error instanceof Error ? error.message : String(error));
    } finally {
      setBusy(false);
    }
  }, [busy, withConnection]);

  useEffect(() => {
    void check();
  }, []);

  const openApp = useCallback(async () => {
    if (busy) return;
    setBusy(true);
    setStatus("正在打开设备上的 Shizuku...");
    try {
      const output = await withConnection((adb) => openShizuku(adb));
      setStatus(output || "已请求打开 Shizuku。请在手机上确认界面已打开。");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : String(error));
    } finally {
      setBusy(false);
    }
  }, [busy, withConnection]);

  const activate = useCallback(async () => {
    if (busy || !shizuku?.installed) return;
    setBusy(true);
    setStatus("正在打开 Shizuku 并执行 ADB 激活命令...");
    try {
      const output = await withConnection((adb) => activateShizukuAdbMode(adb));
      setStatus(output || "激活命令已执行。请回到 Shizuku 查看运行状态。");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : String(error));
    } finally {
      setBusy(false);
    }
  }, [busy, shizuku?.installed, withConnection]);

  return (
    <div className="container" style={{ paddingTop: 12, gap: 14 }}>
      <Card>
        <ListItem
          icon={<IconCode size={20} />}
          title="激活 Shizuku ADB 模式"
          subtitle="执行 Shizuku v11.2.0+ 的 ADB 激活脚本"
        />
        <div style={{ padding: "0 16px 16px", display: "flex", flexDirection: "column", gap: 12 }}>
          <div className="muted" style={{ fontSize: 12, lineHeight: 1.6, whiteSpace: "pre-wrap" }}>
            激活命令：adb shell {SHIZUKU_ACTIVATE_COMMAND}
          </div>
          <div className="muted" style={{ fontSize: 12, lineHeight: 1.6, whiteSpace: "pre-wrap" }}>{status}</div>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <PillButton variant="secondary" onClick={() => void check()} disabled={busy}>
              <IconRefresh size={18} />重新检查
            </PillButton>
            {shizuku?.installed ? (
              <>
                <PillButton variant="secondary" onClick={() => void openApp()} disabled={busy}>
                  打开 Shizuku
                </PillButton>
                <PillButton onClick={() => void activate()} disabled={busy}>
                  {busy ? "处理中..." : "执行激活"}
                </PillButton>
              </>
            ) : (
              <PillButton onClick={() => window.open("https://shizuku.rikka.app/", "_blank")}>
                <IconExternalLink size={18} />了解 Shizuku
              </PillButton>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
}
