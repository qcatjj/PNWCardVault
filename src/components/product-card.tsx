import { Link } from "@tanstack/react-router";
import type { MouseEvent } from "react";
import { toast } from "sonner";
import { ProductMedia } from "@/components/product-media";
import { Badge } from "@/components/ui/badge";
import { useCart } from "@/lib/cart";
import { kindLabel, productMeta, sportLabel, type Product } from "@/lib/catalog-types";
import { formatPrice } from "@/lib/format";

export function ProductCard({ product }: { product: Product }) {
  const sold = product.qty <= 0;
  const add = useCart((s) => s.add);

  function onBuy(event: MouseEvent) {
    event.preventDefault();
    event.stopPropagation();
    const result = add(product, 1);
    if (!result.ok) {
      toast.error(result.reason);
      return;
    }
    toast.success("Added to bag");
  }

  return (
    <article className="group relative overflow-hidden rounded-[20px] border border-border bg-foreground/[0.04] p-3 transition-[transform,box-shadow,border-color] duration-200 ease-[cubic-bezier(0.22,1,0.36,1)] hover:-translate-y-1 hover:border-foreground/25 hover:shadow-[var(--shadow-border-hover)]">
      <Link to="/c/$slug" params={{ slug: product.slug }} className="block outline-none">
        <div className="relative overflow-hidden rounded-[15px]">
          <ProductMedia product={product} className="aspect-[2.5/3.5] transition-transform duration-300 group-hover:scale-[1.03]" />
          <span className="absolute top-2 left-2 rounded-lg border border-border bg-background/80 px-2 py-1 text-[10px] font-bold tracking-wide">
            {sportLabel(product.sport)}
          </span>
        </div>
        <div className="space-y-2 px-1 pt-3">
          <div className="flex items-center gap-2">
            <Badge>{kindLabel(product.kind)}</Badge>
            {product.serialNum ? <Badge tone="accent">{product.serialNum}</Badge> : null}
          </div>
          <h3 className="line-clamp-2 min-h-10 text-sm font-semibold leading-snug text-card-foreground">
            {product.title}
          </h3>
          <p className="truncate text-xs text-muted-foreground">{productMeta(product) || sportLabel(product.sport)}</p>
        </div>
      </Link>
      <div className="mt-3 flex items-center justify-between gap-2 px-1 pb-1">
        <span className="tabular-nums text-lg font-bold">{formatPrice(product.priceCents)}</span>
        {sold ? (
          <span className="text-xs font-semibold text-destructive">Sold</span>
        ) : (
          <button
            type="button"
            onClick={onBuy}
            className="h-9 rounded-[10px] bg-primary px-3 text-xs font-bold text-primary-foreground"
          >
            Buy
          </button>
        )}
      </div>
    </article>
  );
}

export function ProductGrid({ products }: { products: Product[] }) {
  if (products.length === 0) {
    return (
      <div className="rounded-[20px] border border-border bg-card px-6 py-16 text-center">
        <p className="font-display text-3xl text-foreground">This box is empty.</p>
        <p className="mt-2 text-sm text-muted-foreground">
          Cards land here as they’re listed from the desk. Try another sport, or check back soon.
        </p>
      </div>
    );
  }
  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-4 lg:grid-cols-4">
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}
