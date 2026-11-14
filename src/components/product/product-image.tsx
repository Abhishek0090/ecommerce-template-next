import type { Product } from "@/data/types";
import { ProductArt } from "./product-art";

/**
 * Renders any stored image URL:
 *  - "art:<category>:<hex>"  demo illustration (seed data, no file needed)
 *  - "/api/uploads/..."     image uploaded through the admin portal or a review
 *  - any other URL           e.g. /products/x.jpg in /public, or a CDN URL
 */
export function StoredImage({ src, alt, className = "" }: { src: string; alt: string; className?: string }) {
  if (src.startsWith("art:")) {
    const [, category, color] = src.split(":");
    return <ProductArt category={category} color={color || "#8b5cf6"} label={alt} className={`block h-full w-full ${className}`} />;
  }
  // Plain <img>: uploads are already sized by the uploader, and this works for any host without config.
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={src} alt={alt} loading="lazy" decoding="async" className={`block h-full w-full object-cover ${className}`} />;
}

/** Product photo when the product has images, otherwise the generated illustration in the chosen color. */
export function ProductImage({
  product,
  color,
  index = 0,
  className = "",
}: {
  product: Product;
  color?: string;
  index?: number;
  className?: string;
  /** Kept for API compatibility with next/image callers. */
  sizes?: string;
  priority?: boolean;
}) {
  const src = product.images?.[index];
  if (src) return <StoredImage src={src} alt={product.name} className={className} />;
  return (
    <ProductArt
      category={product.category}
      color={color ?? product.colors[0]?.hex ?? "#8b5cf6"}
      label={product.name}
      className={`block h-full w-full ${className}`}
    />
  );
}
