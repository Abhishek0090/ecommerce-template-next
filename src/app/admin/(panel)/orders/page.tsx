import type { Metadata } from "next";
import Link from "next/link";
import { ORDER_STATUSES, type OrderStatus } from "@/data/types";
import { formatPrice } from "@/lib/pricing";
import { requireAdmin } from "@/server/auth";
import { listOrders } from "@/server/repo";
import { Badge, EmptyState, PageHeader, Panel, Table, Tabs, Td } from "@/components/admin/ui";
import { orderTone } from "@/components/admin/status";

export const metadata: Metadata = { title: "Orders" };

export default async function OrdersPage({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  await requireAdmin();
  const sp = await searchParams;
  const status = ORDER_STATUSES.includes(sp.status as OrderStatus) ? (sp.status as OrderStatus) : undefined;
  const all = await listOrders();
  const orders = status ? all.filter((o) => o.status === status) : all;

  return (
    <>
      <PageHeader title="Orders" description="Orders placed through checkout. Cancelling an order puts its items back in stock." />
      <Tabs
        active={status ?? "all"}
        items={[
          { value: "all", label: "All", href: "/admin/orders", count: all.length },
          ...ORDER_STATUSES.map((s) => ({ value: s, label: s[0].toUpperCase() + s.slice(1), href: `/admin/orders?status=${s}`, count: all.filter((o) => o.status === s).length })),
        ]}
      />
      <Panel>
        {orders.length ? (
          <Table head={["Order", "Date", "Customer", "Items", "Status", "Total"]}>
            {orders.map((o) => (
              <tr key={o.id} className="hover:bg-surface-2/50">
                <Td>
                  <Link href={`/admin/orders/${o.id}`} className="font-mono font-semibold text-primary-ink">
                    {o.id}
                  </Link>
                </Td>
                <Td className="whitespace-nowrap text-fg-muted">{new Date(o.createdAt).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })}</Td>
                <Td>
                  {o.address.firstName} {o.address.lastName}
                  <span className="block text-xs text-fg-muted">{o.address.email}</span>
                </Td>
                <Td className="tabular-nums">{o.totals.items}</Td>
                <Td>
                  <Badge tone={orderTone[o.status]}>{o.status}</Badge>
                </Td>
                <Td className="text-right font-semibold tabular-nums">{formatPrice(o.totals.total)}</Td>
              </tr>
            ))}
          </Table>
        ) : (
          <EmptyState title="No orders here" body="Place a test order in the store (card 4242 4242 4242 4242) to see it in this list." />
        )}
      </Panel>
    </>
  );
}
