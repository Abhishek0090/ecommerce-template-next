import Link from "next/link";
import { siteConfig } from "@/config/site";
import { featured as pickFeatured, onSale } from "@/lib/catalog";
import { listCategories, listProducts } from "@/server/repo";
import { ProductGrid } from "@/components/product/product-card";
import { ProductArt } from "@/components/product/product-art";
import { SectionHeading } from "@/components/section-heading";
import { NewsletterForm } from "@/components/layout/newsletter-form";
import { ArrowRightIcon, ReturnIcon, ShieldIcon, SparkIcon, TruckIcon } from "@/components/icons";
import { formatPrice } from "@/lib/pricing";

const perks = [
  { Icon: TruckIcon, title: "Free shipping", body: `On orders over ${formatPrice(siteConfig.freeShippingThreshold)}` },
  { Icon: ReturnIcon, title: "30-day returns", body: "No questions asked" },
  { Icon: ShieldIcon, title: "Secure checkout", body: "Encrypted payments" },
  { Icon: SparkIcon, title: "Member rewards", body: "Earn on every order" },
];

const testimonials = [
  { name: "Aisha K.", text: "The colors are even better in person. Shipping was quick too.", rating: 5 },
  { name: "Daniel R.", text: "Ordered the Glow Orb for my kid's room. Now I want one for every room.", rating: 5 },
  { name: "Mei T.", text: "Easy checkout, lovely packaging and the runners fit perfectly.", rating: 4 },
];

export default async function HomePage() {
  const [products, categories] = await Promise.all([listProducts(), listCategories()]);
  const featured = pickFeatured(products, 8);
  const sale = onSale(products, 4);
  const counts = Object.fromEntries(categories.map((c) => [c.id, products.filter((p) => p.category === c.id).length]));

  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="bg-brand-gradient absolute inset-0 opacity-[0.12]" />
        <div className="bg-grad-2/30 absolute -right-32 -top-32 h-96 w-96 rounded-full blur-3xl" />
        <div className="bg-grad-1/30 absolute -bottom-40 -left-20 h-96 w-96 rounded-full blur-3xl" />
        <div className="container-x relative grid items-center gap-10 py-16 md:grid-cols-2 md:py-24">
          <div>
            <span className="chip mb-5 bg-primary/10 px-3 py-1 text-primary-ink">New season collection</span>
            <h1 className="text-4xl font-black leading-[1.05] tracking-tight sm:text-6xl">
              Add some <span className="text-gradient">color</span> to every day.
            </h1>
            <p className="mt-5 max-w-lg text-lg text-fg-muted">{siteConfig.description}</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/products" className="btn-primary px-7 py-3 text-base">
                Shop now <ArrowRightIcon size={18} />
              </Link>
              <Link href="/products?sale=1" className="btn-outline px-7 py-3 text-base">
                View deals
              </Link>
            </div>
            <dl className="mt-10 flex gap-8">
              {[
                ["12k+", "Happy customers"],
                ["4.8", "Average rating"],
                ["48h", "Dispatch"],
              ].map(([v, l]) => (
                <div key={l}>
                  <dt className="sr-only">{l}</dt>
                  <dd className="text-2xl font-extrabold">{v}</dd>
                  <dd className="text-xs text-fg-muted">{l}</dd>
                </div>
              ))}
            </dl>
          </div>
          <div className="relative mx-auto grid w-full max-w-md grid-cols-2 gap-4">
            {(["audio", "footwear", "home", "watches"] as const).map((cat, i) => (
              <div
                key={cat}
                className={`animate-float self-start overflow-hidden rounded-3xl shadow-2xl shadow-primary/20 ${i % 2 ? "mt-10" : ""}`}
                style={{ animationDelay: `${i * 0.8}s` }}
              >
                <ProductArt category={cat} color={["#8b5cf6", "#f97316", "#f43f5e", "#10b981"][i]} className="block aspect-square w-full" />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Perks */}
      <section className="border-y border-border bg-surface">
        <div className="container-x grid grid-cols-2 gap-6 py-8 md:grid-cols-4">
          {perks.map(({ Icon, title, body }) => (
            <div key={title} className="flex items-center gap-3">
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-primary/10 text-primary-ink">
                <Icon />
              </span>
              <div>
                <p className="text-sm font-semibold">{title}</p>
                <p className="text-xs text-fg-muted">{body}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Categories */}
      <section className="container-x mt-20">
        <SectionHeading eyebrow="Browse" title="Shop by category" href="/products" />
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
          {categories.map((c) => (
            <Link
              key={c.id}
              href={`/products?category=${c.id}`}
              className="group relative overflow-hidden rounded-3xl p-4 text-white shadow-lg transition hover:-translate-y-1 hover:shadow-2xl"
              style={{ background: `linear-gradient(140deg, ${c.colors[0]}, ${c.colors[1]})` }}
            >
              <div className="mx-auto aspect-square w-3/4 transition duration-500 group-hover:scale-110 group-hover:rotate-3">
                <ProductArt category={c.id} color="#ffffff" className="h-full w-full rounded-full opacity-90 mix-blend-luminosity" />
              </div>
              <p className="mt-3 font-bold">{c.name}</p>
              <p className="text-xs text-white/80">{counts[c.id]} products</p>
            </Link>
          ))}
        </div>
      </section>

      {/* Featured */}
      <section className="container-x mt-20">
        <SectionHeading eyebrow="Handpicked" title="Featured products" href="/products" />
        <ProductGrid products={featured} priorityCount={4} />
      </section>

      {/* Promo banner */}
      <section className="container-x mt-20">
        <div className="bg-brand-gradient relative overflow-hidden rounded-[2rem] px-8 py-14 text-white sm:px-14">
          <div className="absolute -right-10 -top-10 h-64 w-64 rounded-full bg-white/10" />
          <div className="absolute -bottom-20 right-40 h-48 w-48 rounded-full bg-white/10" />
          <div className="relative max-w-xl">
            <p className="text-sm font-bold uppercase tracking-widest text-white/80">Color week</p>
            <h2 className="mt-2 text-3xl font-black sm:text-5xl">20% off everything bright</h2>
            <p className="mt-3 text-white/85">
              Use code <strong className="rounded bg-white/20 px-2 py-0.5">COLOR20</strong> at checkout.
            </p>
            <Link href="/products" className="btn-light mt-6 px-7 py-3">
              Shop the sale <ArrowRightIcon size={18} />
            </Link>
          </div>
        </div>
      </section>

      {/* Deals */}
      {sale.length > 0 && (
        <section className="container-x mt-20">
          <SectionHeading eyebrow="Limited time" title="Deals you'll love" href="/products?sale=1" />
          <ProductGrid products={sale} />
        </section>
      )}

      {/* Testimonials */}
      <section className="container-x mt-20">
        <SectionHeading eyebrow="Reviews" title="What customers say" />
        <div className="grid gap-6 md:grid-cols-3">
          {testimonials.map((t) => (
            <figure key={t.name} className="card p-6">
              <div className="mb-3 text-amber-500" aria-label={`${t.rating} stars`}>
                {"★".repeat(t.rating)}
                <span className="text-fg-muted/30">{"★".repeat(5 - t.rating)}</span>
              </div>
              <blockquote className="text-fg">&ldquo;{t.text}&rdquo;</blockquote>
              <figcaption className="mt-4 flex items-center gap-3 text-sm font-semibold">
                <span className="bg-brand-gradient grid h-9 w-9 place-items-center rounded-full text-white">{t.name[0]}</span>
                {t.name}
              </figcaption>
            </figure>
          ))}
        </div>
      </section>

      {/* Newsletter */}
      <section className="container-x mt-20">
        <div className="relative overflow-hidden rounded-[2rem] bg-fg px-8 py-14 text-center text-bg dark:bg-surface-2 dark:text-fg">
          <div className="bg-brand-gradient absolute inset-0 opacity-30" />
          <div className="relative">
            <h2 className="text-3xl font-black text-white">Get 10% off your first order</h2>
            <p className="mx-auto mb-6 mt-2 max-w-md text-white/80">Join the list for new drops, restocks and members-only deals.</p>
            <NewsletterForm big />
          </div>
        </div>
      </section>
    </>
  );
}
