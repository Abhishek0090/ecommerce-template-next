import type { Metadata } from "next";
import { OrderConfirmation } from "@/components/checkout/order-confirmation";

export const metadata: Metadata = { title: "Order confirmed", robots: { index: false } };

export default function SuccessPage() {
  return <OrderConfirmation />;
}
