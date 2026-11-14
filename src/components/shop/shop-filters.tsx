"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useState, useTransition } from "react";
import { SORT_OPTIONS, type SortKey } from "@/lib/catalog";
import type { Category } from "@/data/types";
import { CloseIcon } from "@/components/icons";
import { Select } from "@/components/ui/select";

/** Filters live in the URL, so filtered views can be shared and bookmarked. */
export function ShopFilters({ categories, bounds }: { categories: Category[]; bounds: { min: number; max: number } }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [pending, startTransition] = useTransition();
  const [min, setMin] = useState(params.get("min") ?? "");
  const [max, setMax] = useState(params.get("max") ?? "");

  const update = (changes: Record<string, string | null>) => {
    const next = new URLSearchParams(params.toString());
    for (const [k, v] of Object.entries(changes)) {
      if (v == null || v === "") next.delete(k);
      else next.set(k, v);
    }
    startTransition(() => router.push(`${pathname}${next.size ? `?${next}` : ""}`, { scroll: false }));
  };

  const active = params.get("category");
  const hasFilters = ["q", "category", "sale", "stock", "min", "max"].some((k) => params.has(k));

  return (
    <aside className={`space-y-6 transition-opacity lg:sticky lg:top-28 lg:self-start ${pending ? "opacity-60" : ""}`} aria-label="Filters">
      <div>
        <label htmlFor="sort" className="label">
          Sort by
        </label>
        <Select
          id="sort"
          value={(params.get("sort") as SortKey | null) ?? "featured"}
          options={SORT_OPTIONS}
          onChange={(v) => update({ sort: v === "featured" ? null : v })}
        />
      </div>

      <fieldset>
        <legend className="label">Category</legend>
        <div className="flex flex-wrap gap-2 lg:flex-col lg:items-stretch">
          <button
            type="button"
            onClick={() => update({ category: null })}
            className={`rounded-full px-3 py-1.5 text-left text-sm font-medium transition lg:rounded-xl ${!active ? "bg-primary text-primary-fg" : "bg-surface-2 hover:text-primary-ink"}`}
          >
            All categories
          </button>
          {categories.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => update({ category: c.id })}
              className={`flex items-center gap-2 rounded-full px-3 py-1.5 text-left text-sm font-medium transition lg:rounded-xl ${
                active === c.id ? "bg-primary text-primary-fg" : "bg-surface-2 hover:text-primary-ink"
              }`}
            >
              <span className="h-3 w-3 rounded-full" style={{ background: `linear-gradient(135deg, ${c.colors[0]}, ${c.colors[1]})` }} />
              {c.name}
            </button>
          ))}
        </div>
      </fieldset>

      <fieldset>
        <legend className="label">Price</legend>
        <form
          className="flex items-center gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            update({ min, max });
          }}
        >
          <input type="number" inputMode="numeric" min={0} value={min} onChange={(e) => setMin(e.target.value)} placeholder={`${bounds.min}`} aria-label="Minimum price" className="input" />
          <span className="text-fg-muted">-</span>
          <input type="number" inputMode="numeric" min={0} value={max} onChange={(e) => setMax(e.target.value)} placeholder={`${bounds.max}`} aria-label="Maximum price" className="input" />
          <button type="submit" className="btn-outline px-3">
            Go
          </button>
        </form>
      </fieldset>

      <fieldset className="space-y-2">
        <legend className="label">Availability</legend>
        {[
          { key: "sale", label: "On sale" },
          { key: "stock", label: "In stock only" },
        ].map((o) => (
          <label key={o.key} className="flex cursor-pointer items-center gap-2 text-sm">
            <input type="checkbox" checked={params.get(o.key) === "1"} onChange={(e) => update({ [o.key]: e.target.checked ? "1" : null })} className="h-4 w-4 accent-[var(--primary)]" />
            {o.label}
          </label>
        ))}
      </fieldset>

      {hasFilters && (
        <button
          type="button"
          onClick={() => {
            setMin("");
            setMax("");
            startTransition(() => router.push(pathname, { scroll: false }));
          }}
          className="btn-ghost w-full text-danger"
        >
          <CloseIcon size={16} /> Clear all filters
        </button>
      )}
    </aside>
  );
}
