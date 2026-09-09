import { useState, useRef, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, Check, Building, Plus } from "lucide-react";
import { toast } from "sonner";
import { useBrandStore, getBrandColor, getBrandInitials, type Brand } from "@/store/brand-store";
import { switchBrand } from "@/lib/switch-brand";
import { useAuth } from "@/contexts/AuthContext";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

interface BrandSwitcherProps {
  collapsed?: boolean;
}

export default function BrandSwitcher({ collapsed = false }: BrandSwitcherProps) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { activeBrand, allBrands, setActiveBrand } = useBrandStore();
  const [open, setOpen] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  // Click outside to close
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  // Keyboard navigation
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (!open) {
        if (e.key === "Enter" || e.key === " " || e.key === "ArrowDown") {
          e.preventDefault();
          setOpen(true);
          setFocusedIndex(0);
        }
        return;
      }

      switch (e.key) {
        case "ArrowDown":
          e.preventDefault();
          setFocusedIndex((prev) => Math.min(prev + 1, allBrands.length - 1));
          break;
        case "ArrowUp":
          e.preventDefault();
          setFocusedIndex((prev) => Math.max(prev - 1, 0));
          break;
        case "Enter":
          e.preventDefault();
          if (focusedIndex >= 0 && focusedIndex < allBrands.length) {
            handleSelect(allBrands[focusedIndex]);
          }
          break;
        case "Escape":
          e.preventDefault();
          setOpen(false);
          buttonRef.current?.focus();
          break;
      }
    },
    [open, focusedIndex, allBrands]
  );

  const handleSelect = (brand: Brand) => {
    if (!user || brand.id === activeBrand?.id) {
      setOpen(false);
      return;
    }
    switchBrand(brand, setActiveBrand, user.id);
    setOpen(false);
    toast.success(`Switched to ${brand.name}`);
  };

  if (!activeBrand) return null;

  const color = getBrandColor(activeBrand.color);
  const initials = getBrandInitials(activeBrand.name);
  const isSingleBrand = allBrands.length <= 1;

  // Collapsed: just show avatar
  if (collapsed) {
    return (
      <div className="flex justify-center py-2">
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              onClick={() => !isSingleBrand && setOpen(!open)}
              className="flex h-10 w-10 items-center justify-center rounded-[10px] text-xs font-bold text-white transition-all hover:scale-105"
              style={{ backgroundColor: color }}
            >
              {initials}
            </button>
          </TooltipTrigger>
          <TooltipContent side="right" className="bg-midnight text-primary-foreground border-primary-foreground/10">
            <p className="font-semibold">{activeBrand.name}</p>
            {activeBrand.industry && <p className="text-[10px] text-primary-foreground/60">{activeBrand.industry}</p>}
            {isSingleBrand && <p className="text-[10px] text-primary-foreground/40 mt-1">Add more brands to switch</p>}
          </TooltipContent>
        </Tooltip>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="relative px-4 py-2" onKeyDown={handleKeyDown}>
      <button
        ref={buttonRef}
        onClick={() => !isSingleBrand && setOpen(!open)}
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-label={`Active brand: ${activeBrand.name}. ${isSingleBrand ? "Add more brands to switch." : "Click to switch brand."}`}
        className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 transition-all duration-150 ${
          isSingleBrand
            ? "bg-white/[0.06] cursor-default"
            : "bg-white/[0.08] hover:bg-white/[0.15] cursor-pointer"
        }`}
      >
        {/* Avatar */}
        <div
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[10px] text-xs font-bold text-white"
          style={{ background: `linear-gradient(135deg, ${color}, ${color}cc)` }}
        >
          {initials}
        </div>
        {/* Name + Industry */}
        <div className="min-w-0 flex-1 text-left">
          <p className="truncate font-heading text-sm font-semibold text-primary-foreground" style={{ maxWidth: 140 }}>
            {activeBrand.name}
          </p>
          <p className="truncate text-xs text-primary-foreground/60">
            {activeBrand.industry || "No industry"}
          </p>
        </div>
        {/* Chevron */}
        {!isSingleBrand && (
          <ChevronDown
            className={`h-4 w-4 shrink-0 text-primary-foreground/60 transition-transform duration-150 ${open ? "rotate-180" : ""}`}
          />
        )}
      </button>

      {/* Dropdown */}
      <AnimatePresence>
        {open && !isSingleBrand && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -4 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -4 }}
            transition={{ duration: 0.15 }}
            role="listbox"
            aria-label="Select brand"
            className="absolute left-4 right-4 top-full z-50 mt-1 overflow-hidden rounded-2xl border border-border bg-card shadow-2xl"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 pt-3 pb-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                Your Brands
              </span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setOpen(false);
                  navigate("/brands");
                }}
                className="flex h-6 w-6 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                <Plus className="h-3.5 w-3.5" />
              </button>
            </div>

            {/* Brand list */}
            <div className="max-h-[280px] overflow-y-auto px-2 pb-1">
              {allBrands.map((brand, index) => {
                const isActive = brand.id === activeBrand?.id;
                const isFocused = index === focusedIndex;
                const bColor = getBrandColor(brand.color);
                const bInitials = getBrandInitials(brand.name);

                return (
                  <button
                    key={brand.id}
                    role="option"
                    aria-selected={isActive}
                    onClick={() => handleSelect(brand)}
                    className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left transition-all duration-100 ${
                      isActive
                        ? "bg-lavender"
                        : isFocused
                        ? "bg-muted"
                        : "hover:bg-muted/50"
                    }`}
                  >
                    <div
                      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-[10px] font-bold text-white"
                      style={{ background: `linear-gradient(135deg, ${bColor}, ${bColor}cc)` }}
                    >
                      {bInitials}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-foreground">{brand.name}</p>
                      <p className="truncate text-[11px] text-muted-foreground">{brand.industry || "No industry"}</p>
                    </div>
                    {isActive && <Check className="h-4 w-4 shrink-0 text-primary" />}
                  </button>
                );
              })}
            </div>

            {/* Footer */}
            <div className="border-t border-border px-2 py-2">
              <button
                onClick={() => {
                  setOpen(false);
                  navigate("/brands");
                }}
                className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm text-muted-foreground transition-colors hover:bg-muted/50 hover:text-foreground"
              >
                <Building className="h-4 w-4" />
                <span>Manage Brands</span>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
