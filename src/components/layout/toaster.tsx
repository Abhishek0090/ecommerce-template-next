"use client";

import { useStore } from "@/components/providers/store-provider";
import { CheckIcon, CloseIcon } from "@/components/icons";

export function Toaster() {
  const { toasts, dismiss } = useStore();
  return (
    <div className="pointer-events-none fixed bottom-4 right-4 z-[60] flex w-80 max-w-[calc(100vw-2rem)] flex-col gap-2" aria-live="polite">
      {toasts.map((t) => (
        <div key={t.id} className="card animate-toast pointer-events-auto flex items-start gap-3 p-3 shadow-xl">
          <span className="bg-brand-gradient grid h-7 w-7 shrink-0 place-items-center rounded-full text-white">
            <CheckIcon size={16} />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold">{t.title}</p>
            {t.body && <p className="truncate text-sm text-fg-muted">{t.body}</p>}
          </div>
          <button type="button" onClick={() => dismiss(t.id)} className="text-fg-muted hover:text-fg" aria-label="Dismiss">
            <CloseIcon size={16} />
          </button>
        </div>
      ))}
    </div>
  );
}
