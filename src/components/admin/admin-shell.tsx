"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { adminConfig } from "@/config/admin";
import { siteConfig } from "@/config/site";
import { logoutAction } from "@/server/actions/admin";
import { CloseIcon, MenuIcon } from "@/components/icons";
import { ThemeSwitcher } from "@/components/layout/theme-switcher";
import { AdminIcon } from "./admin-icons";

/** Sidebar + top bar layout for every admin page. Nav items come from src/config/admin.ts. */
export function AdminShell({ children, badges, devCredentials }: { children: React.ReactNode; badges: { pendingReviews: number }; devCredentials: boolean }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const isActive = (href: string) => (href === "/admin" ? pathname === "/admin" : pathname.startsWith(href));

  const nav = (
    <nav className="flex flex-col gap-1" aria-label="Admin">
      {adminConfig.nav.map((item) => {
        const active = isActive(item.href);
        const badge = item.badge ? badges[item.badge] : 0;
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={() => setOpen(false)}
            aria-current={active ? "page" : undefined}
            className={`group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
              active ? "bg-primary text-primary-fg shadow-lg shadow-primary/25" : "text-fg-muted hover:bg-surface-2 hover:text-fg"
            }`}
          >
            <AdminIcon name={item.icon} size={18} />
            <span className="flex-1">{item.label}</span>
            {badge > 0 && (
              <span className={`rounded-full px-2 py-0.5 text-xs font-bold tabular-nums ${active ? "bg-white/25" : "bg-accent text-accent-fg"}`}>{badge}</span>
            )}
          </Link>
        );
      })}
    </nav>
  );

  const brand = (
    <Link href="/admin" className="flex items-center gap-2 px-2 font-extrabold tracking-tight">
      <span className="bg-brand-gradient grid h-9 w-9 place-items-center rounded-xl text-white shadow-lg shadow-primary/30">{siteConfig.name.charAt(0)}</span>
      <span className="leading-tight">
        {siteConfig.name}
        <span className="block text-[11px] font-semibold uppercase tracking-widest text-fg-muted">{adminConfig.title}</span>
      </span>
    </Link>
  );

  const footer = (
    <div className="mt-auto space-y-1 border-t border-border pt-4">
      <Link href="/" target="_blank" className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-fg-muted hover:bg-surface-2 hover:text-fg">
        <AdminIcon name="store" size={18} /> View store
      </Link>
      <form action={logoutAction}>
        <button type="submit" className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-fg-muted hover:bg-danger/10 hover:text-danger">
          <AdminIcon name="logout" size={18} /> Log out
        </button>
      </form>
    </div>
  );

  return (
    <div className="min-h-dvh bg-bg lg:grid lg:grid-cols-[256px_1fr]">
      {/* Desktop sidebar */}
      <aside className="sticky top-0 hidden h-dvh flex-col gap-8 border-r border-border bg-surface p-4 lg:flex">
        {brand}
        {nav}
        {footer}
      </aside>

      {/* Mobile drawer */}
      {open && (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-label="Admin menu">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setOpen(false)} />
          <aside className="absolute inset-y-0 left-0 flex w-72 max-w-[85vw] flex-col gap-8 bg-surface p-4 shadow-2xl">
            <div className="flex items-center justify-between">
              {brand}
              <button type="button" onClick={() => setOpen(false)} className="btn-ghost h-10 w-10 p-0" aria-label="Close menu">
                <CloseIcon />
              </button>
            </div>
            {nav}
            {footer}
          </aside>
        </div>
      )}

      <div className="min-w-0">
        <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-border bg-bg/80 px-4 backdrop-blur-xl sm:px-6">
          <button type="button" onClick={() => setOpen(true)} className="btn-ghost -ml-2 h-10 w-10 p-0 lg:hidden" aria-label="Open menu">
            <MenuIcon />
          </button>
          <p className="text-sm text-fg-muted">
            {adminConfig.nav.find((n) => isActive(n.href))?.label ?? adminConfig.title}
          </p>
          <div className="ml-auto flex items-center gap-2">
            <ThemeSwitcher />
            <span className="bg-brand-gradient grid h-9 w-9 place-items-center rounded-full text-sm font-bold text-white" title="Admin">
              A
            </span>
          </div>
        </header>
        {devCredentials && (
          <p className="border-b border-warning/30 bg-warning/10 px-6 py-2 text-xs font-medium text-warning">
            Using the development password &quot;admin&quot;. Set ADMIN_PASSWORD and ADMIN_SECRET in .env.local before deploying.
          </p>
        )}
        <main className="mx-auto w-full max-w-7xl p-4 sm:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
