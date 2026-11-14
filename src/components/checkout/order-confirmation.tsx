"use client";

import Link from "next/link";
import { useSyncExternalStore } from "react";
import { STORAGE_KEYS } from "@/config/theme";
import { CheckIcon } from "@/components/icons";
import { TotalsTable } from "@/components/cart/cart-summary";
import { formatPrice } from "@/lib/pricing";
import type { Order } from "@/data/types";

const subscribe = () => () => {};
const readOrder = () => {
  try {
    return sessionStorage.getItem(STORAGE_KEYS.lastOrder);
  } catch {
    return null;
  }
};

export function OrderConfirmation() {
  // Read on the client only; the server renders the generic message.
  const raw = useSyncExternalStore(subscribe, readOrder, () => null);
  const order: Order | null = raw ? JSON.parse(raw) : null;

  return (
    <div className="container-x max-w-2xl py-16">
      <div className="text-center">
        <div className="bg-brand-gradient mx-auto grid h-20 w-20 place-items-center rounded-full text-white shadow-xl shadow-primary/30">
          <CheckIcon size={40} />
        </div>
        <h1 className="mt-6 text-3xl font-black sm:text-4xl">Thank you for your order!</h1>
        {order ? (
          <p className="mt-2 text-fg-muted">
            Order <strong className="text-fg">{order.id}</strong> is confirmed. A receipt is on its way to {order.address.email}.
          </p>
        ) : (
          <p className="mt-2 text-fg-muted">Your order is confirmed. A receipt is on its way to your inbox.</p>
        )}
      </div>

      {order && (
        <div className="card mt-10 space-y-6 p-6">
          <ul className="divide-y divide-border">
            {order.lines.map((l) => (
              <li key={l.key} className="flex justify-between py-3 text-sm">
                <span>
                  {l.qty} x {l.name}
                  <span className="text-fg-muted"> {[l.color, l.size].filter(Boolean).join(" / ")}</span>
                </span>
                <span className="tabular-nums">{formatPrice(l.price * l.qty)}</span>
              </li>
            ))}
          </ul>
          <TotalsTable totals={order.totals} shippingLabel={order.shippingMethod === "express" ? "Express shipping" : "Shipping"} />
          <div className="grid gap-4 border-t border-border pt-4 text-sm sm:grid-cols-2">
            <div>
              <p className="font-semibold">Shipping to</p>
              <p className="text-fg-muted">
                {order.address.firstName} {order.address.lastName}
                <br />
                {order.address.address}
                <br />
                {order.address.city} {order.address.postcode}, {order.address.country}
              </p>
            </div>
            <div>
              <p className="font-semibold">Paid with</p>
              <p className="text-fg-muted">Card ending {order.paymentLast4}</p>
            </div>
          </div>
        </div>
      )}

      <div className="mt-8 text-center">
        <Link href="/products" className="btn-primary px-8 py-3">
          Continue shopping
        </Link>
      </div>
    </div>
  );
}
