import type { Metadata } from "next";
import { AdminShell } from "@/components/admin/admin-shell";
import { requireAdmin, usingDevCredentials } from "@/server/auth";
import { listReviews } from "@/server/repo";

export const metadata: Metadata = { title: { default: "Admin", template: "%s | Admin" }, robots: { index: false } };

// Admin pages always read fresh data.
export const dynamic = "force-dynamic";

export default async function PanelLayout({ children }: { children: React.ReactNode }) {
  // Layouts don't re-run on every navigation, so each page and action also calls requireAdmin().
  await requireAdmin();
  const pending = await listReviews({ status: "pending" });
  return (
    <AdminShell badges={{ pendingReviews: pending.length }} devCredentials={usingDevCredentials()}>
      {children}
    </AdminShell>
  );
}
