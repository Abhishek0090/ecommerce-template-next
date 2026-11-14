"use client";

import { siteConfig } from "@/config/site";
import { STORAGE_KEYS } from "@/config/theme";
import { CloseIcon } from "@/components/icons";

/**
 * Top banner from siteConfig.announcement. Closing it hides it until the text changes.
 * Visibility is driven by a data attribute on <html> (set before paint by the boot script),
 * so a closed bar never flashes on reload.
 */
export function AnnouncementBar() {
  if (!siteConfig.announcement) return null;

  const close = () => {
    document.documentElement.dataset.announcementClosed = "";
    try {
      localStorage.setItem(STORAGE_KEYS.announcement, siteConfig.announcement);
    } catch {}
  };

  return (
    <div className="announcement-bar bg-brand-gradient relative text-white">
      <p className="container-x py-2 pr-12 text-center text-xs font-medium sm:pl-12 sm:text-sm">{siteConfig.announcement}</p>
      <button
        type="button"
        onClick={close}
        aria-label="Close announcement"
        className="absolute right-2 top-1/2 grid h-7 w-7 -translate-y-1/2 place-items-center rounded-full text-white/80 transition hover:bg-white/20 hover:text-white focus-visible:outline-2 focus-visible:outline-white sm:right-4"
      >
        <CloseIcon size={16} />
      </button>
    </div>
  );
}
