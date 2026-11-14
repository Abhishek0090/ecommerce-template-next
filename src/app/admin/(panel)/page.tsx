import Link from "next/link";
import { adminConfig } from "@/config/admin";
import { formatPrice } from "@/lib/pricing";
import { requireAdmin } from "@/server/auth";
import { listOrders, listProducts, listReviews } from "@/server/repo";
import { Badge, Notice, PageHeader, Panel, StatCard, EmptyState } from "@/components/admin/ui";
import { AdminIcon } from "@/components/admin/admin-icons";
import { RevenueChart, type DayRevenue } from "@/components/admin/revenue-chart";
import { ProductImage } from "@/components/product/product-image";
import { Rating } from "@/components/product/rating";
import { orderTone } from "@/components/admin/status";

const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? "" : "s"}`;

export default async function DashboardPage({ searchParams }: { searchParams: Promise<{ reset?: string }> }) {
  await requireAdmin();
  const { reset } = await searchParams;
  const [products, orders, pending] = await Promise.all([listProducts({ includeDrafts: true }), listOrders(), listReviews({ status: "pending" })]);

  const paid = orders.filter((o) => o.status !== "cancelled");
  const revenue = paid.reduce((s, o) => s + o.totals.total, 0);
  const lowStock = products.filter((p) => p.status === "active" && p.stock <= adminConfig.lowStockThreshold).sort((a, b) => a.stock - b.stock);

  // Last 14 days, oldest first, with empty days included.
  const days: DayRevenue[] = Array.from({ length: 14 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (13 - i));
    const key = d.toISOString().slice(0, 10);
    const dayOrders = paid.filter((o) => o.createdAt.slice(0, 10) === key);
    return { date: key, total: dayOrders.reduce((s, o) => s + o.totals.total, 0), orders: dayOrders.length };
  });
  const last14 = days.reduce((s, d) => s + d.total, 0);

  return (
    <>
      {reset && <Notice>Demo data restored.</Notice>}
      <PageHeader
        title="Dashboard"
        description="Your store at a glance."
        actions={
          <Link href="/admin/products/new" className="btn-primary">
            New product
          </Link>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Revenue" value={formatPrice(revenue)} hint={`${formatPrice(last14)} in the last 14 days`} icon={<AdminIcon name="revenue" />} />
        <StatCard label="Orders" value={String(orders.length)} hint={`${orders.filter((o) => o.status === "paid").length} waiting to ship`} icon={<AdminIcon name="orders" />} tone="accent" />
        <StatCard
          label="Products"
          value={String(products.length)}
          hint={plural(products.filter((p) => p.status === "draft").length, "draft")}
          icon={<AdminIcon name="products" />}
          tone="success"
        />
        <StatCard label="Pending reviews" value={String(pending.length)} hint="Waiting for approval" icon={<AdminIcon name="reviews" />} tone="warning" />
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[1.6fr_1fr]">
        <Panel title="Daily revenue, last 14 days">
          <div className="p-5">
            {last14 > 0 ? (
              <RevenueChart days={days} />
            ) : (
              <EmptyState title="No sales in the last 14 days" body="Place a test order on the store and it will show up here." />
            )}
          </div>
        </Panel>

        <Panel
          title="Low stock"
          action={
            <Link href="/admin/products?sort=stock" className="text-sm font-semibold text-primary-ink">
              View all
            </Link>
          }
        >
          {lowStock.length ? (
            <ul className="divide-y divide-border">
              {lowStock.slice(0, 6).map((p) => (
                <li key={p.id}>
                  <Link href={`/admin/products/${p.id}`} className="flex items-center gap-3 px-5 py-3 hover:bg-surface-2/60">
                    <span className="h-10 w-10 shrink-0 overflow-hidden rounded-lg">
                      <ProductImage product={p} />
                    </span>
                    <span className="min-w-0 flex-1 truncate text-sm font-medium">{p.name}</span>
                    <Badge tone={p.stock === 0 ? "danger" : "warning"}>{p.stock === 0 ? "Sold out" : `${p.stock} left`}</Badge>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState title="Everything is well stocked" />
          )}
        </Panel>
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-2">
        <Panel
          title="Recent orders"
          action={
            <Link href="/admin/orders" className="text-sm font-semibold text-primary-ink">
              View all
            </Link>
          }
        >
          {orders.length ? (
            <ul className="divide-y divide-border">
              {orders.slice(0, 5).map((o) => (
                <li key={o.id}>
                  <Link href={`/admin/orders/${o.id}`} className="flex items-center gap-3 px-5 py-3 text-sm hover:bg-surface-2/60">
                    <span className="font-mono font-semibold">{o.id}</span>
                    <span className="min-w-0 flex-1 truncate text-fg-muted">
                      {o.address.firstName} {o.address.lastName}
                    </span>
                    <Badge tone={orderTone[o.status]}>{o.status}</Badge>
                    <span className="w-20 text-right font-semibold tabular-nums">{formatPrice(o.totals.total)}</span>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState title="No orders yet" body="Orders placed on the store appear here." />
          )}
        </Panel>

        <Panel
          title="Reviews to moderate"
          action={
            <Link href="/admin/reviews" className="text-sm font-semibold text-primary-ink">
              Moderate
            </Link>
          }
        >
          {pending.length ? (
            <ul className="divide-y divide-border">
              {pending.slice(0, 5).map((r) => (
                <li key={r.id} className="px-5 py-3">
                  <div className="flex items-center justify-between gap-3">
                    <Rating value={r.rating} />
                    <span className="text-xs text-fg-muted">{r.date}</span>
                  </div>
                  <p className="mt-1 truncate text-sm font-medium">
                    {r.title} <span className="font-normal text-fg-muted">- {products.find((p) => p.id === r.productId)?.name}</span>
                  </p>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState title="All caught up" body="New reviews from customers will wait here for approval." />
          )}
        </Panel>
      </div>
    </>
  );
}
