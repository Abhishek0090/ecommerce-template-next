"use client";

import { startTransition, useActionState, useEffect, useRef, useState } from "react";
import { submitReviewAction, type ReviewFormState } from "@/server/actions/store";
import { CameraIcon, CheckIcon, CloseIcon, StarIcon } from "@/components/icons";

const MAX_PHOTOS = 4;
const MAX_BYTES = 5 * 1024 * 1024;
const TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];

type Picked = { file: File; url: string };

export function ReviewForm({ productId, productName, onDone }: { productId: string; productName: string; onDone?: () => void }) {
  const [state, action, pending] = useActionState<ReviewFormState, FormData>(submitReviewAction, { status: "idle" });
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [photos, setPhotos] = useState<Picked[]>([]);
  const [photoError, setPhotoError] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  // Free preview URLs when the form unmounts (removed photos are freed in removePhoto).
  const photosRef = useRef(photos);
  useEffect(() => {
    photosRef.current = photos;
  }, [photos]);
  useEffect(() => () => photosRef.current.forEach((p) => URL.revokeObjectURL(p.url)), []);

  const removePhoto = (p: Picked) => {
    URL.revokeObjectURL(p.url);
    setPhotos((list) => list.filter((x) => x !== p));
  };

  const addFiles = (files: FileList | null) => {
    if (!files) return;
    const next = [...photos];
    let error = "";
    for (const file of Array.from(files)) {
      if (next.length >= MAX_PHOTOS) error = `Up to ${MAX_PHOTOS} photos.`;
      else if (!TYPES.includes(file.type)) error = `${file.name}: use JPG, PNG, WebP or GIF.`;
      else if (file.size > MAX_BYTES) error = `${file.name} is over 5 MB.`;
      else next.push({ file, url: URL.createObjectURL(file) });
    }
    setPhotoError(error);
    setPhotos(next);
    if (fileRef.current) fileRef.current.value = "";
  };

  if (state.status === "success") {
    return (
      <div className="card flex flex-col items-center gap-3 p-8 text-center">
        <span className="bg-brand-gradient grid h-14 w-14 place-items-center rounded-full text-white">
          <CheckIcon size={28} />
        </span>
        <p className="font-semibold">{state.message}</p>
        {onDone && (
          <button type="button" onClick={onDone} className="btn-outline">
            Close
          </button>
        )}
      </div>
    );
  }

  return (
    <form
      // Photos are kept in state (for previews) and appended here. onSubmit (not action=) keeps
      // the typed text if the server returns an error; React resets fields after form actions.
      onSubmit={(e) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        fd.delete("photos");
        photos.forEach((p) => fd.append("photos", p.file));
        startTransition(() => action(fd));
      }}
      className="card space-y-5 p-6"
    >
      <div>
        <h3 className="text-lg font-bold">Review {productName}</h3>
        <p className="text-sm text-fg-muted">Reviews are checked by our team before they appear.</p>
      </div>
      <input type="hidden" name="productId" value={productId} />
      <input type="hidden" name="rating" value={rating || ""} />
      {/* Honeypot field for bots; hidden from people and screen readers. */}
      <input type="text" name="website" tabIndex={-1} autoComplete="off" aria-hidden="true" className="hidden" />

      <fieldset>
        <legend className="label">Your rating</legend>
        <div className="flex gap-1" onMouseLeave={() => setHover(0)}>
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => setRating(n)}
              onMouseEnter={() => setHover(n)}
              aria-label={`${n} star${n > 1 ? "s" : ""}`}
              aria-pressed={rating === n}
              className="rounded-md p-0.5 text-fg-muted transition hover:scale-110"
            >
              <StarIcon size={30} filled={(hover || rating) >= n ? 1 : 0} />
            </button>
          ))}
        </div>
      </fieldset>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="rv-author" className="label">
            Name
          </label>
          <input id="rv-author" name="author" required maxLength={60} autoComplete="given-name" className="input" placeholder="e.g. Alex P." />
        </div>
        <div>
          <label htmlFor="rv-title" className="label">
            Title
          </label>
          <input id="rv-title" name="title" required maxLength={100} className="input" placeholder="Sum it up" />
        </div>
      </div>
      <div>
        <label htmlFor="rv-body" className="label">
          Review
        </label>
        <textarea id="rv-body" name="body" required minLength={10} maxLength={2000} rows={4} className="input" placeholder="What did you like or dislike?" />
      </div>

      <div>
        <p className="label">Photos (optional)</p>
        <div className="flex flex-wrap gap-3">
          {photos.map((p, i) => (
            <div key={p.url} className="relative h-20 w-20 overflow-hidden rounded-xl ring-1 ring-border">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={p.url} alt={`Photo ${i + 1}`} className="h-full w-full object-cover" />
              <button
                type="button"
                onClick={() => removePhoto(p)}
                aria-label={`Remove photo ${i + 1}`}
                className="absolute right-1 top-1 grid h-6 w-6 place-items-center rounded-full bg-black/60 text-white hover:bg-black/80"
              >
                <CloseIcon size={14} />
              </button>
            </div>
          ))}
          {photos.length < MAX_PHOTOS && (
            <label className="grid h-20 w-20 cursor-pointer place-items-center rounded-xl border-2 border-dashed border-border text-fg-muted transition hover:border-primary hover:text-primary-ink">
              <span className="flex flex-col items-center gap-1 text-[11px] font-medium">
                <CameraIcon size={22} />
                Add photo
              </span>
              <input ref={fileRef} type="file" accept={TYPES.join(",")} multiple className="sr-only" onChange={(e) => addFiles(e.target.files)} />
            </label>
          )}
        </div>
        <p className="mt-1.5 text-xs text-fg-muted">Up to {MAX_PHOTOS} photos, 5 MB each.</p>
        {photoError && <p className="mt-1 text-xs text-danger">{photoError}</p>}
      </div>

      {state.status === "error" && (
        <p role="alert" className="rounded-xl border border-danger/40 bg-danger/10 px-4 py-3 text-sm text-danger">
          {state.message}
        </p>
      )}

      <div className="flex justify-end gap-2">
        {onDone && (
          <button type="button" onClick={onDone} className="btn-ghost">
            Cancel
          </button>
        )}
        <button type="submit" disabled={pending || !rating} className="btn-primary">
          {pending ? "Sending..." : "Submit review"}
        </button>
      </div>
    </form>
  );
}
