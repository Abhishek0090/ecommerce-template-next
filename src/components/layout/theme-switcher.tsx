"use client";

import { useEffect, useRef, useState } from "react";
import { palettes } from "@/config/theme";
import { useTheme, type Mode } from "@/components/providers/theme-provider";
import { CheckIcon, MonitorIcon, MoonIcon, PaletteIcon, SunIcon } from "@/components/icons";

const modes: { id: Mode; label: string; Icon: typeof SunIcon }[] = [
  { id: "light", label: "Light", Icon: SunIcon },
  { id: "dark", label: "Dark", Icon: MoonIcon },
  { id: "system", label: "Auto", Icon: MonitorIcon },
];

/** Live palette and light/dark picker. Remove it from the header to lock the store to one look. */
export function ThemeSwitcher() {
  const { palette, mode, setPalette, setMode } = useTheme();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-label="Change theme"
        className="btn-ghost h-10 w-10 rounded-full p-0"
      >
        <PaletteIcon />
      </button>
      {open && (
        <div className="card animate-pop absolute right-0 top-12 z-50 w-80 max-w-[calc(100vw-2rem)] p-4 shadow-2xl shadow-black/20">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-fg-muted">Color theme</p>
          <div className="grid grid-cols-2 gap-2">
            {palettes.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => setPalette(p.id)}
                className={`flex items-center gap-2 rounded-xl border p-2 text-left text-sm transition hover:border-primary ${
                  palette === p.id ? "border-primary bg-primary/10" : "border-border"
                }`}
              >
                <span
                  className="h-6 w-6 shrink-0 rounded-full"
                  style={{ background: `linear-gradient(135deg, ${p.gradient[0]}, ${p.gradient[1]}, ${p.gradient[2]})` }}
                />
                <span className="flex-1 truncate">{p.name}</span>
                {palette === p.id && <CheckIcon size={14} className="text-primary-ink" />}
              </button>
            ))}
          </div>
          <p className="mb-2 mt-4 text-xs font-semibold uppercase tracking-wider text-fg-muted">Mode</p>
          <div className="grid grid-cols-3 gap-1 rounded-xl bg-surface-2 p-1">
            {modes.map(({ id, label, Icon }) => (
              <button
                key={id}
                type="button"
                onClick={() => setMode(id)}
                aria-pressed={mode === id}
                className={`flex items-center justify-center gap-1.5 rounded-lg py-1.5 text-xs font-medium transition ${
                  mode === id ? "bg-surface text-primary-ink shadow" : "text-fg-muted hover:text-fg"
                }`}
              >
                <Icon size={14} /> {label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
