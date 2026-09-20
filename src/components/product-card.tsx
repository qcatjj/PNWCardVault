import { Link } from "@tanstack/react-router";
import { ProductMedia } from "@/components/product-media";
import { Badge } from "@/components/ui/badge";
import { kindLabel, productMeta, type Product } from "@/lib/catalog-types";
import { formatPrice } from "@/lib/format";

export function ProductCard({ product }: { product: Product }) {
  const sold = product.qty <= 0;
  return (
    <Link
      to="/c/$slug"
      params={{ slug: product.slug }}
      className="group block overflow-hidden rounded-lg border border-border bg-card outline-none transition-[box-shadow] duration-200 ease-[cubic-bezier(0.22,1,0.36,1)] hover:shadow-[var(--shadow-border-hover)] focus-visible:ring-2 focus-visible:ring-ring/70"
    >
      <ProductMedia product={product} className="aspect-[2.5/3.5]" />
      <div className="space-y-2 p-4">
        <div className="flex items-center gap-2">
          <Badge>{kindLabel(product.kind)}</Badge>
          {product.kind === "break-spot" && product.qty > 0 ? <Badge tone="live">Spots open</Badge> : null}
        </div>
        <h3 className="line-clamp-2 min-h-10 text-sm font-medium leading-snug text-card-foreground">
          {product.title}
        </h3>
        <p className="truncate text-xs text-muted-foreground">{productMeta(product) || "Hub listing"}</p>
        <div className="flex items-baseline gap-2">
          <span className="tabular-nums text-base font-medium text-foreground">
            {formatPrice(product.priceCents)}
          </span>
          {!sold ? <span className="text-xs text-muted-foreground">Buy now</span> : null}
          {product.compareAtCents && product.compareAtCents > product.priceCents ? (
            <span className="tabular-nums text-xs text-muted-foreground line-through">
              {formatPrice(product.compareAtCents)}
            </span>
          ) : null}
        </div>
      </div>
    </Link>
  );
}

export function ProductGrid({ products }: { products: Product[] }) {
  if (products.length === 0) {
    return (
      <div className="rounded-lg border border-border bg-card px-6 py-16 text-center">
        <p className="font-display text-2xl text-foreground">This box is empty.</p>
        <p className="mt-2 text-sm text-muted-foreground">
          Cards land here as they’re listed from the desk. Try another sport, or check back soon.
        </p>
      </div>
    );
  }
  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-5 lg:grid-cols-4">
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}
