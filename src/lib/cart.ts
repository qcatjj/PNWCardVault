import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Product } from "./catalog-types";

export type CartLine = {
  productId: number;
  slug: string;
  title: string;
  priceCents: number;
  imageKey: string;
  imageUrl?: string | null;
  qty: number;
  maxQty: number;
  kind: string;
};

type CartState = {
  lines: CartLine[];
  add: (product: Product, qty?: number) => { ok: true } | { ok: false; reason: string };
  setQty: (productId: number, qty: number) => void;
  remove: (productId: number) => void;
  clear: () => void;
};

export const useCart = create<CartState>()(
  persist(
    (set, get) => ({
      lines: [],
      add: (product, qty = 1) => {
        if (product.qty <= 0) return { ok: false, reason: "This listing is sold out." };
        const existing = get().lines.find((l) => l.productId === product.id);
        const nextQty = (existing?.qty ?? 0) + qty;
        if (nextQty > product.qty) {
          return { ok: false, reason: `Only ${product.qty} left on this listing.` };
        }
        set((state) => {
          if (existing) {
            return {
              lines: state.lines.map((l) =>
                l.productId === product.id ? { ...l, qty: nextQty, maxQty: product.qty } : l,
              ),
            };
          }
          return {
            lines: [
              ...state.lines,
              {
                productId: product.id,
                slug: product.slug,
                title: product.title,
                priceCents: product.priceCents,
                imageKey: product.imageKey,
                imageUrl: product.imageUrl,
                qty,
                maxQty: product.qty,
                kind: product.kind,
              },
            ],
          };
        });
        return { ok: true };
      },
      setQty: (productId, qty) =>
        set((state) => ({
          lines: state.lines
            .map((l) =>
              l.productId === productId ? { ...l, qty: Math.max(1, Math.min(qty, l.maxQty)) } : l,
            )
            .filter((l) => l.qty > 0),
        })),
      remove: (productId) => set((state) => ({ lines: state.lines.filter((l) => l.productId !== productId) })),
      clear: () => set({ lines: [] }),
    }),
    { name: "pnw-card-hub-cart" },
  ),
);

export function cartCount(lines: CartLine[]) {
  return lines.reduce((sum, l) => sum + l.qty, 0);
}

export function cartTotal(lines: CartLine[]) {
  return lines.reduce((sum, l) => sum + l.qty * l.priceCents, 0);
}
