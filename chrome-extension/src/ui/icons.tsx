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
export const IconAdd = materialIcon("add");
export const IconUsb = materialIcon("usb");
export const IconDevices = materialIcon("devices");
export const IconInfo = materialIcon("info");
export const IconWarning = materialIcon("warning");
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
export const IconEdit = materialIcon("edit");
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

export const IconShizuku = ({ size = 22, className }: IconProps) => (
  <svg
    className={className}
    aria-hidden
    width={size}
    height={size}
    viewBox="0 0 24 25"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    style={{ display: "block" }}
  >
    <path
      d="M16.616 2.09863C17.5314 2.09873 18.3776 2.5887 18.8328 3.38281L23.3113 11.1963L23.3904 11.3457C23.7358 12.0528 23.7359 12.8808 23.3904 13.5879L23.3113 13.7373L18.8328 21.5508C18.3776 22.3449 17.5314 22.8349 16.616 22.835H7.70972C6.79429 22.835 5.9482 22.3449 5.49292 21.5508L1.0144 13.7373C0.563364 12.9505 0.56349 11.9831 1.0144 11.1963L5.49292 3.38281C5.9482 2.58863 6.79428 2.09863 7.70972 2.09863H16.616ZM7.70972 3.90137C7.44051 3.90137 7.19129 4.04576 7.05737 4.2793L4.26929 9.14258C4.3923 9.08881 4.51833 9.03716 4.64819 8.99121C4.96674 8.87844 5.19134 8.6996 5.3103 8.49902C5.56627 8.06752 5.81416 7.69902 6.09546 7.36426C6.9338 6.36722 8.38235 6.40457 9.25659 7.19922C9.7355 7.63456 10.1119 8.10264 10.406 8.73047C10.5505 9.03882 10.743 9.2351 10.9402 9.3252C12.019 9.8182 12.8242 10.2838 13.7156 11.0508C13.9283 11.2338 14.2217 11.3252 14.5291 11.292C15.1533 11.2246 15.7062 11.2389 16.2703 11.3535L16.4001 11.3838C17.6314 11.7108 18.2044 12.9921 17.9294 14.1025L17.8601 14.3291C17.624 14.9788 17.329 15.5399 16.8718 16.1309C16.714 16.3347 16.6446 16.5462 16.6482 16.7285C16.6672 17.6809 16.6634 18.5889 16.4011 19.5127C16.2555 20.0256 16.034 20.5223 15.7214 21.0312H16.616C16.885 21.0311 17.1344 20.8877 17.2683 20.6543L21.7468 12.8398C21.8793 12.6086 21.8794 12.3242 21.7468 12.0928L17.2683 4.2793C17.1344 4.04571 16.8851 3.90147 16.616 3.90137H7.70972ZM8.0437 8.5332C7.83567 8.34411 7.5798 8.40177 7.47632 8.52441C7.27947 8.75867 7.08721 9.03776 6.86108 9.41895C6.4763 10.0677 5.86205 10.4747 5.24976 10.6914C4.25866 11.0421 3.50074 11.7588 2.66284 12.9873L7.05737 20.6543C7.19131 20.8877 7.44056 21.0312 7.70972 21.0312H13.4841C14.1722 20.2317 14.4999 19.6078 14.6667 19.0205C14.848 18.3821 14.8645 17.7172 14.8455 16.7646C14.8322 16.0982 15.0832 15.4948 15.4451 15.0273C15.7798 14.5947 15.9886 14.2005 16.1658 13.7129C16.216 13.5738 16.2021 13.4248 16.1443 13.3096C16.103 13.2277 16.0465 13.1729 15.9802 13.1426L15.9109 13.1201C15.5588 13.0486 15.1956 13.0329 14.7224 13.084C13.9479 13.1676 13.1517 12.9445 12.5398 12.418C11.812 11.7917 11.1641 11.4095 10.1912 10.9648C9.49981 10.649 9.04312 10.0714 8.77319 9.49512C8.59631 9.11753 8.37711 8.83626 8.0437 8.5332Z"
      fill="currentColor"
    />
  </svg>
);
