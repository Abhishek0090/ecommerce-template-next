"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { defaultMode, defaultPalette, STORAGE_KEYS } from "@/config/theme";

export type Mode = "light" | "dark" | "system";

type ThemeApi = {
  palette: string;
  mode: Mode;
  setPalette: (id: string) => void;
  setMode: (mode: Mode) => void;
};

const ThemeContext = createContext<ThemeApi | null>(null);

function applyMode(mode: Mode) {
  const dark = mode === "dark" || (mode === "system" && matchMedia("(prefers-color-scheme: dark)").matches);
  document.documentElement.classList.toggle("dark", dark);
  document.documentElement.dataset.mode = mode;
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  // The boot script in <head> already applied the saved values; read them back from <html>.
  const [palette, setPaletteState] = useState(defaultPalette);
  const [mode, setModeState] = useState<Mode>(defaultMode);

  useEffect(() => {
    const d = document.documentElement.dataset;
    /* eslint-disable react-hooks/set-state-in-effect -- one-time sync with values set before hydration */
    if (d.palette) setPaletteState(d.palette);
    if (d.mode) setModeState(d.mode as Mode);
    /* eslint-enable react-hooks/set-state-in-effect */
  }, []);

  useEffect(() => {
    if (mode !== "system") return;
    const mq = matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => applyMode("system");
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, [mode]);

  const setPalette = useCallback((id: string) => {
    document.documentElement.dataset.palette = id;
    try {
      localStorage.setItem(STORAGE_KEYS.palette, id);
    } catch {}
    setPaletteState(id);
  }, []);

  const setMode = useCallback((m: Mode) => {
    applyMode(m);
    try {
      localStorage.setItem(STORAGE_KEYS.mode, m);
    } catch {}
    setModeState(m);
  }, []);

  return <ThemeContext.Provider value={{ palette, mode, setPalette, setMode }}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used inside <ThemeProvider>");
  return ctx;
}
