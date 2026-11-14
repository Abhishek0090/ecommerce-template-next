"use client";

import Link from "next/link";
import { useStore } from "@/components/providers/store-provider";
import { MinusIcon, PlusIcon, TrashIcon } from "@/components/icons";
import { ProductImage } from "@/components/product/product-image";
import { formatPrice, type ResolvedLine } from "@/lib/pricing";

export function QtyStepper({ value, onChange, max = 10 }: { value: number; onChange: (n: number) => void; max?: number }) {
  return (
    <div className="inline-flex items-center rounded-full border border-border bg-surface">
      <button type="button" onClick={() => onChange(value - 1)} className="grid h-8 w-8 place-items-center rounded-full hover:text-primary-ink" aria-label="Decrease quantity">
        <MinusIcon size={14} />
      </button>
      <span className="w-6 text-center text-sm font-semibold tabular-nums" aria-live="polite">
        {value}
      </span>
      <button
        type="button"
        onClick={() => onChange(value + 1)}
        disabled={value >= max}
        className="grid h-8 w-8 place-items-center rounded-full hover:text-primary-ink disabled:opacity-40"
        aria-label="Increase quantity"
      >
        <PlusIcon size={14} />
      </button>
    </div>
  );
}

export function CartLineItem({ line, onNavigate }: { line: ResolvedLine; onNavigate?: () => void }) {
  const { setQty, removeLine } = useStore();
  const { product } = line;
  const colorHex = product.colors.find((c) => c.name === line.color)?.hex;
  const options = [line.color, line.size && `Size ${line.size}`].filter(Boolean).join(" / ");

  return (
    <li className="flex gap-4 py-4">
      <Link href={`/products/${product.slug}`} onClick={onNavigate} className="h-20 w-20 shrink-0 overflow-hidden rounded-xl">
        <ProductImage product={product} color={colorHex} sizes="80px" />
      </Link>
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex justify-between gap-2">
          <Link href={`/products/${product.slug}`} onClick={onNavigate} className="truncate font-medium hover:text-primary-ink">
            {product.name}
          </Link>
          <span className="font-semibold tabular-nums">{formatPrice(line.lineTotal)}</span>
        </div>
        {options && <p className="text-sm text-fg-muted">{options}</p>}
        <div className="mt-auto flex items-center justify-between pt-2">
          <QtyStepper value={line.qty} onChange={(n) => setQty(line.key, n)} max={Math.min(10, product.stock)} />
          <button type="button" onClick={() => removeLine(line.key)} className="text-fg-muted hover:text-danger" aria-label={`Remove ${product.name}`}>
            <TrashIcon size={18} />
          </button>
        </div>
      </div>
    </li>
  );
}
