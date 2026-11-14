"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useState, useTransition } from "react";
import { SearchIcon } from "@/components/icons";
import { Select } from "@/components/ui/select";

export type FilterSelect = { name: string; label: string; options: { value: string; label: string }[] };

/** Search box + dropdown filters that write to the URL. Reusable on any admin list page. */
export function FilterBar({ searchPlaceholder = "Search...", selects = [] }: { searchPlaceholder?: string; selects?: FilterSelect[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [q, setQ] = useState(params.get("q") ?? "");
  const [pending, startTransition] = useTransition();

  const update = (changes: Record<string, string>) => {
    const next = new URLSearchParams(params.toString());
    for (const [k, v] of Object.entries(changes)) {
      if (v) next.set(k, v);
      else next.delete(k);
    }
    startTransition(() => router.replace(`${pathname}${next.size ? `?${next}` : ""}`, { scroll: false }));
  };

  return (
    <div className={`mb-4 flex flex-col gap-3 transition-opacity sm:flex-row sm:items-center ${pending ? "opacity-60" : ""}`}>
      <form
        role="search"
        className="relative flex-1"
        onSubmit={(e) => {
          e.preventDefault();
          update({ q: q.trim() });
        }}
      >
        <SearchIcon size={18} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-fg-muted" />
        <input value={q} onChange={(e) => setQ(e.target.value)} onBlur={() => update({ q: q.trim() })} placeholder={searchPlaceholder} aria-label={searchPlaceholder} className="input pl-10" />
      </form>
      {selects.map((s) => (
        <Select
          key={s.name}
          label={s.label}
          className="sm:w-48"
          value={params.get(s.name) ?? ""}
          options={s.options}
          onChange={(v) => update({ [s.name]: v })}
        />
      ))}
    </div>
  );
}
