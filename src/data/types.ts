/** Category ids are free-form slugs, so new categories can be added from the admin portal. */
export type CategoryId = string;

export type Category = {
  id: CategoryId;
  name: string;
  blurb: string;
  /** Two colors for the category tile gradient. */
  colors: [string, string];
};

export type ColorOption = { name: string; hex: string };

export type ReviewStatus = "pending" | "approved" | "rejected";

export type Review = {
  id: string;
  productId: string;
  author: string;
  rating: number;
  title: string;
  body: string;
  /** ISO date. */
  date: string;
  /**
   * Photo URLs. Uploaded photos are served from /api/uploads/...
   * Demo seed photos use "art:<category>:<hex>" and are drawn as illustrations.
   */
  images: string[];
  status: ReviewStatus;
  verified?: boolean;
};

export type ProductStatus = "active" | "draft";

export type Product = {
  id: string;
  slug: string;
  name: string;
  category: CategoryId;
  status: ProductStatus;
  price: number;
  /** Original price; when higher than `price` the product shows as on sale. */
  compareAt?: number;
  /** Aggregate rating, updated when reviews are approved or removed. */
  rating: number;
  reviewCount: number;
  colors: ColorOption[];
  sizes?: string[];
  stock: number;
  badge?: "New" | "Bestseller" | "Limited" | "Eco";
  featured?: boolean;
  /** ISO date, used for "newest" sorting. */
  addedAt: string;
  short: string;
  description: string;
  features: string[];
  /** Image URLs. When empty, the store draws a colored illustration instead. */
  images?: string[];
};

export const BADGES = ["New", "Bestseller", "Limited", "Eco"] as const;

export type CartLine = {
  /** productId + chosen options, so the same product in two colors is two lines. */
  key: string;
  productId: string;
  color?: string;
  size?: string;
  qty: number;
};

export type OrderStatus = "paid" | "processing" | "shipped" | "delivered" | "cancelled";
export const ORDER_STATUSES: OrderStatus[] = ["paid", "processing", "shipped", "delivered", "cancelled"];

export type Address = {
  email: string;
  firstName: string;
  lastName: string;
  address: string;
  city: string;
  postcode: string;
  country: string;
  phone?: string;
};

export type ShippingMethod = "standard" | "express";

export type Totals = {
  items: number;
  subtotal: number;
  discount: number;
  shipping: number;
  tax: number;
  total: number;
  freeShippingRemaining: number;
};

export type OrderLine = CartLine & { name: string; price: number };

export type Order = {
  id: string;
  createdAt: string;
  status: OrderStatus;
  lines: OrderLine[];
  totals: Totals;
  coupon?: string;
  shippingMethod: ShippingMethod;
  address: Address;
  paymentLast4: string;
};
