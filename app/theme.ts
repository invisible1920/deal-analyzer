"use client";

import { useEffect, useState } from "react";

export function useSystemTheme() {
  const getTheme = () =>
    window.matchMedia &&
    window.matchMedia("(prefers-color-scheme: dark)").matches
      ? "dark"
      : "light";

  const [theme, setTheme] = useState<"light" | "dark">("light");

  useEffect(() => {
    setTheme(getTheme());

    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const listener = () => setTheme(getTheme());

    media.addEventListener("change", listener);
    return () => media.removeEventListener("change", listener);
  }, []);

  return theme;
}
