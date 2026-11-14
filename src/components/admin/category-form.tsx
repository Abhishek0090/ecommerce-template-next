"use client";

import { startTransition, useActionState, useState } from "react";
import { deleteCategoryAction, saveCategoryAction, type FormState } from "@/server/actions/admin";
import { slugify } from "@/lib/catalog";
import type { Category } from "@/data/types";
import { TrashIcon } from "@/components/icons";

/** Add or edit one category. Pass `category` to edit; omit it to add a new one. */
export function CategoryForm({ category, productCount = 0 }: { category?: Category; productCount?: number }) {
  const [state, action, pending] = useActionState<FormState, FormData>(saveCategoryAction, { status: "idle" });
  const [delState, delAction, deleting] = useActionState<FormState, FormData>(deleteCategoryAction, { status: "idle" });
  const [name, setName] = useState(category?.name ?? "");
  const [c1, setC1] = useState(category?.colors[0] ?? "#8b5cf6");
  const [c2, setC2] = useState(category?.colors[1] ?? "#ec4899");
  const msg = delState.status === "error" ? delState : state.status !== "idle" ? state : null;

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        startTransition(() => action(fd));
      }}
      className="card overflow-hidden"
    >
      <div className="h-20" style={{ background: `linear-gradient(120deg, ${c1}, ${c2})` }} />
      <div className="space-y-3 p-4">
        {category && <input type="hidden" name="originalId" value={category.id} />}
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="label" htmlFor={`name-${category?.id ?? "new"}`}>
              Name
            </label>
            <input id={`name-${category?.id ?? "new"}`} name="name" required maxLength={40} value={name} onChange={(e) => setName(e.target.value)} className="input" />
          </div>
          <div>
            <label className="label" htmlFor={`id-${category?.id ?? "new"}`}>
              URL id
            </label>
            <input
              id={`id-${category?.id ?? "new"}`}
              name="id"
              maxLength={40}
              defaultValue={category?.id}
              placeholder={slugify(name) || "auto"}
              className="input font-mono text-xs"
            />
          </div>
        </div>
        <div>
          <label className="label" htmlFor={`blurb-${category?.id ?? "new"}`}>
            Blurb
          </label>
          <input id={`blurb-${category?.id ?? "new"}`} name="blurb" maxLength={100} defaultValue={category?.blurb} className="input" />
        </div>
        <div className="flex items-center gap-3">
          <span className="label mb-0">Colors</span>
          <input type="color" name="color1" value={c1} onChange={(e) => setC1(e.target.value)} aria-label="First color" className="h-9 w-11 cursor-pointer rounded-lg border border-border bg-surface p-1" />
          <input type="color" name="color2" value={c2} onChange={(e) => setC2(e.target.value)} aria-label="Second color" className="h-9 w-11 cursor-pointer rounded-lg border border-border bg-surface p-1" />
          {category && <span className="ml-auto text-xs text-fg-muted">{productCount} products</span>}
        </div>
        {msg && <p className={`text-sm ${msg.status === "error" ? "text-danger" : "text-success"}`}>{msg.message}</p>}
        <div className="flex gap-2">
          <button type="submit" disabled={pending} className="btn-primary flex-1 py-2">
            {pending ? "Saving..." : category ? "Save" : "Add category"}
          </button>
          {category && (
            <button
              type="button"
              disabled={deleting}
              onClick={() => {
                if (!window.confirm(`Delete the "${category.name}" category?`)) return;
                const fd = new FormData();
                fd.set("id", category.id);
                startTransition(() => delAction(fd));
              }}
              aria-label={`Delete ${category.name}`}
              className="btn-outline px-3 py-2 text-danger hover:border-danger hover:text-danger"
            >
              <TrashIcon size={16} />
            </button>
          )}
        </div>
      </div>
    </form>
  );
}
