"use client";

import Link from "next/link";
import { useStore } from "@/components/providers/store-provider";
import { HeartIcon } from "@/components/icons";
import { ProductGrid } from "@/components/product/product-card";
import { useCatalog } from "@/components/providers/catalog-provider";
import type { Product } from "@/data/types";

export function WishlistView() {
  const { wishlist, hydrated } = useStore();
  const { products } = useCatalog();
  const items = wishlist.map((id) => products.find((p) => p.id === id)).filter((p): p is Product => !!p);

  return (
    <div className="container-x py-10">
      <h1 className="mb-8 text-3xl font-black tracking-tight sm:text-4xl">Wishlist</h1>
      {!hydrated ? null : items.length ? (
        <ProductGrid products={items} />
      ) : (
        <div className="card flex flex-col items-center gap-4 p-12 text-center">
          <div className="bg-brand-gradient grid h-20 w-20 place-items-center rounded-full text-white">
            <HeartIcon size={36} />
          </div>
          <p className="text-xl font-bold">No saved items yet</p>
          <p className="text-fg-muted">Tap the heart on any product to save it here.</p>
          <Link href="/products" className="btn-primary">
            Explore products
          </Link>
        </div>
      )}
    </div>
  );
}
