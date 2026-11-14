import type { Metadata } from "next";
import Link from "next/link";
import { priceBounds, queryProducts, SORT_OPTIONS, type SortKey } from "@/lib/catalog";
import { listCategories, listProducts } from "@/server/repo";
import { ProductGrid } from "@/components/product/product-card";
import { ShopFilters } from "@/components/shop/shop-filters";

export const metadata: Metadata = { title: "Shop" };

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);
const num = (v: string | undefined) => (v && !Number.isNaN(Number(v)) ? Number(v) : undefined);

export default async function ProductsPage({ searchParams }: { searchParams: SearchParams }) {
  const sp = await searchParams;
  const [products, categories] = await Promise.all([listProducts(), listCategories()]);
  const sortParam = one(sp.sort);
  const query = {
    q: one(sp.q),
    category: one(sp.category),
    sale: one(sp.sale) === "1",
    inStock: one(sp.stock) === "1",
    min: num(one(sp.min)),
    max: num(one(sp.max)),
    sort: SORT_OPTIONS.some((o) => o.value === sortParam) ? (sortParam as SortKey) : "featured",
  };
  const results = queryProducts(products, query);
  const category = query.category ? categories.find((c) => c.id === query.category) : undefined;
  const title = query.q ? `Results for "${query.q}"` : category ? category.name : query.sale ? "On sale" : "All products";

  return (
    <div className="container-x py-10">
      <nav className="mb-4 text-sm text-fg-muted" aria-label="Breadcrumb">
        <Link href="/" className="hover:text-primary-ink">
          Home
        </Link>{" "}
        / <span className="text-fg">Shop</span>
      </nav>
      <div
        className="mb-8 overflow-hidden rounded-3xl px-6 py-10 text-white sm:px-10"
        style={
          category
            ? { background: `linear-gradient(120deg, ${category.colors[0]}, ${category.colors[1]})` }
            : { background: "linear-gradient(120deg, var(--grad-1), var(--grad-2), var(--grad-3))" }
        }
      >
        <h1 className="text-3xl font-black sm:text-4xl">{title}</h1>
        <p className="mt-1 text-white/85">{category ? category.blurb : `${products.length} products in ${categories.length} categories`}</p>
      </div>

      <div className="grid gap-8 lg:grid-cols-[260px_1fr]">
        <ShopFilters key={JSON.stringify(sp)} categories={categories} bounds={priceBounds(products)} />
        <section aria-label="Products">
          <p className="mb-4 text-sm text-fg-muted">
            {results.length} {results.length === 1 ? "product" : "products"}
          </p>
          {results.length ? (
            <ProductGrid products={results} priorityCount={4} />
          ) : (
            <div className="card flex flex-col items-center gap-3 p-12 text-center">
              <p className="text-lg font-semibold">No products match these filters</p>
              <Link href="/products" className="btn-primary">
                Clear filters
              </Link>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
