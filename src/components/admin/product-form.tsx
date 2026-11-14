"use client";

import Link from "next/link";
import { startTransition, useActionState, useEffect, useRef, useState } from "react";
import { adminConfig } from "@/config/admin";
import { siteConfig } from "@/config/site";
import { slugify } from "@/lib/catalog";
import { formatPrice } from "@/lib/pricing";
import { BADGES, type Category, type ColorOption, type Product } from "@/data/types";
import { saveProductAction, type FormState } from "@/server/actions/admin";
import { ArrowLeftIcon, ArrowRightIcon, CameraIcon, CloseIcon, PlusIcon, TrashIcon } from "@/components/icons";
import { ProductImage, StoredImage } from "@/components/product/product-image";
import { Select } from "@/components/ui/select";
import { Panel } from "./ui";

const TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const MAX_BYTES = 5 * 1024 * 1024;

type NewImage = { file: File; url: string };

function Field({ label, error, hint, children, htmlFor }: { label: string; error?: string; hint?: string; children: React.ReactNode; htmlFor?: string }) {
  return (
    <div>
      <label htmlFor={htmlFor} className="label">
        {label}
      </label>
      {children}
      {hint && !error && <p className="mt-1 text-xs text-fg-muted">{hint}</p>}
      {error && <p className="mt-1 text-xs text-danger">{error}</p>}
    </div>
  );
}

export function ProductForm({ product, categories, created }: { product?: Product; categories: Category[]; created?: boolean }) {
  const [state, action, pending] = useActionState<FormState, FormData>(saveProductAction, { status: "idle" });
  const errors = state.fieldErrors ?? {};

  const [name, setName] = useState(product?.name ?? "");
  const [slug, setSlug] = useState(product?.slug ?? "");
  const [slugTouched, setSlugTouched] = useState(!!product);
  const [category, setCategory] = useState(product?.category ?? categories[0]?.id ?? "");
  const [status, setStatus] = useState<Product["status"]>(product?.status ?? "draft");
  const [badge, setBadge] = useState<string>(product?.badge ?? "");
  const [price, setPrice] = useState(product ? String(product.price) : "");
  const [compareAt, setCompareAt] = useState(product?.compareAt ? String(product.compareAt) : "");
  const [colors, setColors] = useState<ColorOption[]>(product?.colors ?? [{ name: "Default", hex: "#8b5cf6" }]);
  const [kept, setKept] = useState<string[]>(product?.images ?? []);
  const [added, setAdded] = useState<NewImage[]>([]);
  const [imageError, setImageError] = useState("");
  const addedRef = useRef(added);

  useEffect(() => {
    addedRef.current = added;
  }, [added]);
  useEffect(() => () => addedRef.current.forEach((a) => URL.revokeObjectURL(a.url)), []);

  // After a successful save the server has the new images; show them as stored ones.
  useEffect(() => {
    if (state.status === "success" && product) {
      addedRef.current.forEach((a) => URL.revokeObjectURL(a.url));
      /* eslint-disable react-hooks/set-state-in-effect -- sync with the saved product after the action completes */
      setAdded([]);
      setKept(product.images ?? []);
      /* eslint-enable react-hooks/set-state-in-effect */
    }
  }, [state, product]);

  const totalImages = kept.length + added.length;

  const addFiles = (files: FileList | null) => {
    if (!files) return;
    const next = [...added];
    let error = "";
    for (const file of Array.from(files)) {
      if (kept.length + next.length >= adminConfig.maxProductImages) error = `Up to ${adminConfig.maxProductImages} images.`;
      else if (!TYPES.includes(file.type)) error = `${file.name}: use JPG, PNG, WebP or GIF.`;
      else if (file.size > MAX_BYTES) error = `${file.name} is over 5 MB.`;
      else next.push({ file, url: URL.createObjectURL(file) });
    }
    setImageError(error);
    setAdded(next);
  };

  const moveKept = (i: number, d: number) => {
    const j = i + d;
    if (j < 0 || j >= kept.length) return;
    const next = [...kept];
    [next[i], next[j]] = [next[j], next[i]];
    setKept(next);
  };

  const previewProduct: Product = {
    id: product?.id ?? "preview",
    slug,
    name: name || "Product name",
    category,
    status,
    price: Number(price) || 0,
    compareAt: Number(compareAt) || undefined,
    rating: product?.rating ?? 0,
    reviewCount: product?.reviewCount ?? 0,
    colors,
    stock: 0,
    addedAt: "",
    short: "",
    description: "",
    features: [],
    images: kept,
  };
  const previewSrc = kept[0] ?? added[0]?.url;

  return (
    <form
      // onSubmit instead of action={...}: React resets uncontrolled fields after form actions,
      // which would wipe the user's edits when the server returns a validation error.
      onSubmit={(e) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        fd.delete("newImages");
        added.forEach((a) => fd.append("newImages", a.file));
        startTransition(() => action(fd));
      }}
      className="grid gap-6 xl:grid-cols-[1fr_320px]"
    >
      {product && <input type="hidden" name="id" value={product.id} />}
      <input type="hidden" name="colors" value={JSON.stringify(colors)} />
      <input type="hidden" name="category" value={category} />
      <input type="hidden" name="status" value={status} />
      <input type="hidden" name="badge" value={badge} />
      {kept.map((u) => (
        <input key={u} type="hidden" name="keepImages" value={u} />
      ))}

      <div className="space-y-6">
        {created && state.status === "idle" && (
          <p role="status" className="rounded-xl border border-success/40 bg-success/10 px-4 py-3 text-sm font-medium text-success">
            Product created.
          </p>
        )}
        {state.status !== "idle" && (
          <p
            role={state.status === "error" ? "alert" : "status"}
            className={`rounded-xl border px-4 py-3 text-sm font-medium ${
              state.status === "error" ? "border-danger/40 bg-danger/10 text-danger" : "border-success/40 bg-success/10 text-success"
            }`}
          >
            {state.message}
          </p>
        )}

        <Panel title="Basics">
          <div className="grid gap-4 p-5 sm:grid-cols-2">
            <Field label="Name" htmlFor="name" error={errors.name}>
              <input
                id="name"
                name="name"
                required
                maxLength={120}
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  if (!slugTouched) setSlug(slugify(e.target.value));
                }}
                className="input"
              />
            </Field>
            <Field label="URL slug" htmlFor="slug" error={errors.slug} hint={`${siteConfig.url}/products/${slug || "..."}`}>
              <input
                id="slug"
                name="slug"
                required
                maxLength={80}
                value={slug}
                onChange={(e) => {
                  setSlugTouched(true);
                  setSlug(slugify(e.target.value));
                }}
                className="input font-mono text-xs"
              />
            </Field>
            <Field label="Short description" htmlFor="short" hint="Shown on product cards.">
              <input id="short" name="short" maxLength={200} defaultValue={product?.short} className="input" />
            </Field>
            <Field label="Category" htmlFor="category-select">
              <Select id="category-select" value={category} options={categories.map((c) => ({ value: c.id, label: c.name }))} onChange={setCategory} />
            </Field>
            <div className="sm:col-span-2">
              <Field label="Description" htmlFor="description">
                <textarea id="description" name="description" rows={5} maxLength={4000} defaultValue={product?.description} className="input" />
              </Field>
            </div>
          </div>
        </Panel>

        <Panel title={`Images (${totalImages}/${adminConfig.maxProductImages})`}>
          <div className="p-5">
            <p className="mb-4 text-sm text-fg-muted">The first image is the main photo. Without images the store draws an illustration in the first color.</p>
            <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 lg:grid-cols-6">
              {kept.map((src, i) => (
                <div key={src} className="group relative aspect-square overflow-hidden rounded-xl ring-1 ring-border">
                  <StoredImage src={src} alt={`Image ${i + 1}`} />
                  {i === 0 && <span className="chip absolute left-1.5 top-1.5 bg-primary text-[10px] text-primary-fg">Main</span>}
                  <div className="absolute inset-x-1.5 bottom-1.5 flex justify-between opacity-100 transition sm:opacity-0 sm:group-hover:opacity-100 sm:group-focus-within:opacity-100">
                    <span className="flex gap-1">
                      <button type="button" onClick={() => moveKept(i, -1)} disabled={i === 0} aria-label="Move left" className="grid h-7 w-7 place-items-center rounded-full bg-black/60 text-white disabled:opacity-30">
                        <ArrowLeftIcon size={14} />
                      </button>
                      <button
                        type="button"
                        onClick={() => moveKept(i, 1)}
                        disabled={i === kept.length - 1}
                        aria-label="Move right"
                        className="grid h-7 w-7 place-items-center rounded-full bg-black/60 text-white disabled:opacity-30"
                      >
                        <ArrowRightIcon size={14} />
                      </button>
                    </span>
                    <button type="button" onClick={() => setKept(kept.filter((k) => k !== src))} aria-label={`Remove image ${i + 1}`} className="grid h-7 w-7 place-items-center rounded-full bg-black/60 text-white hover:bg-danger">
                      <TrashIcon size={14} />
                    </button>
                  </div>
                </div>
              ))}
              {added.map((a, i) => (
                <div key={a.url} className="relative aspect-square overflow-hidden rounded-xl ring-2 ring-primary/60">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={a.url} alt={`New image ${i + 1}`} className="h-full w-full object-cover" />
                  <span className="chip absolute left-1.5 top-1.5 bg-accent text-[10px] text-accent-fg">New</span>
                  <button
                    type="button"
                    onClick={() => {
                      URL.revokeObjectURL(a.url);
                      setAdded(added.filter((x) => x !== a));
                    }}
                    aria-label={`Remove new image ${i + 1}`}
                    className="absolute bottom-1.5 right-1.5 grid h-7 w-7 place-items-center rounded-full bg-black/60 text-white hover:bg-danger"
                  >
                    <CloseIcon size={14} />
                  </button>
                </div>
              ))}
              {totalImages < adminConfig.maxProductImages && (
                <label className="grid aspect-square cursor-pointer place-items-center rounded-xl border-2 border-dashed border-border text-fg-muted transition hover:border-primary hover:bg-primary/5 hover:text-primary-ink">
                  <span className="flex flex-col items-center gap-1 text-xs font-medium">
                    <CameraIcon size={24} /> Add images
                  </span>
                  <input
                    type="file"
                    accept={TYPES.join(",")}
                    multiple
                    className="sr-only"
                    onChange={(e) => {
                      addFiles(e.target.files);
                      e.target.value = "";
                    }}
                  />
                </label>
              )}
            </div>
            <p className="mt-2 text-xs text-fg-muted">JPG, PNG, WebP or GIF, up to 5 MB each. New images upload when you save.</p>
            {imageError && <p className="mt-1 text-xs text-danger">{imageError}</p>}
          </div>
        </Panel>

        <Panel title="Pricing and inventory">
          <div className="grid gap-4 p-5 sm:grid-cols-3">
            <Field label={`Price (${siteConfig.currency.code})`} htmlFor="price" error={errors.price}>
              <input id="price" name="price" type="number" step="0.01" min="0" required value={price} onChange={(e) => setPrice(e.target.value)} className="input" />
            </Field>
            <Field label="Compare-at price" htmlFor="compareAt" error={errors.compareAt} hint="Higher than price = on sale.">
              <input id="compareAt" name="compareAt" type="number" step="0.01" min="0" value={compareAt} onChange={(e) => setCompareAt(e.target.value)} className="input" />
            </Field>
            <Field label="Stock" htmlFor="stock" error={errors.stock}>
              <input id="stock" name="stock" type="number" step="1" min="0" required defaultValue={product?.stock ?? 0} className="input" />
            </Field>
          </div>
        </Panel>

        <Panel title="Variants">
          <div className="grid gap-6 p-5 lg:grid-cols-2">
            <div>
              <p className="label">Colors</p>
              <ul className="space-y-2">
                {colors.map((c, i) => (
                  <li key={i} className="flex items-center gap-2">
                    <input
                      type="color"
                      value={c.hex}
                      onChange={(e) => setColors(colors.map((x, j) => (j === i ? { ...x, hex: e.target.value } : x)))}
                      aria-label={`Color ${i + 1} swatch`}
                      className="h-10 w-12 shrink-0 cursor-pointer rounded-lg border border-border bg-surface p-1"
                    />
                    <input
                      value={c.name}
                      onChange={(e) => setColors(colors.map((x, j) => (j === i ? { ...x, name: e.target.value } : x)))}
                      aria-label={`Color ${i + 1} name`}
                      placeholder="Color name"
                      maxLength={30}
                      className="input"
                    />
                    <button
                      type="button"
                      onClick={() => setColors(colors.filter((_, j) => j !== i))}
                      disabled={colors.length === 1}
                      aria-label={`Remove color ${i + 1}`}
                      className="btn-ghost h-10 w-10 shrink-0 p-0 text-fg-muted hover:text-danger"
                    >
                      <TrashIcon size={16} />
                    </button>
                  </li>
                ))}
              </ul>
              {colors.length < 12 && (
                <button type="button" onClick={() => setColors([...colors, { name: "", hex: "#ec4899" }])} className="btn-ghost mt-2 px-3 py-1.5 text-sm text-primary-ink">
                  <PlusIcon size={14} /> Add color
                </button>
              )}
              {errors.colors && <p className="mt-1 text-xs text-danger">{errors.colors}</p>}
            </div>
            <div className="space-y-4">
              <Field label="Sizes" htmlFor="sizes" hint="One per line. Leave empty if the product has no sizes.">
                <textarea id="sizes" name="sizes" rows={3} defaultValue={product?.sizes?.join("\n")} className="input font-mono text-xs" placeholder={"S\nM\nL"} />
              </Field>
              <Field label="Features" htmlFor="features" hint="One per line, shown as a bullet list.">
                <textarea id="features" name="features" rows={4} defaultValue={product?.features.join("\n")} className="input" />
              </Field>
            </div>
          </div>
        </Panel>
      </div>

      {/* Sidebar */}
      <aside className="space-y-6 xl:sticky xl:top-24 xl:self-start">
        <Panel title="Publishing">
          <div className="space-y-4 p-5">
            <Field label="Status" htmlFor="status-select">
              <Select
                id="status-select"
                value={status}
                options={[
                  { value: "active", label: "Active - visible in store" },
                  { value: "draft", label: "Draft - hidden" },
                ]}
                onChange={setStatus}
              />
            </Field>
            <Field label="Badge" htmlFor="badge-select">
              <Select id="badge-select" value={badge} options={[{ value: "", label: "None" }, ...BADGES.map((b) => ({ value: b, label: b }))]} onChange={setBadge} />
            </Field>
            <label className="flex cursor-pointer items-center gap-2 text-sm">
              <input type="checkbox" name="featured" defaultChecked={product?.featured} className="h-4 w-4 accent-[var(--primary)]" />
              Feature on the home page
            </label>
            <div className="flex gap-2 pt-2">
              <button type="submit" disabled={pending} className="btn-primary flex-1">
                {pending ? "Saving..." : product ? "Save changes" : "Create product"}
              </button>
              <Link href="/admin/products" className="btn-outline">
                Cancel
              </Link>
            </div>
          </div>
        </Panel>

        <Panel title="Preview">
          <div className="p-4">
            <div className="overflow-hidden rounded-theme border border-border">
              <div className="aspect-square">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                {previewSrc && !kept.length ? <img src={previewSrc} alt="" className="h-full w-full object-cover" /> : <ProductImage product={previewProduct} />}
              </div>
              <div className="space-y-1 p-3">
                <p className="truncate font-semibold">{previewProduct.name}</p>
                <p className="text-sm">
                  <span className={previewProduct.compareAt && previewProduct.compareAt > previewProduct.price ? "font-bold text-accent-ink" : "font-bold"}>{formatPrice(previewProduct.price)}</span>
                  {previewProduct.compareAt && previewProduct.compareAt > previewProduct.price && (
                    <span className="ml-2 text-fg-muted line-through">{formatPrice(previewProduct.compareAt)}</span>
                  )}
                </p>
              </div>
            </div>
            {product && status === "active" && (
              <Link href={`/products/${product.slug}`} target="_blank" className="mt-3 block text-center text-sm font-semibold text-primary-ink">
                View in store
              </Link>
            )}
          </div>
        </Panel>
      </aside>
    </form>
  );
}
