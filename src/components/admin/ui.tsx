import Link from "next/link";

/**
 * Admin UI kit: small server-safe building blocks used by every admin page.
 * Reuse them for new sections so the portal stays consistent.
 */

export function PageHeader({ title, description, actions }: { title: string; description?: string; actions?: React.ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="text-2xl font-black tracking-tight sm:text-3xl">{title}</h1>
        {description && <p className="mt-1 text-sm text-fg-muted">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}

export function Panel({ title, action, children, className = "" }: { title?: string; action?: React.ReactNode; children: React.ReactNode; className?: string }) {
  return (
    <section className={`card overflow-hidden ${className}`}>
      {title && (
        <div className="flex items-center justify-between gap-3 border-b border-border px-5 py-3.5">
          <h2 className="font-bold">{title}</h2>
          {action}
        </div>
      )}
      {children}
    </section>
  );
}

export function StatCard({ label, value, hint, icon, tone = "primary" }: { label: string; value: string; hint?: string; icon: React.ReactNode; tone?: "primary" | "accent" | "success" | "warning" }) {
  const tones = {
    primary: "bg-primary/12 text-primary-ink",
    accent: "bg-accent/12 text-accent-ink",
    success: "bg-success/12 text-success",
    warning: "bg-warning/12 text-warning",
  };
  return (
    <div className="card flex items-start gap-4 p-5">
      <span className={`grid h-11 w-11 shrink-0 place-items-center rounded-2xl ${tones[tone]}`}>{icon}</span>
      <div className="min-w-0">
        <p className="text-sm text-fg-muted">{label}</p>
        <p className="mt-0.5 text-2xl font-black tabular-nums tracking-tight">{value}</p>
        {hint && <p className="mt-0.5 text-xs text-fg-muted">{hint}</p>}
      </div>
    </div>
  );
}

const BADGE_TONES = {
  neutral: "bg-surface-2 text-fg-muted",
  primary: "bg-primary/12 text-primary-ink",
  success: "bg-success/12 text-success",
  warning: "bg-warning/15 text-warning",
  danger: "bg-danger/12 text-danger",
} as const;

export type BadgeTone = keyof typeof BADGE_TONES;

export function Badge({ tone = "neutral", children }: { tone?: BadgeTone; children: React.ReactNode }) {
  return <span className={`chip whitespace-nowrap ${BADGE_TONES[tone]}`}>{children}</span>;
}

export function EmptyState({ title, body, action }: { title: string; body?: string; action?: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-2 px-6 py-14 text-center">
      <p className="font-semibold">{title}</p>
      {body && <p className="max-w-sm text-sm text-fg-muted">{body}</p>}
      {action && <div className="mt-3">{action}</div>}
    </div>
  );
}

/** Table with consistent styling; pass <tr> rows as children. Scrolls sideways on small screens. */
export function Table({ head, children }: { head: React.ReactNode[]; children: React.ReactNode }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[640px] text-left text-sm">
        <thead className="border-b border-border bg-surface-2/60 text-xs uppercase tracking-wider text-fg-muted">
          <tr>
            {head.map((h, i) => (
              <th key={i} scope="col" className="px-5 py-3 font-semibold">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-border">{children}</tbody>
      </table>
    </div>
  );
}

export function Td({ children, className = "" }: { children?: React.ReactNode; className?: string }) {
  return <td className={`px-5 py-3 align-middle ${className}`}>{children}</td>;
}

export function Tabs({ items, active }: { items: { label: string; href: string; count?: number; value: string }[]; active: string }) {
  return (
    <nav className="mb-4 flex flex-wrap gap-1 rounded-theme bg-surface-2 p-1" aria-label="Filter">
      {items.map((t) => (
        <Link
          key={t.value}
          href={t.href}
          aria-current={t.value === active ? "page" : undefined}
          className={`flex items-center gap-2 rounded-[calc(var(--radius)*0.7)] px-3.5 py-1.5 text-sm font-medium transition ${
            t.value === active ? "bg-surface text-fg shadow-sm" : "text-fg-muted hover:text-fg"
          }`}
        >
          {t.label}
          {t.count != null && <span className="rounded-full bg-bg px-1.5 text-xs tabular-nums">{t.count}</span>}
        </Link>
      ))}
    </nav>
  );
}

export function Notice({ tone = "success", children }: { tone?: "success" | "warning" | "danger"; children: React.ReactNode }) {
  const tones = {
    success: "border-success/40 bg-success/10 text-success",
    warning: "border-warning/40 bg-warning/10 text-warning",
    danger: "border-danger/40 bg-danger/10 text-danger",
  };
  return (
    <p role="status" className={`mb-5 rounded-xl border px-4 py-3 text-sm font-medium ${tones[tone]}`}>
      {children}
    </p>
  );
}
