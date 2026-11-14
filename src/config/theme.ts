import { siteConfig } from "./site";

/**
 * Color palettes. Each palette sets the brand colors; light/dark neutrals are in globals.css.
 * Add a palette here and it shows up in the theme switcher automatically.
 * Set `defaultPalette` to the one your store should load with.
 */
export type Palette = {
  id: string;
  name: string;
  /** Buttons, links, highlights. */
  primary: string;
  /** Text on top of `primary`. */
  primaryFg: string;
  /** Badges, sale tags, secondary highlights. */
  accent: string;
  accentFg: string;
  /** Hero and banner gradient. */
  gradient: [string, string, string];
};

export const palettes: Palette[] = [
  {
    id: "violet",
    name: "Violet Pop",
    primary: "#7c3aed",
    primaryFg: "#ffffff",
    accent: "#e11d48",
    accentFg: "#ffffff",
    gradient: ["#7c3aed", "#db2777", "#f97316"],
  },
  {
    id: "ocean",
    name: "Ocean",
    primary: "#0369a1",
    primaryFg: "#ffffff",
    accent: "#0f766e",
    accentFg: "#ffffff",
    gradient: ["#0ea5e9", "#6366f1", "#14b8a6"],
  },
  {
    id: "sunset",
    name: "Sunset",
    primary: "#c2410c",
    primaryFg: "#ffffff",
    accent: "#be123c",
    accentFg: "#ffffff",
    gradient: ["#f59e0b", "#ea580c", "#e11d48"],
  },
  {
    id: "forest",
    name: "Forest",
    primary: "#047857",
    primaryFg: "#ffffff",
    accent: "#a16207",
    accentFg: "#ffffff",
    gradient: ["#10b981", "#0d9488", "#65a30d"],
  },
  {
    id: "candy",
    name: "Candy",
    primary: "#be185d",
    primaryFg: "#ffffff",
    accent: "#7c3aed",
    accentFg: "#ffffff",
    gradient: ["#f472b6", "#a855f7", "#38bdf8"],
  },
  {
    id: "mono",
    name: "Midnight",
    primary: "#334155",
    primaryFg: "#ffffff",
    accent: "#eab308",
    accentFg: "#1e293b",
    gradient: ["#1e293b", "#475569", "#0f766e"],
  },
];

export const defaultPalette = "violet";

/** "system" follows the visitor's OS setting. */
export const defaultMode: "light" | "dark" | "system" = "system";

/** Corner radius used by cards and buttons. Try "0.25rem" for sharp or "1.5rem" for soft. */
export const radius = "1rem";

export const STORAGE_KEYS = {
  palette: "store.palette",
  mode: "store.mode",
  cart: "store.cart",
  wishlist: "store.wishlist",
  lastOrder: "store.lastOrder",
  /** Holds the text of the announcement the visitor closed; a new text shows again. */
  announcement: "store.announcementClosed",
} as const;

/** CSS for every palette, injected once in the root layout. */
export function paletteCss(): string {
  return `:root{--radius:${radius};}\n` + palettes
    .map(
      (p) =>
        `[data-palette="${p.id}"]{--primary:${p.primary};--primary-fg:${p.primaryFg};--accent:${p.accent};--accent-fg:${p.accentFg};--grad-1:${p.gradient[0]};--grad-2:${p.gradient[1]};--grad-3:${p.gradient[2]};}`,
    )
    .join("\n");
}

/**
 * Runs before first paint so the saved palette and mode apply without a flash.
 * Kept as a string because it is inlined into <head>.
 */
export function themeBootScript(): string {
  const ids = JSON.stringify(palettes.map((p) => p.id));
  return `(function(){try{var d=document.documentElement;var p=localStorage.getItem("${STORAGE_KEYS.palette}");if(${ids}.indexOf(p)<0)p="${defaultPalette}";d.dataset.palette=p;var m=localStorage.getItem("${STORAGE_KEYS.mode}")||"${defaultMode}";var dark=m==="dark"||(m==="system"&&matchMedia("(prefers-color-scheme: dark)").matches);d.classList.toggle("dark",dark);d.dataset.mode=m;if(localStorage.getItem("${STORAGE_KEYS.announcement}")===${JSON.stringify(
    siteConfig.announcement,
  )})d.dataset.announcementClosed="";}catch(e){}})();`;
}
