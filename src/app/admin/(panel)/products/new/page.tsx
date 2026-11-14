import type { Metadata } from "next";
import { requireAdmin } from "@/server/auth";
import { listCategories } from "@/server/repo";
import { PageHeader } from "@/components/admin/ui";
import { ProductForm } from "@/components/admin/product-form";

export const metadata: Metadata = { title: "New product" };

export default async function NewProductPage() {
  await requireAdmin();
  return (
    <>
      <PageHeader title="New product" description="New products start as drafts, so you can finish them before they go live." />
      <ProductForm categories={await listCategories()} />
    </>
  );
}
