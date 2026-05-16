import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { getState, Locale, setLocale, setThemeMode, ThemeMode } from "../../shared/storage";
import { resolveTheme } from "../../shared/theme";
import { IconArrowLeft, IconChevronRight, IconLanguage, IconMoon, IconSun } from "../../ui/icons";
import stepLight1 from "../../assets/1.png";
import stepLight2 from "../../assets/2.png";
import stepLight3 from "../../assets/3.png";
import stepLight4 from "../../assets/4.png";
import stepDark1 from "../../assets/5.png";
import stepDark2 from "../../assets/6.png";
import stepDark3 from "../../assets/7.png";
import stepDark4 from "../../assets/8.png";

type TranslationStep =
  | {
      title: string;
      content: string;
      type: "text";
    }
  | {
      title: string;
      subtitle: string;
      type: "cards";
      items: Array<{ text: string }>;
    };

type TranslationBlock = {
  steps: TranslationStep[];
  back: string;
  next: string;
  start: string;
};

const translations: Record<Locale, TranslationBlock> = {
  "zh-CN": {
    steps: [
      {
        title: "欢迎使用 neoScrcpy.",
        content: "欢迎使用 neoScrcpy Beta，我们使用了 Chrome 的插件侧边栏特性，将您的 android 设备使用 adb 和 WebUSB 投屏至侧边栏。",
        type: "text"
      },
      {
        title: "您的隐私十分重要。",
        content: "保护您的隐私是我们的重要责任，我们的插件不会进行任何联网行为，但是我们需要一些权限来帮助软件正常运作，一切均在本地处理和运行。",
        type: "text"
      },
      {
        title: "权限",
        subtitle: "我们将会使用以下的权限",
        type: "cards",
        items: [
          { text: "您的数据均安全的保存在本地。" },
          { text: "我们会通过 webUSB 读取您的设备，并与其建立连接" },
          { text: "您的数据不会被传送到任何服务器，将完全在本地保存。" }
        ]
      },
      {
        title: "Dev 中的软件。",
        content: "此软件正在开发过程中，目前还有许多不稳定的问题，欢迎前往仓库添加代码，让我们一起将这个项目变的更好。",
        type: "text"
      }
    ],
    back: "上一步",
    next: "下一步",
    start: "开始使用"
  },
  "en-US": {
    steps: [
      {
        title: "Welcome to neoScrcpy.",
        content: "Welcome to neoScrcpy Beta. We utilize Chrome's side panel feature to cast your Android device via ADB and WebUSB directly to the sidebar.",
        type: "text"
      },
      {
        title: "Your Privacy Matters.",
        content: "Protecting your privacy is our priority. Our extension makes no network requests. We require certain permissions to function, but everything is processed and stored locally.",
        type: "text"
      },
      {
        title: "Permissions",
        subtitle: "We require the following permissions:",
        type: "cards",
        items: [
          { text: "Your data is securely stored locally." },
          { text: "We access and connect to your device via WebUSB." },
          { text: "Your data is never sent to any server; it remains entirely local." }
        ]
      },
      {
        title: "Software in Dev.",
        content: "This software is currently under development and may have unstable issues. We welcome contributions to our repository to help improve this project.",
        type: "text"
      }
    ],
    back: "Back",
    next: "Next",
    start: "Get Started"
  }
};

const permissionIconPaths = [
  "M180-515.62v-180.53q0-22.79 13.11-41.03 13.1-18.23 33.89-26.43l227.69-85q12.85-4.62 25.31-4.62 12.46 0 25.31 4.62l227.69 85q20.79 8.2 33.89 26.43Q780-718.94 780-696.15V-516q0 15-9.38 22.5t-20.63 7.5q-12.76 0-21.37-8.25Q720-502.5 720-516v-180.54q0-3.84-2.12-6.92-2.11-3.08-5.96-4.62l-227.69-85q-1.92-.77-4.23-.77-2.31 0-4.23.77l-227.69 85q-3.85 1.54-5.96 4.62-2.12 3.08-2.12 6.92V-516q0 121 68 220t172 132q9.53-3.31 19.92-7.86 10.4-4.54 19.93-8.68 11.15-5.07 23.05-.61 11.89 4.46 17.1 15.61 5.08 11.15.61 23.05-4.46 11.9-15.61 17.1-8.69 3.85-18.78 8.16-10.08 4.31-18.3 8.23-5.61 2-11.92 3.31-6.31 1.3-12.54 1.3-6.23 0-12.23-1.3-6-1.31-11.62-3.31-126.53-45-201.65-159.46Q182.85-382.92 180-515.62ZM664.38-100q-14 0-24.38-10.39-10.39-10.38-10.39-24.38v-122q0-14 10.39-24 10.38-10 24.38-10h5.23v-40q0-31.46 21.97-53.42 21.96-21.96 53.42-21.96t53.42 21.96q21.96 21.96 21.96 53.42v40h5.23q14.16 0 24.28 10 10.11 10 10.11 24v122q0 14-10.11 24.38Q839.77-100 825.61-100H664.38ZM705-290.77h80v-40q0-17-11.5-28.5t-28.5-11.5q-17 0-28.5 11.5t-11.5 28.5v40ZM480-479.62Z",
  "M200-130q-12.77 0-21.38-8.62Q170-147.23 170-160v-42.31h-3.85q-11.76-6.77-23.96-14.04Q130-223.62 130-238.46v-113.85q0-12.77 8.62-21.38 8.61-8.62 21.38-8.62h50V-680q0-62.15 43.92-106.08Q297.85-830 360-830t106.08 43.92Q510-742.15 510-680v400q0 37.62 26.19 63.81Q562.38-190 600-190q37.62 0 63.81-26.19Q690-242.38 690-280v-297.69h-50q-12.77 0-21.38-8.62-8.62-8.61-8.62-21.38v-113.85q0-14.84 12.19-22.11 12.2-7.27 23.96-14.04H650V-800q0-12.77 8.62-21.38Q667.23-830 680-830h80q12.77 0 21.38 8.62Q790-812.77 790-800v42.31h3.85q11.76 6.77 23.96 14.04Q830-736.38 830-721.54v113.85q0 12.77-8.62 21.38-8.61 8.62-21.38 8.62h-50V-280q0 62.15-43.92 106.08Q662.15-130 600-130t-106.08-43.92Q450-217.85 450-280v-400q0-37.62-26.19-63.81Q397.62-770 360-770q-37.62 0-63.81 26.19Q270-717.62 270-680v297.69h50q12.77 0 21.38 8.62 8.62 8.61 8.62 21.38v113.85q0 14.84-12.19 22.11-12.2 7.27-23.96 14.04H310V-160q0 12.77-8.62 21.38Q292.77-130 280-130h-80Z",
  "M771.08-104 334.23-540.23q-6.61 13.84-10.42 28.65Q320-496.77 320-480q0 28.31 9.23 52.62 9.23 24.3 24.92 45.07 7.7 10.54 7.58 22.62-.11 12.07-8.81 20.77-9.3 9.3-21.88 9.42-12.58.11-20.65-10.42Q287-369 273.5-404.27 260-439.54 260-480q0-29.15 7.54-56.12 7.54-26.96 20.85-49.96l-72.47-72.46q-26.38 38.31-41.15 83.04Q160-530.77 160-480q0 60.69 20.54 113.92 20.54 53.23 58.23 95.62 8.69 9.92 9.58 22.58.88 12.65-8.43 21.96-9.3 9.3-22.07 8.92-12.77-.39-21.46-10.31-45-51.08-70.7-115.15Q100-406.54 100-480q0-63.15 18.92-118.92 18.93-55.77 53.62-103l-69.15-69.16q-8.93-8.92-9.12-21.19-.19-12.27 9.12-21.58 9.3-9.3 21.38-9.3 12.08 0 21.38 9.3l667.7 667.7q8.92 8.92 9.11 20.88.19 11.96-9.11 21.27-9.31 9.31-21.39 9.31-12.07 0-21.38-9.31ZM800-480q0-64-24.5-122.5T706-706q-45-45-103.5-69.5T480-800q-39.15 0-77.23 8.77-38.08 8.77-71.62 28.77-10.53 6.69-23.3 3.34-12.77-3.34-19.46-13.88-6.7-10.54-3.66-22.5t13.58-18.04q42.08-22.61 87.84-34.54Q431.92-860 480-860q75.77 0 145.31 28.66 69.54 28.65 123.46 82.57 53.92 53.92 82.57 123.46Q860-555.77 860-480q0 48.23-12 94.58-12 46.34-35.39 88.42-6.07 10.54-17.53 13.08-11.47 2.53-22-3.54-10.54-6.08-13.89-18.04-3.34-11.96 2.73-23.11 19.54-34.77 28.81-73.31T800-480ZM541-628q-29-12-61-12-11 0-21 1.5t-20.38 3.88q-12.77 3.24-23-3.15-10.23-6.38-13.47-19.15-3.23-12.77 3.16-22.81 6.38-10.04 19.15-13.27 13.23-3.61 27.27-5.31Q465.77-700 480-700q44.15 0 84.5 16.66 40.35 16.65 71.27 47.57 30.92 30.92 47.57 71.27Q700-524.15 700-480q0 14.23-1.69 28.27-1.7 14.04-5.31 27.27-3.23 12.77-13.46 19.15-10.23 6.39-23 3.16-12.77-3.24-18.96-13.47-6.2-10.23-2.96-23Q637-449 638.5-459q1.5-10 1.5-21 0-32-12-61t-35-52q-23-23-52-35Z"
];

const stepIconPaths = [
  "M665.38-64q-12.77 0-21.57-8.92-8.81-8.93-8.81-21.7t8.81-21.38q8.8-8.62 21.57-8.62Q736-125 785.5-174.69q49.5-49.7 49.88-119.93 0-12.77 8.93-21.88 8.92-9.12 21.69-9.12 12.77 0 21.38 9.12 8.62 9.11 8.62 21.88 0 96.16-67.23 163.39Q761.54-64 665.38-64ZM94.62-635q-12.77 0-21.7-8.61Q64-652.23 64-665q0-96.15 67.42-163.58Q198.85-896 294.62-896q12.77 0 21.88 8.62 9.12 8.61 9.12 21.38t-9.12 21.69q-9.11 8.93-21.88 8.93Q224-835 174.5-785.31q-49.5 49.7-49.88 119.93 0 12.77-8.62 21.57-8.61 8.81-21.38 8.81Zm664.07-108.08q0 11.77-9.31 21.08L502.31-474.31q-8.31 8.92-20.58 8.62-12.27-.31-21.19-8.62-9.31-8.92-9.12-21.38.2-12.46 9.12-21.39l246.69-247.07q9.31-9.31 21.08-9.31 11.77 0 21.07 9.31 9.31 9.31 9.31 21.07Zm67.92 124.23q0 12.08-9.3 21.39L598.23-378.77q-8.31 8.31-20.77 8.5-12.46.19-21.38-8.5-8.93-8.92-9.04-21.38-.12-12.46 8.81-21.39l218.69-218.69q9.31-9.31 21.38-9.31 12.08 0 21.39 9.31 9.3 9.31 9.3 21.38ZM219.46-220.23q-85.61-85.62-85.42-205.54.19-119.92 86.19-205.92l91.62-91.62q10.84-10.84 25.5-10.84 14.65 0 25.5 10.84l24.07 24.08q8.93 8.92 14.31 19.12 5.39 10.19 8.85 21.65l146.46-147.08q9.31-9.3 21.38-9.3 12.08 0 21.39 9.3 9.3 9.31 9.3 21.39 0 12.07-9.3 21.38L425.92-589.38l-73.84 73.61 19.38 19.39q42.15 42.15 40.92 101.15-1.23 59-44 101.77l-8.3 8.31q-8.31 8.3-20.77 8.5-12.46.19-21.39-8.5-8.92-8.93-8.92-21.39t8.92-21.38l7.7-7.7q24.92-24.92 26.46-59.3 1.54-34.39-23.39-59.31l-36.23-35.62q-10.84-10.84-10.84-25.8 0-14.97 10.84-25.81l50.85-49.85q13.92-13.92 13.92-33.5 0-19.57-13.92-33.5l-5.77-5.77-75.16 74.77Q194-520.92 193.42-425.85q-.57 95.08 67.81 163.47Q329.61-194 425.58-194q95.96 0 164.34-68.38l225.92-226.54q9.31-9.31 21.39-9.31t21.38 9.31q9.31 9.31 9.31 21.38 0 12.08-9.31 21.39L631.69-220.23q-86 86-206.11 86-120.12 0-206.12-86Zm205.92-206.31Z",
  "M360-250h240q12.77 0 21.38-8.62Q630-267.23 630-280t-8.62-21.38Q612.77-310 600-310H360q-12.77 0-21.38 8.62Q330-292.77 330-280t8.62 21.38Q347.23-250 360-250Zm0-160h240q12.77 0 21.38-8.62Q630-427.23 630-440t-8.62-21.38Q612.77-470 600-470H360q-12.77 0-21.38 8.62Q330-452.77 330-440t8.62 21.38Q347.23-410 360-410ZM252.31-100Q222-100 201-121q-21-21-21-51.31v-615.38Q180-818 201-839q21-21 51.31-21h287.77q14.46 0 27.81 5.62 13.34 5.61 23.19 15.46l167.84 167.84q9.85 9.85 15.46 23.19 5.62 13.35 5.62 27.81v447.77Q780-142 759-121q-21 21-51.31 21H252.31ZM540-656.16V-800H252.31q-4.62 0-8.46 3.85-3.85 3.84-3.85 8.46v615.38q0 4.62 3.85 8.46 3.84 3.85 8.46 3.85h455.38q4.62 0 8.46-3.85 3.85-3.84 3.85-8.46V-620H576.16q-15.47 0-25.81-10.35Q540-640.69 540-656.16ZM240-800v180-180V-160v-640Z",
  "M480-380ZM260-180q-82.92 0-141.46-57.53Q60-295.06 60-378.15q0-74.54 47.96-131.12t118.96-67.04Q246.15-666 317.12-723q70.96-57 162.88-57 88.4 0 156.08 51.19 67.69 51.2 92.53 131.5 3.85 12.77-3.15 22.31t-17.54 12.77q-10.54 3.23-21.88-1.85-11.35-5.07-16.81-20.46-20.38-59.23-71.81-97.34Q546-720 480-720q-83 0-141.5 58.5T280-520h-20.77q-56.85 0-98.04 41Q120-438 120-380t41 99q41 41 99 41h258.08q12.75 0 21.37 8.63 8.63 8.63 8.63 21.38 0 12.76-8.63 21.37-8.62 8.62-21.37 8.62H260Zm411.92 0q-15.36 0-25.76-10.4-10.39-10.39-10.39-25.76v-114.23q0-15.46 11.11-25.61 11.12-10.15 26.97-10.15v-40q0-30.62 21.82-52.43 21.82-21.8 52.46-21.8t52.21 21.8q21.58 21.81 21.58 52.43v40q15.85 0 26.96 10.15Q860-345.85 860-330.39v114.23q0 15.37-10.4 25.76-10.39 10.4-25.76 10.4H671.92Zm37.31-186.15h77.31v-40q0-17-10.73-27.93Q765.08-445 748.08-445t-27.93 10.92q-10.92 10.93-10.92 27.93v40Z",
  "M160-240v-480 510-30Zm12.31 60Q142-180 121-201q-21-21-21-51.31v-455.38Q100-738 121-759q21-21 51.31-21H362q14.46 0 27.81 5.62 13.34 5.61 23.19 15.46L471.92-700h315.77Q818-700 839-679q21 21 21 51.31v160.38q0 12.77-8.62 21.39-8.61 8.61-21.38 8.61t-21.38-8.61q-8.62-8.62-8.62-21.39v-160.38q0-5.39-3.46-8.85t-8.85-3.46H447.38l-80-80H172.31q-5.39 0-8.85 3.46t-3.46 8.85v455.38q0 5.39 3.46 8.85t8.85 3.46h179.23q12.77 0 21.38 8.62 8.62 8.61 8.62 21.38t-8.62 21.38q-8.61 8.62-21.38 8.62H172.31Zm381.46-30 65.92 65.92q8.93 8.93 8.93 20.89t-8.93 21.27q-8.92 9.3-21.19 9.11-12.27-.19-21.19-9.11l-82.77-82.77q-10.85-10.85-10.85-25.31 0-14.46 10.85-25.31l82.77-82.77q8.92-8.92 21-9.11 12.08-.19 21.38 9.11 8.93 8.93 8.93 21.08 0 12.15-8.93 21.08L553.77-210Zm261.69 0-65.92-65.92q-8.92-8.93-8.92-20.89t8.92-21.27q8.92-9.3 21.19-9.11 12.27.19 21.19 9.11l82.77 82.77q10.85 10.85 10.85 25.31 0 14.46-10.85 25.31l-82.77 82.77q-8.92 8.92-21 9.11-12.07.19-21.38-9.11-8.92-8.93-8.92-21.08 0-12.15 8.92-21.08L815.46-210Z"
];

const CustomIcon = ({ d, className }: { d: string; className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="currentColor" className={className}>
    <path d={d} />
  </svg>
);

const lightStepImages = [stepLight1, stepLight2, stepLight3, stepLight4];
const darkStepImages = [stepDark1, stepDark2, stepDark3, stepDark4];

export function WelcomeApp() {
  const [currentStep, setCurrentStep] = useState(0);
  const [locale, setLocaleState] = useState<Locale>("zh-CN");
  const [themeMode, setThemeModeState] = useState<ThemeMode>("system");
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [transitionId, setTransitionId] = useState(0);
  const [prevSnapshot, setPrevSnapshot] = useState<TranslationStep | null>(null);
  const [showPrev, setShowPrev] = useState(false);
  const [enterActive, setEnterActive] = useState(true);
  const [exitActive, setExitActive] = useState(false);
  const [contentMinHeight, setContentMinHeight] = useState<number | null>(null);
  const themeModeRef = useRef<ThemeMode>("system");
  const localeRef = useRef<Locale>("zh-CN");
  const lastDataRef = useRef<TranslationStep | null>(null);
  const lastStepRef = useRef<number | null>(null);
  const lastLocaleRef = useRef<Locale | null>(null);
  const prevHeightRef = useRef(0);
  const heightTimerRef = useRef<number | null>(null);
  const contentRef = useRef<HTMLDivElement | null>(null);

  const applyTheme = (mode: ThemeMode, prefersDark: boolean) => {
    const resolved = resolveTheme(mode, prefersDark);
    document.documentElement.dataset.theme = resolved;
    setIsDarkMode(resolved === "dark");
  };

  useEffect(() => {
    let mounted = true;
    const mql = window.matchMedia("(prefers-color-scheme: dark)");
    const update = (mode: ThemeMode, prefersDark = mql.matches) => {
      if (!mounted) return;
      applyTheme(mode, prefersDark);
    };

    void (async () => {
      const s = await getState();
      if (!mounted) return;
      setLocaleState(s.locale);
      setThemeModeState(s.themeMode);
      themeModeRef.current = s.themeMode;
      localeRef.current = s.locale;
      update(s.themeMode);
    })();

    const listener = (changes: Record<string, chrome.storage.StorageChange>, areaName: string) => {
      if (areaName !== "local") return;
      if (changes.locale?.newValue) {
        const nextLocale = changes.locale.newValue as Locale;
        localeRef.current = nextLocale;
        setLocaleState(nextLocale);
      }
      if (changes.themeMode?.newValue) {
        const nextMode = changes.themeMode.newValue as ThemeMode;
        themeModeRef.current = nextMode;
        setThemeModeState(nextMode);
        update(nextMode);
      }
    };
    chrome.storage.onChanged.addListener(listener);

    const onMediaChange = (event: MediaQueryListEvent) => {
      if (themeModeRef.current === "system") {
        update("system", event.matches);
      }
    };
    mql.addEventListener("change", onMediaChange);

    return () => {
      mounted = false;
      chrome.storage.onChanged.removeListener(listener);
      mql.removeEventListener("change", onMediaChange);
    };
  }, []);

  useEffect(() => {
    themeModeRef.current = themeMode;
  }, [themeMode]);

  useEffect(() => {
    localeRef.current = locale;
  }, [locale]);

  const t = translations[locale];
  const currentData = t.steps[currentStep];
  const stepCount = t.steps.length;
  const stepImages = useMemo(() => (isDarkMode ? darkStepImages : lightStepImages), [isDarkMode]);
  const exitDuration = 600;

  useEffect(() => {
    if (lastStepRef.current === null) {
      lastStepRef.current = currentStep;
      lastLocaleRef.current = locale;
      lastDataRef.current = currentData;
      return;
    }

    if (lastStepRef.current === currentStep && lastLocaleRef.current === locale) {
      lastDataRef.current = currentData;
      return;
    }

    lastStepRef.current = currentStep;
    lastLocaleRef.current = locale;
    setPrevSnapshot(lastDataRef.current);
    setShowPrev(true);
    setTransitionId((id) => id + 1);
    setEnterActive(false);
    setExitActive(true);
    lastDataRef.current = currentData;

    const frame = requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        setEnterActive(true);
      });
    });

    const timer = window.setTimeout(() => {
      setShowPrev(false);
    }, exitDuration);
    return () => {
      cancelAnimationFrame(frame);
      window.clearTimeout(timer);
    };
  }, [currentStep, locale, currentData]);

  useLayoutEffect(() => {
    const element = contentRef.current;
    if (!element) return;
    const measured = Math.ceil(element.getBoundingClientRect().height);
    const maxHeight = Math.max(prevHeightRef.current, measured);
    setContentMinHeight(maxHeight);
    if (heightTimerRef.current !== null) {
      window.clearTimeout(heightTimerRef.current);
    }
    heightTimerRef.current = window.setTimeout(() => {
      setContentMinHeight(measured);
      prevHeightRef.current = measured;
    }, exitDuration);
    return () => {
      if (heightTimerRef.current !== null) {
        window.clearTimeout(heightTimerRef.current);
      }
    };
  }, [transitionId, exitDuration]);

  const toggleDarkMode = async () => {
    const nextMode: ThemeMode = isDarkMode ? "light" : "dark";
    setThemeModeState(nextMode);
    applyTheme(nextMode, nextMode === "dark");
    await setThemeMode(nextMode);
  };

  const toggleLanguage = async () => {
    const nextLocale: Locale = locale === "zh-CN" ? "en-US" : "zh-CN";
    setLocaleState(nextLocale);
    await setLocale(nextLocale);
  };

  const handleStart = async () => {
    const win = await chrome.windows.getCurrent();
    await chrome.runtime.sendMessage({ type: "OPEN_SIDEPANEL", windowId: win.id });
    if (typeof win.id === "number") {
      await chrome.windows.update(win.id, { focused: true });
    }
    window.close();
  };

  const handleNext = () => {
    if (currentStep < stepCount - 1) {
      setCurrentStep((prev) => prev + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  const languageLabel = useMemo(() => (locale === "zh-CN" ? "CN" : "EN"), [locale]);
  const renderContent = (data: TranslationStep) => (
    <>
      <h1 className={`text-4xl font-bold mb-4 tracking-tight transition-all duration-300 ${isDarkMode ? "text-white" : "text-neutral-900"}`}>
        {data.title}
      </h1>

      {data.type === "text" && (
        <p className={`text-lg leading-relaxed max-w-lg transition-colors duration-300 ${isDarkMode ? "text-neutral-400" : "text-neutral-500"}`}>
          {data.content}
        </p>
      )}

      {data.type === "cards" && (
        <div className="space-y-4 mt-2">
          <p className={`text-lg mb-6 ${isDarkMode ? "text-neutral-400" : "text-neutral-500"}`}>{data.subtitle}</p>
          {data.items.map((item, index) => (
            <div
              key={index}
              className={`flex items-center gap-4 p-4 rounded-2xl border transition-all ${isDarkMode ? "bg-neutral-800/30 border-neutral-800 text-neutral-200" : "bg-neutral-50 border-neutral-100 text-neutral-700"}`}
            >
              <div className={`flex-shrink-0 ${isDarkMode ? "text-neutral-400" : "text-neutral-500"}`}>
                <CustomIcon d={permissionIconPaths[index]} />
              </div>
              <span className="text-sm font-medium leading-normal">{item.text}</span>
            </div>
          ))}
        </div>
      )}
    </>
  );

  return (
    <div className={`min-h-screen flex items-center justify-center p-6 md:p-12 font-sans transition-colors duration-500 ${isDarkMode ? "bg-neutral-950 text-white" : "bg-[#fafafa] text-[#1a1a1a]"}`}>
      <div className="fixed top-8 right-8 flex gap-3">
        <button
          onClick={toggleLanguage}
          className={`p-3 rounded-full transition-all duration-300 active:scale-90 shadow-sm flex items-center justify-center ${isDarkMode ? "bg-neutral-800 text-neutral-300 hover:bg-neutral-700 hover:text-white" : "bg-white text-neutral-500 hover:bg-neutral-100 hover:text-black"}`}
          title={locale === "zh-CN" ? "Switch to English" : "切换为中文"}
          type="button"
        >
          <IconLanguage size={20} />
          <span className="text-xs font-bold ml-1 w-5">{languageLabel}</span>
        </button>

        <button
          onClick={toggleDarkMode}
          className={`p-3 rounded-full transition-all duration-300 active:scale-90 shadow-sm ${isDarkMode ? "bg-neutral-800 text-yellow-400 hover:bg-neutral-700" : "bg-white text-neutral-500 hover:bg-neutral-100"}`}
          type="button"
        >
          {isDarkMode ? <IconSun size={20} /> : <IconMoon size={20} />}
        </button>
      </div>
      <div className="relative w-full h-full flex items-center justify-center" style={{ transform: "scale(0.8)", transformOrigin: "center" }}>
        <div className={`rounded-[40px] w-full max-w-6xl min-h-[720px] flex flex-col md:flex-row overflow-hidden transition-all duration-500 shadow-2xl ${isDarkMode ? "bg-neutral-900 border-neutral-800 border" : "bg-white border-neutral-100 border shadow-[0_8px_30px_rgb(0,0,0,0.04)]"}`}>
          <div className="md:w-[42%] p-3 md:p-4 hidden md:block">
            <div className={`w-full h-full rounded-[32px] border relative overflow-hidden group transition-colors duration-500 ${isDarkMode ? "bg-neutral-800/50 border-neutral-700" : "bg-neutral-50 border-neutral-100"}`}>
              <div className="absolute inset-0 flex items-center justify-center">
                <img src={stepImages[currentStep]} alt="" className="w-full h-full object-cover" />
              </div>
              <div className={`absolute inset-0 pointer-events-none transition-opacity duration-500 ${isDarkMode ? "bg-gradient-to-tr from-black/20 via-transparent to-white/5 opacity-50" : "bg-gradient-to-tr from-neutral-100/40 via-transparent to-neutral-200/20"}`} />
            </div>
          </div>

          <div className="p-8 md:p-16 flex-1 flex flex-col justify-between">
            <div className="flex flex-col h-full">
              <div className="mb-8 md:mb-12">
                <div className="flex gap-1.5 mb-6">
                  {[0, 1, 2, 3].map((_, idx) => (
                    <div key={idx} className={`h-1 rounded-full transition-all duration-500 ${currentStep === idx ? (isDarkMode ? "w-6 bg-white" : "w-6 bg-black") : isDarkMode ? "w-2 bg-neutral-800" : "w-2 bg-neutral-200"}`} />
                  ))}
                </div>

                <div className={`mb-8 transition-colors ${isDarkMode ? "text-white" : "text-black"}`}>
                  <CustomIcon
                    d={stepIconPaths[currentStep]}
                    className={currentStep === 0 ? "w-10 h-10 animate-wave" : "w-10 h-10"}
                  />
                </div>

                <div className="relative" style={contentMinHeight ? { minHeight: `${contentMinHeight}px` } : undefined}>
                  {showPrev && prevSnapshot && (
                    <div key={`prev-${transitionId}`} className={`slide-wrapper absolute inset-0 pointer-events-none ${exitActive ? "slide-exit-active" : "slide-exit"}`}>
                      {renderContent(prevSnapshot)}
                    </div>
                  )}
                  <div ref={contentRef} key={`current-${transitionId}`} className={`slide-wrapper ${enterActive ? "slide-enter-active" : "slide-enter"}`}>
                    {renderContent(currentData)}
                  </div>
                </div>
              </div>
            </div>

            <div className={`flex justify-between items-center mt-8 pt-8 border-t transition-colors ${isDarkMode ? "border-neutral-800" : "border-neutral-100"}`}>
              <button
                className={`rounded-full px-6 py-3 font-bold text-sm transition-all flex items-center gap-2 active:scale-95 ${currentStep === 0 ? "opacity-0 pointer-events-none" : ""} ${isDarkMode ? "text-neutral-400 hover:text-white hover:bg-neutral-800" : "text-neutral-500 hover:text-black hover:bg-neutral-100"}`}
                onClick={handleBack}
                type="button"
              >
                <IconArrowLeft size={18} />
                {t.back}
              </button>

            <button
              className={`rounded-full px-10 py-4 font-bold text-sm transition-all flex items-center gap-2 active:scale-95 shadow-xl ${isDarkMode ? "bg-white text-black hover:bg-neutral-100 shadow-white/5" : "bg-black text-white hover:bg-neutral-800 shadow-neutral-200"}`}
              onClick={currentStep === stepCount - 1 ? handleStart : handleNext}
              type="button"
            >
                {currentStep === stepCount - 1 ? (
                  <>
                    {t.start} <IconChevronRight size={18} />
                  </>
                ) : (
                  <>
                    {t.next} <IconChevronRight size={18} />
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
