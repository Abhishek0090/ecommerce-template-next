"use client";

import Link from "next/link";
import { useEffect } from "react";
import { useStore } from "@/components/providers/store-provider";
import { useCatalog } from "@/components/providers/catalog-provider";
import { CartIcon, CloseIcon } from "@/components/icons";
import { computeTotals, resolveLines } from "@/lib/pricing";
import { CartLineItem } from "./cart-line-item";
import { FreeShippingMeter, TotalsTable } from "./cart-summary";

export function CartDrawer() {
  const { cart, coupon, cartOpen, openCart } = useStore();
  const { products } = useCatalog();
  const lines = resolveLines(cart, products);
  const totals = computeTotals(cart, products, coupon);
  const close = () => openCart(false);

  useEffect(() => {
    if (!cartOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && openCart(false);
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [cartOpen, openCart]);

  return (
    <div className={`fixed inset-0 z-50 ${cartOpen ? "" : "pointer-events-none"}`} inert={!cartOpen}>
      <div className={`absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity ${cartOpen ? "opacity-100" : "opacity-0"}`} onClick={close} />
      <aside
        role="dialog"
        aria-modal="true"
        aria-label="Shopping cart"
        className={`absolute inset-y-0 right-0 flex w-full max-w-md flex-col bg-surface shadow-2xl transition-transform duration-300 ${
          cartOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <h2 className="text-lg font-bold">Your cart</h2>
          <button type="button" onClick={close} className="btn-ghost h-10 w-10 rounded-full p-0" aria-label="Close cart">
            <CloseIcon />
          </button>
        </div>

        {lines.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-4 p-8 text-center">
            <div className="bg-brand-gradient grid h-20 w-20 place-items-center rounded-full text-white">
              <CartIcon size={36} />
            </div>
            <p className="text-lg font-semibold">Your cart is empty</p>
            <p className="text-sm text-fg-muted">Find something colorful you love.</p>
            <Link href="/products" onClick={close} className="btn-primary">
              Start shopping
            </Link>
          </div>
        ) : (
          <>
            <div className="px-5 pt-4">
              <FreeShippingMeter totals={totals} />
            </div>
            <ul className="flex-1 divide-y divide-border overflow-y-auto px-5">
              {lines.map((line) => (
                <CartLineItem key={line.key} line={line} onNavigate={close} />
              ))}
            </ul>
            <div className="space-y-4 border-t border-border p-5">
              <TotalsTable totals={totals} />
              <div className="grid grid-cols-2 gap-2">
                <Link href="/cart" onClick={close} className="btn-outline">
                  View cart
                </Link>
                <Link href="/checkout" onClick={close} className="btn-primary">
                  Checkout
                </Link>
              </div>
            </div>
          </>
        )}
      </aside>
    </div>
  );
}
