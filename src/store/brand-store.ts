import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface Brand {
  id: string;
  name: string;
  industry: string | null;
  color: string;
  tone: string[] | null;
  is_default: boolean | null;
}

interface BrandStore {
  activeBrand: Brand | null;
  allBrands: Brand[];
  isLoading: boolean;
  setActiveBrand: (brand: Brand) => void;
  setAllBrands: (brands: Brand[]) => void;
  setIsLoading: (loading: boolean) => void;
  clearBrand: () => void;
}

const DEFAULT_COLOR = "#6D28D9";

export function getBrandColor(color?: string | null): string {
  if (!color) return DEFAULT_COLOR;
  return /^#([0-9A-Fa-f]{3,8})$/.test(color) ? color : DEFAULT_COLOR;
}

export function getBrandInitials(name: string): string {
  return name
    .split(/\s+/)
    .map((w) => w[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export const useBrandStore = create<BrandStore>()(
  persist(
    (set) => ({
      activeBrand: null,
      allBrands: [],
      isLoading: true,
      setActiveBrand: (brand) => set({ activeBrand: brand }),
      setAllBrands: (brands) => set({ allBrands: brands }),
      setIsLoading: (loading) => set({ isLoading: loading }),
      clearBrand: () => set({ activeBrand: null, allBrands: [] }),
    }),
    {
      name: "flowo-active-brand",
      partialize: (state) => ({ activeBrand: state.activeBrand }),
    }
  )
);
