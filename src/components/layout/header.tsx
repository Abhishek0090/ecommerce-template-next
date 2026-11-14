"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { siteConfig } from "@/config/site";
import { useStore } from "@/components/providers/store-provider";
import { CartIcon, CloseIcon, HeartIcon, MenuIcon, SearchIcon } from "@/components/icons";
import { ThemeSwitcher } from "./theme-switcher";

export function Logo() {
  return (
    <Link href="/" className="flex items-center gap-2 text-lg font-extrabold tracking-tight">
      <span className="bg-brand-gradient grid h-9 w-9 place-items-center rounded-xl text-white shadow-lg shadow-primary/30">
        {siteConfig.name.charAt(0)}
      </span>
      <span>{siteConfig.name}</span>
    </Link>
  );
}

function SearchBox({ onDone }: { onDone?: () => void }) {
  const router = useRouter();
  const [q, setQ] = useState("");
  return (
    <form
      role="search"
      onSubmit={(e) => {
        e.preventDefault();
        router.push(`/products${q.trim() ? `?q=${encodeURIComponent(q.trim())}` : ""}`);
        onDone?.();
      }}
      className="relative w-full"
    >
      <SearchIcon size={18} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-fg-muted" />
      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Search products..."
        aria-label="Search products"
        className="input rounded-full bg-surface-2 pl-10"
      />
    </form>
  );
}

export function Header() {
  const { cart, wishlist, hydrated, openCart } = useStore();
  const [menuOpen, setMenuOpen] = useState(false);
  const pathname = usePathname();
  const count = cart.reduce((s, l) => s + l.qty, 0);

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-bg/80 backdrop-blur-xl">
      <div className="container-x flex h-16 items-center gap-4">
        <button
          type="button"
          className="btn-ghost -ml-2 h-10 w-10 p-0 lg:hidden"
          onClick={() => setMenuOpen(true)}
          aria-label="Open menu"
        >
          <MenuIcon />
        </button>
        <Logo />
        <nav className="ml-6 hidden items-center gap-1 lg:flex" aria-label="Main">
          {siteConfig.nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`rounded-full px-3 py-1.5 text-sm font-medium transition hover:bg-surface-2 hover:text-primary-ink ${
                pathname === item.href ? "text-primary-ink" : "text-fg-muted"
              }`}
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="ml-auto hidden w-64 md:block">
          <SearchBox />
        </div>
        <div className="ml-auto flex items-center gap-1 md:ml-2">
          <ThemeSwitcher />
          <Link href="/wishlist" className="btn-ghost relative h-10 w-10 rounded-full p-0" aria-label="Wishlist">
            <HeartIcon />
            {hydrated && wishlist.length > 0 && (
              <span className="absolute -right-0.5 -top-0.5 grid h-5 min-w-5 place-items-center rounded-full bg-accent px-1 text-[10px] font-bold text-accent-fg">
                {wishlist.length}
              </span>
            )}
          </Link>
          <button
            type="button"
            onClick={() => openCart(true)}
            className="btn-ghost relative h-10 w-10 rounded-full p-0"
            aria-label={`Open cart, ${count} items`}
          >
            <CartIcon />
            {hydrated && count > 0 && (
              <span className="absolute -right-0.5 -top-0.5 grid h-5 min-w-5 place-items-center rounded-full bg-primary px-1 text-[10px] font-bold text-primary-fg">
                {count}
              </span>
            )}
          </button>
        </div>
      </div>

      {menuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-label="Menu">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setMenuOpen(false)} />
          <div className="absolute inset-y-0 left-0 flex w-80 max-w-[85vw] flex-col gap-6 bg-surface p-5 shadow-2xl">
            <div className="flex items-center justify-between">
              <Logo />
              <button type="button" className="btn-ghost h-10 w-10 p-0" onClick={() => setMenuOpen(false)} aria-label="Close menu">
                <CloseIcon />
              </button>
            </div>
            <SearchBox onDone={() => setMenuOpen(false)} />
            <nav className="flex flex-col gap-1" aria-label="Mobile">
              {siteConfig.nav.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMenuOpen(false)}
                  className="rounded-xl px-3 py-2.5 font-medium hover:bg-surface-2 hover:text-primary-ink"
                >
                  {item.label}
                </Link>
              ))}
              <Link href="/wishlist" onClick={() => setMenuOpen(false)} className="rounded-xl px-3 py-2.5 font-medium hover:bg-surface-2">
                Wishlist
              </Link>
              <Link href="/about" onClick={() => setMenuOpen(false)} className="rounded-xl px-3 py-2.5 font-medium hover:bg-surface-2">
                About
              </Link>
            </nav>
          </div>
        </div>
      )}
    </header>
  );
}
