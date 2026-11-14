"use client";

import { useState } from "react";
import { siteConfig } from "@/config/site";
import { useStore } from "@/components/providers/store-provider";
import { findCoupon, formatPrice, type Totals } from "@/lib/pricing";
import { TruckIcon } from "@/components/icons";

export function FreeShippingMeter({ totals }: { totals: Totals }) {
  const pct = Math.min(100, ((siteConfig.freeShippingThreshold - totals.freeShippingRemaining) / siteConfig.freeShippingThreshold) * 100);
  return (
    <div className="rounded-xl bg-surface-2 p-3">
      <p className="flex items-center gap-2 text-sm">
        <TruckIcon size={18} className="text-primary-ink" />
        {totals.freeShippingRemaining > 0 ? (
          <span>
            Add <strong>{formatPrice(totals.freeShippingRemaining)}</strong> more for free shipping
          </span>
        ) : (
          <span className="font-medium text-success">You get free shipping!</span>
        )}
      </p>
      <div className="mt-2 h-2 overflow-hidden rounded-full bg-border">
        <div className="bg-brand-gradient h-full rounded-full transition-all duration-500" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

export function CouponForm() {
  const { coupon, applyCoupon } = useStore();
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const active = findCoupon(coupon);

  if (active) {
    return (
      <div className="flex items-center justify-between rounded-xl border border-dashed border-success/60 bg-success/10 px-3 py-2 text-sm">
        <span>
          <strong>{active.code}</strong> - {active.label}
        </span>
        <button type="button" onClick={() => applyCoupon(undefined)} className="text-xs font-semibold text-fg-muted hover:text-danger">
          Remove
        </button>
      </div>
    );
  }
  return (
    <form
      className="flex gap-2"
      onSubmit={(e) => {
        e.preventDefault();
        if (findCoupon(code)) {
          applyCoupon(code.trim().toUpperCase());
          setCode("");
          setError("");
        } else setError("That code isn't valid.");
      }}
    >
      <div className="flex-1">
        <input value={code} onChange={(e) => setCode(e.target.value)} placeholder="Discount code" aria-label="Discount code" className="input" />
        {error && <p className="mt-1 text-xs text-danger">{error}</p>}
      </div>
      <button type="submit" className="btn-outline h-[42px]">
        Apply
      </button>
    </form>
  );
}

export function TotalsTable({ totals, shippingLabel = "Shipping" }: { totals: Totals; shippingLabel?: string }) {
  const row = "flex justify-between text-sm";
  return (
    <dl className="space-y-2">
      <div className={row}>
        <dt className="text-fg-muted">Subtotal ({totals.items} items)</dt>
        <dd className="tabular-nums">{formatPrice(totals.subtotal)}</dd>
      </div>
      {totals.discount > 0 && (
        <div className={`${row} text-success`}>
          <dt>Discount</dt>
          <dd className="tabular-nums">-{formatPrice(totals.discount)}</dd>
        </div>
      )}
      <div className={row}>
        <dt className="text-fg-muted">{shippingLabel}</dt>
        <dd className="tabular-nums">{totals.shipping === 0 ? "Free" : formatPrice(totals.shipping)}</dd>
      </div>
      {siteConfig.taxRate > 0 && (
        <div className={row}>
          <dt className="text-fg-muted">Estimated tax</dt>
          <dd className="tabular-nums">{formatPrice(totals.tax)}</dd>
        </div>
      )}
      <div className="flex justify-between border-t border-border pt-3 text-base font-bold">
        <dt>Total</dt>
        <dd className="tabular-nums">{formatPrice(totals.total)}</dd>
      </div>
    </dl>
  );
}
