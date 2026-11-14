"use client";

import Link from "next/link";
import { useState } from "react";
import { useStore } from "@/components/providers/store-provider";
import { HeartIcon, PlusIcon } from "@/components/icons";
import { discountPercent, isOnSale } from "@/lib/catalog";
import type { Product } from "@/data/types";
import { ProductImage } from "./product-image";
import { Price } from "./price";
import { Rating } from "./rating";

const badgeStyle: Record<NonNullable<Product["badge"]>, string> = {
  New: "bg-primary text-primary-fg",
  Bestseller: "bg-amber-400 text-amber-950",
  Limited: "bg-fg text-bg",
  Eco: "bg-emerald-500 text-white",
};

export function ProductCard({ product, priority }: { product: Product; priority?: boolean }) {
  const { addToCart, toggleWishlist, wishlist } = useStore();
  const [color, setColor] = useState(product.colors[0]);
  const saved = wishlist.includes(product.id);
  const soldOut = product.stock <= 0;
  const needsSize = !!product.sizes?.length;

  return (
    <article className="group card relative flex flex-col overflow-hidden transition hover:-translate-y-1 hover:shadow-xl hover:shadow-primary/10">
      <Link href={`/products/${product.slug}`} className="relative block aspect-square overflow-hidden">
        <div className="h-full w-full transition duration-500 group-hover:scale-105">
          <ProductImage product={product} color={color?.hex} priority={priority} />
        </div>
        <div className="absolute left-3 top-3 flex flex-col items-start gap-1.5">
          {product.badge && <span className={`chip ${badgeStyle[product.badge]}`}>{product.badge}</span>}
          {isOnSale(product) && <span className="chip bg-accent text-accent-fg">-{discountPercent(product)}%</span>}
          {soldOut && <span className="chip bg-surface/90 text-fg">Sold out</span>}
        </div>
      </Link>

      <button
        type="button"
        onClick={() => toggleWishlist(product.id, product.name)}
        aria-pressed={saved}
        aria-label={saved ? `Remove ${product.name} from wishlist` : `Save ${product.name} to wishlist`}
        className={`absolute right-3 top-3 grid h-9 w-9 place-items-center rounded-full bg-surface/90 shadow backdrop-blur transition hover:scale-110 ${
          saved ? "text-accent-ink" : "text-fg-muted"
        }`}
      >
        <HeartIcon size={18} fill={saved ? "currentColor" : "none"} />
      </button>

      <div className="flex flex-1 flex-col gap-2 p-4">
        <Rating value={product.rating} count={product.reviewCount} />
        <Link href={`/products/${product.slug}`} className="font-semibold leading-snug hover:text-primary-ink">
          {product.name}
        </Link>
        <p className="line-clamp-2 text-sm text-fg-muted">{product.short}</p>

        {product.colors.length > 1 && (
          <div className="flex gap-1.5" role="radiogroup" aria-label="Color">
            {product.colors.map((c) => (
              <button
                key={c.name}
                type="button"
                role="radio"
                aria-checked={c.name === color?.name}
                aria-label={c.name}
                title={c.name}
                onClick={() => setColor(c)}
                className={`h-5 w-5 rounded-full border-2 transition ${
                  c.name === color?.name ? "scale-110 border-fg" : "border-surface ring-1 ring-border"
                }`}
                style={{ background: c.hex }}
              />
            ))}
          </div>
        )}

        <div className="mt-auto flex items-center justify-between gap-2 pt-2">
          <Price product={product} />
          {needsSize ? (
            <Link href={`/products/${product.slug}`} className="btn-outline px-3 py-2 text-xs">
              Choose size
            </Link>
          ) : (
            <button
              type="button"
              disabled={soldOut}
              onClick={() => addToCart({ productId: product.id, color: color?.name, qty: 1 }, product.name)}
              className="btn-primary px-3 py-2 text-xs"
            >
              <PlusIcon size={14} /> Add
            </button>
          )}
        </div>
      </div>
    </article>
  );
}

export function ProductGrid({ products, priorityCount = 0 }: { products: Product[]; priorityCount?: number }) {
  return (
    <div className="grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-4">
      {products.map((p, i) => (
        <ProductCard key={p.id} product={p} priority={i < priorityCount} />
      ))}
    </div>
  );
}
