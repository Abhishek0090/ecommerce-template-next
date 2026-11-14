import { formatPrice } from "@/lib/pricing";
import { discountPercent, isOnSale } from "@/lib/catalog";
import type { Product } from "@/data/types";

export function Price({ product, large }: { product: Product; large?: boolean }) {
  return (
    <div className="flex flex-wrap items-baseline gap-2">
      <span className={`font-bold ${large ? "text-3xl" : "text-base"} ${isOnSale(product) ? "text-accent-ink" : "text-fg"}`}>
        {formatPrice(product.price)}
      </span>
      {isOnSale(product) && (
        <>
          <span className={`text-fg-muted line-through ${large ? "text-lg" : "text-sm"}`}>{formatPrice(product.compareAt!)}</span>
          {large && <span className="chip bg-accent/15 text-accent-ink">Save {discountPercent(product)}%</span>}
        </>
      )}
    </div>
  );
}
