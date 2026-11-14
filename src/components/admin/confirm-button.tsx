"use client";

import { useTransition } from "react";

/** Button that asks for confirmation, then runs a server action. */
export function ConfirmButton({
  action,
  confirm,
  children,
  className = "btn-ghost text-danger",
  title,
}: {
  action: () => Promise<void>;
  confirm?: string;
  children: React.ReactNode;
  className?: string;
  title?: string;
}) {
  const [pending, start] = useTransition();
  return (
    <button
      type="button"
      title={title}
      aria-label={title}
      disabled={pending}
      onClick={() => {
        if (confirm && !window.confirm(confirm)) return;
        start(() => action());
      }}
      className={className}
    >
      {pending ? "..." : children}
    </button>
  );
}
