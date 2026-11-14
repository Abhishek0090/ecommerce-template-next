import type { Metadata } from "next";
import Link from "next/link";
import type { ReviewStatus } from "@/data/types";
import { requireAdmin } from "@/server/auth";
import { listProducts, listReviews } from "@/server/repo";
import { deleteReviewAction, setReviewStatusAction } from "@/server/actions/admin";
import { Badge, EmptyState, PageHeader, Panel, Tabs } from "@/components/admin/ui";
import { ConfirmButton } from "@/components/admin/confirm-button";
import { reviewTone } from "@/components/admin/status";
import { Rating } from "@/components/product/rating";
import { StoredImage } from "@/components/product/product-image";
import { CheckIcon, CloseIcon, TrashIcon } from "@/components/icons";

export const metadata: Metadata = { title: "Reviews" };

const STATUSES: ReviewStatus[] = ["pending", "approved", "rejected"];

export default async function ReviewsPage({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  await requireAdmin();
  const sp = await searchParams;
  const status = STATUSES.includes(sp.status as ReviewStatus) ? (sp.status as ReviewStatus) : "pending";
  const [all, products] = await Promise.all([listReviews(), listProducts({ includeDrafts: true })]);
  const reviews = all.filter((r) => r.status === status);
  const productOf = (id: string) => products.find((p) => p.id === id);

  return (
    <>
      <PageHeader title="Reviews" description="Approve reviews to publish them. Approved ratings update the product's average." />
      <Tabs
        active={status}
        items={STATUSES.map((s) => ({ value: s, label: s[0].toUpperCase() + s.slice(1), href: `/admin/reviews?status=${s}`, count: all.filter((r) => r.status === s).length }))}
      />
      {reviews.length === 0 ? (
        <Panel>
          <EmptyState title={status === "pending" ? "All caught up" : `No ${status} reviews`} body={status === "pending" ? "New reviews from customers wait here for approval." : undefined} />
        </Panel>
      ) : (
        <div className="space-y-4">
          {reviews.map((r) => {
            const product = productOf(r.productId);
            return (
              <article key={r.id} className="card p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <Rating value={r.rating} />
                      <Badge tone={reviewTone[r.status]}>{r.status}</Badge>
                      {r.images.length > 0 && <Badge tone="primary">{r.images.length} photo{r.images.length > 1 ? "s" : ""}</Badge>}
                    </div>
                    <h2 className="mt-2 font-semibold">{r.title}</h2>
                    <p className="mt-1 whitespace-pre-line text-sm text-fg-muted">{r.body}</p>
                  </div>
                  <div className="flex shrink-0 gap-2">
                    {r.status !== "approved" && (
                      <ConfirmButton action={setReviewStatusAction.bind(null, r.id, "approved")} className="btn-primary px-3 py-2 text-xs">
                        <CheckIcon size={14} /> Approve
                      </ConfirmButton>
                    )}
                    {r.status !== "rejected" && (
                      <ConfirmButton action={setReviewStatusAction.bind(null, r.id, "rejected")} className="btn-outline px-3 py-2 text-xs">
                        <CloseIcon size={14} /> Reject
                      </ConfirmButton>
                    )}
                    <ConfirmButton
                      action={deleteReviewAction.bind(null, r.id)}
                      confirm="Delete this review and its photos permanently?"
                      className="btn-ghost px-2.5 py-2 text-danger"
                      title="Delete review"
                    >
                      <TrashIcon size={16} />
                    </ConfirmButton>
                  </div>
                </div>
                {r.images.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {r.images.map((src, i) => (
                      <a key={src + i} href={src.startsWith("art:") ? undefined : src} target="_blank" rel="noreferrer" className="h-24 w-24 overflow-hidden rounded-xl ring-1 ring-border">
                        <StoredImage src={src} alt={`Photo ${i + 1} from ${r.author}`} />
                      </a>
                    ))}
                  </div>
                )}
                <p className="mt-3 text-xs text-fg-muted">
                  <span className="font-semibold text-fg">{r.author}</span> on {r.date} for{" "}
                  {product ? (
                    <Link href={`/admin/products/${product.id}`} className="font-semibold text-primary-ink">
                      {product.name}
                    </Link>
                  ) : (
                    "a deleted product"
                  )}
                </p>
              </article>
            );
          })}
        </div>
      )}
    </>
  );
}
