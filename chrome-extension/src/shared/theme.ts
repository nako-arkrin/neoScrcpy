import { ThemeMode, getState } from "./storage";

export function resolveTheme(mode: ThemeMode, prefersDark: boolean) {
  if (mode === "deepBlue") return "deepBlue";
  if (mode === "pink") return "pink";
  if (mode === "dark") return "dark";
  if (mode === "light") return "light";
  return prefersDark ? "dark" : "light";
}

export async function applyInitialTheme() {
  const { themeMode } = await getState();
  const mql = window.matchMedia("(prefers-color-scheme: dark)");
  const apply = () => {
    const theme = resolveTheme(themeMode, mql.matches);
    document.documentElement.dataset.theme = theme;
  };
  apply();
}
