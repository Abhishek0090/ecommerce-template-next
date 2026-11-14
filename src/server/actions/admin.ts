"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { adminConfig } from "@/config/admin";
import { slugify } from "@/lib/catalog";
import { BADGES, ORDER_STATUSES, type Category, type ColorOption, type OrderStatus, type Product, type ReviewStatus } from "@/data/types";
import { checkPassword, endSession, requireAdmin, startSession } from "@/server/auth";
import { resetDb } from "@/server/db";
import * as repo from "@/server/repo";
import { deleteUploads, saveImages, UploadError } from "@/server/uploads";

/**
 * Admin server actions. Server actions are public HTTP endpoints, so every one
 * checks the session first with requireAdmin().
 */

export type FormState = { status: "idle" | "success" | "error"; message?: string; fieldErrors?: Record<string, string> };

/** Store and admin pages both read the data store, so refresh everything after a change. */
const refreshAll = () => revalidatePath("/", "layout");

const text = (form: FormData, key: string, max = 200) => String(form.get(key) ?? "").trim().slice(0, max);

// ---------- Auth ----------

export async function loginAction(_prev: FormState, form: FormData): Promise<FormState> {
  // Small fixed delay slows down password guessing.
  await new Promise((r) => setTimeout(r, 400));
  if (!checkPassword(String(form.get("password") ?? ""))) return { status: "error", message: "Wrong password." };
  await startSession();
  const next = text(form, "next");
  redirect(next.startsWith("/admin") && !next.startsWith("//") ? next : "/admin");
}

export async function logoutAction() {
  await endSession();
  redirect("/admin/login");
}

// ---------- Products ----------

function parseProduct(form: FormData): { data?: Omit<Product, "id" | "rating" | "reviewCount" | "addedAt">; errors: Record<string, string> } {
  const errors: Record<string, string> = {};
  const name = text(form, "name", 120);
  const slug = slugify(text(form, "slug", 80) || name);
  const price = Number(form.get("price"));
  const compareRaw = text(form, "compareAt");
  const compareAt = compareRaw ? Number(compareRaw) : undefined;
  const stock = Number(form.get("stock"));
  const badge = text(form, "badge");

  if (!name) errors.name = "Name is required.";
  if (!slug) errors.slug = "URL slug is required.";
  if (!(price >= 0) || !Number.isFinite(price)) errors.price = "Enter a price of 0 or more.";
  if (compareAt !== undefined && (!Number.isFinite(compareAt) || compareAt < 0)) errors.compareAt = "Enter a valid price or leave empty.";
  if (!Number.isInteger(stock) || stock < 0) errors.stock = "Stock must be a whole number, 0 or more.";
  if (badge && !BADGES.includes(badge as (typeof BADGES)[number])) errors.badge = "Unknown badge.";

  let colors: ColorOption[] = [];
  try {
    colors = (JSON.parse(String(form.get("colors") || "[]")) as ColorOption[])
      .map((c) => ({ name: String(c.name).trim().slice(0, 30), hex: String(c.hex) }))
      .filter((c) => c.name && /^#[0-9a-f]{6}$/i.test(c.hex))
      .slice(0, 12);
  } catch {
    errors.colors = "Invalid colors.";
  }
  if (!colors.length) errors.colors = "Add at least one color option.";

  const list = (key: string, max: number, len: number) =>
    String(form.get(key) ?? "")
      .split("\n")
      .map((s) => s.trim().slice(0, len))
      .filter(Boolean)
      .slice(0, max);

  if (Object.keys(errors).length) return { errors };
  return {
    errors,
    data: {
      name,
      slug,
      category: text(form, "category", 40),
      status: form.get("status") === "draft" ? "draft" : "active",
      price: Math.round(price * 100) / 100,
      compareAt: compareAt ? Math.round(compareAt * 100) / 100 : undefined,
      stock,
      badge: (badge || undefined) as Product["badge"],
      featured: form.get("featured") === "on",
      short: text(form, "short", 200),
      description: text(form, "description", 4000),
      features: list("features", 12, 120),
      sizes: list("sizes", 20, 20),
      colors,
      images: [],
    },
  };
}

export async function saveProductAction(_prev: FormState, form: FormData): Promise<FormState> {
  await requireAdmin();
  const id = text(form, "id") || undefined;
  const { data, errors } = parseProduct(form);
  if (!data) return { status: "error", message: "Please fix the highlighted fields.", fieldErrors: errors };

  // Images: the form sends the URLs to keep (in display order) plus new files.
  const keep = form.getAll("keepImages").map(String);
  const existing = id ? await repo.getProductById(id) : undefined;
  const allowedKeep = keep.filter((u) => existing?.images?.includes(u));
  let uploaded: string[] = [];
  try {
    uploaded = await saveImages(form, "newImages", adminConfig.maxProductImages - allowedKeep.length);
  } catch (e) {
    if (e instanceof UploadError) return { status: "error", message: e.message };
    throw e;
  }

  let saved: Product;
  try {
    saved = await repo.saveProduct({ ...data, id, images: [...allowedKeep, ...uploaded] });
  } catch (e) {
    await deleteUploads(uploaded);
    if (e instanceof repo.RepoError) return { status: "error", message: e.message };
    throw e;
  }
  await deleteUploads((existing?.images ?? []).filter((u) => !allowedKeep.includes(u)));
  refreshAll();
  if (!id) redirect(`/admin/products/${saved.id}?created=1`);
  return { status: "success", message: "Product saved." };
}

export async function deleteProductAction(id: string) {
  await requireAdmin();
  const product = await repo.getProductById(id);
  if (!product) return;
  const reviews = await repo.listReviews({ productId: id });
  await repo.deleteProduct(id);
  await deleteUploads([...(product.images ?? []), ...reviews.flatMap((r) => r.images)]);
  refreshAll();
  redirect("/admin/products");
}

export async function setProductStatusAction(id: string, status: Product["status"]) {
  await requireAdmin();
  const p = await repo.getProductById(id);
  if (!p) return;
  await repo.saveProduct({ ...p, status });
  refreshAll();
}

// ---------- Categories ----------

export async function saveCategoryAction(_prev: FormState, form: FormData): Promise<FormState> {
  await requireAdmin();
  const originalId = text(form, "originalId") || undefined;
  const name = text(form, "name", 40);
  const category: Category = {
    id: slugify(text(form, "id", 40) || name),
    name,
    blurb: text(form, "blurb", 100),
    colors: [text(form, "color1", 7), text(form, "color2", 7)] as [string, string],
  };
  if (!name || !category.id) return { status: "error", message: "Name is required." };
  if (!category.colors.every((c) => /^#[0-9a-f]{6}$/i.test(c))) return { status: "error", message: "Pick two colors." };
  try {
    await repo.saveCategory(category, originalId);
  } catch (e) {
    if (e instanceof repo.RepoError) return { status: "error", message: e.message };
    throw e;
  }
  refreshAll();
  return { status: "success", message: originalId ? "Category updated." : "Category added." };
}

export async function deleteCategoryAction(_prev: FormState, form: FormData): Promise<FormState> {
  await requireAdmin();
  try {
    await repo.deleteCategory(text(form, "id"));
  } catch (e) {
    if (e instanceof repo.RepoError) return { status: "error", message: e.message };
    throw e;
  }
  refreshAll();
  return { status: "success", message: "Category deleted." };
}

// ---------- Reviews ----------

export async function setReviewStatusAction(id: string, status: ReviewStatus) {
  await requireAdmin();
  await repo.setReviewStatus(id, status);
  refreshAll();
}

export async function deleteReviewAction(id: string) {
  await requireAdmin();
  const removed = await repo.deleteReview(id);
  if (removed) await deleteUploads(removed.images);
  refreshAll();
}

// ---------- Orders ----------

export async function setOrderStatusAction(id: string, status: OrderStatus) {
  await requireAdmin();
  if (!ORDER_STATUSES.includes(status)) return;
  await repo.setOrderStatus(id, status);
  refreshAll();
}

// ---------- Settings ----------

export async function resetDemoDataAction() {
  await requireAdmin();
  await resetDb();
  refreshAll();
  redirect("/admin?reset=1");
}
