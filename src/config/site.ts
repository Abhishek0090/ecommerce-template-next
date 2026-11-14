/**
 * Store settings. Edit this file to rebrand the template.
 * Colors live in ./theme.ts, products and categories in ../data/.
 */
export const siteConfig = {
  name: "Dummy Store",
  tagline: "Colorful things for everyday life",
  description: "A customizable Next.js ecommerce template with color themes, cart, wishlist and checkout.",
  url: "https://example.com",

  /** Shown in the thin bar above the header. Set to "" to hide it. */
  announcement: "Free shipping on orders over $75 - use code WELCOME10 for 10% off",

  currency: { code: "USD", locale: "en-US" },

  /** Orders at or above this subtotal ship free. */
  freeShippingThreshold: 75,
  shippingFlatRate: 6.99,
  expressShippingRate: 14.99,
  /** Fraction of the discounted subtotal, e.g. 0.08 = 8%. Set to 0 to hide tax. */
  taxRate: 0.08,

  /** Coupon codes accepted at checkout. percent = 10 means 10% off the subtotal. */
  coupons: {
    WELCOME10: { percent: 10, label: "10% off your order" },
    COLOR20: { percent: 20, label: "20% off - color week" },
  } as Record<string, { percent: number; label: string }>,

  nav: [
    { label: "Shop all", href: "/products" },
    { label: "Audio", href: "/products?category=audio" },
    { label: "Footwear", href: "/products?category=footwear" },
    { label: "Home", href: "/products?category=home" },
    { label: "Sale", href: "/products?sale=1" },
  ],

  footer: [
    {
      title: "Shop",
      links: [
        { label: "All products", href: "/products" },
        { label: "New arrivals", href: "/products?sort=newest" },
        { label: "On sale", href: "/products?sale=1" },
        { label: "Wishlist", href: "/wishlist" },
      ],
    },
    {
      title: "Help",
      links: [
        { label: "Shipping", href: "/about#shipping" },
        { label: "Returns", href: "/about#returns" },
        { label: "Contact", href: "/about#contact" },
      ],
    },
    {
      title: "Company",
      links: [
        { label: "About us", href: "/about" },
        { label: "Customize theme", href: "/about#customize" },
      ],
    },
  ],

  contact: {
    email: "hello@example.com",
    phone: "+1 (555) 010-2030",
    address: "100 Market Street, San Francisco, CA",
  },

  social: [
    { label: "Instagram", href: "https://instagram.com" },
    { label: "X", href: "https://x.com" },
    { label: "YouTube", href: "https://youtube.com" },
  ],
} as const;

export type SiteConfig = typeof siteConfig;
