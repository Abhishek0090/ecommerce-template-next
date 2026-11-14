import "server-only";
import { randomUUID } from "node:crypto";
import { readDb, updateDb } from "./db";
import type { Category, Order, OrderStatus, Product, Review, ReviewStatus } from "@/data/types";

/**
 * Repository: the only module that knows how data is stored.
 * Replace the bodies with database or headless-commerce calls to change the backend.
 */

export class RepoError extends Error {}

export const newId = (prefix: string) => `${prefix}_${randomUUID().replace(/-/g, "").slice(0, 10)}`;

const round1 = (n: number) => Math.round(n * 10) / 10;

// ---------- Products ----------

export async function listProducts(opts: { includeDrafts?: boolean } = {}): Promise<Product[]> {
  const { products } = await readDb();
  return opts.includeDrafts ? products : products.filter((p) => p.status === "active");
}

export async function getProductBySlug(slug: string, opts: { includeDrafts?: boolean } = {}) {
  const p = (await readDb()).products.find((x) => x.slug === slug);
  return p && (opts.includeDrafts || p.status === "active") ? p : undefined;
}

export async function getProductById(id: string) {
  return (await readDb()).products.find((x) => x.id === id);
}

export async function saveProduct(input: Omit<Product, "id" | "rating" | "reviewCount" | "addedAt"> & { id?: string }) {
  return updateDb((db) => {
    if (db.products.some((p) => p.slug === input.slug && p.id !== input.id)) {
      throw new RepoError(`Another product already uses the URL "${input.slug}".`);
    }
    if (!db.categories.some((c) => c.id === input.category)) throw new RepoError("Choose a valid category.");
    const existing = input.id ? db.products.find((p) => p.id === input.id) : undefined;
    if (input.id && !existing) throw new RepoError("That product no longer exists.");
    const product: Product = existing
      ? { ...existing, ...input, id: existing.id }
      : { ...input, id: newId("p"), rating: 0, reviewCount: 0, addedAt: new Date().toISOString().slice(0, 10) };
    if (existing) db.products[db.products.indexOf(existing)] = product;
    else db.products.unshift(product);
    return product;
  });
}

export async function deleteProduct(id: string) {
  return updateDb((db) => {
    db.products = db.products.filter((p) => p.id !== id);
    db.reviews = db.reviews.filter((r) => r.productId !== id);
  });
}

// ---------- Categories ----------

export async function listCategories(): Promise<Category[]> {
  return (await readDb()).categories;
}

export async function saveCategory(input: Category, originalId?: string) {
  return updateDb((db) => {
    const current = originalId ? db.categories.find((c) => c.id === originalId) : undefined;
    if (db.categories.some((c) => c.id === input.id && c !== current)) throw new RepoError(`Category id "${input.id}" is taken.`);
    if (current) {
      // Renaming the id moves its products along with it.
      if (current.id !== input.id) db.products.forEach((p) => p.category === current.id && (p.category = input.id));
      Object.assign(current, input);
    } else db.categories.push(input);
    return input;
  });
}

export async function deleteCategory(id: string) {
  return updateDb((db) => {
    const used = db.products.filter((p) => p.category === id).length;
    if (used) throw new RepoError(`Move or delete the ${used} product(s) in this category first.`);
    db.categories = db.categories.filter((c) => c.id !== id);
  });
}

// ---------- Reviews ----------

export async function listReviews(filter: { productId?: string; status?: ReviewStatus } = {}): Promise<Review[]> {
  return (await readDb()).reviews
    .filter((r) => (!filter.productId || r.productId === filter.productId) && (!filter.status || r.status === filter.status))
    .sort((a, b) => b.date.localeCompare(a.date));
}

/** Keeps product.rating / reviewCount in step when a review enters or leaves "approved". */
function applyToAggregate(product: Product | undefined, rating: number, delta: 1 | -1) {
  if (!product) return;
  const count = product.reviewCount + delta;
  product.rating = count > 0 ? round1((product.rating * product.reviewCount + delta * rating) / count) : 0;
  product.reviewCount = Math.max(0, count);
}

export async function addReview(input: Omit<Review, "id" | "date" | "status">) {
  return updateDb((db) => {
    if (!db.products.some((p) => p.id === input.productId)) throw new RepoError("Product not found.");
    const review: Review = { ...input, id: newId("r"), date: new Date().toISOString().slice(0, 10), status: "pending" };
    db.reviews.unshift(review);
    return review;
  });
}

export async function setReviewStatus(id: string, status: ReviewStatus) {
  return updateDb((db) => {
    const r = db.reviews.find((x) => x.id === id);
    if (!r) throw new RepoError("Review not found.");
    const product = db.products.find((p) => p.id === r.productId);
    if (r.status !== "approved" && status === "approved") applyToAggregate(product, r.rating, 1);
    if (r.status === "approved" && status !== "approved") applyToAggregate(product, r.rating, -1);
    r.status = status;
    return r;
  });
}

export async function deleteReview(id: string) {
  return updateDb((db) => {
    const r = db.reviews.find((x) => x.id === id);
    if (!r) return undefined;
    if (r.status === "approved") applyToAggregate(db.products.find((p) => p.id === r.productId), r.rating, -1);
    db.reviews = db.reviews.filter((x) => x.id !== id);
    return r;
  });
}

// ---------- Orders ----------

export async function listOrders(): Promise<Order[]> {
  return [...(await readDb()).orders].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function getOrder(id: string) {
  return (await readDb()).orders.find((o) => o.id === id);
}

/**
 * Saves an order and takes the items out of stock in the same write,
 * so two buyers can't both get the last unit.
 */
export async function createOrder(build: (products: Product[]) => Omit<Order, "id" | "createdAt" | "status">) {
  return updateDb((db) => {
    const draft = build(db.products);
    for (const line of draft.lines) {
      const p = db.products.find((x) => x.id === line.productId);
      if (!p || p.status !== "active") throw new RepoError(`${line.name} is no longer available.`);
      if (p.stock < line.qty) throw new RepoError(`Only ${p.stock} of ${p.name} left in stock.`);
    }
    for (const line of draft.lines) db.products.find((x) => x.id === line.productId)!.stock -= line.qty;
    const order: Order = {
      ...draft,
      id: `DS-${Date.now().toString(36).toUpperCase().slice(-6)}`,
      createdAt: new Date().toISOString(),
      status: "paid",
    };
    db.orders.push(order);
    return order;
  });
}

export async function setOrderStatus(id: string, status: OrderStatus) {
  return updateDb((db) => {
    const o = db.orders.find((x) => x.id === id);
    if (!o) throw new RepoError("Order not found.");
    // Cancelling puts the items back in stock; un-cancelling takes them out again.
    if (o.status !== "cancelled" && status === "cancelled") {
      o.lines.forEach((l) => {
        const p = db.products.find((x) => x.id === l.productId);
        if (p) p.stock += l.qty;
      });
    } else if (o.status === "cancelled" && status !== "cancelled") {
      o.lines.forEach((l) => {
        const p = db.products.find((x) => x.id === l.productId);
        if (p) p.stock = Math.max(0, p.stock - l.qty);
      });
    }
    o.status = status;
    return o;
  });
}
