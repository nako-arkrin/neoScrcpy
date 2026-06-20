import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Card, Dropdown, IconButton, ListItem, PillButton, Switch } from "../../ui/m3";
import {
  IconAndroid,
  IconAdd,
  IconArrowLeft,
  IconCheck,
  IconChevronRight,
  IconCode,
  IconDelete,
  IconDevices,
  IconExternalLink,
  IconFileText,
  IconGithub,
  IconGlobe,
  IconHeart,
  IconInfo,
  IconKey,
  IconPages,
  IconPalette,
  IconPip,
  IconPower,
  IconSettings,
  IconShield,
  IconShizuku,
  IconSoundOff,
  IconSoundOn,
  IconTerminal,
  IconUpload
} from "../../ui/icons";
import {
  addRecentDevice,
  clearPipResumeState,
  clearRecentDevices,
  getPipResumeState,
  getState,
  ignoreDeviceTip,
  isDeviceTipIgnored,
  Locale,
  RecentDevice,
  removeRecentDevice,
  setLocale,
  setCommandLineEnabled,
  setDeveloperOptionsVisible,
  setFastbootScanEnabled,
  setPipResumeState,
  setShizukuEnabled,
  setTerminalFont,
  setThemeMode,
  ThemeMode
} from "../../shared/storage";
import { resolveTheme } from "../../shared/theme";
import { WebFastboot } from "../../shared/fastboot";
import { WebADB } from "../../shared/webadb";
import { frameBufferToObjectUrl, type FrameBufferLike } from "../../shared/framebuffer-preview";
import { useDangerConfirm } from "../../shared/useDangerConfirm";
import { useScrcpy } from "../../shared/useScrcpy";
import bannerImage from "../../assets/BG.png";
import avatarImage from "../../assets/avatar.jpg";
import logoImage from "../../assets/neoscrcpy.png";
import { formatThemeLabel, t } from "../../shared/i18n";
import { CommandLineScreen, ShizukuAdbScreen, TERMINAL_FONTS } from "./advanced-screens";
import { FileManagerScreen } from "./file-manager-screen";

type Screen =
  | "devices"
  | "deviceHome"
  | "fileManager"
  | "installApp"
  | "deviceTips"
  | "shizukuAdb"
  | "commandLine"
  | "settingsMain"
  | "settingsAppearance"
  | "settingsGeneral"
  | "settingsDeveloper"
  | "settingsPrivacy"
  | "settingsAbout"
  | "control"
  | "incompatible";

function useThemeState() {
  const [mode, setMode] = useState<ThemeMode>("system");
  useEffect(() => {
    let mounted = true;
    void (async () => {
      const s = await getState();
      if (!mounted) return;
      setMode(s.themeMode);
    })();
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    const mql = window.matchMedia("(prefers-color-scheme: dark)");
    const apply = () => {
      const theme = resolveTheme(mode, mql.matches);
      document.documentElement.dataset.theme = theme;
    };
    apply();
    mql.addEventListener("change", apply);
    return () => mql.removeEventListener("change", apply);
  }, [mode]);

  const update = useCallback(async (next: ThemeMode) => {
    setMode(next);
    await setThemeMode(next);
  }, []);

  const setFromStorage = useCallback((next: ThemeMode) => {
    setMode(next);
  }, []);

  return { mode, update, setFromStorage };
}

function useLocaleState() {
  const [locale, setLocaleValue] = useState<Locale>("zh-CN");
  useEffect(() => {
    let mounted = true;
    void (async () => {
      const s = await getState();
      if (!mounted) return;
      setLocaleValue(s.locale);
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const update = useCallback(async (next: Locale) => {
    setLocaleValue(next);
    await setLocale(next);
  }, []);

  const setFromStorage = useCallback((next: Locale) => {
    setLocaleValue(next);
  }, []);

  return { locale, update, setFromStorage };
}

function isCompatible() {
  const hasUsb = typeof navigator !== "undefined" && Boolean((navigator as any).usb);
  const hasWebCodecs = typeof (window as any).VideoDecoder !== "undefined";
  const hasWebGl = (() => {
    const c = document.createElement("canvas");
    return Boolean(c.getContext("webgl") || c.getContext("experimental-webgl"));
  })();
  return hasUsb && hasWebCodecs && hasWebGl;
}

export function SidePanelApp() {
  const { mode, update, setFromStorage } = useThemeState();
  const { locale, update: updateLocale, setFromStorage: setLocaleFromStorage } = useLocaleState();
  const [screen, setScreen] = useState<Screen>(() => (isCompatible() ? "devices" : "incompatible"));
  const [recent, setRecent] = useState<RecentDevice[]>([]);
  const [selectedSerial, setSelectedSerial] = useState<string | null>(null);
  const [controlTitle, setControlTitle] = useState<string | null>(null);
  const [controlActions, setControlActions] = useState<React.ReactNode>(null);
  const [shizukuEnabled, setShizukuEnabledValue] = useState(false);
  const [commandLineEnabled, setCommandLineEnabledValue] = useState(false);
  const [fastbootScanEnabled, setFastbootScanEnabledValue] = useState(false);
  const [developerOptionsVisible, setDeveloperOptionsVisibleValue] = useState(false);
  const [terminalFont, setTerminalFontValue] = useState(TERMINAL_FONTS[0].value);

  const titles: Record<Screen, string> = useMemo(
    () => ({
      devices: t(locale, "nav.devices"),
      deviceHome: controlTitle || "Android Device",
      fileManager: t(locale, "nav.fileManager"),
      installApp: t(locale, "nav.installApp"),
      deviceTips: t(locale, "nav.deviceTips"),
      shizukuAdb: t(locale, "nav.shizukuAdb"),
      commandLine: t(locale, "nav.commandLine"),
      settingsMain: t(locale, "nav.settings"),
      settingsAppearance: t(locale, "nav.settingsAppearance"),
      settingsGeneral: t(locale, "nav.settingsGeneral"),
      settingsDeveloper: t(locale, "nav.settingsDeveloper"),
      settingsPrivacy: t(locale, "nav.settingsPrivacy"),
      settingsAbout: t(locale, "nav.settingsAbout"),
      control: t(locale, "nav.control"),
      incompatible: t(locale, "nav.incompatible")
    }),
    [locale]
  );

  useEffect(() => {
    document.documentElement.lang = locale;
    document.title = `${titles[screen]} - neoScrcpy`;
  }, [locale, screen, titles]);

  useEffect(() => {
    let mounted = true;
    void (async () => {
      const s = await getState();
      if (!mounted) return;
      setRecent(s.recentDevices);
      setShizukuEnabledValue(s.shizukuEnabled);
      setCommandLineEnabledValue(s.commandLineEnabled);
      setFastbootScanEnabledValue(s.fastbootScanEnabled);
      setDeveloperOptionsVisibleValue(s.developerOptionsVisible);
      setTerminalFontValue(s.terminalFont);
      if (screen === "devices" && isCompatible()) {
        const resumeState = await getPipResumeState();
        if (!mounted || !resumeState?.serial) return;
        setSelectedSerial(resumeState.serial);
        setControlTitle(resumeState.title ?? null);
        setScreen("control");
        await clearPipResumeState();
      }
    })();
    const listener = (changes: Record<string, chrome.storage.StorageChange>, areaName: string) => {
      if (areaName !== "local") return;
      if (changes.recentDevices?.newValue) {
        setRecent(changes.recentDevices.newValue as RecentDevice[]);
      }
      if (changes.themeMode?.newValue) {
        setFromStorage(changes.themeMode.newValue as ThemeMode);
      }
      if (changes.locale?.newValue) {
        setLocaleFromStorage(changes.locale.newValue as Locale);
      }
      if (changes.shizukuEnabled) {
        setShizukuEnabledValue(Boolean(changes.shizukuEnabled.newValue));
      }
      if (changes.commandLineEnabled) {
        setCommandLineEnabledValue(Boolean(changes.commandLineEnabled.newValue));
      }
      if (changes.fastbootScanEnabled) {
        setFastbootScanEnabledValue(Boolean(changes.fastbootScanEnabled.newValue));
      }
      if (changes.developerOptionsVisible) {
        setDeveloperOptionsVisibleValue(Boolean(changes.developerOptionsVisible.newValue));
      }
      if (changes.terminalFont?.newValue) {
        setTerminalFontValue(changes.terminalFont.newValue as string);
      }
    };
    chrome.storage.onChanged.addListener(listener);
    return () => {
      mounted = false;
      chrome.storage.onChanged.removeListener(listener);
    };
  }, [screen, setFromStorage, setLocaleFromStorage]);

  const goBack = useCallback(() => {
    if (screen === "control") {
      setScreen("deviceHome");
      return;
    }
    if (screen === "fileManager" || screen === "installApp" || screen === "deviceTips" || screen === "shizukuAdb" || screen === "commandLine") {
      setScreen("deviceHome");
      return;
    }
    if (screen === "deviceHome") {
      setSelectedSerial(null);
      setControlTitle(null);
      setScreen("devices");
      return;
    }
    if (
      screen === "settingsAppearance" ||
      screen === "settingsGeneral" ||
      screen === "settingsDeveloper" ||
      screen === "settingsPrivacy" ||
      screen === "settingsAbout"
    ) {
      setScreen("settingsMain");
      return;
    }
    setScreen("devices");
  }, [screen]);

  const isOpeningRef = React.useRef(false);
  const openPermissionTab = useCallback(async () => {
    if (isOpeningRef.current) return;
    isOpeningRef.current = true;
    try {
      await chrome.runtime.sendMessage({ type: "OPEN_PERMISSION_TAB" });
    } finally {
      setTimeout(() => {
        isOpeningRef.current = false;
      }, 1000);
    }
  }, []);

  const openSettings = useCallback(() => setScreen("settingsMain"), []);

  const openDeviceHome = useCallback((serial?: string) => {
    setSelectedSerial(serial ?? null);
    setScreen("deviceHome");
  }, []);

  const openControl = useCallback(() => setScreen("control"), []);
  const openFileManager = useCallback(() => setScreen("fileManager"), []);
  const openInstallApp = useCallback(() => setScreen("installApp"), []);
  const openDeviceTips = useCallback(() => setScreen("deviceTips"), []);
  const openShizukuAdb = useCallback(() => setScreen("shizukuAdb"), []);
  const openCommandLine = useCallback(() => setScreen("commandLine"), []);
  const openPipLauncherForSelected = useCallback(async () => {
    const device = recent.find((d) => d.serial === selectedSerial);
    const params = new URLSearchParams();
    if (selectedSerial) params.set("serial", selectedSerial);
    params.set("title", device?.model || device?.name || "Android Device");
    const url = chrome.runtime.getURL(`pages/pip/index.html?${params.toString()}`);
    await setPipResumeState({ serial: selectedSerial ?? undefined, title: device?.model || device?.name || "Android Device" });
    await chrome.tabs.create({ url, active: true });
  }, [recent, selectedSerial]);

  const clearRecent = useCallback(async () => {
    await clearRecentDevices();
    setRecent([]);
  }, []);

  const removeRecent = useCallback(async (serial: string) => {
    await removeRecentDevice(serial);
    setRecent((current) => current.filter((device) => device.serial !== serial));
    if (selectedSerial === serial) {
      setSelectedSerial(null);
      setControlTitle(null);
    }
  }, [selectedSerial]);

  useEffect(() => {
    if (screen !== "control" && screen !== "fileManager" && screen !== "deviceHome") {
      setControlActions(null);
    }
    if (screen !== "control" && screen !== "deviceHome" && screen !== "fileManager" && screen !== "installApp" && screen !== "commandLine") {
      setControlTitle(null);
    }
  }, [screen]);

  useEffect(() => {
    const device = recent.find((d) => d.serial === selectedSerial);
    if (!device) return;
    setControlTitle(device.model || device.name || "Android Device");
  }, [recent, selectedSerial]);

  return (
    <div className="appRoot" data-screen={screen}>
      <header className="header">
        <div style={{ display: "flex", alignItems: "center", gap: 6, minWidth: 0 }}>
          {screen !== "devices" && (
            <IconButton onClick={goBack} title={t(locale, "common.back")}>
              <IconArrowLeft size={20} />
            </IconButton>
          )}
          <div className="headerTitle">{screen === "control" ? controlTitle || "Android Device" : titles[screen]}</div>
        </div>
        <div style={{ display: "flex", gap: 6 }}>
          {screen === "devices" && (
            <IconButton onClick={openSettings} title={t(locale, "common.settings")}>
              <IconSettings size={20} />
            </IconButton>
          )}
          {(screen === "control" || screen === "fileManager" || screen === "deviceHome") && controlActions}
        </div>
      </header>

      <main
        className="page"
        style={screen === "control" || screen === "fileManager" ? { overflow: "hidden", paddingBottom: 0 } : undefined}
      >
        {screen === "incompatible" && <IncompatibleScreen locale={locale} />}
        {screen === "devices" && (
          <DevicesScreen
            locale={locale}
            recent={recent}
            onOpenPermission={openPermissionTab}
            onOpenControl={openDeviceHome}
            onClearRecent={clearRecent}
            onRemoveRecent={(serial) => void removeRecent(serial)}
            fastbootScanEnabled={fastbootScanEnabled}
          />
        )}
        {screen === "deviceHome" && (
          <DeviceHomeScreen
            locale={locale}
            device={recent.find((d) => d.serial === selectedSerial) ?? null}
            onFileManager={openFileManager}
            onControl={openControl}
            onInstallApp={openInstallApp}
            onPip={() => void openPipLauncherForSelected()}
            onDeviceTips={openDeviceTips}
            onShizukuAdb={openShizukuAdb}
            onCommandLine={openCommandLine}
            onNeedPermission={openPermissionTab}
            onUpdateHeaderActions={setControlActions}
            shizukuEnabled={shizukuEnabled}
            commandLineEnabled={commandLineEnabled}
            developerOptionsVisible={developerOptionsVisible}
          />
        )}
        {screen === "fileManager" && (
          <FileManagerScreen
            serial={selectedSerial ?? undefined}
            locale={locale}
            onNeedPermission={openPermissionTab}
            onUpdateHeaderActions={setControlActions}
          />
        )}
        {screen === "installApp" && <InstallAppScreen locale={locale} serial={selectedSerial ?? undefined} onNeedPermission={openPermissionTab} />}
        {screen === "deviceTips" && (
          <DeviceTipsScreen
            locale={locale}
            device={recent.find((d) => d.serial === selectedSerial) ?? null}
            onNeedPermission={openPermissionTab}
          />
        )}
        {screen === "shizukuAdb" && <ShizukuAdbScreen locale={locale} serial={selectedSerial ?? undefined} onNeedPermission={openPermissionTab} />}
        {screen === "commandLine" && (
          <CommandLineScreen
            locale={locale}
            serial={selectedSerial ?? undefined}
            onNeedPermission={openPermissionTab}
            onOpenScreen={openControl}
            terminalFont={terminalFont}
            mode={recent.find((d) => d.serial === selectedSerial)?.mode ?? "adb"}
          />
        )}
        {screen === "settingsMain" && (
          <SettingsMainScreen
            locale={locale}
            themeMode={mode}
            developerOptionsVisible={developerOptionsVisible}
            onNavigate={(s) => setScreen(s)}
          />
        )}
        {screen === "settingsAppearance" && <SettingsAppearanceScreen locale={locale} themeMode={mode} onThemeMode={update} />}
        {screen === "settingsGeneral" && <SettingsGeneralScreen locale={locale} value={locale} onLocale={updateLocale} />}
        {screen === "settingsDeveloper" && (
          <SettingsDeveloperScreen
            shizukuEnabled={shizukuEnabled}
            onShizukuEnabled={async (next) => {
              setShizukuEnabledValue(next);
              await setShizukuEnabled(next);
            }}
            commandLineEnabled={commandLineEnabled}
            onCommandLineEnabled={async (next) => {
              setCommandLineEnabledValue(next);
              await setCommandLineEnabled(next);
            }}
            fastbootScanEnabled={fastbootScanEnabled}
            onFastbootScanEnabled={async (next) => {
              setFastbootScanEnabledValue(next);
              await setFastbootScanEnabled(next);
            }}
            locale={locale}
            terminalFont={terminalFont}
            onTerminalFont={async (next) => {
              setTerminalFontValue(next);
              await setTerminalFont(next);
            }}
          />
        )}
        {screen === "settingsPrivacy" && <SettingsPrivacyScreen locale={locale} />}
        {screen === "settingsAbout" && (
          <SettingsAboutScreen
            locale={locale}
            developerOptionsVisible={developerOptionsVisible}
            onDeveloperOptionsVisible={async (next) => {
              setDeveloperOptionsVisibleValue(next);
              await setDeveloperOptionsVisible(next);
            }}
          />
        )}
        {screen === "control" && (
          <ControlScreen
            locale={locale}
            serial={selectedSerial ?? undefined}
            onNeedPermission={openPermissionTab}
            onConnected={addRecentDevice}
            onUpdateHeaderTitle={setControlTitle}
            onUpdateHeaderActions={setControlActions}
          />
        )}
      </main>
    </div>
  );
}

function IncompatibleScreen({ locale }: { locale: Locale }) {
  return (
    <div className="container">
      <div className="centerEmpty">
        <div style={{ fontSize: 16, fontWeight: 700, color: "var(--color-on-surface)" }}>{t(locale, "incompatible.title")}</div>
        <div style={{ marginTop: 8, fontSize: 13 }}>{t(locale, "incompatible.subtitle")}</div>
      </div>
    </div>
  );
}

function DevicesScreen({
  locale,
  recent,
  onOpenPermission,
  onOpenControl,
  onClearRecent,
  onRemoveRecent,
  fastbootScanEnabled
}: {
  locale: Locale;
  recent: RecentDevice[];
  onOpenPermission: () => void;
  onOpenControl: (serial?: string) => void;
  onClearRecent: () => void;
  onRemoveRecent: (serial: string) => void;
  fastbootScanEnabled: boolean;
}) {
  useEffect(() => {
    if (!fastbootScanEnabled) return;
    let disposed = false;
    void (async () => {
      const connections = await WebFastboot.getInstance().listGranted().catch(() => []);
      for (const connection of connections) {
        if (disposed) {
          await connection.dispose().catch(() => {});
          continue;
        }
        await addRecentDevice({
          serial: connection.serial,
          name: connection.name,
          model: connection.model,
          mode: "fastboot"
        });
        await connection.dispose().catch(() => {});
      }
    })();
    return () => {
      disposed = true;
    };
  }, [fastbootScanEnabled]);

  return (
    <div className="container">
      <Card>
        <ListItem
          icon={<IconAdd size={20} />}
          title={t(locale, "devices.connect.title")}
          subtitle={t(locale, "devices.connect.subtitle")}
          isNav
          onClick={onOpenPermission}
        />
      </Card>

      <Card>
        <ListItem
          icon={<IconDevices size={20} />}
          title={t(locale, "devices.recent.title")}
          subtitle={recent.length ? t(locale, "devices.recent.subtitleHas") : t(locale, "devices.recent.subtitleEmpty")}
          action={
            recent.length ? (
              <IconButton onClick={onClearRecent} title={t(locale, "devices.recent.clear")}>
                <IconDelete size={18} />
              </IconButton>
            ) : null
          }
        />
        {recent.length ? (
          recent.map((d) => (
            <RecentDeviceRow
              key={d.serial}
              device={d}
              locale={locale}
              onOpen={() => onOpenControl(d.serial)}
              onRemove={() => onRemoveRecent(d.serial)}
            />
          ))
        ) : (
          <div className="centerEmpty">{t(locale, "devices.recent.emptyHint")}</div>
        )}
      </Card>
    </div>
  );
}

function RecentDeviceRow({
  device,
  locale,
  onOpen,
  onRemove
}: {
  device: RecentDevice;
  locale: Locale;
  onOpen: () => void;
  onRemove: () => void;
}) {
  const [hovered, setHovered] = useState(false);
  return (
    <div
      className="listItem clickable"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={onOpen}
    >
      <div className="listLead">
        <div className="listIcon" style={device.mode === "fastboot" ? { color: "#f97316" } : undefined}>
          {device.mode === "fastboot" ? <IconTerminal size={20} /> : <IconDevices size={20} />}
        </div>
        <div className="listTexts">
          <div className="listTitle">{device.model || device.name || "Android Device"}</div>
          <div className="listSubtitle">
            {device.mode === "fastboot" ? `${t(locale, "devices.mode.fastboot")} · ${device.serial}` : device.serial}
          </div>
        </div>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        {hovered && (
          <button
            className="iconBtn fileActionButton"
            title={t(locale, "devices.recent.remove")}
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              onRemove();
            }}
          >
            <IconDelete size={18} />
          </button>
        )}
        <IconChevronRight size={18} />
      </div>
    </div>
  );
}

function isHighRiskCommand(command: string[]) {
  const value = command.join(" ").trim().toLowerCase();
  return value === "reboot bootloader" || value === "reboot recovery" || value === "flashing unlock";
}

function DeviceHomeScreen({
  locale,
  device,
  onFileManager,
  onControl,
  onInstallApp,
  onPip,
  onDeviceTips,
  onShizukuAdb,
  onCommandLine,
  onNeedPermission,
  onUpdateHeaderActions,
  shizukuEnabled,
  commandLineEnabled,
  developerOptionsVisible
}: {
  locale: Locale;
  device: RecentDevice | null;
  onFileManager: () => void;
  onControl: () => void;
  onInstallApp: () => void;
  onPip: () => void;
  onDeviceTips: () => void;
  onShizukuAdb: () => void;
  onCommandLine: () => void;
  onNeedPermission: () => void;
  onUpdateHeaderActions: (actions: React.ReactNode) => void;
  shizukuEnabled: boolean;
  commandLineEnabled: boolean;
  developerOptionsVisible: boolean;
}) {
  const title = device?.model || device?.name || "Android Device";
  const serial = device?.serial || t(locale, "common.noDeviceSelected");
  const isFastboot = device?.mode === "fastboot";
  const hasDeviceTip = isXiaomiDeviceName(title) || isXiaomiDeviceName(device?.name);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewFailed, setPreviewFailed] = useState(false);
  const { confirmDanger, dangerConfirmDialog } = useDangerConfirm(locale);

  const runPowerCommand = useCallback(
    async (command: string[]) => {
      if (isHighRiskCommand(command) && !(await confirmDanger(command.join(" ")))) return;
      if (isFastboot) {
        const connection = device?.serial ? await WebFastboot.getInstance().connectGranted(device.serial) : null;
        if (!connection) {
          onNeedPermission();
          return;
        }
        try {
          await connection.execute(command.join(" "));
        } catch (error) {
          console.warn("Failed to run fastboot command:", error);
        } finally {
          await connection.dispose();
        }
        return;
      }
      const connection = device?.serial ? await WebADB.getInstance().connectGranted(device.serial) : null;
      if (!connection) {
        onNeedPermission();
        return;
      }
      try {
        await connection.adb.subprocess.noneProtocol.spawnWaitText(command);
      } catch (error) {
        console.warn("Failed to run power command:", error);
      } finally {
        await connection.dispose();
      }
    },
    [confirmDanger, device?.serial, isFastboot, onNeedPermission]
  );

  useEffect(() => {
    if (isFastboot) {
      onUpdateHeaderActions(null);
      return;
    }
    onUpdateHeaderActions(
      <HeaderPowerMenu
        locale={locale}
        disabled={!device?.serial}
        developerOptionsVisible={developerOptionsVisible}
        onCommand={(command) => void runPowerCommand(command)}
      />
    );
    return () => onUpdateHeaderActions(null);
  }, [developerOptionsVisible, device?.serial, isFastboot, locale, onUpdateHeaderActions, runPowerCommand]);

  useEffect(() => {
    let disposed = false;
    let objectUrl: string | null = null;
    setPreviewUrl(null);
    setPreviewFailed(false);

    void (async () => {
      if (!device?.serial || isFastboot) {
        setPreviewFailed(true);
        return;
      }
      const connection = await WebADB.getInstance().connectGranted(device.serial);
      if (!connection) {
        if (!disposed) setPreviewFailed(true);
        return;
      }
      try {
        const frame = await connection.adb.framebuffer();
        objectUrl = await frameBufferToObjectUrl(frame as FrameBufferLike);
        if (!disposed && objectUrl) setPreviewUrl(objectUrl);
        if (!disposed && !objectUrl) setPreviewFailed(true);
      } catch {
        if (!disposed) setPreviewFailed(true);
      } finally {
        await connection.dispose();
      }
    })();

    return () => {
      disposed = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [device?.serial, isFastboot]);

  return (
    <>
    <div className="container" style={{ paddingTop: 12 }}>
      <Card style={isFastboot ? { background: "linear-gradient(135deg, #f97316, #fb923c)", color: "#fff" } : undefined}>
        <div style={{ minHeight: 150, padding: 18, display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 20, overflow: "hidden" }}>
          <div style={{ minWidth: 0, paddingLeft: 4, paddingTop: 10 }}>
            <div style={{ fontSize: 18, fontWeight: 900, color: isFastboot ? "#fff" : "var(--color-on-surface)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{title}</div>
            <div className="muted" style={{ marginTop: 6, fontSize: 13, lineHeight: 1.5, color: isFastboot ? "rgba(255,255,255,0.82)" : undefined }}>{serial}</div>
          </div>
          <div
            aria-label={t(locale, "deviceHome.preview")}
            style={{
              alignSelf: "flex-end",
              flex: "0 0 auto",
              width: 118,
              height: 162,
              marginRight: 20,
              marginBottom: -38,
              border: "4px solid #ffffff",
              borderBottom: 0,
              borderRadius: "24px 24px 0 0",
              overflow: "hidden",
              background: isFastboot ? "rgba(124,45,18,0.35)" : "#8e8e93",
              display: "grid",
              placeItems: "center",
              boxShadow: "0 -1px 0 rgba(255,255,255,0.4)"
            }}
          >
            {previewUrl && !isFastboot ? (
              <img
                src={previewUrl}
                alt={t(locale, "deviceHome.preview")}
                style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
              />
            ) : (
              <span style={{ color: previewFailed || isFastboot ? "#f2f2f2" : "rgba(255,255,255,0.5)", display: "inline-flex" }}>
                <IconAndroid size={46} />
              </span>
            )}
          </div>
        </div>
      </Card>

      <Card>
        {isFastboot ? (
          <>
            <ListItem
              icon={<IconTerminal size={20} />}
              title={t(locale, "deviceHome.commandLine.title")}
              subtitle={t(locale, "deviceHome.fastbootCommandLine.subtitle")}
              isNav
              onClick={onCommandLine}
            />
            <ListItem
              icon={<IconPower size={20} />}
              title={t(locale, "deviceHome.fastbootReboot.title")}
              subtitle={t(locale, "deviceHome.fastbootReboot.subtitle")}
              onClick={() => void runPowerCommand(["reboot"])}
            />
          </>
        ) : (
          <>
            <ListItem
              icon={<IconFileText size={20} />}
              title={t(locale, "deviceHome.fileManager.title")}
              subtitle={t(locale, "deviceHome.fileManager.subtitle")}
              isNav
              onClick={onFileManager}
            />
            <ListItem
              icon={<IconDevices size={20} />}
              title={t(locale, "deviceHome.control.title")}
              subtitle={t(locale, "deviceHome.control.subtitle")}
              isNav
              onClick={onControl}
            />
            <ListItem
              icon={<IconPages size={20} />}
              title={t(locale, "deviceHome.installApp.title")}
              subtitle={t(locale, "deviceHome.installApp.subtitle")}
              isNav
              onClick={onInstallApp}
            />
            <ListItem
              icon={<IconPip size={20} />}
              title={t(locale, "deviceHome.pip.title")}
              subtitle={t(locale, "deviceHome.pip.subtitle")}
              isNav
              onClick={onPip}
            />
            {hasDeviceTip && (
              <ListItem
                icon={<span style={{ color: "#f97316", display: "inline-flex" }}><IconInfo size={20} /></span>}
                title={t(locale, "deviceHome.deviceTips.title")}
                subtitle={t(locale, "deviceHome.deviceTips.subtitle")}
                isNav
                onClick={onDeviceTips}
              />
            )}
            {(shizukuEnabled || commandLineEnabled) && (
              <>
                {shizukuEnabled && (
                <ListItem
                  icon={<IconShizuku size={22} />}
                  title={t(locale, "deviceHome.shizuku.title")}
                  subtitle={t(locale, "deviceHome.shizuku.subtitle")}
                  isNav
                  onClick={onShizukuAdb}
                />
                )}
                {commandLineEnabled && (
                <ListItem
                  icon={<IconTerminal size={20} />}
                  title={t(locale, "deviceHome.commandLine.title")}
                  subtitle={t(locale, "deviceHome.commandLine.subtitle")}
                  isNav
                  onClick={onCommandLine}
                />
                )}
              </>
            )}
          </>
        )}
      </Card>
    </div>
    {dangerConfirmDialog}
    </>
  );
}

function formatFileSize(size: bigint | number) {
  const value = typeof size === "bigint" ? Number(size) : size;
  if (!Number.isFinite(value) || value <= 0) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  let next = value;
  let unit = 0;
  while (next >= 1024 && unit < units.length - 1) {
    next /= 1024;
    unit += 1;
  }
  return `${next.toFixed(unit === 0 ? 0 : 1)} ${units[unit]}`;
}

function DeviceTipsScreen({
  locale,
  device,
  onNeedPermission
}: {
  locale: Locale;
  device: RecentDevice | null;
  onNeedPermission: () => void;
}) {
  const [status, setStatus] = useState("");
  const serial = device?.serial;

  const openDeveloperOptions = useCallback(async () => {
    const connection = serial ? await WebADB.getInstance().connectGranted(serial) : await WebADB.getInstance().requestDevice();
    if (!connection) {
      setStatus(t(locale, "deviceTips.status.permissionRequired"));
      onNeedPermission();
      return;
    }
    try {
      await connection.adb.subprocess.noneProtocol.spawnWaitText([
        "am",
        "start",
        "-a",
        "android.settings.APPLICATION_DEVELOPMENT_SETTINGS"
      ]);
      setStatus(t(locale, "deviceTips.status.openedDeveloperOptions"));
    } catch (error) {
      setStatus(error instanceof Error ? error.message : String(error));
    } finally {
      await connection.dispose();
    }
  }, [locale, onNeedPermission, serial]);

  const ignoreTip = useCallback(async () => {
    if (!serial) return;
    await ignoreDeviceTip(serial);
    setStatus(t(locale, "deviceTips.status.ignored"));
  }, [locale, serial]);

  return (
    <div className="container" style={{ paddingTop: 12 }}>
      <Card>
        <ListItem
          icon={<span style={{ color: "#f97316", display: "inline-flex" }}><IconInfo size={20} /></span>}
          title={t(locale, "deviceHome.deviceTips.title")}
          subtitle={t(locale, "deviceHome.deviceTips.subtitle")}
        />
        <div style={{ padding: "0 16px 16px", display: "flex", flexDirection: "column", gap: 12 }}>
          <div style={{ fontSize: 15, fontWeight: 800, color: "var(--color-on-surface)" }}>
            {t(locale, "deviceTips.xiaomi.title")}
          </div>
          <div className="muted" style={{ fontSize: 13, lineHeight: 1.55 }}>
            {t(locale, "deviceTips.xiaomi.body")}
          </div>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <PillButton variant="secondary" onClick={() => void openDeveloperOptions()}>
              {t(locale, "deviceTips.openDeveloperOptions")}
            </PillButton>
            <PillButton onClick={() => void ignoreTip()} disabled={!serial}>
              {t(locale, "deviceTips.ignore")}
            </PillButton>
          </div>
          {status && <div className="muted" style={{ fontSize: 12, lineHeight: 1.5 }}>{status}</div>}
        </div>
      </Card>
    </div>
  );
}

function InstallAppScreen({ locale, serial, onNeedPermission }: { locale: Locale; serial?: string; onNeedPermission: () => void }) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [status, setStatus] = useState(() => t(locale, "installApp.status.pick"));
  const [busy, setBusy] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const pickApk = useCallback((file?: File | null) => {
    if (!file) return;
    if (!file.name.toLowerCase().endsWith(".apk")) {
      setSelectedFile(null);
      setStatus(t(locale, "installApp.status.pickApk"));
      return;
    }
    setSelectedFile(file);
    setStatus(t(locale, "installApp.status.ready"));
  }, [locale]);

  const install = useCallback(async () => {
    if (!selectedFile || busy) return;
    if (!selectedFile.name.toLowerCase().endsWith(".apk")) {
      setStatus(t(locale, "installApp.status.pickApk"));
      return;
    }

    setBusy(true);
    setStatus(t(locale, "installApp.status.connecting"));
    const connection = serial ? await WebADB.getInstance().connectGranted(serial) : await WebADB.getInstance().requestDevice();
    if (!connection) {
      setBusy(false);
      setStatus(t(locale, "deviceTips.status.permissionRequired"));
      onNeedPermission();
      return;
    }

    const remotePath = "/data/local/tmp/neoScrcpy-install.apk";
    let sync: Awaited<ReturnType<typeof connection.adb.sync>> | undefined;
    try {
      sync = await connection.adb.sync();
      setStatus(t(locale, "installApp.status.transferring"));
      await sync.write({
        filename: remotePath,
        file: selectedFile.stream() as any,
        permission: 0o644,
        mtime: Math.floor(Date.now() / 1000)
      });
      setStatus(t(locale, "installApp.status.installing"));
      const output = await connection.adb.subprocess.noneProtocol.spawnWaitText(["pm", "install", "-r", remotePath]);
      await connection.adb.rm(remotePath, { force: true }).catch(() => undefined);
      setStatus(output.trim() || t(locale, "installApp.status.done"));
    } catch (error) {
      setStatus(error instanceof Error ? error.message : String(error));
    } finally {
      await sync?.dispose();
      await connection.dispose();
      setBusy(false);
    }
  }, [busy, locale, onNeedPermission, selectedFile, serial]);

  return (
    <div className="container" style={{ paddingTop: 12 }}>
      <Card>
        <div style={{ padding: 16, display: "flex", flexDirection: "column", gap: 12 }}>
          <input
            ref={inputRef}
            type="file"
            accept=".apk,application/vnd.android.package-archive"
            onChange={(event) => pickApk(event.currentTarget.files?.[0] ?? null)}
            style={{ display: "none" }}
          />
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            onDragOver={(event) => {
              event.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={(event) => {
              event.preventDefault();
              setIsDragging(false);
              pickApk(event.dataTransfer.files?.[0] ?? null);
            }}
            style={{
              width: "100%",
              border: `1.5px dashed ${isDragging ? "var(--color-on-surface)" : "var(--color-outline-variant)"}`,
              borderRadius: 14,
              background: isDragging ? "var(--color-surface-container-high)" : "var(--color-surface)",
              color: "var(--color-on-surface)",
              padding: 18,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 10,
              cursor: "pointer",
              textAlign: "center"
            }}
          >
            <span
              style={{
                width: 44,
                height: 44,
                borderRadius: 999,
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                background: "var(--color-surface-container-high)"
              }}
            >
              <IconUpload size={22} />
            </span>
            <span style={{ fontSize: 14, fontWeight: 800 }}>{selectedFile ? selectedFile.name : t(locale, "installApp.dropLabel")}</span>
            <span className="muted" style={{ fontSize: 12, lineHeight: 1.5 }}>
              {t(locale, "installApp.support")}
            </span>
          </button>
          <div className="muted" style={{ fontSize: 12, lineHeight: 1.5 }}>
            {selectedFile ? `${selectedFile.name} · ${formatFileSize(selectedFile.size)}` : t(locale, "installApp.noFile")}
          </div>
          <PillButton onClick={() => void install()} disabled={busy || !selectedFile}>
            {busy ? t(locale, "installApp.installing") : t(locale, "installApp.install")}
          </PillButton>
          <div className="muted" style={{ fontSize: 12, lineHeight: 1.5, whiteSpace: "pre-wrap" }}>{status}</div>
        </div>
      </Card>
    </div>
  );
}

function SettingsMainScreen({
  locale,
  themeMode,
  developerOptionsVisible,
  onNavigate
}: {
  locale: Locale;
  themeMode: ThemeMode;
  developerOptionsVisible: boolean;
  onNavigate: (screen: Exclude<Screen, "devices" | "control" | "incompatible">) => void;
}) {
  const themeLabel = formatThemeLabel(locale, themeMode);

  return (
    <div className="container" style={{ paddingTop: 12 }}>
      <Card>
        <ListItem
          icon={<IconPalette size={20} />}
          title={t(locale, "settingsMain.appearance.title")}
          subtitle={t(locale, "settingsMain.appearance.subtitle", { theme: themeLabel })}
          onClick={() => onNavigate("settingsAppearance")}
          isNav
        />
        <ListItem
          icon={<IconSettings size={20} />}
          title={t(locale, "settingsMain.general.title")}
          subtitle={t(locale, "settingsMain.general.subtitle")}
          onClick={() => onNavigate("settingsGeneral")}
          isNav
        />
        {developerOptionsVisible && (
          <ListItem
            icon={<IconCode size={20} />}
            title={t(locale, "settingsMain.developer.title")}
            subtitle={t(locale, "settingsMain.developer.subtitle")}
            onClick={() => onNavigate("settingsDeveloper")}
            isNav
          />
        )}
      </Card>

      <Card>
        <ListItem
          icon={<IconShield size={20} />}
          title={t(locale, "settingsMain.privacy.title")}
          subtitle={t(locale, "settingsMain.privacy.subtitle")}
          onClick={() => onNavigate("settingsPrivacy")}
          isNav
        />
      </Card>

      <Card>
        <ListItem
          icon={<IconInfo size={20} />}
          title={t(locale, "settingsMain.about.title")}
          subtitle={t(locale, "settingsMain.about.subtitle")}
          onClick={() => onNavigate("settingsAbout")}
          isNav
        />
      </Card>
    </div>
  );
}

function SettingsAppearanceScreen({
  locale,
  themeMode,
  onThemeMode
}: {
  locale: Locale;
  themeMode: ThemeMode;
  onThemeMode: (m: ThemeMode) => void;
}) {
  return (
    <div className="container" style={{ paddingTop: 12 }}>
      <Card>
        <div style={{ padding: 16 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: "var(--color-on-surface-variant)", marginBottom: 10 }}>
            {t(locale, "appearance.section.title")}
          </div>
          <Dropdown
            value={themeMode}
            onChange={(v) => onThemeMode(v as ThemeMode)}
            options={[
              { value: "light", label: t(locale, "appearance.theme.light") },
              { value: "system", label: t(locale, "appearance.theme.system") },
              { value: "dark", label: t(locale, "appearance.theme.dark") },
              { value: "pink", label: t(locale, "appearance.theme.pink") },
              { value: "deepBlue", label: t(locale, "appearance.theme.deepBlue") }
            ]}
          />
        </div>
      </Card>
    </div>
  );
}

function SettingsGeneralScreen({ locale, value, onLocale }: { locale: Locale; value: Locale; onLocale: (l: Locale) => void }) {
  const [contextMenu, setContextMenu] = useState(true);

  return (
    <div className="container" style={{ paddingTop: 12 }}>
      <Card>
        <ListItem
          icon={<IconGlobe size={20} />}
          title={t(locale, "general.language.title")}
          subtitle={t(locale, "general.language.subtitle")}
          action={
            <Dropdown
              value={value}
              onChange={(v) => onLocale(v as Locale)}
              options={[
                { value: "zh-CN", label: t(locale, "general.language.zhCN") },
                { value: "en-US", label: t(locale, "general.language.enUS") }
              ]}
            />
          }
        />
        <ListItem
          icon={<IconKey size={20} />}
          title={t(locale, "general.contextMenu.title")}
          subtitle={t(locale, "general.contextMenu.subtitle")}
          action={<Switch checked={contextMenu} onChange={setContextMenu} />}
        />
      </Card>
    </div>
  );
}

function SettingsDeveloperScreen({
  locale,
  shizukuEnabled,
  onShizukuEnabled,
  commandLineEnabled,
  onCommandLineEnabled,
  fastbootScanEnabled,
  onFastbootScanEnabled,
  terminalFont,
  onTerminalFont
}: {
  locale: Locale;
  shizukuEnabled: boolean;
  onShizukuEnabled: (next: boolean) => void;
  commandLineEnabled: boolean;
  onCommandLineEnabled: (next: boolean) => void;
  fastbootScanEnabled: boolean;
  onFastbootScanEnabled: (next: boolean) => void;
  terminalFont: string;
  onTerminalFont: (next: string) => void;
}) {
  return (
    <div className="container" style={{ paddingTop: 12 }}>
      <Card>
        <ListItem
          icon={<IconShizuku size={22} />}
          title={t(locale, "developer.shizuku.title")}
          subtitle={t(locale, "developer.shizuku.subtitle")}
          action={<Switch checked={shizukuEnabled} onChange={onShizukuEnabled} />}
        />
        <ListItem
          icon={<IconTerminal size={20} />}
          title={t(locale, "developer.commandLine.title")}
          subtitle={t(locale, "developer.commandLine.subtitle")}
          action={<Switch checked={commandLineEnabled} onChange={onCommandLineEnabled} />}
        />
        <ListItem
          icon={<span style={{ color: "#f97316", display: "inline-flex" }}><IconTerminal size={20} /></span>}
          title={t(locale, "developer.fastbootScan.title")}
          subtitle={t(locale, "developer.fastbootScan.subtitle")}
          action={<Switch checked={fastbootScanEnabled} onChange={onFastbootScanEnabled} />}
        />
        <ListItem
          icon={<IconTerminal size={20} />}
          title={t(locale, "developer.terminalFont.title")}
          subtitle={t(locale, "developer.terminalFont.subtitle")}
          action={
            <Dropdown
              value={terminalFont}
              onChange={onTerminalFont}
              options={TERMINAL_FONTS.map((item) => ({ value: item.value, label: item.label }))}
            />
          }
        />
      </Card>
    </div>
  );
}

function SettingsPrivacyScreen({ locale }: { locale: Locale }) {
  return (
    <div className="container" style={{ paddingTop: 12, gap: 18 }}>
      <section>
        <div style={{ fontSize: 13, fontWeight: 700, color: "var(--color-primary)", padding: "0 16px", marginBottom: 8 }}>
          {t(locale, "privacy.section.controls")}
        </div>
        <Card>
          <ListItem
            icon={<IconFileText size={20} />}
            title={t(locale, "privacy.policy.title")}
            subtitle={t(locale, "privacy.policy.subtitle")}
            isNav
            onClick={() => window.open("#", "_blank")}
          />
        </Card>
      </section>

      <section>
        <div style={{ fontSize: 13, fontWeight: 700, color: "var(--color-primary)", padding: "0 16px", marginBottom: 8 }}>
          {t(locale, "privacy.section.permissions")}
        </div>
        <Card>
          <ListItem
            icon={<IconGlobe size={20} />}
            title={t(locale, "privacy.perm.webusb.title")}
            subtitle={t(locale, "privacy.perm.webusb.subtitle")}
            action={<IconCheck size={20} />}
          />
          <ListItem
            icon={<IconKey size={20} />}
            title={t(locale, "privacy.perm.storage.title")}
            subtitle={t(locale, "privacy.perm.storage.subtitle")}
            action={<IconCheck size={20} />}
          />
          <ListItem
            icon={<IconExternalLink size={20} />}
            title={t(locale, "privacy.perm.sidepanel.title")}
            subtitle={t(locale, "privacy.perm.sidepanel.subtitle")}
            action={<IconCheck size={20} />}
          />
          <ListItem
            icon={<IconDevices size={20} />}
            title={t(locale, "privacy.perm.tabs.title")}
            subtitle={t(locale, "privacy.perm.tabs.subtitle")}
            action={<IconCheck size={20} />}
          />
        </Card>
      </section>
    </div>
  );
}

function SettingsAboutScreen({
  locale,
  developerOptionsVisible,
  onDeveloperOptionsVisible
}: {
  locale: Locale;
  developerOptionsVisible: boolean;
  onDeveloperOptionsVisible: (next: boolean) => void;
}) {
  const [versionClicks, setVersionClicks] = useState(0);
  const [developerMessage, setDeveloperMessage] = useState("");

  const toggleDeveloperOptions = useCallback(() => {
    setVersionClicks((count) => {
      const nextCount = count + 1;
      if (nextCount < 3) return nextCount;
      const nextVisible = !developerOptionsVisible;
      onDeveloperOptionsVisible(nextVisible);
      setDeveloperMessage(t(locale, nextVisible ? "about.developer.enabled" : "about.developer.hidden"));
      return 0;
    });
  }, [developerOptionsVisible, locale, onDeveloperOptionsVisible]);

  return (
    <>
      <div style={{ padding: "12px 16px 0" }}>
        <Card
          className="banner-card"
          style={{
            height: 192,
            position: "relative",
            background: "#000",
            padding: 0,
            borderRadius: 12,
            boxShadow: "none"
          }}
        >
          <img
            src={bannerImage}
            alt="Background Character"
            style={{
              position: "absolute",
              inset: 0,
              width: "100%",
              height: "100%",
              objectFit: "cover",
              opacity: 0.8
            }}
          />
          <div
            style={{
              position: "absolute",
              inset: 0,
              background: "linear-gradient(135deg, #111827, #000000)",
              opacity: 0.2,
              mixBlendMode: "multiply"
            }}
          />
          <div style={{ position: "absolute", inset: 0, opacity: 0.18, pointerEvents: "none" }}>
            <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                  <path d="M 40 0 L 0 0 0 40" fill="none" stroke="white" strokeWidth="1" />
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#grid)" />
            </svg>
          </div>
          <div
            style={{
              position: "absolute",
              inset: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              pointerEvents: "none"
            }}
          >
            <img src={logoImage} alt="neoScrcpy Logo" style={{ width: 60, height: 60, objectFit: "contain" }} />
          </div>
          <div
            style={{
              position: "absolute",
              bottom: 0,
              left: 0,
              right: 0,
              height: 60,
              background: "linear-gradient(to top, rgba(0,0,0,0.8), transparent)"
            }}
          />
        </Card>
      </div>

      <div className="container" style={{ paddingTop: 16, gap: 18 }}>
        <section>
          <div style={{ fontSize: 13, fontWeight: 700, color: "var(--color-primary)", padding: "0 16px", marginBottom: 8 }}>
            {t(locale, "about.section.character")}
          </div>
          <Card>
            <div style={{ padding: 18, display: "flex", flexDirection: "column", gap: 8 }}>
              <div style={{ fontSize: 16, fontWeight: 800, color: "var(--color-on-surface)" }}>{t(locale, "about.character.name")}</div>
              <div style={{ fontSize: 13, color: "var(--color-on-surface-variant)", lineHeight: 1.6 }}>
                {t(locale, "about.character.desc")}
              </div>
              <div style={{ fontSize: 12, color: "var(--color-on-surface-variant)", opacity: 0.7, marginTop: 4 }}>
                {t(locale, "about.character.credit", { author: "gnlop" })}
              </div>
            </div>
          </Card>
        </section>

        <section>
          <div style={{ fontSize: 13, fontWeight: 700, color: "var(--color-primary)", padding: "0 16px", marginBottom: 8 }}>
            {t(locale, "about.section.project")}
          </div>
          <Card>
            <ListItem
              icon={<IconInfo size={20} />}
              title={t(locale, "about.version.title")}
              subtitle="Beta Ver 0.1.3"
              onClick={toggleDeveloperOptions}
            />
            {developerMessage ? (
              <div className="muted" style={{ padding: "0 16px 14px", fontSize: 12, lineHeight: 1.5 }}>
                {developerMessage}
              </div>
            ) : null}
            <ListItem
              icon={
                <img
                  src={avatarImage}
                  alt=""
                  style={{ width: 40, height: 40, borderRadius: 999, display: "block", objectFit: "cover" }}
                />
              }
              title={t(locale, "about.dev.name")}
              subtitle={t(locale, "about.dev.subtitle")}
            />
          </Card>
        </section>

        <section>
          <div style={{ fontSize: 13, fontWeight: 700, color: "var(--color-primary)", padding: "0 16px", marginBottom: 8 }}>
            {t(locale, "about.section.opensource")}
          </div>
          <Card>
            <ListItem
              icon={<IconGithub size={20} />}
              title={t(locale, "about.source.title")}
              subtitle={t(locale, "about.source.subtitle")}
              isNav
              onClick={() => window.open("https://github.com/nako-arkrin/neoScrcpy", "_blank")}
            />
            <ListItem
              icon={<IconCode size={20} />}
              title={t(locale, "about.ref.title")}
              subtitle={t(locale, "about.ref.subtitle")}
              isNav
              onClick={() => window.open("https://github.com/yume-chan/ya-webadb", "_blank")}
            />
            <ListItem icon={<IconHeart size={20} />} title={t(locale, "about.thanks.title")} subtitle={t(locale, "about.thanks.subtitle")} />
          </Card>
        </section>

        <div className="muted" style={{ fontSize: 12, textAlign: "center", padding: "0 22px", opacity: 0.7, lineHeight: 1.5 }}>
          Designed with Material 3 Monochrome.
          <br />
          Copyright © 2026 neoScrcpy Team.
        </div>
      </div>
    </>
  );
}

function isXiaomiDeviceName(value?: string | null) {
  if (!value) return false;
  return /小米|红米|xiaomi|redmi/i.test(value);
}

function HeaderPowerMenu({
  locale,
  disabled,
  developerOptionsVisible,
  onCommand
}: {
  locale: Locale;
  disabled: boolean;
  developerOptionsVisible: boolean;
  onCommand: (command: string[]) => void;
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement | null>(null);
  const options = [
    ...(developerOptionsVisible
      ? [
          { label: t(locale, "control.power.bootloader"), command: ["reboot", "bootloader"] },
          { label: t(locale, "control.power.fastbootd"), command: ["reboot", "fastboot"] },
          { label: t(locale, "control.power.recovery"), command: ["reboot", "recovery"] }
        ]
      : []),
    { label: t(locale, "control.power.reboot"), command: ["reboot"] },
    { label: t(locale, "control.power.shutdown"), command: ["reboot", "-p"] }
  ];

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [open]);

  return (
    <div ref={rootRef} style={{ position: "relative" }}>
      <IconButton
        onClick={() => setOpen((current) => !current)}
        title={t(locale, "common.power")}
        disabled={disabled}
      >
        <IconPower size={20} />
      </IconButton>
      {open && !disabled && (
        <div
          role="menu"
          style={{
            position: "absolute",
            top: 46,
            right: 0,
            zIndex: 30,
            minWidth: 190,
            padding: 6,
            borderRadius: 16,
            background: "var(--color-surface-container-high)",
            boxShadow: "0 12px 30px rgba(0,0,0,0.18)",
            border: "1px solid var(--color-outline-variant)"
          }}
        >
          {options.map((option) => (
            <button
              key={option.command.join(" ")}
              role="menuitem"
              type="button"
              onClick={() => {
                setOpen(false);
                onCommand(option.command);
              }}
              style={{
                width: "100%",
                height: 40,
                border: 0,
                borderRadius: 10,
                background: "transparent",
                color: "var(--color-on-surface)",
                textAlign: "left",
                padding: "0 12px",
                fontSize: 13,
                fontWeight: 650,
                cursor: "pointer"
              }}
              onMouseEnter={(event) => {
                event.currentTarget.style.background = "color-mix(in srgb, var(--color-on-surface) 7%, transparent)";
              }}
              onMouseLeave={(event) => {
                event.currentTarget.style.background = "transparent";
              }}
            >
              {option.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function ControlScreen({
  locale,
  serial,
  onNeedPermission,
  onConnected,
  onUpdateHeaderTitle,
  onUpdateHeaderActions
}: {
  locale: Locale;
  serial?: string;
  onNeedPermission: () => void;
  onConnected: (d: { serial: string; name: string; model?: string }) => Promise<void>;
  onUpdateHeaderTitle: (title: string) => void;
  onUpdateHeaderActions: (actions: React.ReactNode) => void;
}) {
  const scrcpy = useScrcpy(locale);
  const { connect: scrcpyConnect } = scrcpy;
  const [connectAttempt, setConnectAttempt] = useState(0);
  const [showConnectHint, setShowConnectHint] = useState(false);
  const [connectedDevice, setConnectedDevice] = useState<{ serial: string; model?: string; name?: string } | null>(null);
  const [pipHandoff, setPipHandoff] = useState<{ tabId?: number; title: string; stage: "launcher" | "pip" } | null>(null);
  const [audioEnabled, setAudioEnabled] = useState(false);
  const [xiaomiTipHidden, setXiaomiTipHidden] = useState(false);
  const [deviceTipIgnored, setDeviceTipIgnored] = useState(false);

  const connect = useCallback(async (audioOverride = audioEnabled) => {
    setConnectAttempt((prev) => prev + 1);
    const supported = WebADB.getInstance().isSupported();
    if (!supported) return;
    const device = await scrcpyConnect(serial ? { mode: "granted", serial, audio: audioOverride } : { mode: "prompt", audio: audioOverride });
    if (!device) {
      if (serial) return;
      onNeedPermission();
      return;
    }
    setConnectedDevice({ serial: device.serial, name: device.name, model: device.model });
    setXiaomiTipHidden(false);
    setDeviceTipIgnored(await isDeviceTipIgnored(device.serial));
    await onConnected({ serial: device.serial, name: device.name, model: device.model });
  }, [audioEnabled, onConnected, onNeedPermission, scrcpyConnect, serial]);

  const reconnect = useCallback(async (audioOverride = audioEnabled) => {
    await scrcpy.disconnect();
    await connect(audioOverride);
  }, [audioEnabled, connect, scrcpy]);

  useEffect(() => {
    void connect();
  }, [connect]);

  useEffect(() => {
    onUpdateHeaderTitle(scrcpy.deviceModel || "Android Device");
  }, [onUpdateHeaderTitle, scrcpy.deviceModel]);

  useEffect(() => {
    if (scrcpy.isConnected) {
      setShowConnectHint(false);
      return;
    }
    setShowConnectHint(false);
    const timer = setTimeout(() => {
      if (!scrcpy.isConnected) setShowConnectHint(true);
    }, 5000);
    return () => clearTimeout(timer);
  }, [connectAttempt, scrcpy.isConnected]);

  const openPipLauncher = useCallback(async () => {
    console.log("[neoScrcpy:PiP] launcher requested", {
      isConnected: scrcpy.isConnected,
      connectedDevice,
      selectedSerial: serial
    });
    if (!scrcpy.isConnected) {
      console.warn("[neoScrcpy:PiP] cannot open launcher: device is not connected");
      return;
    }

    const params = new URLSearchParams();
    const serialToUse = connectedDevice?.serial ?? serial;
    if (serialToUse) params.set("serial", serialToUse);
    const title = connectedDevice?.model || scrcpy.deviceModel || connectedDevice?.name || "Android Device";
    params.set("title", title);
    if (audioEnabled) params.set("audio", "1");
    const url = chrome.runtime.getURL(`pages/pip/index.html?${params.toString()}`);
    await setPipResumeState({ serial: serialToUse, title });
    setPipHandoff({ title, stage: "launcher" });
    await scrcpy.disconnect();
    const tab = await chrome.tabs.create({ url, active: true });
    setPipHandoff({ tabId: tab.id, title, stage: "launcher" });
  }, [audioEnabled, connectedDevice, scrcpy, serial]);

  const restoreFromPip = useCallback(async () => {
    const tabId = pipHandoff?.tabId;
    setPipHandoff(null);
    await clearPipResumeState();
    if (typeof tabId === "number") {
      try {
        await chrome.tabs.remove(tabId);
      } catch (e) {
        console.warn("[neoScrcpy:PiP] failed to close PiP launcher tab:", e);
      }
    }
    void connect();
  }, [connect, pipHandoff?.tabId]);

  const applyAudioEnabled = useCallback(
    async (next: boolean) => {
      setAudioEnabled(next);
      if (!scrcpy.isConnected) return;

      console.log("[neoScrcpy:Audio] reconnecting to apply audio state", { audioEnabled: next });
      await reconnect(next);
    },
    [reconnect, scrcpy.isConnected]
  );

  const openDeveloperOptions = useCallback(async () => {
    try {
      await scrcpy.adbRef.current?.subprocess.noneProtocol.spawnWaitText([
        "am",
        "start",
        "-a",
        "android.settings.APPLICATION_DEVELOPMENT_SETTINGS"
      ]);
    } catch (error) {
      console.warn("Failed to open Android developer options:", error);
    }
  }, [scrcpy.adbRef]);

  const shouldShowXiaomiTip =
    scrcpy.isConnected &&
    !xiaomiTipHidden &&
    !deviceTipIgnored &&
    (isXiaomiDeviceName(connectedDevice?.model) ||
      isXiaomiDeviceName(connectedDevice?.name) ||
      isXiaomiDeviceName(scrcpy.deviceModel));

  useEffect(() => {
    const listener = (message: any) => {
      if (message?.type === "PIP_WINDOW_OPENED") {
        setPipHandoff((current) => (current ? { ...current, stage: "pip" } : current));
        return;
      }
      if (message?.type === "PIP_WINDOW_CLOSED") {
        setPipHandoff(null);
        void clearPipResumeState();
        void connect();
      }
    };
    chrome.runtime.onMessage.addListener(listener);
    return () => {
      chrome.runtime.onMessage.removeListener(listener);
    };
  }, [connect]);

  useEffect(() => {
    if (pipHandoff?.stage !== "pip") return;
    const timer = window.setTimeout(() => {
      try {
        window.close();
      } catch (error) {
        console.warn("[neoScrcpy:PiP] failed to close sidepanel window:", error);
      }
    }, 0);
    return () => window.clearTimeout(timer);
  }, [pipHandoff?.stage]);

  useEffect(() => {
    onUpdateHeaderActions(
      <>
        <IconButton onClick={() => void scrcpy.sendPowerKey()} title={t(locale, "common.power")} disabled={!scrcpy.isConnected}>
          <IconPower size={20} />
        </IconButton>
        <IconButton
          onClick={() => void applyAudioEnabled(!audioEnabled)}
          title={audioEnabled ? t(locale, "control.audioOff") : t(locale, "control.audioOn")}
        >
          {audioEnabled ? <IconSoundOn size={20} /> : <IconSoundOff size={20} />}
        </IconButton>
        <IconButton 
          onClick={() => void openPipLauncher()} 
          title={t(locale, "common.pip")}
          disabled={!scrcpy.isConnected}
        >
          <IconPip size={20} />
        </IconButton>
      </>
    );
    return () => onUpdateHeaderActions(null);
  }, [applyAudioEnabled, audioEnabled, locale, onUpdateHeaderActions, openPipLauncher, scrcpy]);

  if (pipHandoff?.stage === "pip") {
    return <div style={{ display: "none" }} />;
  }

  if (pipHandoff?.stage === "launcher") {
    return (
      <div className="container" style={{ padding: 18, minHeight: 0, height: "100%", justifyContent: "center", alignItems: "center" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 10, alignItems: "center", textAlign: "center" }}>
          <div className="muted" style={{ fontSize: 12, lineHeight: 1.5, maxWidth: 260 }}>
            {t(locale, "control.pipPermissionHint")}
          </div>
          <PillButton onClick={() => void restoreFromPip()}>{t(locale, "common.reconnect")}</PillButton>
        </div>
      </div>
    );
  }

  return (
    <div className="container" style={{ padding: 12, gap: 0, overflow: "hidden", minHeight: 0, height: "100%" }}>
      <div style={{ flex: 1, width: "100%", height: "100%", minHeight: 0, minWidth: 0, display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
        <div
          style={{
            maxWidth: "100%",
            maxHeight: "100%",
            aspectRatio: scrcpy.videoSize ? `${scrcpy.videoSize.width} / ${scrcpy.videoSize.height}` : "9 / 16",
            display: "flex",
            borderRadius: 18,
            overflow: "hidden",
            background: "var(--color-surface-container-highest)",
            boxShadow: "var(--shadow-1)",
            position: "relative"
          }}
        >
          <div
            style={{
              position: "absolute",
              top: 10,
              left: 10,
              zIndex: 12,
              display: "none",
              alignItems: "center",
              gap: 8,
              padding: "6px 8px",
              borderRadius: 12,
              background: "rgba(0,0,0,0.56)",
              color: "#fff",
              fontSize: 12,
              fontWeight: 800
            }}
          >
            <span>{t(locale, "control.audio")}</span>
            <Switch checked={audioEnabled} onChange={setAudioEnabled} />
          </div>
          <canvas
            ref={scrcpy.canvasRef}
            style={{
              width: "100%",
              height: "100%",
              display: "block",
              touchAction: "none",
              outline: "none"
            }}
              tabIndex={0}
              onPointerDown={scrcpy.onPointerDown}
              onPointerMove={scrcpy.onPointerMove}
              onPointerUp={scrcpy.onPointerUp}
              onPointerCancel={scrcpy.onPointerUp}
              onWheel={scrcpy.onWheel}
              onKeyDown={scrcpy.onKeyDown}
              onKeyUp={scrcpy.onKeyUp}
              onCompositionEnd={scrcpy.onCompositionEnd}
            />
            {!scrcpy.isConnected && (
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  padding: 16,
                  pointerEvents: "none",
                  zIndex: 10
                }}
              >
                <div
                  className="muted"
                  style={{
                    fontSize: 12,
                    textAlign: "center",
                    overflow: "auto",
                    maxHeight: "100%",
                    whiteSpace: "pre-wrap",
                    pointerEvents: "auto",
                    userSelect: "text",
                    background: "rgba(0,0,0,0.6)",
                    color: "#fff",
                    padding: 8,
                    borderRadius: 8
                  }}
                >
                  {scrcpy.status}
                </div>
              </div>
            )}

          </div>
        </div>

      {!scrcpy.isConnected && showConnectHint && (
        <div
          style={{
            position: "fixed",
            left: 16,
            right: 16,
            bottom: 16,
            zIndex: 20,
            background: "var(--color-surface-container-high)",
            borderRadius: 18,
            boxShadow: "var(--shadow-1)"
          }}
        >
          <div style={{ padding: 16, display: "flex", flexDirection: "column", gap: 12 }}>
            <div className="muted" style={{ fontSize: 13 }}>
              {t(locale, "control.permissionHint")}
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <PillButton variant="secondary" onClick={onNeedPermission}>
                {t(locale, "common.openPermissionPage")}
              </PillButton>
              <PillButton onClick={() => void reconnect()} disabled={!WebADB.getInstance().isSupported()}>
                {t(locale, "common.reconnect")}
              </PillButton>
            </div>
          </div>
        </div>
      )}
      {shouldShowXiaomiTip && (
        <div
          style={{
            position: "fixed",
            left: 16,
            right: 16,
            bottom: 16,
            zIndex: 21,
            background: "var(--color-surface-container-high)",
            borderRadius: 18,
            boxShadow: "var(--shadow-1)"
          }}
        >
          <div style={{ padding: 16, display: "flex", flexDirection: "column", gap: 12 }}>
            <div style={{ fontSize: 15, fontWeight: 800, color: "var(--color-on-surface)" }}>
              {t(locale, "deviceTips.xiaomi.title")}
            </div>
            <div className="muted" style={{ fontSize: 13, lineHeight: 1.55 }}>
              {t(locale, "deviceTips.xiaomi.body")}
            </div>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              <PillButton variant="secondary" onClick={() => void openDeveloperOptions()}>
                {t(locale, "deviceTips.openDeveloperOptions")}
              </PillButton>
              <PillButton onClick={() => setXiaomiTipHidden(true)}>{t(locale, "deviceTips.hide")}</PillButton>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
