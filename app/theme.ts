"use client";

import { useEffect, useState } from "react";

export type ThemeName = "light" | "dark";

export const themeColors = {
  light: {
    bg: "#f8fafc",
    panel: "#ffffff",
    border: "#e2e8f0",
    text: "#0f172a",
    textSecondary: "#475569",
    inputBg: "#ffffff",
    inputBorder: "#cbd5e1"
  },
  dark: {
    bg: "#0b1120",
    panel: "#111827",
    border: "#334155",
    text: "#e2e8f0",
    textSecondary: "#94a3b8",
    inputBg: "#1e293b",
    inputBorder: "#475569"
  }
};

export function useSystemTheme(): ThemeName {
  const getTheme = () =>
    window.matchMedia &&
    window.matchMedia("(prefers-color-scheme: dark)").matches
      ? "dark"
      : "light";

  const [theme, setTheme] = useState<ThemeName>("light");

  useEffect(() => {
    setTheme(getTheme());

    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const listener = () => setTheme(getTheme());

    media.addEventListener("change", listener);
    return () => media.removeEventListener("change", listener);
  }, []);

  return theme;
}

export function useThemeColors() {
  const mode = useSystemTheme();
  return themeColors[mode];
}
