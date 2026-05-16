import type { Adb } from "@yume-chan/adb";

export const SHIZUKU_PACKAGE = "moe.shizuku.privileged.api";
export const SHIZUKU_ACTIVATE_COMMAND = "sh /sdcard/Android/data/moe.shizuku.privileged.api/start.sh";

export type ShizukuStatus = {
  installed: boolean;
  versionName?: string;
  versionCode?: string;
};

export async function shellText(adb: Adb, command: string | string[]) {
  return (await adb.subprocess.noneProtocol.spawnWaitText(command)).trim();
}

export async function getShizukuStatus(adb: Adb): Promise<ShizukuStatus> {
  const path = await shellText(adb, ["pm", "path", SHIZUKU_PACKAGE]).catch(() => "");
  if (!path.includes(SHIZUKU_PACKAGE)) return { installed: false };

  const dump = await shellText(adb, ["dumpsys", "package", SHIZUKU_PACKAGE]).catch(() => "");
  return {
    installed: true,
    versionName: dump.match(/versionName=([^\s]+)/)?.[1],
    versionCode: dump.match(/versionCode=(\d+)/)?.[1]
  };
}

export async function openShizuku(adb: Adb) {
  return shellText(adb, ["monkey", "-p", SHIZUKU_PACKAGE, "-c", "android.intent.category.LAUNCHER", "1"]);
}

export async function activateShizukuAdbMode(adb: Adb) {
  await openShizuku(adb).catch(() => "");
  return shellText(adb, SHIZUKU_ACTIVATE_COMMAND);
}
