import { useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { QtyStepper } from "@/components/qty-stepper";
import { Button } from "@/components/ui/button";
import { useCart } from "@/lib/cart";
import type { Product } from "@/lib/catalog-types";

export function AddToCart({ product }: { product: Product }) {
  const add = useCart((s) => s.add);
  const navigate = useNavigate();
  const [qty, setQty] = useState(1);
  const sold = product.qty <= 0;
  const max = Math.max(product.qty, 1);

  function onAdd() {
    const result = add(product, qty);
    if (!result.ok) {
      toast.error(result.reason);
      return;
    }
    toast.success(product.kind === "break-spot" ? "Spot added to cart." : "Added to cart.");
  }

  function onBuy() {
    void navigate({
      to: "/checkout",
      search: { bin: product.slug, qty: qty > 1 ? qty : undefined },
    });
  }

  if (sold) {
    return (
      <Button disabled className="w-full">
        Sold out
      </Button>
    );
  }

  const buyLabel = product.kind === "break-spot" ? "Buy this spot" : "Buy now";

  return (
    <div className="flex flex-col gap-3">
      {product.qty > 1 ? <QtyStepper value={qty} max={max} onChange={setQty} /> : null}
      <div className="flex flex-col gap-2 sm:flex-row">
        <Button type="button" onClick={onBuy} className="flex-1">
          {buyLabel}
        </Button>
        <Button type="button" variant="outline" onClick={onAdd} className="flex-1">
          Add to cart
        </Button>
      </div>
    </div>
  );
}
