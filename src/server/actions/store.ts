"use server";

import { revalidatePath } from "next/cache";
import { siteConfig } from "@/config/site";
import { computeTotals, findCoupon } from "@/lib/pricing";
import type { Address, CartLine, Order, ShippingMethod } from "@/data/types";
import { addReview, createOrder, getProductById, RepoError } from "@/server/repo";
import { saveImages, UploadError } from "@/server/uploads";

/**
 * Public server actions used by the storefront. Everything from the browser is
 * re-validated here; prices and totals are recomputed from the stored products.
 */

export type ActionResult<T = undefined> = { ok: true; data: T } | { ok: false; error: string };

const str = (v: unknown, max = 200) => (typeof v === "string" ? v.trim().slice(0, max) : "");

export async function placeOrderAction(input: {
  lines: CartLine[];
  coupon?: string;
  method: ShippingMethod;
  address: Address;
  paymentLast4: string;
}): Promise<ActionResult<Order>> {
  const a = input.address ?? ({} as Address);
  const address: Address = {
    email: str(a.email, 120),
    firstName: str(a.firstName, 60),
    lastName: str(a.lastName, 60),
    address: str(a.address, 160),
    city: str(a.city, 80),
    postcode: str(a.postcode, 20),
    country: str(a.country, 60),
    phone: str(a.phone, 30),
  };
  if (!/^\S+@\S+\.\S+$/.test(address.email) || !address.firstName || !address.lastName || !address.address || !address.city || !address.postcode) {
    return { ok: false, error: "Please complete your shipping details." };
  }
  if (!Array.isArray(input.lines) || input.lines.length === 0 || input.lines.length > 50) return { ok: false, error: "Your cart is empty." };
  const lines: CartLine[] = input.lines.map((l) => ({
    key: str(l.key, 200),
    productId: str(l.productId, 40),
    color: str(l.color, 40) || undefined,
    size: str(l.size, 20) || undefined,
    qty: Math.max(1, Math.min(10, Math.floor(Number(l.qty)) || 1)),
  }));
  const method: ShippingMethod = input.method === "express" ? "express" : "standard";
  const coupon = findCoupon(input.coupon)?.code;
  const last4 = /^\d{4}$/.test(input.paymentLast4) ? input.paymentLast4 : "0000";

  // Demo payment. Real stores: create a payment with Stripe / Razorpay / PayPal here and
  // only save the order after the provider confirms it. Never send card numbers to your server.
  try {
    const order = await createOrder((products) => ({
      lines: lines.map((l) => {
        const p = products.find((x) => x.id === l.productId);
        if (!p) throw new RepoError("An item in your cart is no longer available.");
        return { ...l, name: p.name, price: p.price };
      }),
      totals: computeTotals(lines, products, coupon, method),
      coupon,
      shippingMethod: method,
      address,
      paymentLast4: last4,
    }));
    revalidatePath("/", "layout"); // stock changed
    return { ok: true, data: order };
  } catch (e) {
    if (e instanceof RepoError) return { ok: false, error: e.message };
    throw e;
  }
}

export type ReviewFormState = { status: "idle" | "success" | "error"; message?: string };

const MAX_PHOTOS = 4;

export async function submitReviewAction(_prev: ReviewFormState, form: FormData): Promise<ReviewFormState> {
  // Honeypot: bots fill every field, people never see this one.
  if (str(form.get("website"))) return { status: "success", message: "Thanks!" };

  const productId = str(form.get("productId"), 40);
  const author = str(form.get("author"), 60);
  const title = str(form.get("title"), 100);
  const body = str(form.get("body"), 2000);
  const rating = Math.round(Number(form.get("rating")));
  if (!author || !title || body.length < 10) return { status: "error", message: "Add your name, a title and at least 10 characters." };
  if (!(rating >= 1 && rating <= 5)) return { status: "error", message: "Choose a star rating." };
  const product = await getProductById(productId);
  if (!product || product.status !== "active") return { status: "error", message: "This product is not available." };

  try {
    const images = await saveImages(form, "photos", MAX_PHOTOS);
    await addReview({ productId, author, rating, title, body, images, verified: false });
  } catch (e) {
    if (e instanceof UploadError || e instanceof RepoError) return { status: "error", message: e.message };
    throw e;
  }
  revalidatePath("/admin", "layout");
  return {
    status: "success",
    message: `Thanks, ${author}! Your review will appear on ${siteConfig.name} once it's approved.`,
  };
}
