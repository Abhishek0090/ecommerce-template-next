"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { siteConfig } from "@/config/site";
import { STORAGE_KEYS } from "@/config/theme";
import { useStore } from "@/components/providers/store-provider";
import { CouponForm, TotalsTable } from "@/components/cart/cart-summary";
import { ProductImage } from "@/components/product/product-image";
import { CheckIcon, ShieldIcon } from "@/components/icons";
import { computeTotals, formatPrice, resolveLines, type ShippingMethod } from "@/lib/pricing";
import { placeOrderAction } from "@/server/actions/store";
import type { Address } from "@/data/types";
import { useCatalog } from "@/components/providers/catalog-provider";
import { Select } from "@/components/ui/select";

const STEPS = ["Information", "Delivery", "Payment"] as const;
const COUNTRIES = ["United States", "Canada", "United Kingdom", "India", "Australia", "Germany", "France"];

type Errors = Partial<Record<string, string>>;

const emptyAddress: Address = { email: "", firstName: "", lastName: "", address: "", city: "", postcode: "", country: COUNTRIES[0], phone: "" };

function validateAddress(a: Address): Errors {
  const e: Errors = {};
  if (!/^\S+@\S+\.\S+$/.test(a.email)) e.email = "Enter a valid email";
  if (!a.firstName.trim()) e.firstName = "Required";
  if (!a.lastName.trim()) e.lastName = "Required";
  if (!a.address.trim()) e.address = "Required";
  if (!a.city.trim()) e.city = "Required";
  if (!a.postcode.trim()) e.postcode = "Required";
  return e;
}

type Card = { name: string; number: string; expiry: string; cvc: string };

function luhn(num: string) {
  let sum = 0;
  for (let i = 0; i < num.length; i++) {
    let d = Number(num[num.length - 1 - i]);
    if (i % 2) d = d * 2 > 9 ? d * 2 - 9 : d * 2;
    sum += d;
  }
  return sum % 10 === 0;
}

function validateCard(c: Card): Errors {
  const e: Errors = {};
  const digits = c.number.replace(/\s/g, "");
  if (!c.name.trim()) e.name = "Required";
  if (!/^\d{13,19}$/.test(digits) || !luhn(digits)) e.number = "Enter a valid card number";
  const [mm, yy] = c.expiry.split("/").map(Number);
  const now = new Date();
  const expired = !mm || mm > 12 || !yy || 2000 + yy < now.getFullYear() || (2000 + yy === now.getFullYear() && mm < now.getMonth() + 1);
  if (expired) e.expiry = "Use MM/YY, not expired";
  if (!/^\d{3,4}$/.test(c.cvc)) e.cvc = "3 or 4 digits";
  return e;
}

function Field({
  label,
  error,
  className = "",
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & { label: string; error?: string }) {
  const id = props.id ?? props.name;
  return (
    <div className={className}>
      <label htmlFor={id} className="label">
        {label}
      </label>
      <input id={id} {...props} aria-invalid={!!error} aria-describedby={error ? `${id}-err` : undefined} className={`input ${error ? "border-danger" : ""}`} />
      {error && (
        <p id={`${id}-err`} className="mt-1 text-xs text-danger">
          {error}
        </p>
      )}
    </div>
  );
}

export function CheckoutForm() {
  const router = useRouter();
  const { cart, coupon, hydrated, clearCart } = useStore();
  const [step, setStep] = useState(0);
  const [address, setAddress] = useState<Address>(emptyAddress);
  const [method, setMethod] = useState<ShippingMethod>("standard");
  const [card, setCard] = useState<Card>({ name: "", number: "", expiry: "", cvc: "" });
  const [errors, setErrors] = useState<Errors>({});
  const [placing, setPlacing] = useState(false);

  const { products } = useCatalog();
  const [orderError, setOrderError] = useState("");
  const lines = resolveLines(cart, products);
  const totals = computeTotals(cart, products, coupon, method);
  const standardShipping = computeTotals(cart, products, coupon, "standard").shipping;

  if (!hydrated) return <div className="container-x min-h-[50vh] py-10" aria-busy="true" />;

  // The cart is cleared right before redirecting to the confirmation page.
  if (placing && lines.length === 0) {
    return <div className="container-x py-20 text-center text-fg-muted">Confirming your order...</div>;
  }

  if (lines.length === 0) {
    return (
      <div className="container-x py-20 text-center">
        <h1 className="text-3xl font-black">Your cart is empty</h1>
        <p className="mt-2 text-fg-muted">Add something to your cart before checking out.</p>
        <Link href="/products" className="btn-primary mt-6">
          Browse products
        </Link>
      </div>
    );
  }

  const setA = (k: keyof Address) => (e: React.ChangeEvent<HTMLInputElement>) => setAddress({ ...address, [k]: e.target.value });

  const next = async (e: React.FormEvent) => {
    e.preventDefault();
    if (step === 0) {
      const errs = validateAddress(address);
      setErrors(errs);
      if (Object.keys(errs).length === 0) setStep(1);
    } else if (step === 1) {
      setStep(2);
    } else {
      const errs = validateCard(card);
      setErrors(errs);
      if (Object.keys(errs).length) return;
      setPlacing(true);
      setOrderError("");
      // Only the last 4 digits leave the browser; the server recomputes prices and checks stock.
      const result = await placeOrderAction({
        lines: cart,
        coupon,
        method,
        address,
        paymentLast4: card.number.replace(/\s/g, "").slice(-4),
      }).catch(() => ({ ok: false as const, error: "Something went wrong. Please try again." }));
      if (!result.ok) {
        setOrderError(result.error);
        setPlacing(false);
        return;
      }
      try {
        sessionStorage.setItem(STORAGE_KEYS.lastOrder, JSON.stringify(result.data));
      } catch {}
      clearCart();
      router.push(`/checkout/success?order=${result.data.id}`);
    }
  };

  return (
    <div className="container-x py-10">
      <h1 className="mb-6 text-3xl font-black tracking-tight sm:text-4xl">Checkout</h1>

      <ol className="mb-8 flex items-center gap-2 text-sm" aria-label="Checkout steps">
        {STEPS.map((s, i) => (
          <li key={s} className="flex items-center gap-2">
            <button
              type="button"
              disabled={i > step}
              onClick={() => setStep(i)}
              aria-current={i === step ? "step" : undefined}
              className={`flex items-center gap-2 rounded-full px-3 py-1.5 font-semibold transition ${
                i === step ? "bg-primary text-primary-fg" : i < step ? "bg-primary/10 text-primary-ink" : "bg-surface-2 text-fg-muted"
              }`}
            >
              <span className="grid h-5 w-5 place-items-center rounded-full bg-white/25 text-xs">{i < step ? <CheckIcon size={12} /> : i + 1}</span>
              {s}
            </button>
            {i < STEPS.length - 1 && <span className="h-px w-6 bg-border" />}
          </li>
        ))}
      </ol>

      <div className="grid gap-8 lg:grid-cols-[1fr_400px]">
        <form onSubmit={next} noValidate className="card space-y-6 p-6 sm:p-8">
          {step === 0 && (
            <>
              <h2 className="text-lg font-bold">Contact</h2>
              <Field label="Email" name="email" type="email" autoComplete="email" value={address.email} onChange={setA("email")} error={errors.email} />
              <h2 className="pt-2 text-lg font-bold">Shipping address</h2>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="First name" name="firstName" autoComplete="given-name" value={address.firstName} onChange={setA("firstName")} error={errors.firstName} />
                <Field label="Last name" name="lastName" autoComplete="family-name" value={address.lastName} onChange={setA("lastName")} error={errors.lastName} />
                <Field label="Address" name="address" autoComplete="street-address" value={address.address} onChange={setA("address")} error={errors.address} className="sm:col-span-2" />
                <Field label="City" name="city" autoComplete="address-level2" value={address.city} onChange={setA("city")} error={errors.city} />
                <Field label="Postal code" name="postcode" autoComplete="postal-code" value={address.postcode} onChange={setA("postcode")} error={errors.postcode} />
                <div>
                  <label htmlFor="country" className="label">
                    Country
                  </label>
                  <Select
                    id="country"
                    value={address.country}
                    options={COUNTRIES.map((c) => ({ value: c, label: c }))}
                    onChange={(country) => setAddress({ ...address, country })}
                  />
                </div>
                <Field label="Phone (optional)" name="phone" type="tel" autoComplete="tel" value={address.phone} onChange={setA("phone")} />
              </div>
            </>
          )}

          {step === 1 && (
            <>
              <h2 className="text-lg font-bold">Delivery method</h2>
              <div className="space-y-3">
                {[
                  { id: "standard" as const, title: "Standard", eta: "3-5 business days", price: standardShipping },
                  { id: "express" as const, title: "Express", eta: "1-2 business days", price: siteConfig.expressShippingRate },
                ].map((o) => (
                  <label
                    key={o.id}
                    className={`flex cursor-pointer items-center gap-4 rounded-xl border-2 p-4 transition ${method === o.id ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"}`}
                  >
                    <input type="radio" name="method" checked={method === o.id} onChange={() => setMethod(o.id)} className="h-4 w-4 accent-[var(--primary)]" />
                    <div className="flex-1">
                      <p className="font-semibold">{o.title}</p>
                      <p className="text-sm text-fg-muted">{o.eta}</p>
                    </div>
                    <span className="font-semibold">{o.price === 0 ? "Free" : formatPrice(o.price)}</span>
                  </label>
                ))}
              </div>
              <div className="rounded-xl bg-surface-2 p-4 text-sm">
                <p className="font-semibold">Shipping to</p>
                <p className="text-fg-muted">
                  {address.firstName} {address.lastName}, {address.address}, {address.city} {address.postcode}, {address.country}
                </p>
              </div>
            </>
          )}

          {step === 2 && (
            <>
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold">Payment</h2>
                <span className="flex items-center gap-1 text-xs text-fg-muted">
                  <ShieldIcon size={14} /> Demo only, no real charge
                </span>
              </div>
              <div className="bg-brand-gradient relative overflow-hidden rounded-2xl p-6 text-white shadow-xl">
                <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-white/15" />
                <p className="text-xs uppercase tracking-widest text-white/70">Card</p>
                <p className="mt-6 font-mono text-xl tracking-widest">{card.number || "•••• •••• •••• ••••"}</p>
                <div className="mt-4 flex justify-between text-sm">
                  <span className="uppercase">{card.name || "Your name"}</span>
                  <span>{card.expiry || "MM/YY"}</span>
                </div>
              </div>
              <p className="text-xs text-fg-muted">Test card: 4242 4242 4242 4242, any future date, any CVC.</p>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Name on card" name="name" autoComplete="cc-name" value={card.name} onChange={(e) => setCard({ ...card, name: e.target.value })} error={errors.name} className="sm:col-span-2" />
                <Field
                  label="Card number"
                  name="number"
                  inputMode="numeric"
                  autoComplete="cc-number"
                  value={card.number}
                  onChange={(e) =>
                    setCard({
                      ...card,
                      number: e.target.value
                        .replace(/\D/g, "")
                        .slice(0, 19)
                        .replace(/(\d{4})(?=\d)/g, "$1 "),
                    })
                  }
                  error={errors.number}
                  className="sm:col-span-2"
                />
                <Field
                  label="Expiry (MM/YY)"
                  name="expiry"
                  inputMode="numeric"
                  autoComplete="cc-exp"
                  value={card.expiry}
                  onChange={(e) => {
                    const d = e.target.value.replace(/\D/g, "").slice(0, 4);
                    setCard({ ...card, expiry: d.length > 2 ? `${d.slice(0, 2)}/${d.slice(2)}` : d });
                  }}
                  error={errors.expiry}
                />
                <Field
                  label="CVC"
                  name="cvc"
                  inputMode="numeric"
                  autoComplete="cc-csc"
                  value={card.cvc}
                  onChange={(e) => setCard({ ...card, cvc: e.target.value.replace(/\D/g, "").slice(0, 4) })}
                  error={errors.cvc}
                />
              </div>
            </>
          )}

          {orderError && (
            <p role="alert" className="rounded-xl border border-danger/40 bg-danger/10 px-4 py-3 text-sm text-danger">
              {orderError}
            </p>
          )}
          <div className="flex items-center justify-between gap-3 border-t border-border pt-6">
            {step > 0 ? (
              <button type="button" onClick={() => setStep(step - 1)} className="btn-ghost">
                Back
              </button>
            ) : (
              <Link href="/cart" className="btn-ghost">
                Back to cart
              </Link>
            )}
            <button type="submit" disabled={placing} className="btn-primary px-8 py-3 text-base">
              {placing ? "Placing order..." : step < 2 ? "Continue" : `Pay ${formatPrice(totals.total)}`}
            </button>
          </div>
        </form>

        <aside className="card h-fit space-y-5 p-6 lg:sticky lg:top-28">
          <h2 className="text-lg font-bold">Order summary</h2>
          <ul className="space-y-3">
            {lines.map((l) => (
              <li key={l.key} className="flex items-center gap-3">
                <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-lg">
                  <ProductImage product={l.product} color={l.product.colors.find((c) => c.name === l.color)?.hex} sizes="56px" />
                  <span className="absolute right-0.5 top-0.5 grid h-5 min-w-5 place-items-center rounded-full bg-fg px-1 text-[10px] font-bold text-bg">{l.qty}</span>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{l.product.name}</p>
                  <p className="text-xs text-fg-muted">{[l.color, l.size].filter(Boolean).join(" / ")}</p>
                </div>
                <span className="text-sm font-semibold tabular-nums">{formatPrice(l.lineTotal)}</span>
              </li>
            ))}
          </ul>
          <CouponForm />
          <TotalsTable totals={totals} shippingLabel={method === "express" ? "Express shipping" : "Shipping"} />
        </aside>
      </div>
    </div>
  );
}
