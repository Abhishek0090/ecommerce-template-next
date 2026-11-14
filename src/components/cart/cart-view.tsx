"use client";

import Link from "next/link";
import { useStore } from "@/components/providers/store-provider";
import { useCatalog } from "@/components/providers/catalog-provider";
import { ArrowLeftIcon, CartIcon } from "@/components/icons";
import { ProductGrid } from "@/components/product/product-card";
import { featured } from "@/lib/catalog";
import { computeTotals, resolveLines } from "@/lib/pricing";
import { CartLineItem } from "./cart-line-item";
import { CouponForm, FreeShippingMeter, TotalsTable } from "./cart-summary";

export function CartView() {
  const { cart, coupon, hydrated, clearCart } = useStore();
  const { products } = useCatalog();
  const lines = resolveLines(cart, products);
  const totals = computeTotals(cart, products, coupon);

  if (!hydrated) return <div className="container-x min-h-[50vh] py-10" aria-busy="true" />;

  return (
    <div className="container-x py-10">
      <h1 className="mb-8 text-3xl font-black tracking-tight sm:text-4xl">Shopping cart</h1>
      {lines.length === 0 ? (
        <>
          <div className="card flex flex-col items-center gap-4 p-12 text-center">
            <div className="bg-brand-gradient grid h-20 w-20 place-items-center rounded-full text-white">
              <CartIcon size={36} />
            </div>
            <p className="text-xl font-bold">Your cart is empty</p>
            <Link href="/products" className="btn-primary">
              Start shopping
            </Link>
          </div>
          <h2 className="mb-6 mt-16 text-2xl font-bold">Popular right now</h2>
          <ProductGrid products={featured(products, 4)} />
        </>
      ) : (
        <div className="grid gap-8 lg:grid-cols-[1fr_380px]">
          <div className="card px-5">
            <ul className="divide-y divide-border">
              {lines.map((line) => (
                <CartLineItem key={line.key} line={line} />
              ))}
            </ul>
            <div className="flex items-center justify-between border-t border-border py-4 text-sm">
              <Link href="/products" className="flex items-center gap-1 font-semibold text-primary-ink">
                <ArrowLeftIcon size={16} /> Continue shopping
              </Link>
              <button type="button" onClick={clearCart} className="text-fg-muted hover:text-danger">
                Clear cart
              </button>
            </div>
          </div>
          <aside className="card h-fit space-y-5 p-6 lg:sticky lg:top-28">
            <h2 className="text-lg font-bold">Order summary</h2>
            <FreeShippingMeter totals={totals} />
            <CouponForm />
            <TotalsTable totals={totals} />
            <Link href="/checkout" className="btn-primary w-full py-3.5 text-base">
              Checkout
            </Link>
            <p className="text-center text-xs text-fg-muted">Try codes WELCOME10 or COLOR20</p>
          </aside>
        </div>
      )}
    </div>
  );
}
