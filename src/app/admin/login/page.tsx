import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { siteConfig } from "@/config/site";
import { isAdmin, usingDevCredentials } from "@/server/auth";
import { LoginForm } from "@/components/admin/login-form";

export const metadata: Metadata = { title: "Admin login", robots: { index: false } };

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  if (await isAdmin()) redirect("/admin");
  const { next } = await searchParams;
  return (
    <div className="relative grid min-h-dvh place-items-center overflow-hidden px-4">
      <div className="bg-brand-gradient absolute inset-0 opacity-15" />
      <div className="bg-grad-2/30 absolute -right-24 -top-24 h-96 w-96 rounded-full blur-3xl" />
      <div className="bg-grad-1/30 absolute -bottom-32 -left-24 h-96 w-96 rounded-full blur-3xl" />
      <div className="card relative w-full max-w-sm p-8 shadow-2xl">
        <div className="mb-6 flex flex-col items-center text-center">
          <span className="bg-brand-gradient mb-4 grid h-14 w-14 place-items-center rounded-2xl text-2xl font-black text-white shadow-lg shadow-primary/30">
            {siteConfig.name.charAt(0)}
          </span>
          <h1 className="text-2xl font-black">{siteConfig.name} admin</h1>
          <p className="mt-1 text-sm text-fg-muted">Sign in to manage products, reviews and orders.</p>
        </div>
        <LoginForm next={next ?? "/admin"} />
        {usingDevCredentials() && process.env.NODE_ENV !== "production" && (
          <p className="mt-5 rounded-xl bg-surface-2 px-3 py-2 text-center text-xs text-fg-muted">
            Development password: <code className="font-mono font-semibold text-fg">admin</code>
          </p>
        )}
      </div>
    </div>
  );
}
