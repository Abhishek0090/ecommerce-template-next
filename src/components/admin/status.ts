import type { OrderStatus, ProductStatus, ReviewStatus } from "@/data/types";
import type { BadgeTone } from "./ui";

/** Badge colors for each status, shared by every admin page. */
export const orderTone: Record<OrderStatus, BadgeTone> = {
  paid: "primary",
  processing: "warning",
  shipped: "primary",
  delivered: "success",
  cancelled: "danger",
};

export const reviewTone: Record<ReviewStatus, BadgeTone> = {
  pending: "warning",
  approved: "success",
  rejected: "danger",
};

export const productTone: Record<ProductStatus, BadgeTone> = {
  active: "success",
  draft: "neutral",
};
