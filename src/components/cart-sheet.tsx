import * as Dialog from "@radix-ui/react-dialog";
import { Link } from "@tanstack/react-router";
import { ShoppingBag, X } from "lucide-react";
import { ProductMedia } from "@/components/product-media";
import { QtyStepper } from "@/components/qty-stepper";
import { Button } from "@/components/ui/button";
import { cartCount, cartTotal, useCart } from "@/lib/cart";
import { formatPrice } from "@/lib/format";

export function CartSheet({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const lines = useCart((s) => s.lines);
  const setQty = useCart((s) => s.setQty);
  const remove = useCart((s) => s.remove);
  const total = cartTotal(lines);

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-background/70 backdrop-blur-sm data-[state=open]:animate-in" />
        <Dialog.Content className="fixed top-0 right-0 z-50 flex h-dvh w-[min(26rem,94vw)] flex-col border-l border-border bg-card outline-none">
          <div className="flex items-center justify-between border-b border-border px-5 py-4">
            <Dialog.Title className="font-display text-2xl text-card-foreground">Your bag</Dialog.Title>
            <Dialog.Close asChild>
              <button type="button" className="flex size-11 items-center justify-center rounded-xl hover:bg-muted" aria-label="Close cart">
                <X className="size-5" />
              </button>
            </Dialog.Close>
          </div>
          <div className="flex-1 overflow-y-auto px-5 py-4">
            {lines.length === 0 ? (
              <div className="flex h-full min-h-56 flex-col items-center justify-center text-center">
                <ShoppingBag className="size-8 text-muted-foreground" />
                <p className="mt-3 font-display text-2xl">Bag is empty.</p>
                <p className="mt-1 text-sm text-muted-foreground">Grab a listing from the drop.</p>
              </div>
            ) : (
              <ul className="divide-y divide-border">
                {lines.map((line) => (
                  <li key={line.productId} className="flex gap-3 py-4">
                    <div className="w-14 shrink-0 overflow-hidden rounded-lg border border-border">
                      <ProductMedia
                        product={{
                          title: line.title,
                          qty: line.maxQty,
                          imageKey: line.imageKey,
                          imageUrl: line.imageUrl ?? null,
                          player: null,
                          year: null,
                          sport: "basketball",
                          kind: line.kind,
                          parallel: null,
                          serialNum: null,
                          grade: null,
                        }}
                        className="aspect-[2.5/3.5]"
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <Link
                        to="/c/$slug"
                        params={{ slug: line.slug }}
                        className="line-clamp-2 text-sm font-semibold text-foreground"
                        onClick={() => onOpenChange(false)}
                      >
                        {line.title}
                      </Link>
                      <p className="mt-1 tabular-nums text-sm text-muted-foreground">
                        {formatPrice(line.priceCents)}
                      </p>
                      <div className="mt-2 flex items-center justify-between gap-2">
                        <QtyStepper
                          value={line.qty}
                          max={line.maxQty}
                          onChange={(qty) => setQty(line.productId, qty)}
                        />
                        <button
                          type="button"
                          className="text-xs text-muted-foreground hover:text-foreground"
                          onClick={() => remove(line.productId)}
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div className="border-t border-border p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))]">
            <div className="mb-3 flex items-center justify-between font-display text-xl">
              <span>Total</span>
              <span className="tabular-nums">{formatPrice(total)}</span>
            </div>
            {lines.length === 0 ? (
              <Button className="w-full rounded-xl" disabled>
                Checkout
              </Button>
            ) : (
              <Button asChild className="w-full rounded-xl">
                <Link to="/checkout" onClick={() => onOpenChange(false)}>
                  Checkout with Stripe
                </Link>
              </Button>
            )}
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

export function CartButton({ onClick }: { onClick: () => void }) {
  const count = useCart((s) => cartCount(s.lines));
  return (
    <button
      type="button"
      onClick={onClick}
      className="relative flex h-11 items-center gap-2 rounded-xl border border-border bg-foreground/5 px-3 text-sm font-semibold hover:bg-muted"
      aria-label={count ? `Bag, ${count} items` : "Bag"}
    >
      <ShoppingBag className="size-4" />
      <span className="hidden sm:inline">Bag</span>
      <span className="inline-grid min-w-[19px] place-items-center rounded-full bg-primary px-1.5 text-[11px] font-bold text-primary-foreground tabular-nums">
        {count}
      </span>
    </button>
  );
}
