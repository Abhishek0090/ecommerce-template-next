import { StarIcon } from "@/components/icons";

export function Rating({ value, count, size = 14 }: { value: number; count?: number; size?: number }) {
  return (
    <div className="flex items-center gap-1.5 text-fg-muted" aria-label={`Rated ${value} out of 5`}>
      <div className="flex">
        {[0, 1, 2, 3, 4].map((i) => (
          <StarIcon key={i} size={size} filled={Math.max(0, Math.min(1, value - i))} />
        ))}
      </div>
      <span className="text-xs font-medium">
        {value.toFixed(1)}
        {count != null && <span className="font-normal"> ({count})</span>}
      </span>
    </div>
  );
}
