import { Link } from "@tanstack/react-router";
import { AddToCart } from "@/components/add-to-cart";
import { ProductGrid } from "@/components/product-card";
import { ProductMedia } from "@/components/product-media";
import { ShareKit } from "@/components/share-kit";
import { Badge } from "@/components/ui/badge";
import { kindLabel, productMeta, sportLabel, type Product } from "@/lib/catalog-types";
import { formatPrice } from "@/lib/format";

export function ProductView({ product, related }: { product: Product; related: Product[] }) {
  const sold = product.qty <= 0;

  return (
    <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <nav className="mb-6 text-sm text-muted-foreground">
        <Link to="/shop" className="hover:text-foreground">
          Shop
        </Link>
        <span className="px-2">/</span>
        <Link to="/shop" search={{ sport: product.sport }} className="hover:text-foreground">
          {sportLabel(product.sport)}
        </Link>
      </nav>

      <div className="grid gap-10 md:grid-cols-2 md:items-start lg:grid-cols-[minmax(0,26rem)_1fr]">
        <ProductMedia
          product={product}
          className="aspect-[2.5/3.5] w-full rounded-lg border border-border"
          sizes="(min-width: 768px) 420px, 90vw"
        />
        <div className="pb-28 md:pb-0">
          <div className="flex flex-wrap gap-2">
            <Badge>{kindLabel(product.kind)}</Badge>
            <Badge>{sportLabel(product.sport)}</Badge>
            {sold ? <Badge tone="sold">Sold out</Badge> : <Badge tone="live">{product.qty} left</Badge>}
          </div>
          <h1 className="mt-4 font-display text-4xl text-foreground">{product.title}</h1>
          <p className="mt-2 text-sm text-muted-foreground">{productMeta(product)}</p>
          <div className="mt-5 flex items-baseline gap-3">
            <p className="font-display text-3xl tabular-nums">{formatPrice(product.priceCents)}</p>
            {product.compareAtCents && product.compareAtCents > product.priceCents ? (
              <p className="text-muted-foreground line-through tabular-nums">
                {formatPrice(product.compareAtCents)}
              </p>
            ) : null}
            {!sold ? <span className="text-sm text-muted-foreground">Buy now</span> : null}
          </div>
          {product.description ? (
            <p className="mt-6 max-w-xl text-sm leading-relaxed text-foreground/90">{product.description}</p>
          ) : null}
          {product.imageDepiction ? (
            <p className="mt-4 max-w-xl text-sm text-muted-foreground">
              This is a depiction of the card. The listing photo was AI-enhanced for shop quality. You receive the
              physical card described, in the condition noted.
            </p>
          ) : null}

          <div className="mt-8 space-y-4 border-t border-border pt-6">
            <div className="hidden md:block">
              <AddToCart product={product} />
            </div>
            <ShareKit product={product} />
            <p className="text-xs text-muted-foreground">
              Buy now opens Stripe checkout — no account needed. Ships after payment.
            </p>
          </div>
        </div>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-background/95 px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] md:hidden">
        <div className="mx-auto max-w-6xl">
          <AddToCart product={product} />
        </div>
      </div>

      {related.length > 0 ? (
        <section className="mt-16">
          <h2 className="mb-6 font-display text-2xl">More from this drawer</h2>
          <ProductGrid products={related} />
        </section>
      ) : null}
    </main>
  );
}

export function ListingMissing() {
  return (
    <main className="mx-auto max-w-xl px-4 py-24 text-center">
      <h1 className="font-display text-3xl">That listing walked.</h1>
      <p className="mt-2 text-sm text-muted-foreground">The buy link does not match anything in the hub.</p>
      <Link to="/shop" className="mt-6 inline-block text-sm text-primary">
        Back to the shop
      </Link>
    </main>
  );
}
