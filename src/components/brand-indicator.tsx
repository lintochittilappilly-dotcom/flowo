import { useBrandStore, getBrandColor, getBrandInitials } from "@/store/brand-store";

interface BrandIndicatorProps {
  className?: string;
}

export default function BrandIndicator({ className = "" }: BrandIndicatorProps) {
  const { activeBrand } = useBrandStore();

  if (!activeBrand) return null;

  const color = getBrandColor(activeBrand.color);
  const initials = getBrandInitials(activeBrand.name);

  return (
    <div className={`inline-flex h-8 items-center gap-2 rounded-full bg-lavender px-3 ${className}`}>
      <div
        className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[8px] font-bold text-white"
        style={{ backgroundColor: color }}
      >
        {initials}
      </div>
      <span className="max-w-[120px] truncate text-xs font-semibold text-primary">
        {activeBrand.name}
      </span>
    </div>
  );
}
