import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { siteConfig } from "@/config/site";
import { related } from "@/lib/catalog";
import { getProductBySlug, listCategories, listProducts, listReviews } from "@/server/repo";
import { ProductDetail } from "@/components/product/product-detail";
import { ProductGrid } from "@/components/product/product-card";
import { SectionHeading } from "@/components/section-heading";
import { ReviewSection } from "@/components/reviews/review-section";

type Params = Promise<{ slug: string }>;

export async function generateStaticParams() {
  return (await listProducts()).map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const product = await getProductBySlug((await params).slug);
  if (!product) return {};
  return { title: product.name, description: product.short, openGraph: { title: product.name, description: product.short } };
}

export default async function ProductPage({ params }: { params: Params }) {
  const product = await getProductBySlug((await params).slug);
  if (!product) notFound();
  const [products, categories, reviews] = await Promise.all([
    listProducts(),
    listCategories(),
    listReviews({ productId: product.id, status: "approved" }),
  ]);
  const category = categories.find((c) => c.id === product.category);

  // Structured data so search engines can show price and rating.
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.description,
    ...(product.reviewCount > 0 && {
      aggregateRating: { "@type": "AggregateRating", ratingValue: product.rating, reviewCount: product.reviewCount },
    }),
    offers: {
      "@type": "Offer",
      price: product.price,
      priceCurrency: siteConfig.currency.code,
      availability: product.stock > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
    },
  };

  return (
    <div className="container-x py-10">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
      <nav className="mb-6 text-sm text-fg-muted" aria-label="Breadcrumb">
        <Link href="/" className="hover:text-primary-ink">
          Home
        </Link>{" "}
        /{" "}
        <Link href={`/products?category=${product.category}`} className="hover:text-primary-ink">
          {category?.name ?? "Shop"}
        </Link>{" "}
        / <span className="text-fg">{product.name}</span>
      </nav>

      <ProductDetail product={product} />

      <section className="mt-16 max-w-3xl">
        <h2 className="mb-4 text-2xl font-bold">Details</h2>
        <p className="text-fg-muted">{product.description}</p>
        {product.features.length > 0 && (
          <ul className="mt-4 grid gap-2 sm:grid-cols-2">
            {product.features.map((f) => (
              <li key={f} className="flex gap-2 text-sm">
                <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-primary" />
                {f}
              </li>
            ))}
          </ul>
        )}
      </section>

      <div className="mt-16">
        <ReviewSection product={product} reviews={reviews} />
      </div>

      <section className="mt-20">
        <SectionHeading eyebrow="More to love" title="You may also like" href={`/products?category=${product.category}`} />
        <ProductGrid products={related(products, product)} />
      </section>
    </div>
  );
}
