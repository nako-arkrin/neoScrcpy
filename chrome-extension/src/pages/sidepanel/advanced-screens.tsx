import React, { useCallback, useEffect, useState } from "react";
import { Card, ListItem, PillButton } from "../../ui/m3";
import { IconChevronRight, IconExternalLink, IconRefresh, IconShizuku } from "../../ui/icons";
import { WebADB } from "../../shared/webadb";
import { WebFastboot, type FastbootConnection } from "../../shared/fastboot";
import {
  activateShizukuAdbMode,
  getShizukuStatus,
  openShizuku,
  SHIZUKU_ACTIVATE_COMMAND,
  shellText,
  type ShizukuStatus
} from "../../shared/androidDeviceTools";
import type { Locale } from "../../shared/storage";
import { t } from "../../shared/i18n";
import { useDangerConfirm } from "../../shared/useDangerConfirm";

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
  const [logExpanded, setLogExpanded] = useState(false);

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
          icon={<IconShizuku size={22} />}
          title={t(locale, "deviceHome.shizuku.title")}
          subtitle={t(locale, "deviceHome.shizuku.subtitle")}
        />
        <div style={{ padding: "0 16px 16px", display: "flex", flexDirection: "column", gap: 12 }}>
          <div>
            <button
              type="button"
              title={logExpanded ? t(locale, "shizuku.log.hide") : t(locale, "shizuku.log.show")}
              onClick={() => setLogExpanded((value) => !value)}
              style={{
                width: "100%",
                border: 0,
                borderRadius: 14,
                padding: "10px 12px",
                background: "var(--color-surface-container-highest)",
                color: "var(--color-on-surface)",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                cursor: "pointer",
                font: "inherit",
                fontSize: 13,
                fontWeight: 750
              }}
            >
              <span>{t(locale, "shizuku.log.title")}</span>
              <span style={{ display: "inline-flex", transform: logExpanded ? "rotate(90deg)" : "rotate(0deg)", transition: "transform 150ms ease" }}>
                <IconChevronRight size={18} />
              </span>
            </button>
            {logExpanded && (
              <div
                className="muted"
                style={{
                  marginTop: 10,
                  fontSize: 12,
                  lineHeight: 1.6,
                  whiteSpace: "pre-wrap",
                  overflowWrap: "anywhere"
                }}
              >
                {t(locale, "shizuku.command", { command: SHIZUKU_ACTIVATE_COMMAND })}
                {"\n\n"}
                {status}
              </div>
            )}
          </div>
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

type TerminalLine = { id: number; kind: "system" | "input" | "output" | "error"; text: string };

export const TERMINAL_FONTS = [
  { label: "Cascadia Mono", value: "\"Cascadia Mono\", \"Cascadia Code\", Consolas, monospace" },
  { label: "JetBrains Mono", value: "\"JetBrains Mono\", \"Cascadia Mono\", Consolas, monospace" },
  { label: "Fira Code", value: "\"Fira Code\", \"Cascadia Mono\", Consolas, monospace" },
  { label: "Consolas", value: "Consolas, \"Cascadia Mono\", monospace" },
  { label: "Monospace", value: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace" }
];

const ANDROID_ASCII = String.raw`
⠀⠀⠀⠀⢀⣀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⣀⡀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠙⢷⣤⣤⣴⣶⣶⣦⣤⣤⡾⠋⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⣴⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣦⠀⠀⠀⠀⠀
⠀⠀⠀⠀⣼⣿⣿⣉⣹⣿⣿⣿⣿⣏⣉⣿⣿⣧⠀⠀⠀⠀
⠀⠀⠀⢸⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⡇⠀⠀⠀
`;

function normalizeShellCommand(value: string) {
  return value
    .trim()
    .replace(/^adb\s+shell\s+/i, "")
    .replace(/^shell\s+/i, "");
}

function normalizeFastbootCommand(value: string) {
  return value.trim().replace(/^fastboot\s+/i, "");
}

function isHighRiskFastbootCommand(command: string) {
  const value = normalizeFastbootCommand(command).toLowerCase();
  return value === "reboot bootloader" || value === "reboot recovery" || value === "flashing unlock";
}

export function CommandLineScreen({
  locale,
  serial,
  onNeedPermission,
  onOpenScreen,
  terminalFont,
  mode = "adb"
}: {
  locale: Locale;
  serial?: string;
  onNeedPermission: () => void;
  onOpenScreen: () => void;
  terminalFont: string;
  mode?: "adb" | "fastboot";
}) {
  const [command, setCommand] = useState("");
  const [busy, setBusy] = useState(false);
  const [deviceInfo, setDeviceInfo] = useState({
    status: t(locale, "terminal.status.connecting"),
    version: "--",
    buildId: "--"
  });
  const [lines, setLines] = useState<TerminalLine[]>(() => [
    { id: Date.now(), kind: "system", text: t(locale, "terminal.status.connecting") }
  ]);
  const { confirmDanger, dangerConfirmDialog } = useDangerConfirm(locale);

  const appendLine = useCallback((kind: TerminalLine["kind"], text: string) => {
    setLines((current) => [...current, { id: Date.now() + current.length, kind, text }]);
  }, []);

  const withConnection = useCallback(
    async <T,>(task: (adb: any) => Promise<T>) => {
      const connection = serial ? await WebADB.getInstance().connectGranted(serial) : await WebADB.getInstance().requestDevice();
      if (!connection) {
        onNeedPermission();
        throw new Error(t(locale, "terminal.status.permissionRequired"));
      }
      try {
        return await task(connection.adb);
      } finally {
        await connection.dispose();
      }
    },
    [locale, onNeedPermission, serial]
  );

  const withFastbootConnection = useCallback(
    async <T,>(task: (fastboot: FastbootConnection) => Promise<T>) => {
      const connection = serial ? await WebFastboot.getInstance().connectGranted(serial) : await WebFastboot.getInstance().requestDevice();
      if (!connection) {
        onNeedPermission();
        throw new Error(t(locale, "terminal.status.permissionRequired"));
      }
      try {
        return await task(connection);
      } finally {
        await connection.dispose();
      }
    },
    [locale, onNeedPermission, serial]
  );

  const refreshDeviceInfo = useCallback(async () => {
    setDeviceInfo((current) => ({ ...current, status: t(locale, "terminal.status.connecting") }));
    try {
      if (mode === "fastboot") {
        const info = await withFastbootConnection(async (fastboot) => {
          const product = await fastboot.execute("getvar product").catch(() => "");
          const version = await fastboot.execute("getvar version").catch(() => "");
          return { product: product || fastboot.model || "--", version: version || "--" };
        });
        setDeviceInfo({
          status: t(locale, "terminal.status.connected"),
          version: `Fastboot ${info.version}`,
          buildId: info.product
        });
        appendLine("system", t(locale, "terminal.fastboot.connected"));
        return;
      }
      const info = await withConnection(async (adb) => {
        const [version, sdk, buildId] = await Promise.all([
          shellText(adb, ["getprop", "ro.build.version.release"]).catch(() => ""),
          shellText(adb, ["getprop", "ro.build.version.sdk"]).catch(() => ""),
          shellText(adb, ["getprop", "ro.build.id"]).catch(() => "")
        ]);
        return { version: version || "--", sdk: sdk || "--", buildId: buildId || "--" };
      });
      setDeviceInfo({
        status: t(locale, "terminal.status.connected"),
        version: `Android ${info.version} / API ${info.sdk}`,
        buildId: info.buildId
      });
      appendLine("system", t(locale, "terminal.status.connected"));
    } catch (error) {
      setDeviceInfo((current) => ({ ...current, status: t(locale, "terminal.status.disconnected") }));
      appendLine("error", error instanceof Error ? error.message : String(error));
    }
  }, [appendLine, locale, mode, withConnection, withFastbootConnection]);

  useEffect(() => {
    void refreshDeviceInfo();
  }, []);

  const runCommand = useCallback(async () => {
    const shellCommand = mode === "fastboot" ? normalizeFastbootCommand(command) : normalizeShellCommand(command);
    if (!shellCommand || busy) return;
    setCommand("");
    setBusy(true);
    appendLine("input", `$ ${command.trim()}`);
    try {
      if (mode === "fastboot") {
        if (/^help$/i.test(shellCommand)) {
          appendLine("output", t(locale, "terminal.fastboot.help"));
          return;
        }
        if (/^devices?$/i.test(shellCommand)) {
          appendLine("output", `List of devices attached\n${serial ?? "webusb-fastboot"}\tfastboot`);
          return;
        }
        if (isHighRiskFastbootCommand(shellCommand) && !(await confirmDanger(shellCommand))) {
          appendLine("system", t(locale, "common.cancelled"));
          return;
        }
        const output = await withFastbootConnection((fastboot) => fastboot.execute(shellCommand));
        appendLine("output", output || t(locale, "terminal.output.empty"));
        return;
      }
      if (/^(adb\s+)?devices?$/i.test(shellCommand)) {
        appendLine("output", `List of devices attached\n${serial ?? "webusb-device"}\tdevice`);
        return;
      }
      if (/^(adb\s+)?screen$/i.test(shellCommand)) {
        appendLine("system", t(locale, "terminal.status.openingScreen"));
        onOpenScreen();
        return;
      }
      if (/^(adb\s+)?help$/i.test(shellCommand)) {
        appendLine("output", t(locale, "terminal.help"));
        return;
      }
      const output = await withConnection((adb) => shellText(adb, shellCommand));
      appendLine("output", output || t(locale, "terminal.output.empty"));
    } catch (error) {
      appendLine("error", error instanceof Error ? error.message : String(error));
    } finally {
      setBusy(false);
    }
  }, [appendLine, busy, command, confirmDanger, locale, mode, onOpenScreen, serial, withConnection, withFastbootConnection]);

  return (
    <div
      style={{
        flex: 1,
        minHeight: 0,
        background: "#000000",
        color: "#b8ffb8",
        display: "flex",
        flexDirection: "column",
        fontFamily: terminalFont
      }}
    >
      <div className="customScrollbar" style={{ flex: 1, minHeight: 0, overflow: "auto", padding: 16, whiteSpace: "pre-wrap" }}>
        <div style={{ display: "grid", gridTemplateColumns: "minmax(0, auto) 1fr", gap: 18, alignItems: "center", marginBottom: 16 }}>
          <pre style={{ margin: 0, color: "#8fd08f", lineHeight: 1.08 }}>{ANDROID_ASCII}</pre>
          <div style={{ lineHeight: 1.7, minWidth: 0 }}>
            <div>{t(locale, "terminal.device.version")}: {deviceInfo.version}</div>
            <div>{t(locale, "terminal.device.buildId")}: {deviceInfo.buildId}</div>
            <div>{t(locale, "terminal.device.status")}: {deviceInfo.status}</div>
          </div>
        </div>
        {lines.map((line) => (
          <div
            key={line.id}
            style={{
              color: line.kind === "error" ? "#ff7b72" : line.kind === "input" ? "#79c0ff" : line.kind === "system" ? "#f2cc60" : "#b8ffb8",
              marginBottom: 8
            }}
          >
            {line.text}
          </div>
        ))}
      </div>

      <form
        onSubmit={(event) => {
          event.preventDefault();
          void runCommand();
        }}
        style={{ display: "flex", alignItems: "center", gap: 8, padding: 14 }}
      >
        <span style={{ color: "#79c0ff", flex: "0 0 auto" }}>$</span>
        <input
          value={command}
          onChange={(event) => setCommand(event.currentTarget.value)}
          disabled={busy}
          placeholder={t(locale, "terminal.placeholder")}
          spellCheck={false}
          style={{
            flex: 1,
            minWidth: 0,
            border: 0,
            outline: "none",
            background: "transparent",
            color: "#b8ffb8",
            fontFamily: "inherit",
            fontSize: 13
          }}
        />
      </form>
      {dangerConfirmDialog}
    </div>
  );
}

