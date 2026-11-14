import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { formatPrice } from "@/lib/pricing";
import { requireAdmin } from "@/server/auth";
import { getOrder } from "@/server/repo";
import { Badge, PageHeader, Panel } from "@/components/admin/ui";
import { orderTone } from "@/components/admin/status";
import { OrderStatusControl } from "@/components/admin/order-status-control";
import { TotalsTable } from "@/components/cart/cart-summary";
import { ArrowLeftIcon } from "@/components/icons";

export const metadata: Metadata = { title: "Order" };

export default async function OrderPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const order = await getOrder((await params).id);
  if (!order) notFound();
  const a = order.address;

  return (
    <>
      <Link href="/admin/orders" className="mb-4 inline-flex items-center gap-1 text-sm font-semibold text-primary-ink">
        <ArrowLeftIcon size={16} /> All orders
      </Link>
      <PageHeader
        title={`Order ${order.id}`}
        description={new Date(order.createdAt).toLocaleString(undefined, { dateStyle: "full", timeStyle: "short" })}
        actions={<Badge tone={orderTone[order.status]}>{order.status}</Badge>}
      />
      <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
        <Panel title="Items">
          <ul className="divide-y divide-border">
            {order.lines.map((l) => (
              <li key={l.key} className="flex items-center justify-between gap-4 px-5 py-3 text-sm">
                <div>
                  <Link href={`/admin/products/${l.productId}`} className="font-semibold hover:text-primary-ink">
                    {l.name}
                  </Link>
                  <p className="text-xs text-fg-muted">
                    {[l.color, l.size && `Size ${l.size}`].filter(Boolean).join(" / ")} - {l.qty} x {formatPrice(l.price)}
                  </p>
                </div>
                <span className="font-semibold tabular-nums">{formatPrice(l.price * l.qty)}</span>
              </li>
            ))}
          </ul>
          <div className="border-t border-border p-5">
            <TotalsTable totals={order.totals} shippingLabel={order.shippingMethod === "express" ? "Express shipping" : "Shipping"} />
            {order.coupon && <p className="mt-3 text-xs text-fg-muted">Coupon: {order.coupon}</p>}
          </div>
        </Panel>
        <div className="space-y-6">
          <Panel title="Status">
            <div className="p-5">
              <OrderStatusControl id={order.id} status={order.status} />
            </div>
          </Panel>
          <Panel title="Customer">
            <div className="space-y-3 p-5 text-sm">
              <p>
                <span className="font-semibold">
                  {a.firstName} {a.lastName}
                </span>
                <br />
                <a href={`mailto:${a.email}`} className="text-primary-ink">
                  {a.email}
                </a>
                {a.phone && (
                  <>
                    <br />
                    {a.phone}
                  </>
                )}
              </p>
              <p className="text-fg-muted">
                {a.address}
                <br />
                {a.city} {a.postcode}
                <br />
                {a.country}
              </p>
              <p className="text-fg-muted">
                {order.shippingMethod === "express" ? "Express" : "Standard"} shipping - card ending {order.paymentLast4}
              </p>
            </div>
          </Panel>
        </div>
      </div>
    </>
  );
}
