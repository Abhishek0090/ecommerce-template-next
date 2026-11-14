"use client";

import { useState } from "react";
import { formatPrice } from "@/lib/pricing";
import { siteConfig } from "@/config/site";

const compactMoney = new Intl.NumberFormat(siteConfig.currency.locale, {
  style: "currency",
  currency: siteConfig.currency.code,
  notation: "compact",
  maximumFractionDigits: 1,
});

export type DayRevenue = { date: string; total: number; orders: number };

/**
 * Daily revenue bars. Single series, so no legend: the panel title names it.
 * Bars use --primary-ink (lightened in dark mode) so they stay visible on both surfaces.
 */
export function RevenueChart({ days }: { days: DayRevenue[] }) {
  const [hover, setHover] = useState<number | null>(null);
  const W = 640;
  const H = 220;
  const pad = { top: 12, right: 8, bottom: 26, left: 52 };
  const innerW = W - pad.left - pad.right;
  const innerH = H - pad.top - pad.bottom;
  const max = Math.max(...days.map((d) => d.total), 1);
  // Round the axis top up to a clean step.
  const step = 10 ** Math.floor(Math.log10(max));
  const top = Math.ceil(max / step) * step;
  const ticks = [0, top / 2, top];
  const slot = innerW / days.length;
  const barW = Math.max(4, slot - 2); // 2px gap between bars
  const y = (v: number) => pad.top + innerH - (v / top) * innerH;
  const label = (d: string) => new Date(d + "T00:00:00").toLocaleDateString(siteConfig.currency.locale, { month: "short", day: "numeric" });

  return (
    <div className="relative">
      <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full" role="img" aria-label="Daily revenue for the last 14 days">
        {ticks.map((t) => (
          <g key={t}>
            <line x1={pad.left} x2={W - pad.right} y1={y(t)} y2={y(t)} stroke="var(--border)" strokeDasharray={t === 0 ? undefined : "3 4"} />
            <text x={pad.left - 8} y={y(t)} dy="0.32em" textAnchor="end" fontSize="11" fill="var(--fg-muted)">
              {compactMoney.format(t)}
            </text>
          </g>
        ))}
        {days.map((d, i) => {
          const x = pad.left + i * slot + 1;
          const h = Math.max(0, pad.top + innerH - y(d.total));
          const r = Math.min(4, h / 2, barW / 2);
          const by = pad.top + innerH - h;
          // Rounded top corners only; the bar sits flat on the baseline.
          const path = h > 0 ? `M${x},${by + h} V${by + r} Q${x},${by} ${x + r},${by} H${x + barW - r} Q${x + barW},${by} ${x + barW},${by + r} V${by + h} Z` : "";
          return (
            <g key={d.date}>
              {path && <path d={path} fill="var(--primary-ink)" opacity={hover === null || hover === i ? 1 : 0.45} className="transition-opacity" />}
              {/* Hit target spans the full column, larger than the bar. */}
              <rect
                x={pad.left + i * slot}
                y={pad.top}
                width={slot}
                height={innerH}
                fill="transparent"
                onMouseEnter={() => setHover(i)}
                onMouseLeave={() => setHover(null)}
                onFocus={() => setHover(i)}
                onBlur={() => setHover(null)}
                tabIndex={0}
                aria-label={`${label(d.date)}: ${formatPrice(d.total)}, ${d.orders} orders`}
                className="cursor-default outline-none"
              />
              {(i % 2 === 0 || days.length <= 7) && (
                <text x={pad.left + i * slot + slot / 2} y={H - 8} textAnchor="middle" fontSize="10.5" fill="var(--fg-muted)">
                  {label(d.date)}
                </text>
              )}
            </g>
          );
        })}
      </svg>
      {hover !== null && (
        <div
          className="pointer-events-none absolute top-0 z-10 -translate-x-1/2 rounded-xl border border-border bg-surface px-3 py-2 text-xs shadow-xl"
          style={{ left: `${((pad.left + hover * slot + slot / 2) / W) * 100}%` }}
        >
          <p className="font-semibold">{label(days[hover].date)}</p>
          <p className="tabular-nums text-fg">{formatPrice(days[hover].total)}</p>
          <p className="text-fg-muted">
            {days[hover].orders} {days[hover].orders === 1 ? "order" : "orders"}
          </p>
        </div>
      )}
      {/* Table view for screen readers. */}
      <table className="sr-only">
        <caption>Daily revenue</caption>
        <thead>
          <tr>
            <th>Date</th>
            <th>Revenue</th>
            <th>Orders</th>
          </tr>
        </thead>
        <tbody>
          {days.map((d) => (
            <tr key={d.date}>
              <td>{d.date}</td>
              <td>{formatPrice(d.total)}</td>
              <td>{d.orders}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
