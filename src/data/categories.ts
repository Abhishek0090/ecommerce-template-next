import type { Category } from "./types";

/** Seed categories, copied into the data store on first run. Manage them at /admin/categories. */

export const categories: Category[] = [
  { id: "audio", name: "Audio", blurb: "Headphones and speakers", colors: ["#8b5cf6", "#ec4899"] },
  { id: "footwear", name: "Footwear", blurb: "Sneakers for every day", colors: ["#f97316", "#facc15"] },
  { id: "bags", name: "Bags", blurb: "Carry it in color", colors: ["#06b6d4", "#3b82f6"] },
  { id: "watches", name: "Watches", blurb: "Time, beautifully", colors: ["#10b981", "#84cc16"] },
  { id: "home", name: "Home", blurb: "Lamps, mugs and more", colors: ["#f43f5e", "#fb923c"] },
  { id: "beauty", name: "Beauty", blurb: "Skin care essentials", colors: ["#d946ef", "#6366f1"] },
];
