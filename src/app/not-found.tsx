import Link from "next/link";

export default function NotFound() {
  return (
    <div className="container-x flex min-h-[60vh] flex-col items-center justify-center py-20 text-center">
      <p className="text-gradient text-8xl font-black">404</p>
      <h1 className="mt-4 text-2xl font-bold">This page wandered off</h1>
      <p className="mt-2 text-fg-muted">The page you are looking for doesn&apos;t exist or has moved.</p>
      <div className="mt-8 flex gap-3">
        <Link href="/" className="btn-primary">
          Go home
        </Link>
        <Link href="/products" className="btn-outline">
          Browse products
        </Link>
      </div>
    </div>
  );
}
