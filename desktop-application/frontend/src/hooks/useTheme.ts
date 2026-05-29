import { useCallback, useEffect, useState } from "react";

import type { Theme } from "@/types/Settings";

const STORAGE_KEY = "sheetmind-theme";

function resolveTheme(preference: Theme): "dark" | "light" {
  if (preference === "system") {
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  }
  return preference;
}

function applyTheme(resolved: "dark" | "light") {
  const html = document.documentElement;
  html.classList.remove("dark", "light");
  html.classList.add(resolved);
}

(function initTheme() {
  const stored = (localStorage.getItem(STORAGE_KEY) as Theme) ?? "dark";
  applyTheme(resolveTheme(stored));
})();

export function useTheme() {
  const [theme, setThemeState] = useState<Theme>(
    () => (localStorage.getItem(STORAGE_KEY) as Theme) ?? "dark"
  );

  useEffect(() => {
    if (theme !== "system") return;

    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = () => applyTheme(resolveTheme("system"));
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, [theme]);

  const setTheme = useCallback((next: Theme) => {
    localStorage.setItem(STORAGE_KEY, next);
    setThemeState(next);
    applyTheme(resolveTheme(next));
  }, []);

  const resolvedTheme = resolveTheme(theme);

  return { theme, setTheme, resolvedTheme };
}
