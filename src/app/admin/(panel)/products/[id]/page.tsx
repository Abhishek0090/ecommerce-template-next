import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/server/auth";
import { getProductById, listCategories } from "@/server/repo";
import { deleteProductAction } from "@/server/actions/admin";
import { PageHeader } from "@/components/admin/ui";
import { ProductForm } from "@/components/admin/product-form";
import { ConfirmButton } from "@/components/admin/confirm-button";
import { TrashIcon } from "@/components/icons";

export const metadata: Metadata = { title: "Edit product" };

export default async function EditProductPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ created?: string }> }) {
  await requireAdmin();
  const [{ id }, { created }] = await Promise.all([params, searchParams]);
  const [product, categories] = await Promise.all([getProductById(id), listCategories()]);
  if (!product) notFound();
  return (
    <>
      <PageHeader
        title={product.name}
        description={`Added ${product.addedAt} - ${product.reviewCount} ratings, ${product.rating.toFixed(1)} average`}
        actions={
          <ConfirmButton action={deleteProductAction.bind(null, product.id)} confirm={`Delete "${product.name}"? Its reviews and images are deleted too.`} className="btn-outline text-danger hover:border-danger hover:text-danger">
            <TrashIcon size={16} /> Delete
          </ConfirmButton>
        }
      />
      {/* key resets the form state when switching between products */}
      <ProductForm key={product.id} product={product} categories={categories} created={created === "1"} />
    </>
  );
}
