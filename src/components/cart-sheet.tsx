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
        <Dialog.Overlay className="fixed inset-0 z-50 bg-background/70" />
        <Dialog.Content className="fixed top-0 right-0 bottom-0 left-auto z-50 flex h-dvh w-full max-w-md flex-col border-l border-border bg-card shadow-xl outline-none">
          <div className="flex items-center justify-between border-b border-border px-5 py-4">
            <Dialog.Title className="font-display text-xl text-card-foreground">Cart</Dialog.Title>
            <Dialog.Close asChild>
              <button type="button" className="flex size-11 items-center justify-center rounded-md hover:bg-muted" aria-label="Close cart">
                <X className="size-5" />
              </button>
            </Dialog.Close>
          </div>
          <div className="flex-1 overflow-y-auto px-5 py-4">
            {lines.length === 0 ? (
              <div className="flex h-full min-h-56 flex-col items-center justify-center text-center">
                <ShoppingBag className="size-8 text-muted-foreground" />
                <p className="mt-3 font-display text-2xl">The box is empty.</p>
                <p className="mt-1 text-sm text-muted-foreground">Take a listing from the hub.</p>
              </div>
            ) : (
              <ul className="space-y-4">
                {lines.map((line) => (
                  <li key={line.productId} className="flex gap-3">
                    <div className="w-20 shrink-0 overflow-hidden rounded-md border border-border">
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
                        className="line-clamp-2 text-sm font-medium text-foreground"
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
          <div className="border-t border-border p-5">
            <div className="mb-3 flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Subtotal</span>
              <span className="tabular-nums font-medium">{formatPrice(total)}</span>
            </div>
            {lines.length === 0 ? (
              <Button className="w-full" disabled>
                Checkout
              </Button>
            ) : (
              <Button asChild className="w-full">
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
      className="relative flex size-11 items-center justify-center rounded-md hover:bg-muted"
      aria-label={count ? `Cart, ${count} items` : "Cart"}
    >
      <ShoppingBag className="size-5" />
      {count > 0 ? (
        <span className="absolute top-1.5 right-1.5 flex size-4 items-center justify-center rounded-full bg-primary text-[10px] font-medium text-primary-foreground tabular-nums">
          {count}
        </span>
      ) : null}
    </button>
  );
}
