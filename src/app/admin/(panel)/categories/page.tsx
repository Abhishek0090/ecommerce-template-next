import type { Metadata } from "next";
import { requireAdmin } from "@/server/auth";
import { listCategories, listProducts } from "@/server/repo";
import { PageHeader } from "@/components/admin/ui";
import { CategoryForm } from "@/components/admin/category-form";

export const metadata: Metadata = { title: "Categories" };

export default async function CategoriesPage() {
  await requireAdmin();
  const [categories, products] = await Promise.all([listCategories(), listProducts({ includeDrafts: true })]);
  return (
    <>
      <PageHeader title="Categories" description="Shown as colored tiles on the home page and as filters in the shop." />
      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
        {categories.map((c) => (
          // key includes colors so the form resets after a save changes them
          <CategoryForm key={c.id + c.colors.join()} category={c} productCount={products.filter((p) => p.category === c.id).length} />
        ))}
        <div>
          <p className="mb-2 text-sm font-semibold text-fg-muted">Add a category</p>
          {/* key remounts an empty form after each successful add */}
          <CategoryForm key={categories.length} />
        </div>
      </div>
    </>
  );
}
