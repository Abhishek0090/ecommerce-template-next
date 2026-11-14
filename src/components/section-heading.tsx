import Link from "next/link";
import { ArrowRightIcon } from "./icons";

export function SectionHeading({
  eyebrow,
  title,
  href,
  linkLabel = "View all",
}: {
  eyebrow?: string;
  title: string;
  href?: string;
  linkLabel?: string;
}) {
  return (
    <div className="mb-8 flex items-end justify-between gap-4">
      <div>
        {eyebrow && <p className="text-gradient mb-1 text-sm font-bold uppercase tracking-widest">{eyebrow}</p>}
        <h2 className="text-2xl font-extrabold tracking-tight sm:text-3xl">{title}</h2>
      </div>
      {href && (
        <Link href={href} className="group flex shrink-0 items-center gap-1 text-sm font-semibold text-primary-ink">
          {linkLabel} <ArrowRightIcon size={16} className="transition group-hover:translate-x-1" />
        </Link>
      )}
    </div>
  );
}
