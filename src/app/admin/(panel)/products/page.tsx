import type { Metadata } from "next";
import Link from "next/link";
import { adminConfig } from "@/config/admin";
import { formatPrice } from "@/lib/pricing";
import { isOnSale } from "@/lib/catalog";
import { requireAdmin } from "@/server/auth";
import { listCategories, listProducts } from "@/server/repo";
import { deleteProductAction, setProductStatusAction } from "@/server/actions/admin";
import { Badge, EmptyState, PageHeader, Panel, Table, Td } from "@/components/admin/ui";
import { FilterBar } from "@/components/admin/filter-bar";
import { ConfirmButton } from "@/components/admin/confirm-button";
import { productTone } from "@/components/admin/status";
import { ProductImage } from "@/components/product/product-image";
import { TrashIcon } from "@/components/icons";

export const metadata: Metadata = { title: "Products" };

const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? "" : "s"}`;

type SP = Promise<{ q?: string; category?: string; status?: string; sort?: string }>;

export default async function ProductsAdminPage({ searchParams }: { searchParams: SP }) {
  await requireAdmin();
  const sp = await searchParams;
  const [all, categories] = await Promise.all([listProducts({ includeDrafts: true }), listCategories()]);
  const q = sp.q?.toLowerCase();
  const products = all
    .filter((p) => (!q || `${p.name} ${p.slug}`.toLowerCase().includes(q)) && (!sp.category || p.category === sp.category) && (!sp.status || p.status === sp.status))
    .sort((a, b) =>
      sp.sort === "stock" ? a.stock - b.stock : sp.sort === "price" ? b.price - a.price : sp.sort === "name" ? a.name.localeCompare(b.name) : b.addedAt.localeCompare(a.addedAt),
    );
  const catName = (id: string) => categories.find((c) => c.id === id)?.name ?? id;

  return (
    <>
      <PageHeader
        title="Products"
        description={`${all.length} products, ${plural(all.filter((p) => p.status === "draft").length, "draft")}`}
        actions={
          <Link href="/admin/products/new" className="btn-primary">
            New product
          </Link>
        }
      />
      <FilterBar
        searchPlaceholder="Search products"
        selects={[
          { name: "category", label: "Category", options: [{ value: "", label: "All categories" }, ...categories.map((c) => ({ value: c.id, label: c.name }))] },
          {
            name: "status",
            label: "Status",
            options: [
              { value: "", label: "Any status" },
              { value: "active", label: "Active" },
              { value: "draft", label: "Draft" },
            ],
          },
          {
            name: "sort",
            label: "Sort",
            options: [
              { value: "", label: "Newest" },
              { value: "name", label: "Name A-Z" },
              { value: "price", label: "Price high-low" },
              { value: "stock", label: "Stock low-high" },
            ],
          },
        ]}
      />
      <Panel>
        {products.length ? (
          <Table head={["Product", "Category", "Price", "Stock", "Status", ""]}>
            {products.map((p) => (
              <tr key={p.id} className="hover:bg-surface-2/50">
                <Td>
                  <Link href={`/admin/products/${p.id}`} className="flex items-center gap-3">
                    <span className="h-11 w-11 shrink-0 overflow-hidden rounded-lg ring-1 ring-border">
                      <ProductImage product={p} />
                    </span>
                    <span className="min-w-0">
                      <span className="block truncate font-semibold hover:text-primary-ink">{p.name}</span>
                      <span className="block truncate text-xs text-fg-muted">/{p.slug}</span>
                    </span>
                  </Link>
                </Td>
                <Td className="text-fg-muted">{catName(p.category)}</Td>
                <Td className="tabular-nums">
                  {formatPrice(p.price)}
                  {isOnSale(p) && <span className="ml-1.5 text-xs text-fg-muted line-through">{formatPrice(p.compareAt!)}</span>}
                </Td>
                <Td>
                  <Badge tone={p.stock === 0 ? "danger" : p.stock <= adminConfig.lowStockThreshold ? "warning" : "neutral"}>{p.stock}</Badge>
                </Td>
                <Td>
                  <ConfirmButton
                    action={setProductStatusAction.bind(null, p.id, p.status === "active" ? "draft" : "active")}
                    className="cursor-pointer"
                    title={p.status === "active" ? "Click to unpublish" : "Click to publish"}
                  >
                    <Badge tone={productTone[p.status]}>{p.status}</Badge>
                  </ConfirmButton>
                </Td>
                <Td className="text-right">
                  <div className="flex justify-end gap-1">
                    <Link href={`/admin/products/${p.id}`} className="btn-ghost px-3 py-1.5 text-xs">
                      Edit
                    </Link>
                    <ConfirmButton
                      action={deleteProductAction.bind(null, p.id)}
                      confirm={`Delete "${p.name}"? Its reviews and images are deleted too.`}
                      className="btn-ghost px-2.5 py-1.5 text-danger"
                      title={`Delete ${p.name}`}
                    >
                      <TrashIcon size={16} />
                    </ConfirmButton>
                  </div>
                </Td>
              </tr>
            ))}
          </Table>
        ) : (
          <EmptyState
            title="No products found"
            body="Try another search or filter, or add your first product."
            action={
              <Link href="/admin/products/new" className="btn-primary">
                New product
              </Link>
            }
          />
        )}
      </Panel>
    </>
  );
}
