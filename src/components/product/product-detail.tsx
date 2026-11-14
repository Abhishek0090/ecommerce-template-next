"use client";

import { useState } from "react";
import { useStore } from "@/components/providers/store-provider";
import { QtyStepper } from "@/components/cart/cart-line-item";
import { CartIcon, HeartIcon, ReturnIcon, ShieldIcon, TruckIcon } from "@/components/icons";
import { siteConfig } from "@/config/site";
import { formatPrice } from "@/lib/pricing";
import type { Product } from "@/data/types";
import { ProductImage } from "./product-image";
import { Price } from "./price";
import { Rating } from "./rating";

export function ProductDetail({ product }: { product: Product }) {
  const { addToCart, toggleWishlist, wishlist, openCart } = useStore();
  const [color, setColor] = useState(product.colors[0]);
  const [size, setSize] = useState<string>();
  const [qty, setQty] = useState(1);
  const [sizeError, setSizeError] = useState(false);
  const [view, setView] = useState(0);
  const saved = wishlist.includes(product.id);
  const soldOut = product.stock <= 0;
  const needsSize = !!product.sizes?.length;

  // Without real images, the thumbnails show the product in each color.
  const thumbs = product.images?.length ? product.images.map((_, i) => ({ i, color: color?.hex })) : product.colors.map((c, i) => ({ i, color: c.hex }));

  const add = (thenOpen: boolean) => {
    if (needsSize && !size) {
      setSizeError(true);
      return;
    }
    addToCart({ productId: product.id, color: color?.name, size, qty }, product.name);
    if (thenOpen) openCart(true);
  };

  return (
    <div className="grid gap-10 lg:grid-cols-2">
      <div className="space-y-4">
        <div className="card aspect-square overflow-hidden">
          <ProductImage
            product={product}
            index={product.images?.length ? view : 0}
            color={product.images?.length ? undefined : color?.hex}
            sizes="(min-width: 1024px) 50vw, 100vw"
            priority
          />
        </div>
        {thumbs.length > 1 && (
          <div className="grid grid-cols-4 gap-3">
            {thumbs.map((t) => {
              const selected = product.images?.length ? view === t.i : color?.hex === t.color;
              return (
                <button
                  key={t.i}
                  type="button"
                  onClick={() => (product.images?.length ? setView(t.i) : setColor(product.colors[t.i]))}
                  className={`aspect-square overflow-hidden rounded-xl border-2 transition ${selected ? "border-primary" : "border-transparent opacity-70 hover:opacity-100"}`}
                  aria-label={`View ${product.images?.length ? `image ${t.i + 1}` : product.colors[t.i].name}`}
                >
                  <ProductImage product={product} index={t.i} color={t.color} sizes="120px" />
                </button>
              );
            })}
          </div>
        )}
      </div>

      <div className="flex flex-col gap-6">
        <div>
          {product.badge && <span className="chip mb-3 bg-primary/10 text-primary-ink">{product.badge}</span>}
          <h1 className="text-3xl font-black tracking-tight sm:text-4xl">{product.name}</h1>
          <a href="#reviews" className="mt-2 inline-block">
            <Rating value={product.rating} count={product.reviewCount} size={16} />
          </a>
        </div>
        <Price product={product} large />
        <p className="text-fg-muted">{product.short}</p>

        <div>
          <p className="label">
            Color: <span className="font-normal text-fg-muted">{color?.name}</span>
          </p>
          <div className="flex gap-2" role="radiogroup" aria-label="Color">
            {product.colors.map((c) => (
              <button
                key={c.name}
                type="button"
                role="radio"
                aria-checked={c.name === color?.name}
                aria-label={c.name}
                onClick={() => setColor(c)}
                className={`h-10 w-10 rounded-full border-4 transition ${c.name === color?.name ? "scale-110 border-surface ring-2 ring-primary" : "border-surface ring-1 ring-border hover:scale-105"}`}
                style={{ background: c.hex }}
              />
            ))}
          </div>
        </div>

        {needsSize && (
          <div>
            <p className="label">Size {sizeError && <span className="font-normal text-danger">- please choose a size</span>}</p>
            <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Size">
              {product.sizes!.map((s) => (
                <button
                  key={s}
                  type="button"
                  role="radio"
                  aria-checked={size === s}
                  onClick={() => {
                    setSize(s);
                    setSizeError(false);
                  }}
                  className={`min-w-12 rounded-xl border px-3 py-2 text-sm font-semibold transition ${
                    size === s ? "border-primary bg-primary text-primary-fg" : sizeError ? "border-danger" : "border-border hover:border-primary"
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="flex flex-wrap items-center gap-3">
          <QtyStepper value={qty} onChange={(n) => setQty(Math.max(1, n))} max={Math.min(10, Math.max(1, product.stock))} />
          <p className={`text-sm font-medium ${soldOut ? "text-danger" : product.stock < 10 ? "text-warning" : "text-success"}`}>
            {soldOut ? "Sold out" : product.stock < 10 ? `Only ${product.stock} left` : "In stock"}
          </p>
        </div>

        <div className="flex gap-3">
          <button type="button" disabled={soldOut} onClick={() => add(false)} className="btn-primary flex-1 py-3.5 text-base">
            <CartIcon size={18} /> {soldOut ? "Sold out" : "Add to cart"}
          </button>
          <button type="button" disabled={soldOut} onClick={() => add(true)} className="btn-accent py-3.5 text-base">
            Buy now
          </button>
          <button
            type="button"
            onClick={() => toggleWishlist(product.id, product.name)}
            aria-pressed={saved}
            aria-label={saved ? "Remove from wishlist" : "Save to wishlist"}
            className={`btn-outline px-4 ${saved ? "border-accent text-accent-ink" : ""}`}
          >
            <HeartIcon size={20} fill={saved ? "currentColor" : "none"} />
          </button>
        </div>

        <ul className="card divide-y divide-border text-sm">
          {[
            { Icon: TruckIcon, text: `Free shipping over ${formatPrice(siteConfig.freeShippingThreshold)}, otherwise ${formatPrice(siteConfig.shippingFlatRate)}` },
            { Icon: ReturnIcon, text: "Free returns within 30 days" },
            { Icon: ShieldIcon, text: "2-year warranty included" },
          ].map(({ Icon, text }) => (
            <li key={text} className="flex items-center gap-3 p-4">
              <Icon size={18} className="text-primary-ink" />
              {text}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
