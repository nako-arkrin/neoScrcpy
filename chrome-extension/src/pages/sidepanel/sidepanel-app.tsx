import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Card, Dropdown, IconButton, ListItem, PillButton, Segmented, Switch } from "../../ui/m3";
import {
  IconArrowLeft,
  IconChevronRight,
  IconCheck,
  IconCode,
  IconDelete,
  IconDevices,
  IconDownload,
  IconExternalLink,
  IconAppStore,
  IconFileArchive,
  IconFileAudio,
  IconFileImage,
  IconFileText,
  IconFileVideo,
  IconFolder,
  IconGithub,
  IconGlobe,
  IconHeart,
  IconInfo,
  IconKey,
  IconMonitor,
  IconMoon,
  IconPages,
  IconPalette,
  IconPip,
  IconPower,
  IconRefresh,
  IconSettings,
  IconShield,
  IconSoundOff,
  IconSoundOn,
  IconSun,
  IconUpload,
  IconUsb
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
  setLocale,
  setPipResumeState,
  setShizukuEnabled,
  setThemeMode,
  ThemeMode
} from "../../shared/storage";
import { resolveTheme } from "../../shared/theme";
import { WebADB } from "../../shared/webadb";
import { useScrcpy } from "../../shared/useScrcpy";
import bannerImage from "../../assets/BG.png";
import avatarImage from "../../assets/avatar.jpg";
import logoImage from "../../assets/neoscrcpy.png";
import { formatThemeLabel, t } from "../../shared/i18n";
import { ShizukuAdbScreen } from "./advanced-screens";

type Screen =
  | "devices"
  | "deviceHome"
  | "fileManager"
  | "installApp"
  | "deviceTips"
  | "shizukuAdb"
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
  const [shizukuFeatureEnabled, setShizukuFeatureEnabled] = useState(false);

  const titles: Record<Screen, string> = useMemo(
    () => ({
      devices: t(locale, "nav.devices"),
      deviceHome: controlTitle || "Android Device",
      fileManager: t(locale, "nav.fileManager"),
      installApp: t(locale, "nav.installApp"),
      deviceTips: t(locale, "nav.deviceTips"),
      shizukuAdb: t(locale, "nav.shizukuAdb"),
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
      setShizukuFeatureEnabled(s.shizukuEnabled);
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
        setShizukuFeatureEnabled(Boolean(changes.shizukuEnabled.newValue));
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
    if (screen === "fileManager" || screen === "installApp" || screen === "deviceTips" || screen === "shizukuAdb") {
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

  useEffect(() => {
    if (screen !== "control" && screen !== "fileManager") {
      setControlActions(null);
    }
    if (screen !== "control" && screen !== "deviceHome" && screen !== "fileManager" && screen !== "installApp") {
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
          {(screen === "control" || screen === "fileManager") && controlActions}
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
            shizukuFeatureEnabled={shizukuFeatureEnabled}
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
        {screen === "settingsMain" && (
          <SettingsMainScreen
            locale={locale}
            themeMode={mode}
            onNavigate={(s) => setScreen(s)}
          />
        )}
        {screen === "settingsAppearance" && <SettingsAppearanceScreen locale={locale} themeMode={mode} onThemeMode={update} />}
        {screen === "settingsGeneral" && <SettingsGeneralScreen locale={locale} value={locale} onLocale={updateLocale} />}
        {screen === "settingsDeveloper" && (
          <SettingsDeveloperScreen enabled={shizukuFeatureEnabled} onEnabled={async (next) => {
            setShizukuFeatureEnabled(next);
            await setShizukuEnabled(next);
          }} locale={locale} />
        )}
        {screen === "settingsPrivacy" && <SettingsPrivacyScreen locale={locale} />}
        {screen === "settingsAbout" && <SettingsAboutScreen locale={locale} />}
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
  onClearRecent
}: {
  locale: Locale;
  recent: RecentDevice[];
  onOpenPermission: () => void;
  onOpenControl: (serial?: string) => void;
  onClearRecent: () => void;
}) {
  return (
    <div className="container">
      <Card>
        <ListItem
          icon={<IconUsb size={20} />}
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
            <ListItem
              key={d.serial}
              icon={<IconDevices size={20} />}
              title={d.model || d.name || "Android Device"}
              subtitle={d.serial}
              isNav
              onClick={() => onOpenControl(d.serial)}
            />
          ))
        ) : (
          <div className="centerEmpty">{t(locale, "devices.recent.emptyHint")}</div>
        )}
      </Card>
    </div>
  );
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
  shizukuFeatureEnabled
}: {
  locale: Locale;
  device: RecentDevice | null;
  onFileManager: () => void;
  onControl: () => void;
  onInstallApp: () => void;
  onPip: () => void;
  onDeviceTips: () => void;
  onShizukuAdb: () => void;
  shizukuFeatureEnabled: boolean;
}) {
  const title = device?.model || device?.name || "Android Device";
  const serial = device?.serial || t(locale, "common.noDeviceSelected");
  const hasDeviceTip = isXiaomiDeviceName(title) || isXiaomiDeviceName(device?.name);

  return (
    <div className="container" style={{ paddingTop: 12 }}>
      <Card>
        <div style={{ padding: 18, display: "flex", flexDirection: "column", gap: 8 }}>
          <div style={{ fontSize: 16, fontWeight: 900, color: "var(--color-on-surface)" }}>{title}</div>
          <div className="muted" style={{ fontSize: 12, lineHeight: 1.5 }}>{serial}</div>
        </div>
      </Card>

      <Card>
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
        {shizukuFeatureEnabled && (
          <ListItem
            icon={<IconCode size={20} />}
            title={t(locale, "deviceHome.shizuku.title")}
            subtitle={t(locale, "deviceHome.shizuku.subtitle")}
            isNav
            onClick={onShizukuAdb}
          />
        )}
      </Card>
    </div>
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

type FileManagerEntry = { name: string; size: bigint | number; type?: unknown; mode?: number };

const FILE_MANAGER_ROOT = "/sdcard";

function normalizeUserStoragePath(path: string) {
  const raw = path.trim().replace(/\\/g, "/");
  if (!raw) return FILE_MANAGER_ROOT;

  let next: string;
  if (raw.startsWith("/")) {
    next = raw;
  } else if (raw === "sdcard" || raw.startsWith("sdcard/")) {
    next = `/${raw}`;
  } else {
    next = `${FILE_MANAGER_ROOT}/${raw}`;
  }

  const parts = next.replace(/\/+/g, "/").split("/").filter(Boolean);
  const sourceParts = parts[0] === "sdcard" ? parts.slice(1) : parts;
  const safeParts = ["sdcard"];
  for (const part of sourceParts) {
    if (!part || part === ".") continue;
    if (part === "..") {
      if (safeParts.length > 1) safeParts.pop();
      continue;
    }
    safeParts.push(part);
  }
  return `/${safeParts.join("/")}`;
}

function joinDevicePath(base: string, name: string) {
  return normalizeUserStoragePath(`${base.replace(/\/$/, "")}/${name}`);
}

function isDirectoryEntry(entry: FileManagerEntry) {
  return entry.type === 4 || (typeof entry.mode === "number" && (entry.mode & 0o170000) === 0o040000);
}

function getPathSegments(path: string) {
  const normalized = normalizeUserStoragePath(path);
  const parts = normalized.split("/").filter(Boolean);
  return parts.map((part, index) => ({
    label: part,
    path: `/${parts.slice(0, index + 1).join("/")}`
  }));
}

function getFileIcon(entry: FileManagerEntry) {
  if (isDirectoryEntry(entry)) return <IconFolder size={20} />;
  const ext = entry.name.split(".").pop()?.toLowerCase() ?? "";
  if (["apk", "apks", "xapk"].includes(ext)) return <IconAppStore size={20} />;
  if (["jpg", "jpeg", "png", "gif", "webp", "bmp", "heic", "svg"].includes(ext)) return <IconFileImage size={20} />;
  if (["mp3", "wav", "flac", "aac", "ogg", "m4a", "opus"].includes(ext)) return <IconFileAudio size={20} />;
  if (["mp4", "mkv", "webm", "avi", "mov", "3gp"].includes(ext)) return <IconFileVideo size={20} />;
  if (["zip", "rar", "7z", "tar", "gz", "xz"].includes(ext)) return <IconFileArchive size={20} />;
  if (["js", "ts", "tsx", "jsx", "json", "xml", "html", "css", "sh", "kt", "java", "log"].includes(ext)) return <IconCode size={20} />;
  return <IconFileText size={20} />;
}

function FileManagerScreen({
  serial,
  locale,
  onNeedPermission,
  onUpdateHeaderActions
}: {
  serial?: string;
  locale: Locale;
  onNeedPermission: () => void;
  onUpdateHeaderActions: (actions: React.ReactNode) => void;
}) {
  const [path, setPath] = useState(FILE_MANAGER_ROOT);
  const [pathDraft, setPathDraft] = useState(FILE_MANAGER_ROOT);
  const [entries, setEntries] = useState<FileManagerEntry[]>([]);
  const [status, setStatus] = useState(() => t(locale, "fileManager.status.ready"));
  const [busy, setBusy] = useState(false);
  const [pathExpanded, setPathExpanded] = useState(false);
  const [isDraggingFile, setIsDraggingFile] = useState(false);
  const [transfer, setTransfer] = useState<{ type: "upload" | "download"; name: string; progress: number } | null>(null);

  const load = useCallback(async (targetPath = path) => {
    if (busy) return;
    const nextPath = normalizeUserStoragePath(targetPath);
    setPath(nextPath);
    setPathDraft(nextPath);
    setBusy(true);
    setStatus(t(locale, "fileManager.status.reading"));
    const connection = serial ? await WebADB.getInstance().connectGranted(serial) : await WebADB.getInstance().requestDevice();
    if (!connection) {
      setBusy(false);
      setStatus(t(locale, "deviceTips.status.permissionRequired"));
      onNeedPermission();
      return;
    }
    let sync: Awaited<ReturnType<typeof connection.adb.sync>> | undefined;
    try {
      sync = await connection.adb.sync();
      const list = await sync.readdir(nextPath);
      setEntries(
        list.sort((a, b) => {
          const aDir = isDirectoryEntry(a);
          const bDir = isDirectoryEntry(b);
          if (aDir !== bDir) return aDir ? -1 : 1;
          return a.name.localeCompare(b.name);
        })
      );
      setStatus(t(locale, "fileManager.status.readCount", { count: list.length }));
    } catch (error) {
      setStatus(error instanceof Error ? error.message : String(error));
    } finally {
      await sync?.dispose();
      await connection.dispose();
      setBusy(false);
    }
  }, [busy, locale, onNeedPermission, path, serial]);

  useEffect(() => {
    void load(FILE_MANAGER_ROOT);
  }, []);

  const breadcrumbs = getPathSegments(path);

  const uploadFiles = useCallback(async (files: FileList | File[]) => {
    if (transfer) return;
    const uploadList = Array.from(files).filter((file) => file.size >= 0);
    if (!uploadList.length) return;

    setStatus(t(locale, "fileManager.status.uploadPreparing", { count: uploadList.length }));
    const connection = serial ? await WebADB.getInstance().connectGranted(serial) : await WebADB.getInstance().requestDevice();
    if (!connection) {
      setStatus(t(locale, "deviceTips.status.permissionRequired"));
      onNeedPermission();
      return;
    }

    let sync: Awaited<ReturnType<typeof connection.adb.sync>> | undefined;
    try {
      sync = await connection.adb.sync();
      for (const file of uploadList) {
        let uploaded = 0;
        setTransfer({ type: "upload", name: file.name, progress: 0 });
        setStatus(t(locale, "fileManager.status.uploading", { name: file.name }));
        const reader = file.stream().getReader();
        const stream = new ReadableStream<Uint8Array>({
          async pull(controller) {
            const { done, value } = await reader.read();
            if (done) {
              controller.close();
              return;
            }
            uploaded += value.byteLength;
            setTransfer({ type: "upload", name: file.name, progress: file.size ? Math.round((uploaded / file.size) * 100) : 100 });
            controller.enqueue(value);
          },
          cancel() {
            return reader.cancel();
          }
        });
        await sync.write({
          filename: joinDevicePath(path, file.name),
          file: stream as any,
          permission: 0o644,
          mtime: Math.floor(file.lastModified / 1000)
        });
      }
      setStatus(t(locale, "fileManager.status.uploaded", { count: uploadList.length }));
      await load(path);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : String(error));
    } finally {
      setTransfer(null);
      setIsDraggingFile(false);
      await sync?.dispose();
      await connection.dispose();
    }
  }, [load, locale, onNeedPermission, path, serial, transfer]);

  const downloadEntry = useCallback(async (entry: FileManagerEntry) => {
    if (transfer || isDirectoryEntry(entry)) return;
    setTransfer({ type: "download", name: entry.name, progress: 0 });
    setStatus(t(locale, "fileManager.status.downloading", { name: entry.name }));
    const connection = serial ? await WebADB.getInstance().connectGranted(serial) : await WebADB.getInstance().requestDevice();
    if (!connection) {
      setTransfer(null);
      setStatus(t(locale, "deviceTips.status.permissionRequired"));
      onNeedPermission();
      return;
    }

    let sync: Awaited<ReturnType<typeof connection.adb.sync>> | undefined;
    try {
      sync = await connection.adb.sync();
      const total = Math.max(0, Number(entry.size));
      const chunks: BlobPart[] = [];
      let downloaded = 0;
      const reader = sync.read(joinDevicePath(path, entry.name)).getReader();
      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          const chunk = new Uint8Array(value.byteLength);
          chunk.set(value);
          chunks.push(chunk.buffer);
          downloaded += value.byteLength;
          setTransfer({ type: "download", name: entry.name, progress: total ? Math.round((downloaded / total) * 100) : 0 });
        }
      } finally {
        reader.releaseLock();
      }
      const blob = new Blob(chunks, { type: "application/octet-stream" });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = entry.name;
      anchor.click();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
      setStatus(t(locale, "fileManager.status.downloaded", { name: entry.name }));
    } catch (error) {
      setStatus(error instanceof Error ? error.message : String(error));
    } finally {
      setTransfer(null);
      await sync?.dispose();
      await connection.dispose();
    }
  }, [locale, onNeedPermission, path, serial, transfer]);

  useEffect(() => {
    onUpdateHeaderActions(
      <>
        <IconButton
          onClick={() => setPathExpanded((value) => !value)}
          title={pathExpanded ? t(locale, "fileManager.path.collapse") : t(locale, "fileManager.path.expand")}
          style={pathExpanded ? { background: "var(--color-surface-container-highest)" } : undefined}
        >
          <IconFolder size={20} />
        </IconButton>
        <IconButton onClick={() => void load(path)} title={t(locale, "common.refresh")} disabled={busy}>
          <IconRefresh size={20} />
        </IconButton>
      </>
    );
    return () => onUpdateHeaderActions(null);
  }, [busy, load, locale, onUpdateHeaderActions, path, pathExpanded]);

  return (
    <div
      className="container"
      style={{ paddingTop: 12, height: "100%", minHeight: 0, overflow: "hidden", gap: 12 }}
    >
      <div
        className="customScrollbar"
        style={{
          flex: "0 0 auto",
          display: "flex",
          gap: 6,
          alignItems: "center",
          overflowX: "auto",
          padding: "0 4px 2px",
          whiteSpace: "nowrap"
        }}
      >
        {breadcrumbs.map((item, index) => (
          <React.Fragment key={item.path}>
            {index > 0 && <span className="muted" style={{ fontSize: 12 }}>/</span>}
            <button
              type="button"
              onClick={() => void load(item.path)}
              disabled={busy || item.path === path}
              style={{
                border: 0,
                background: item.path === path ? "var(--color-surface-container-high)" : "transparent",
                color: "var(--color-on-surface)",
                borderRadius: 999,
                padding: "4px 8px",
                fontSize: 12,
                fontWeight: 700,
                cursor: busy || item.path === path ? "default" : "pointer",
                flex: "0 0 auto"
              }}
            >
              {item.label}
            </button>
          </React.Fragment>
        ))}
      </div>

      {pathExpanded && (
        <Card style={{ flex: "0 0 auto" }}>
          <div style={{ padding: 14 }}>
            <input
              className="pathInput"
              value={pathDraft}
              spellCheck={false}
              onChange={(event) => setPathDraft(event.currentTarget.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") void load(pathDraft);
              }}
            />
          </div>
        </Card>
      )}

      <div className="muted" style={{ flex: "0 0 auto", fontSize: 12, lineHeight: 1.5, padding: "0 4px" }}>
        {status}
      </div>

      {transfer && (
        <div style={{ flex: "0 0 auto", display: "flex", flexDirection: "column", gap: 6, padding: "0 4px" }}>
          <div className="muted" style={{ fontSize: 12 }}>
            {transfer.type === "upload" ? t(locale, "common.upload") : t(locale, "common.download")} {transfer.name} · {transfer.progress}%
          </div>
          <div
            style={{
              height: 6,
              borderRadius: 999,
              background: "var(--color-surface-container-highest)",
              overflow: "hidden"
            }}
          >
            <div
              style={{
                width: `${Math.max(0, Math.min(100, transfer.progress))}%`,
                height: "100%",
                borderRadius: 999,
                background: "var(--color-primary)",
                transition: "width 120ms ease"
              }}
            />
          </div>
        </div>
      )}

      <div
        className="card customScrollbar"
        onDragOver={(event) => {
          if (!event.dataTransfer.types.includes("Files")) return;
          event.preventDefault();
          setIsDraggingFile(true);
        }}
        onDragLeave={(event) => {
          const related = event.relatedTarget;
          if (related instanceof Node && event.currentTarget.contains(related)) return;
          setIsDraggingFile(false);
        }}
        onDrop={(event) => {
          event.preventDefault();
          setIsDraggingFile(false);
          void uploadFiles(event.dataTransfer.files);
        }}
        style={{
          flex: "1 1 auto",
          minHeight: 0,
          overflow: "auto",
          position: "relative",
          outline: isDraggingFile ? "2px solid var(--color-primary)" : "none",
          outlineOffset: -2
        }}
      >
        {entries.length ? (
          entries.map((entry) => (
            <FileEntryRow
              key={entry.name}
              locale={locale}
              entry={entry}
              disabled={Boolean(transfer)}
              onOpen={() => void load(joinDevicePath(path, entry.name))}
              onDownload={() => void downloadEntry(entry)}
            />
          ))
        ) : (
          <div className="centerEmpty">{t(locale, "fileManager.empty")}</div>
        )}
        {isDraggingFile && (
          <div
            style={{
              position: "sticky",
              left: 0,
              right: 0,
              bottom: 0,
              padding: 14,
              background: "color-mix(in srgb, var(--color-surface-container-high) 92%, transparent)",
              color: "var(--color-on-surface)",
              fontSize: 13,
              fontWeight: 800,
              textAlign: "center",
              backdropFilter: "blur(10px)"
            }}
          >
            {t(locale, "fileManager.dropToUpload", { path })}
          </div>
        )}
      </div>
    </div>
  );
}

function FileEntryRow({
  locale,
  entry,
  disabled,
  onOpen,
  onDownload
}: {
  locale: Locale;
  entry: FileManagerEntry;
  disabled: boolean;
  onOpen: () => void;
  onDownload: () => void;
}) {
  const [hovered, setHovered] = useState(false);
  const isDirectory = isDirectoryEntry(entry);

  return (
    <div
      className={["listItem", isDirectory && !disabled ? "clickable" : ""].filter(Boolean).join(" ")}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={isDirectory && !disabled ? onOpen : undefined}
    >
      <div className="listLead">
        <div className="listIcon">{getFileIcon(entry)}</div>
        <div className="listTexts">
          <div className="listTitle">{entry.name}</div>
          <div className="listSubtitle">{isDirectory ? t(locale, "common.folder") : formatFileSize(entry.size)}</div>
        </div>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        {!isDirectory && hovered && (
          <button
            className="iconBtn fileActionButton"
            title={t(locale, "common.downloadFile")}
            type="button"
            disabled={disabled}
            onClick={(event) => {
              event.stopPropagation();
              onDownload();
            }}
          >
            <IconDownload size={18} />
          </button>
        )}
        {isDirectory ? <IconChevronRight size={18} /> : null}
      </div>
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
  onNavigate
}: {
  locale: Locale;
  themeMode: ThemeMode;
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
        <ListItem
          icon={<IconCode size={20} />}
          title={t(locale, "settingsMain.developer.title")}
          subtitle={t(locale, "settingsMain.developer.subtitle")}
          onClick={() => onNavigate("settingsDeveloper")}
          isNav
        />
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
          <Segmented
            value={themeMode}
            onChange={(v) => onThemeMode(v as ThemeMode)}
            options={[
              { value: "light", label: t(locale, "appearance.theme.light"), icon: <IconSun size={18} /> },
              { value: "system", label: t(locale, "appearance.theme.system"), icon: <IconMonitor size={18} /> },
              { value: "dark", label: t(locale, "appearance.theme.dark"), icon: <IconMoon size={18} /> }
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

function SettingsDeveloperScreen({ locale, enabled, onEnabled }: { locale: Locale; enabled: boolean; onEnabled: (next: boolean) => void }) {
  return (
    <div className="container" style={{ paddingTop: 12 }}>
      <Card>
        <ListItem
          icon={<IconCode size={20} />}
          title={t(locale, "developer.shizuku.title")}
          subtitle={t(locale, "developer.shizuku.subtitle")}
          action={<Switch checked={enabled} onChange={onEnabled} />}
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

function SettingsAboutScreen({ locale }: { locale: Locale }) {
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
              display: "none",
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
            <ListItem icon={<IconInfo size={20} />} title={t(locale, "about.version.title")} subtitle="Beta Ver 0.1.1" />
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
      await scrcpy.disconnect();
      await connect(next);
    },
    [connect, scrcpy]
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
              <PillButton onClick={() => void connect()} disabled={!WebADB.getInstance().isSupported()}>
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


