"use client";

import { useEffect, useRef } from "react";
import { ArrowLeftIcon, ArrowRightIcon, CloseIcon } from "@/components/icons";
import { StoredImage } from "@/components/product/product-image";

export type LightboxPhoto = { src: string; caption?: string };

/** Full-screen photo viewer. Arrow keys move, Escape closes, focus returns to the opener. */
export function Lightbox({
  photos,
  index,
  onIndex,
  onClose,
}: {
  photos: LightboxPhoto[];
  index: number;
  onIndex: (i: number) => void;
  onClose: () => void;
}) {
  const closeRef = useRef<HTMLButtonElement>(null);
  const photo = photos[index];
  const many = photos.length > 1;
  const go = (d: number) => onIndex((index + d + photos.length) % photos.length);

  useEffect(() => {
    const opener = document.activeElement as HTMLElement | null;
    closeRef.current?.focus();
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prevOverflow;
      opener?.focus();
    };
  }, []);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Photo viewer"
      className="fixed inset-0 z-[80] flex flex-col bg-black/90 p-4 backdrop-blur"
      onKeyDown={(e) => {
        if (e.key === "Escape") onClose();
        if (many && e.key === "ArrowRight") go(1);
        if (many && e.key === "ArrowLeft") go(-1);
      }}
    >
      <div className="flex items-center justify-between text-white">
        <span className="text-sm tabular-nums text-white/70">
          {index + 1} / {photos.length}
        </span>
        <button ref={closeRef} type="button" onClick={onClose} aria-label="Close photo viewer" className="grid h-10 w-10 place-items-center rounded-full hover:bg-white/15">
          <CloseIcon />
        </button>
      </div>
      <div className="relative flex min-h-0 flex-1 items-center justify-center" onClick={(e) => e.target === e.currentTarget && onClose()}>
        {many && (
          <button type="button" onClick={() => go(-1)} aria-label="Previous photo" className="absolute left-0 z-10 grid h-12 w-12 place-items-center rounded-full bg-white/10 text-white hover:bg-white/25">
            <ArrowLeftIcon />
          </button>
        )}
        <div key={photo.src} className="animate-pop aspect-square max-h-full w-full max-w-[min(80vh,720px)] overflow-hidden rounded-2xl">
          <StoredImage src={photo.src} alt={photo.caption ?? "Customer photo"} />
        </div>
        {many && (
          <button type="button" onClick={() => go(1)} aria-label="Next photo" className="absolute right-0 z-10 grid h-12 w-12 place-items-center rounded-full bg-white/10 text-white hover:bg-white/25">
            <ArrowRightIcon />
          </button>
        )}
      </div>
      {photo.caption && <p className="pt-3 text-center text-sm text-white/80">{photo.caption}</p>}
    </div>
  );
}
