export type ThemeMode = "system" | "light" | "dark";

export type Locale = "zh-CN" | "en-US";

export type RecentDevice = {
  serial: string;
  name: string;
  model?: string;
  lastConnectedAt: number;
};

export type StoredState = {
  themeMode: ThemeMode;
  locale: Locale;
  recentDevices: RecentDevice[];
  shizukuEnabled: boolean;
  terminalFont: string;
  ignoredDeviceTipSerials: string[];
};

export type PipResumeState = {
  serial?: string;
  title?: string;
};

const defaults: StoredState = {
  themeMode: "system",
  locale: "zh-CN",
  recentDevices: [],
  shizukuEnabled: false,
  terminalFont: "\"Cascadia Mono\", \"Cascadia Code\", Consolas, monospace",
  ignoredDeviceTipSerials: []
};

export async function getState(): Promise<StoredState> {
  const result = await chrome.storage.local.get(defaults);
  return result as StoredState;
}

export async function setThemeMode(themeMode: ThemeMode) {
  await chrome.storage.local.set({ themeMode });
}

export async function setLocale(locale: Locale) {
  await chrome.storage.local.set({ locale });
}

export async function setShizukuEnabled(shizukuEnabled: boolean) {
  await chrome.storage.local.set({ shizukuEnabled });
}

export async function setTerminalFont(terminalFont: string) {
  await chrome.storage.local.set({ terminalFont });
}

export async function isDeviceTipIgnored(serial?: string) {
  if (!serial) return false;
  const state = await getState();
  return state.ignoredDeviceTipSerials.includes(serial);
}

export async function ignoreDeviceTip(serial: string) {
  const state = await getState();
  if (state.ignoredDeviceTipSerials.includes(serial)) return;
  await chrome.storage.local.set({
    ignoredDeviceTipSerials: [...state.ignoredDeviceTipSerials, serial]
  });
}

export async function addRecentDevice(device: Omit<RecentDevice, "lastConnectedAt">) {
  const state = await getState();
  const next: RecentDevice[] = [
    { ...device, lastConnectedAt: Date.now() },
    ...state.recentDevices.filter((d) => d.serial !== device.serial)
  ].slice(0, 2);
  await chrome.storage.local.set({ recentDevices: next });
}

export async function clearRecentDevices() {
  await chrome.storage.local.set({ recentDevices: [] });
}

const PIP_RESUME_SERIAL_KEY = "pipResumeSerial";
const PIP_RESUME_TITLE_KEY = "pipResumeTitle";

export async function getPipResumeState(): Promise<PipResumeState | null> {
  const result = await chrome.storage.local.get([PIP_RESUME_SERIAL_KEY, PIP_RESUME_TITLE_KEY]);
  const serial = result[PIP_RESUME_SERIAL_KEY] as string | undefined;
  const title = result[PIP_RESUME_TITLE_KEY] as string | undefined;
  if (!serial && !title) {
    return null;
  }
  return { serial, title };
}

export async function setPipResumeState(state: PipResumeState) {
  await chrome.storage.local.set({
    [PIP_RESUME_SERIAL_KEY]: state.serial ?? null,
    [PIP_RESUME_TITLE_KEY]: state.title ?? null
  });
}

export async function clearPipResumeState() {
  await chrome.storage.local.remove([PIP_RESUME_SERIAL_KEY, PIP_RESUME_TITLE_KEY]);
}
