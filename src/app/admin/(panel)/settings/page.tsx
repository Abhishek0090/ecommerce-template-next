import type { Metadata } from "next";
import { siteConfig } from "@/config/site";
import { requireAdmin, usingDevCredentials } from "@/server/auth";
import { DATA_DIR } from "@/server/db";
import { resetDemoDataAction } from "@/server/actions/admin";
import { PageHeader, Panel } from "@/components/admin/ui";
import { ConfirmButton } from "@/components/admin/confirm-button";

export const metadata: Metadata = { title: "Settings" };

export default async function SettingsPage() {
  await requireAdmin();
  const rows: [string, string][] = [
    ["Store name", siteConfig.name],
    ["Currency", `${siteConfig.currency.code} (${siteConfig.currency.locale})`],
    ["Free shipping from", String(siteConfig.freeShippingThreshold)],
    ["Tax rate", `${siteConfig.taxRate * 100}%`],
    ["Coupons", Object.keys(siteConfig.coupons).join(", ")],
    ["Data folder", DATA_DIR],
    ["Admin password", usingDevCredentials() ? "Development default (set ADMIN_PASSWORD)" : "Set from ADMIN_PASSWORD"],
  ];
  return (
    <>
      <PageHeader title="Settings" description="Store settings live in code so they are versioned with the template." />
      <div className="grid gap-6 lg:grid-cols-2">
        <Panel title="Store">
          <dl className="divide-y divide-border text-sm">
            {rows.map(([k, v]) => (
              <div key={k} className="flex justify-between gap-4 px-5 py-3">
                <dt className="text-fg-muted">{k}</dt>
                <dd className="break-all text-right font-medium">{v}</dd>
              </div>
            ))}
          </dl>
          <p className="border-t border-border px-5 py-3 text-xs text-fg-muted">
            Edit these in <code className="font-mono text-primary-ink">src/config/site.ts</code>. Colors are in{" "}
            <code className="font-mono text-primary-ink">src/config/theme.ts</code>.
          </p>
        </Panel>
        <Panel title="Demo data">
          <div className="space-y-4 p-5 text-sm">
            <p className="text-fg-muted">
              Restore the original products, categories and reviews and delete all orders. Uploaded image files stay in the data folder.
            </p>
            <ConfirmButton
              action={resetDemoDataAction}
              confirm="Reset all products, categories, reviews and orders to the demo data? This cannot be undone."
              className="btn-outline text-danger hover:border-danger hover:text-danger"
            >
              Reset demo data
            </ConfirmButton>
          </div>
        </Panel>
      </div>
    </>
  );
}
