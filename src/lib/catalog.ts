/**
 * Pure catalog helpers. They take the product list as input, so the same code runs on the
 * server (pages read products from src/server/repo.ts) and in the browser (cart, wishlist).
 */
import type { Product, Review } from "@/data/types";

export type SortKey = "featured" | "newest" | "price-asc" | "price-desc" | "rating";

export const SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: "featured", label: "Featured" },
  { value: "newest", label: "Newest" },
  { value: "price-asc", label: "Price: low to high" },
  { value: "price-desc", label: "Price: high to low" },
  { value: "rating", label: "Top rated" },
];

export type ProductQuery = {
  q?: string;
  category?: string;
  sale?: boolean;
  inStock?: boolean;
  min?: number;
  max?: number;
  sort?: SortKey;
};

export const isOnSale = (p: Product) => !!p.compareAt && p.compareAt > p.price;
export const discountPercent = (p: Product) => (isOnSale(p) ? Math.round((1 - p.price / p.compareAt!) * 100) : 0);

export const findById = (products: Product[], id: string) => products.find((p) => p.id === id);

export const featured = (products: Product[], limit = 8) => products.filter((p) => p.featured).slice(0, limit);

export const onSale = (products: Product[], limit = 4) => products.filter(isOnSale).slice(0, limit);

export function related(products: Product[], product: Product, limit = 4): Product[] {
  const same = products.filter((p) => p.category === product.category && p.id !== product.id);
  const others = products.filter((p) => p.category !== product.category && p.featured);
  return [...same, ...others].slice(0, limit);
}

export function queryProducts(products: Product[], query: ProductQuery): Product[] {
  const q = query.q?.trim().toLowerCase();
  const list = products.filter((p) => {
    if (query.category && p.category !== query.category) return false;
    if (query.sale && !isOnSale(p)) return false;
    if (query.inStock && p.stock <= 0) return false;
    if (query.min != null && p.price < query.min) return false;
    if (query.max != null && p.price > query.max) return false;
    if (q && !`${p.name} ${p.short} ${p.category}`.toLowerCase().includes(q)) return false;
    return true;
  });
  const by: Record<SortKey, (a: Product, b: Product) => number> = {
    featured: (a, b) => Number(!!b.featured) - Number(!!a.featured) || b.reviewCount - a.reviewCount,
    newest: (a, b) => b.addedAt.localeCompare(a.addedAt),
    "price-asc": (a, b) => a.price - b.price,
    "price-desc": (a, b) => b.price - a.price,
    rating: (a, b) => b.rating - a.rating,
  };
  return [...list].sort(by[query.sort ?? "featured"]);
}

export function priceBounds(products: Product[]) {
  if (!products.length) return { min: 0, max: 0 };
  return {
    min: Math.floor(Math.min(...products.map((p) => p.price))),
    max: Math.ceil(Math.max(...products.map((p) => p.price))),
  };
}

/** Count of written reviews per star value, 5 down to 1. */
export function ratingBreakdown(reviews: Review[]) {
  return [5, 4, 3, 2, 1].map((stars) => ({ stars, count: reviews.filter((r) => Math.round(r.rating) === stars).length }));
}

export const slugify = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
