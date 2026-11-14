/**
 * Admin portal settings. Add a section by adding a nav item here and a page under
 * src/app/admin/(panel)/<href>/page.tsx (call requireAdmin() at its top).
 */
export type AdminNavIcon = "dashboard" | "products" | "categories" | "reviews" | "orders" | "settings";

export const adminConfig = {
  title: "Admin",
  nav: [
    { label: "Dashboard", href: "/admin", icon: "dashboard" },
    { label: "Products", href: "/admin/products", icon: "products" },
    { label: "Categories", href: "/admin/categories", icon: "categories" },
    { label: "Reviews", href: "/admin/reviews", icon: "reviews", badge: "pendingReviews" },
    { label: "Orders", href: "/admin/orders", icon: "orders" },
    { label: "Settings", href: "/admin/settings", icon: "settings" },
  ] as { label: string; href: string; icon: AdminNavIcon; badge?: "pendingReviews" }[],
  /** Products at or below this stock show as "low stock" on the dashboard. */
  lowStockThreshold: 10,
  /** Max images per product. */
  maxProductImages: 8,
} as const;
