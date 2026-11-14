import type { Metadata } from "next";
import { siteConfig } from "@/config/site";
import { palettes } from "@/config/theme";
import { formatPrice } from "@/lib/pricing";

export const metadata: Metadata = { title: "About" };

export default function AboutPage() {
  const sections = [
    {
      id: "shipping",
      title: "Shipping",
      body: `Orders over ${formatPrice(siteConfig.freeShippingThreshold)} ship free. Otherwise standard shipping is ${formatPrice(
        siteConfig.shippingFlatRate,
      )} (3-5 business days) and express is ${formatPrice(siteConfig.expressShippingRate)} (1-2 business days).`,
    },
    { id: "returns", title: "Returns", body: "Return anything within 30 days for a full refund. Items must be unused and in their original packaging." },
    {
      id: "contact",
      title: "Contact",
      body: `Email ${siteConfig.contact.email} or call ${siteConfig.contact.phone}. Our studio: ${siteConfig.contact.address}.`,
    },
  ];

  return (
    <div className="container-x max-w-3xl py-14">
      <h1 className="text-4xl font-black tracking-tight">
        About <span className="text-gradient">{siteConfig.name}</span>
      </h1>
      <p className="mt-4 text-lg text-fg-muted">{siteConfig.description}</p>

      <div className="mt-10 space-y-6">
        {sections.map((s) => (
          <section key={s.id} id={s.id} className="card scroll-mt-28 p-6">
            <h2 className="text-xl font-bold">{s.title}</h2>
            <p className="mt-2 text-fg-muted">{s.body}</p>
          </section>
        ))}

        <section id="customize" className="card scroll-mt-28 p-6">
          <h2 className="text-xl font-bold">Customize this template</h2>
          <p className="mt-2 text-fg-muted">Everything you need to rebrand is in a few files:</p>
          <ul className="mt-4 space-y-2 text-sm">
            {[
              ["src/config/site.ts", "Store name, announcement, currency, shipping, tax, coupons, navigation, footer"],
              ["src/config/theme.ts", "Color palettes, default palette, light/dark default, corner radius"],
              ["src/app/globals.css", "Neutral colors for light and dark mode, button and card styles"],
              ["/admin", "Admin portal: products, images, categories, reviews, orders"],
              ["src/config/admin.ts", "Admin navigation and limits"],
              ["src/server/repo.ts", "Data access: swap the JSON store for your database"],
              ["src/server/actions/store.ts", "Checkout: connect a payment provider"],
            ].map(([file, what]) => (
              <li key={file} className="flex flex-col gap-0.5 sm:flex-row sm:gap-3">
                <code className="shrink-0 rounded bg-surface-2 px-2 py-0.5 font-mono text-xs text-primary-ink">{file}</code>
                <span className="text-fg-muted">{what}</span>
              </li>
            ))}
          </ul>
          <p className="mt-6 text-sm font-semibold">Built-in palettes</p>
          <div className="mt-3 flex flex-wrap gap-3">
            {palettes.map((p) => (
              <div key={p.id} className="flex items-center gap-2 rounded-full border border-border px-3 py-1.5 text-sm">
                <span className="h-4 w-4 rounded-full" style={{ background: `linear-gradient(135deg, ${p.gradient.join(", ")})` }} />
                {p.name}
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
