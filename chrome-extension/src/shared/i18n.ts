import type { Locale, ThemeMode } from "./storage";

const zhCN = {
  "app.name": "neoScrcpy",

  "nav.devices": "设备",
  "nav.settings": "设置",
  "nav.settingsAppearance": "外观 & 显示",
  "nav.settingsGeneral": "通用设置",
  "nav.settingsPrivacy": "隐私与权限",
  "nav.settingsAbout": "关于项目",
  "nav.control": "控制",
  "nav.incompatible": "不兼容",

  "incompatible.title": "neoScrcpy 需要更新的浏览器版本才可以运行",
  "incompatible.subtitle": "你可以试着下载更新的版本后运行",

  "common.back": "返回",
  "common.settings": "设置",
  "common.power": "电源",
  "common.pip": "画中画",
  "common.retry": "重试",
  "common.reconnect": "重新连接",
  "common.openPermissionPage": "打开授权页面",
  "common.openSidePanel": "打开侧边栏",
  "common.connectDevice": "连接设备",
  "common.cancelled": "已取消",
  "common.none": "暂无",

  "devices.connect.title": "连接设备",
  "devices.connect.subtitle": "申请 USB ADB 权限并连接",
  "devices.recent.title": "最近设备",
  "devices.recent.subtitleHas": "点击快速连接",
  "devices.recent.subtitleEmpty": "暂无历史记录",
  "devices.recent.clear": "清空最近设备",
  "devices.recent.emptyHint": "连接过的设备会出现在这里",

  "settingsMain.appearance.title": "外观 & 显示",
  "settingsMain.appearance.subtitle": "主题：{theme}",
  "settingsMain.general.title": "通用设置",
  "settingsMain.general.subtitle": "菜单集成",
  "settingsMain.privacy.title": "隐私与权限",
  "settingsMain.privacy.subtitle": "权限查看",
  "settingsMain.about.title": "关于项目",
  "settingsMain.about.subtitle": "版本 v0.1.0",

  "appearance.section.title": "主题模式",
  "appearance.theme.light": "浅色",
  "appearance.theme.system": "跟随系统",
  "appearance.theme.dark": "深色",

  "general.contextMenu.title": "右键菜单集成",
  "general.contextMenu.subtitle": "在上下文菜单中显示快捷操作（暂未实现）",
  "general.language.title": "语言",
  "general.language.subtitle": "切换界面显示语言",
  "general.language.zhCN": "简体中文",
  "general.language.enUS": "English (US)",

  "privacy.section.controls": "隐私控制",
  "privacy.policy.title": "隐私政策",
  "privacy.policy.subtitle": "点击查看完整的隐私协议（暂未实现）",
  "privacy.section.permissions": "已获授权的权限",
  "privacy.perm.webusb.title": "WebUSB 设备访问",
  "privacy.perm.webusb.subtitle": "navigator.usb（用户授权）",
  "privacy.perm.storage.title": "存储权限",
  "privacy.perm.storage.subtitle": "storage (local)",
  "privacy.perm.sidepanel.title": "侧边栏控制",
  "privacy.perm.sidepanel.subtitle": "sidePanel",
  "privacy.perm.tabs.title": "标签页权限",
  "privacy.perm.tabs.subtitle": "tabs",

  "about.section.character": "背景角色",
  "about.character.name": "泉此方",
  "about.character.desc":
    "传说中的御宅族精神领袖，拥有标志性的蓝发与呆毛。虽然运动神经拔群，却因不想错过动画直播而拒绝加入社团。平日慵懒随性，但在购买周边时行动力爆表。在她身上，你能看到每一个热爱二次元的自己的影子。",
  "about.character.credit": "图片原作者: {author}",
  "about.section.project": "关于项目",
  "about.version.title": "版本",
  "about.dev.name": "Nako Arkrin",
  "about.dev.subtitle": "开发者与设计师",
  "about.section.opensource": "开源",
  "about.source.title": "源代码",
  "about.source.subtitle": "GitHub Repository",
  "about.ref.title": "ya-webadb",
  "about.ref.subtitle": "Reference Project",
  "about.thanks.title": "感谢",
  "about.thanks.subtitle": "所有贡献者",

  "control.permissionHint": "如果未授予 USB 权限，请先在授权页面连接一次设备。",

  "scrcpy.status.disconnected": "未连接",
  "scrcpy.status.connecting": "正在连接 ADB...",
  "scrcpy.status.retrying": "正在重试连接...",
  "scrcpy.status.cancelled": "连接已取消或失败",
  "scrcpy.status.connectedStarting": "已连接 ADB，正在启动 Scrcpy...",
  "scrcpy.status.decoderInit": "Scrcpy 已启动，正在初始化解码器...",
  "scrcpy.status.webglUnavailable": "WebGL 不可用",
  "scrcpy.status.mirroringActive": "镜像已启动",
  "scrcpy.status.noVideoStream": "Scrcpy 视频流不可用",
  "scrcpy.status.videoStreamError": "视频流错误：{message}",

  "popup.openSidePanel": "打开侧边栏",
  "popup.connectDevice": "连接设备",
  "popup.version.title": "项目版本",
  "popup.version.subtitle": "Beta Ver 0.1.0",
  "popup.settings.title": "项目设置",
  "popup.settings.subtitle": "在侧边栏中查看",
  "popup.recent.title": "最近连接的设备",
  "popup.recent.subtitleHas": "最多显示 2 台",
  "popup.recent.subtitleEmpty": "暂无",
  "popup.recent.emptyHint": "连接过的设备会显示在这里",

  "options.title": "设置",
  "options.subtitle": "当前版本的设置主要在侧边栏中展示。",

  "permission.statusLabel": "状态：{status}",
  "permission.status.ready": "准备就绪",
  "permission.status.unsupported": "当前浏览器不支持 WebUSB",
  "permission.status.requesting": "正在请求 USB 设备权限...",
  "permission.status.connected": "已连接。现在可以打开侧边栏控制设备。",
  "permission.connecting": "连接中…",
  "permission.connect": "连接设备",
  "permission.openSidePanel": "打开侧边栏",
  "permission.reset": "重置连接状态",
  "permission.title": "连接 Android 设备",
  "permission.desc":
    "neoScrcpy 需要通过 WebUSB 申请 ADB 连接权限，用于在浏览器侧边栏中显示手机画面，并将点击/滑动等操作映射为设备控制指令。",
  "permission.faq.title": "常见问题排查",
  "permission.faq.deviceMissing.title": "找不到设备？(重要)",
  "permission.faq.deviceMissing.body":
    "如果您之前能连接但现在找不到设备，这通常是因为浏览器或 USB 服务处于“卡死”状态。\n请尝试：1. 重新插拔 USB 数据线；2. 在手机上关闭并重新开启“USB 调试”开关；3. 点击上方的“重置连接状态”按钮。",
  "permission.faq.driver.title": "驱动问题 (Windows)",
  "permission.faq.driver.body": "虽然之前能连接，但系统更新可能重置驱动。请确保安装了驱动：",
  "permission.faq.other.title": "其他程序占用",
  "permission.faq.other.body": "请确保电脑上没有运行其他手机助手或 adb.exe 进程，它们会独占 USB 设备。",

  "error.usbTransferInterrupted": "USB 传输中断，请重新插拔设备并重新授权",
  "error.deviceDisconnected": "设备已断开，请重新连接",
  "error.usbAborted": "USB 连接被中断，请重新连接",
  "error.notAdbDevice": "所选设备未能识别为 ADB 设备",
  "error.scrcpyStartFailed": "Scrcpy 服务启动失败：{message}",
  "error.connectFailed": "连接失败：{message}",
  "error.usbTransferInterruptedLong":
    "USB 传输中断。请检查：1. 是否有其他 ADB 程序正在运行；2. 重新插拔设备；3. 确保已在手机上授权调试。",
  "error.usbTimeout": "USB 连接被中断或超时，请重试"
} as const;

export type I18nKey = keyof typeof zhCN;

const enUS: Record<I18nKey, string> = {
  "app.name": "neoScrcpy",

  "nav.devices": "Devices",
  "nav.settings": "Settings",
  "nav.settingsAppearance": "Appearance & Display",
  "nav.settingsGeneral": "General",
  "nav.settingsPrivacy": "Privacy & Permissions",
  "nav.settingsAbout": "About",
  "nav.control": "Control",
  "nav.incompatible": "Incompatible",

  "incompatible.title": "neoScrcpy requires a newer browser to run",
  "incompatible.subtitle": "Try updating your browser and run it again",

  "common.back": "Back",
  "common.settings": "Settings",
  "common.power": "Power",
  "common.pip": "PiP",
  "common.retry": "Retry",
  "common.reconnect": "Reconnect",
  "common.openPermissionPage": "Open permission page",
  "common.openSidePanel": "Open side panel",
  "common.connectDevice": "Connect device",
  "common.cancelled": "Cancelled",
  "common.none": "None",

  "devices.connect.title": "Connect device",
  "devices.connect.subtitle": "Request USB ADB permission and connect",
  "devices.recent.title": "Recent devices",
  "devices.recent.subtitleHas": "Tap to connect quickly",
  "devices.recent.subtitleEmpty": "No history",
  "devices.recent.clear": "Clear recent devices",
  "devices.recent.emptyHint": "Connected devices will appear here",

  "settingsMain.appearance.title": "Appearance & Display",
  "settingsMain.appearance.subtitle": "Theme: {theme}",
  "settingsMain.general.title": "General",
  "settingsMain.general.subtitle": "Menu integration",
  "settingsMain.privacy.title": "Privacy & Permissions",
  "settingsMain.privacy.subtitle": "View permissions",
  "settingsMain.about.title": "About",
  "settingsMain.about.subtitle": "Version v0.1.0",

  "appearance.section.title": "Theme mode",
  "appearance.theme.light": "Light",
  "appearance.theme.system": "System",
  "appearance.theme.dark": "Dark",

  "general.contextMenu.title": "Context menu integration",
  "general.contextMenu.subtitle": "Show quick actions in the context menu (not implemented)",
  "general.language.title": "Language",
  "general.language.subtitle": "Switch UI language",
  "general.language.zhCN": "简体中文",
  "general.language.enUS": "English (US)",

  "privacy.section.controls": "Privacy controls",
  "privacy.policy.title": "Privacy policy",
  "privacy.policy.subtitle": "View the full privacy policy (not implemented)",
  "privacy.section.permissions": "Granted permissions",
  "privacy.perm.webusb.title": "WebUSB device access",
  "privacy.perm.webusb.subtitle": "navigator.usb (user granted)",
  "privacy.perm.storage.title": "Storage",
  "privacy.perm.storage.subtitle": "storage (local)",
  "privacy.perm.sidepanel.title": "Side panel control",
  "privacy.perm.sidepanel.subtitle": "sidePanel",
  "privacy.perm.tabs.title": "Tabs",
  "privacy.perm.tabs.subtitle": "tabs",

  "about.section.character": "Background character",
  "about.character.name": "Konata Izumi",
  "about.character.desc":
    "A legendary otaku icon with her signature blue hair and ahoge. Despite her athletic talent, she refuses to join clubs so she won't miss anime broadcasts. Laid-back day to day, but unstoppable when shopping for merch — a reflection of every anime fan.",
  "about.character.credit": "Image credit: {author}",
  "about.section.project": "Project",
  "about.version.title": "Version",
  "about.dev.name": "Nako Arkrin",
  "about.dev.subtitle": "Developer & Designer",
  "about.section.opensource": "Open source",
  "about.source.title": "Source code",
  "about.source.subtitle": "GitHub Repository",
  "about.ref.title": "ya-webadb",
  "about.ref.subtitle": "Reference project",
  "about.thanks.title": "Thanks",
  "about.thanks.subtitle": "All contributors",

  "control.permissionHint": "If USB permission hasn't been granted, connect once on the permission page.",

  "scrcpy.status.disconnected": "Disconnected",
  "scrcpy.status.connecting": "Connecting to ADB...",
  "scrcpy.status.retrying": "Retrying connection...",
  "scrcpy.status.cancelled": "Connection cancelled or failed",
  "scrcpy.status.connectedStarting": "Connected to ADB. Starting Scrcpy...",
  "scrcpy.status.decoderInit": "Scrcpy started. Initializing decoder...",
  "scrcpy.status.webglUnavailable": "WebGL is not available",
  "scrcpy.status.mirroringActive": "Mirroring active",
  "scrcpy.status.noVideoStream": "Scrcpy video stream not available",
  "scrcpy.status.videoStreamError": "Video stream error: {message}",

  "popup.openSidePanel": "Open side panel",
  "popup.connectDevice": "Connect device",
  "popup.version.title": "Version",
  "popup.version.subtitle": "Beta Ver 0.1.0",
  "popup.settings.title": "Settings",
  "popup.settings.subtitle": "Open in side panel",
  "popup.recent.title": "Recently connected devices",
  "popup.recent.subtitleHas": "Up to 2 devices",
  "popup.recent.subtitleEmpty": "None",
  "popup.recent.emptyHint": "Connected devices will appear here",

  "options.title": "Settings",
  "options.subtitle": "Settings are mainly available in the side panel in this version.",

  "permission.statusLabel": "Status: {status}",
  "permission.status.ready": "Ready",
  "permission.status.unsupported": "This browser does not support WebUSB",
  "permission.status.requesting": "Requesting USB device permission...",
  "permission.status.connected": "Connected. You can now control the device in the side panel.",
  "permission.connecting": "Connecting…",
  "permission.connect": "Connect device",
  "permission.openSidePanel": "Open side panel",
  "permission.reset": "Reset connection",
  "permission.title": "Connect Android device",
  "permission.desc":
    "neoScrcpy uses WebUSB to request ADB permission, mirror your phone in the browser side panel, and map clicks/swipes to control commands.",
  "permission.faq.title": "Troubleshooting",
  "permission.faq.deviceMissing.title": "Can't find your device? (Important)",
  "permission.faq.deviceMissing.body":
    "If you could connect before but can't find the device now, the browser or USB stack may be stuck.\nTry: 1) Replug the USB cable; 2) Toggle \"USB debugging\" off and on on your phone; 3) Click \"Reset connection\" above.",
  "permission.faq.driver.title": "Driver issue (Windows)",
  "permission.faq.driver.body": "Even if it worked before, system updates may reset drivers. Make sure the driver is installed:",
  "permission.faq.other.title": "Other apps are using ADB",
  "permission.faq.other.body": "Make sure no other phone assistants or adb.exe processes are running — they may exclusively lock the USB device.",

  "error.usbTransferInterrupted": "USB transfer interrupted. Replug the device and grant permission again.",
  "error.deviceDisconnected": "Device disconnected. Please reconnect.",
  "error.usbAborted": "USB connection was interrupted. Please reconnect.",
  "error.notAdbDevice": "Selected device was not recognized as an ADB device.",
  "error.scrcpyStartFailed": "Failed to start scrcpy server: {message}",
  "error.connectFailed": "Connection failed: {message}",
  "error.usbTransferInterruptedLong":
    "USB transfer interrupted. Check: 1) no other ADB programs are running; 2) replug the device; 3) confirm USB debugging is authorized on the phone.",
  "error.usbTimeout": "USB connection was interrupted or timed out. Please retry."
};

const messages: Record<Locale, Record<I18nKey, string>> = {
  "zh-CN": zhCN,
  "en-US": enUS
};

export function formatThemeLabel(locale: Locale, themeMode: ThemeMode) {
  if (themeMode === "light") return t(locale, "appearance.theme.light");
  if (themeMode === "dark") return t(locale, "appearance.theme.dark");
  return t(locale, "appearance.theme.system");
}

export function t(locale: Locale, key: I18nKey, vars?: Record<string, string | number>) {
  const template = messages[locale]?.[key] ?? messages["zh-CN"][key] ?? key;
  if (!vars) return template;
  return template.replace(/\{(\w+)\}/g, (_, name: string) => String(vars[name] ?? `{${name}}`));
}
