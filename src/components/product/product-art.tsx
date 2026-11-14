import type { CategoryId } from "@/data/types";

/**
 * Draws a colorful product illustration from the category and chosen color,
 * so the template looks complete without any image files.
 * When a product has `images`, ProductImage renders those instead.
 */
const glyphs: Record<string, React.ReactNode> = {
  audio: (
    <>
      <path d="M50 118V100a50 50 0 0 1 100 0v18" fill="none" strokeWidth="12" />
      <rect x="38" y="108" width="30" height="48" rx="12" />
      <rect x="132" y="108" width="30" height="48" rx="12" />
    </>
  ),
  footwear: (
    <>
      <path d="M30 132c0-20 6-44 14-56 10 4 22 6 34 2 8 18 26 30 50 36 22 5 40 10 40 26v8H30Z" />
      <path d="M30 148h138v10H30z" opacity="0.55" />
      <path d="M70 96l10 8M84 92l10 9M98 90l9 10" fill="none" strokeWidth="5" opacity="0.6" />
    </>
  ),
  bags: (
    <>
      <path d="M74 74v-8a26 26 0 0 1 52 0v8" fill="none" strokeWidth="10" />
      <rect x="44" y="74" width="112" height="92" rx="18" />
      <rect x="74" y="106" width="52" height="28" rx="8" opacity="0.55" />
    </>
  ),
  watches: (
    <>
      <rect x="80" y="28" width="40" height="40" rx="8" opacity="0.6" />
      <rect x="80" y="132" width="40" height="40" rx="8" opacity="0.6" />
      <circle cx="100" cy="100" r="44" />
      <circle cx="100" cy="100" r="32" opacity="0.45" fill="#fff" />
      <path d="M100 80v22l14 10" fill="none" strokeWidth="6" />
    </>
  ),
  home: (
    <>
      <circle cx="100" cy="88" r="46" />
      <circle cx="86" cy="74" r="14" fill="#fff" opacity="0.5" />
      <path d="M78 140h44l8 26H70Z" opacity="0.7" />
    </>
  ),
  beauty: (
    <>
      <rect x="86" y="36" width="28" height="22" rx="5" opacity="0.65" />
      <rect x="66" y="58" width="68" height="108" rx="18" />
      <rect x="80" y="92" width="40" height="36" rx="6" fill="#fff" opacity="0.45" />
    </>
  ),
  // Used for categories added in the admin portal.
  default: (
    <>
      <path d="M100 40 156 70v62l-56 30-56-30V70Z" />
      <path d="M44 70l56 30 56-30M100 100v62" fill="none" strokeWidth="5" opacity="0.5" />
    </>
  ),
};

function shade(hex: string, amount: number) {
  const n = parseInt(hex.replace("#", ""), 16);
  const ch = (shift: number) => Math.max(0, Math.min(255, ((n >> shift) & 255) + amount));
  return `rgb(${ch(16)}, ${ch(8)}, ${ch(0)})`;
}

export function ProductArt({
  category,
  color,
  className,
  label,
}: {
  category: CategoryId;
  color: string;
  className?: string;
  label?: string;
}) {
  const id = `g-${category.replace(/[^a-z0-9]/gi, "")}-${color.replace("#", "")}`;
  return (
    <svg viewBox="0 0 200 200" className={className} role="img" aria-label={label}>
      <defs>
        <radialGradient id={`${id}-bg`} cx="30%" cy="25%" r="90%">
          <stop offset="0%" stopColor={shade(color, 120)} />
          <stop offset="100%" stopColor={shade(color, 40)} />
        </radialGradient>
        <linearGradient id={`${id}-fg`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor={shade(color, 20)} />
          <stop offset="100%" stopColor={shade(color, -50)} />
        </linearGradient>
      </defs>
      <rect width="200" height="200" fill={`url(#${id}-bg)`} />
      <circle cx="160" cy="40" r="46" fill="#fff" opacity="0.18" />
      <circle cx="30" cy="180" r="60" fill="#fff" opacity="0.12" />
      <ellipse cx="100" cy="172" rx="62" ry="8" fill="#000" opacity="0.12" />
      <g fill={`url(#${id}-fg)`} stroke={shade(color, -40)} strokeLinecap="round" strokeLinejoin="round">
        {glyphs[category] ?? glyphs.default}
      </g>
    </svg>
  );
}
