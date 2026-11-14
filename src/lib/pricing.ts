import { siteConfig } from "@/config/site";
import type { CartLine, Product, ShippingMethod, Totals } from "@/data/types";

export type { ShippingMethod, Totals };

const formatter = new Intl.NumberFormat(siteConfig.currency.locale, {
  style: "currency",
  currency: siteConfig.currency.code,
});

export const formatPrice = (amount: number) => formatter.format(amount);

export type ResolvedLine = CartLine & { product: Product; lineTotal: number };

/** Joins cart lines with current product data. Lines for deleted or hidden products are dropped. */
export function resolveLines(lines: CartLine[], products: Product[]): ResolvedLine[] {
  return lines.flatMap((line) => {
    const product = products.find((p) => p.id === line.productId);
    return product ? [{ ...line, product, lineTotal: product.price * line.qty }] : [];
  });
}

export function findCoupon(code: string | undefined) {
  if (!code) return undefined;
  const c = siteConfig.coupons[code.trim().toUpperCase()];
  return c ? { code: code.trim().toUpperCase(), ...c } : undefined;
}

const round = (n: number) => Math.round(n * 100) / 100;

/** Used by the cart for display and by the server when it creates the order. */
export function computeTotals(lines: CartLine[], products: Product[], coupon?: string, method: ShippingMethod = "standard"): Totals {
  const resolved = resolveLines(lines, products);
  const subtotal = round(resolved.reduce((s, l) => s + l.lineTotal, 0));
  const items = resolved.reduce((s, l) => s + l.qty, 0);
  const pct = findCoupon(coupon)?.percent ?? 0;
  const discount = round((subtotal * pct) / 100);
  const afterDiscount = subtotal - discount;
  const free = afterDiscount >= siteConfig.freeShippingThreshold;
  const shipping = items === 0 ? 0 : method === "express" ? siteConfig.expressShippingRate : free ? 0 : siteConfig.shippingFlatRate;
  const tax = round(afterDiscount * siteConfig.taxRate);
  return {
    items,
    subtotal,
    discount,
    shipping,
    tax,
    total: round(afterDiscount + shipping + tax),
    freeShippingRemaining: Math.max(0, round(siteConfig.freeShippingThreshold - afterDiscount)),
  };
}
