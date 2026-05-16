import React from "react";

type IconProps = { size?: number; className?: string };

const materialIcon =
  (name: string) =>
  ({ size = 20, className }: IconProps) =>
    (
      <span
        className={["material-symbols-rounded", className].filter(Boolean).join(" ")}
        style={{ fontSize: size, width: size, height: size }}
        aria-hidden
      >
        {name}
      </span>
    );

export const IconChevronRight = materialIcon("chevron_right");
export const IconArrowLeft = materialIcon("arrow_back_ios_new");
export const IconSettings = materialIcon("settings");
export const IconUsb = materialIcon("usb");
export const IconDevices = materialIcon("devices");
export const IconInfo = materialIcon("info");
export const IconPower = materialIcon("power_settings_new");
export const IconPip = materialIcon("picture_in_picture_alt");
export const IconSoundOn = materialIcon("volume_up");
export const IconSoundOff = materialIcon("volume_off");
export const IconRefresh = materialIcon("refresh");
export const IconPalette = materialIcon("palette");
export const IconShield = materialIcon("shield");
export const IconKey = materialIcon("key");
export const IconExternalLink = materialIcon("open_in_new");
export const IconCheck = materialIcon("check");
export const IconDelete = materialIcon("delete");
export const IconClose = materialIcon("close");
export const IconGlobe = materialIcon("public");
export const IconGithub = materialIcon("code");
export const IconFileText = materialIcon("description");
export const IconFolder = materialIcon("folder");
export const IconFileImage = materialIcon("image");
export const IconFileAudio = materialIcon("audio_file");
export const IconFileVideo = materialIcon("video_file");
export const IconFileArchive = materialIcon("archive");
export const IconAppStore = materialIcon("apps");
export const IconAndroid = materialIcon("android");
export const IconUpload = materialIcon("upload");
export const IconDownload = materialIcon("download");
export const IconBookOpen = materialIcon("menu_book");
export const IconHeart = materialIcon("favorite");
export const IconCode = materialIcon("code");
export const IconTerminal = materialIcon("terminal");
export const IconSun = materialIcon("light_mode");
export const IconMoon = materialIcon("dark_mode");
export const IconMonitor = materialIcon("computer");
export const IconLanguage = materialIcon("translate");
export const IconPages = materialIcon("library_books");
