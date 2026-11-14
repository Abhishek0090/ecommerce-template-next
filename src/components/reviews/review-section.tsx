"use client";

import { useMemo, useState } from "react";
import { siteConfig } from "@/config/site";
import { ratingBreakdown } from "@/lib/catalog";
import type { Product, Review } from "@/data/types";
import { CameraIcon, CheckIcon } from "@/components/icons";
import { Rating } from "@/components/product/rating";
import { StoredImage } from "@/components/product/product-image";
import { Lightbox, type LightboxPhoto } from "./lightbox";
import { ReviewForm } from "./review-form";

type Filter = "all" | "photos" | 1 | 2 | 3 | 4 | 5;

export function ReviewSection({ product, reviews }: { product: Product; reviews: Review[] }) {
  const [filter, setFilter] = useState<Filter>("all");
  const [writing, setWriting] = useState(false);
  const [viewer, setViewer] = useState<{ photos: LightboxPhoto[]; index: number } | null>(null);

  const breakdown = ratingBreakdown(reviews);
  const allPhotos = useMemo(
    () => reviews.flatMap((r) => r.images.map((src) => ({ src, caption: `${r.author} - "${r.title}"` }))),
    [reviews],
  );
  const shown = reviews.filter((r) => (filter === "all" ? true : filter === "photos" ? r.images.length > 0 : Math.round(r.rating) === filter));
  const date = (d: string) => new Date(d).toLocaleDateString(siteConfig.currency.locale, { dateStyle: "medium" });

  const chip = (value: Filter, label: string) => (
    <button
      key={String(value)}
      type="button"
      onClick={() => setFilter(value)}
      aria-pressed={filter === value}
      className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${
        filter === value ? "bg-primary text-primary-fg" : "bg-surface-2 text-fg-muted hover:text-fg"
      }`}
    >
      {label}
    </button>
  );

  return (
    <section id="reviews" className="scroll-mt-24">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <h2 className="text-2xl font-bold">Customer reviews</h2>
        {!writing && (
          <button type="button" onClick={() => setWriting(true)} className="btn-primary">
            Write a review
          </button>
        )}
      </div>

      <div className="grid gap-8 lg:grid-cols-[300px_1fr]">
        {/* Summary */}
        <aside className="space-y-6">
          <div className="card p-6">
            <div className="flex items-end gap-3">
              <span className="text-5xl font-black leading-none">{product.rating.toFixed(1)}</span>
              <div className="pb-1">
                <Rating value={product.rating} size={18} />
                <p className="mt-1 text-xs text-fg-muted">Based on {product.reviewCount} ratings</p>
              </div>
            </div>
            <ul className="mt-5 space-y-2">
              {breakdown.map(({ stars, count }) => {
                const pct = reviews.length ? (count / reviews.length) * 100 : 0;
                return (
                  <li key={stars}>
                    <button
                      type="button"
                      onClick={() => setFilter(filter === stars ? "all" : (stars as Filter))}
                      disabled={!count}
                      className="group flex w-full items-center gap-3 text-sm disabled:opacity-50"
                      aria-label={`${stars} star reviews: ${count}`}
                    >
                      <span className="w-6 shrink-0 text-left font-medium tabular-nums">{stars}★</span>
                      <span className="h-2 flex-1 overflow-hidden rounded-full bg-surface-2">
                        <span className="block h-full rounded-full bg-amber-400 transition-all group-hover:bg-amber-500" style={{ width: `${pct}%` }} />
                      </span>
                      <span className="w-6 shrink-0 text-right text-xs text-fg-muted tabular-nums">{count}</span>
                    </button>
                  </li>
                );
              })}
            </ul>
            <p className="mt-3 text-xs text-fg-muted">Bars show the {reviews.length} written {reviews.length === 1 ? "review" : "reviews"}.</p>
          </div>

          {allPhotos.length > 0 && (
            <div className="card p-5">
              <p className="mb-3 flex items-center gap-2 text-sm font-semibold">
                <CameraIcon size={16} className="text-primary-ink" /> Customer photos ({allPhotos.length})
              </p>
              <div className="grid grid-cols-4 gap-2">
                {allPhotos.slice(0, 8).map((p, i) => (
                  <button
                    key={p.src + i}
                    type="button"
                    onClick={() => setViewer({ photos: allPhotos, index: i })}
                    className="relative aspect-square overflow-hidden rounded-lg ring-1 ring-border transition hover:scale-105 hover:ring-primary"
                    aria-label={`Open customer photo ${i + 1}`}
                  >
                    <StoredImage src={p.src} alt="" />
                    {i === 7 && allPhotos.length > 8 && (
                      <span className="absolute inset-0 grid place-items-center bg-black/55 text-sm font-bold text-white">+{allPhotos.length - 8}</span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}
        </aside>

        {/* List */}
        <div className="space-y-4">
          {writing && <ReviewForm productId={product.id} productName={product.name} onDone={() => setWriting(false)} />}

          {reviews.length > 0 && (
            <div className="flex flex-wrap gap-2" role="group" aria-label="Filter reviews">
              {chip("all", `All (${reviews.length})`)}
              {allPhotos.length > 0 && chip("photos", `With photos (${reviews.filter((r) => r.images.length).length})`)}
              {breakdown.filter((b) => b.count).map((b) => chip(b.stars as Filter, `${b.stars}★`))}
            </div>
          )}

          {shown.length === 0 && !writing && (
            <p className="card p-6 text-sm text-fg-muted">
              {reviews.length ? "No reviews match this filter." : "No written reviews yet. Bought this? Be the first to share your thoughts and photos."}
            </p>
          )}

          {shown.map((r) => (
            <article key={r.id} className="card p-5">
              <div className="flex items-center justify-between gap-3">
                <Rating value={r.rating} />
                <time className="text-xs text-fg-muted" dateTime={r.date}>
                  {date(r.date)}
                </time>
              </div>
              <h3 className="mt-2 font-semibold">{r.title}</h3>
              <p className="mt-1 text-sm text-fg-muted">{r.body}</p>
              {r.images.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {r.images.map((src, i) => (
                    <button
                      key={src + i}
                      type="button"
                      onClick={() => setViewer({ photos: r.images.map((s) => ({ src: s, caption: `${r.author} - "${r.title}"` })), index: i })}
                      className="h-20 w-20 overflow-hidden rounded-xl ring-1 ring-border transition hover:scale-105 hover:ring-primary"
                      aria-label={`Open photo ${i + 1} from ${r.author}`}
                    >
                      <StoredImage src={src} alt="" />
                    </button>
                  ))}
                </div>
              )}
              <p className="mt-3 flex items-center gap-2 text-xs font-medium">
                <span className="bg-brand-gradient grid h-6 w-6 place-items-center rounded-full text-[10px] text-white">{r.author[0]}</span>
                {r.author}
                {r.verified && (
                  <span className="inline-flex items-center gap-1 text-success">
                    <CheckIcon size={12} /> Verified buyer
                  </span>
                )}
              </p>
            </article>
          ))}
        </div>
      </div>

      {viewer && <Lightbox photos={viewer.photos} index={viewer.index} onIndex={(index) => setViewer({ ...viewer, index })} onClose={() => setViewer(null)} />}
    </section>
  );
}
