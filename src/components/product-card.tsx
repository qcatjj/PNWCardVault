import { Link } from "@tanstack/react-router";
import type { MouseEvent } from "react";
import { toast } from "sonner";
import { ProductMedia } from "@/components/product-media";
import { ListingBadges, ListingTitle } from "@/components/listing-bits";
import { useCart } from "@/lib/cart";
import { sportLabel, type Product } from "@/lib/catalog-types";
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
          <ProductMedia
            product={product}
            className="aspect-[2.5/3.5] transition-transform duration-300 group-hover:scale-[1.03]"
          />
          <span className="absolute top-2 left-2 rounded-lg border border-border bg-background/80 px-2 py-1 text-[10px] font-bold tracking-wide">
            {sportLabel(product.sport)}
          </span>
        </div>
        <div className="space-y-2 px-1 pt-3">
          <ListingBadges product={product} />
          <div className="min-h-[3.25rem]">
            <ListingTitle product={product} />
          </div>
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
            className="h-11 min-w-16 rounded-[10px] bg-primary px-4 text-sm font-bold text-primary-foreground"
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

/** Horizontally swipeable shelf on mobile; regular grid from md up. */
export function ProductRail({ products }: { products: Product[] }) {
  return (
    <div className="-mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-2 [scrollbar-width:none] md:mx-0 md:grid md:grid-cols-3 md:gap-4 md:overflow-visible md:px-0 lg:grid-cols-4">
      {products.map((product) => (
        <div key={product.id} className="w-[46%] shrink-0 snap-start md:w-auto">
          <ProductCard product={product} />
        </div>
      ))}
    </div>
  );
}
