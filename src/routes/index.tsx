import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { BinButton } from "@/components/bin-button";
import { ProductGrid } from "@/components/product-card";
import { ProductMedia } from "@/components/product-media";
import { HubHalo } from "@/components/hub-mark";
import { listProducts } from "@/lib/catalog";
import { productMeta, sportLabel } from "@/lib/catalog-types";
import { formatPrice } from "@/lib/format";

const BOXES = [
  { id: "basketball" as const, box: "01" },
  { id: "wnba" as const, box: "02" },
  { id: "football" as const, box: "03" },
  { id: "baseball" as const, box: "04" },
  { id: "nonsport" as const, box: "05" },
];

export const Route = createFileRoute("/")({
  loader: async () => {
    const [featured, latest] = await Promise.all([
      listProducts({ data: { featured: true, inStock: true, limit: 8 } }),
      listProducts({ data: { inStock: true, sort: "newest", limit: 8 } }),
    ]);
    return { featured, latest };
  },
  component: Home,
});

function Home() {
  const { featured, latest } = Route.useLoaderData();
  const hero = featured[0] ?? latest[0] ?? null;
  const shelf = (featured.length > 1 ? featured : latest).filter((item) => item.id !== hero?.id).slice(0, 8);

  return (
    <main>
      <section className="border-b border-border hub-plate">
        <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 md:py-14">
          <p className="font-mono text-xs uppercase tracking-[0.22em] text-muted-foreground">
            Pacific Northwest · singles shop
          </p>
          {hero ? (
            <div className="mt-6 grid gap-10 lg:grid-cols-[minmax(0,18rem)_1fr] lg:items-center">
              <div className="relative mx-auto w-full max-w-[18rem] lg:mx-0">
                <HubHalo className="pointer-events-none absolute -inset-10 text-border" />
                <Link
                  to="/c/$slug"
                  params={{ slug: hero.slug }}
                  className="relative block overflow-hidden rounded-lg border border-border bg-card"
                >
                  <ProductMedia product={hero} className="aspect-[2.5/3.5]" />
                </Link>
              </div>
              <div>
                <h1 className="max-w-xl font-display text-4xl text-foreground md:text-6xl">
                  The hub is open. Cards on the table.
                </h1>
                <p className="mt-4 max-w-md text-base text-foreground/85">
                  A Pacific Northwest shop for singles and slabs. Buy it now with Stripe — ships after checkout, no
                  stream required.
                </p>
                <p className="mt-6 font-display text-2xl">{hero.title}</p>
                <p className="mt-1 text-sm text-muted-foreground">{productMeta(hero)}</p>
                <p className="mt-3 font-display text-3xl tabular-nums">{formatPrice(hero.priceCents)}</p>
                <div className="mt-6 flex max-w-md flex-col gap-3 sm:flex-row">
                  <BinButton product={hero} className="flex-1" />
                  <Link
                    to="/shop"
                    className="inline-flex h-12 flex-1 items-center justify-center rounded-lg border border-border px-5 text-base font-medium hover:bg-muted"
                  >
                    Shop the hub
                  </Link>
                </div>
              </div>
            </div>
          ) : (
            <div className="mt-6">
              <h1 className="max-w-xl font-display text-4xl md:text-6xl">The hub is empty.</h1>
              <p className="mt-4 max-w-md text-base text-foreground/85">
                Cards show up here as they’re listed. Check back, or open the shop.
              </p>
              <div className="mt-6 flex max-w-md flex-col gap-3 sm:flex-row">
                <Link
                  to="/shop"
                  className="inline-flex h-12 items-center justify-center rounded-lg bg-primary px-5 text-base font-medium text-primary-foreground hover:opacity-90"
                >
                  Shop the hub
                </Link>
                <Link
                  to="/desk"
                  className="inline-flex h-12 items-center justify-center rounded-lg border border-border px-5 text-base font-medium hover:bg-muted"
                >
                  Owner desk
                </Link>
              </div>
            </div>
          )}
        </div>
      </section>

      {shelf.length > 0 ? (
        <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
          <div className="mb-8 flex items-end justify-between gap-4">
            <div>
              <p className="font-mono text-xs uppercase tracking-[0.22em] text-muted-foreground">In the hub</p>
              <h2 className="mt-2 font-display text-3xl">Open boxes</h2>
            </div>
            <Link to="/shop" className="hidden items-center gap-1 text-sm text-primary sm:inline-flex">
              Shop all <ArrowRight className="size-4" />
            </Link>
          </div>
          <ProductGrid products={shelf} />
        </section>
      ) : null}

      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <div className="mb-6">
          <p className="font-mono text-xs uppercase tracking-[0.22em] text-muted-foreground">By sport</p>
          <h2 className="mt-2 font-display text-3xl">Boxes by sport</h2>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {BOXES.map((item) => (
            <Link
              key={item.id}
              to="/shop"
              search={{ sport: item.id }}
              className="rounded-lg border border-border bg-card px-4 py-5 hover:border-primary/40"
            >
              <p className="font-mono text-xs tabular-nums text-muted-foreground">Box {item.box}</p>
              <p className="mt-2 font-display text-xl">{sportLabel(item.id)}</p>
            </Link>
          ))}
        </div>
      </section>

      <section className="border-t border-border hub-plate">
        <div className="mx-auto grid max-w-6xl gap-10 px-4 py-16 sm:px-6 md:grid-cols-3">
          {[
            {
              n: "01",
              t: "Open a box",
              d: "Filter the shop by sport or set. Every listing has its own buy link.",
            },
            {
              n: "02",
              t: "Pay on Stripe",
              d: "Buy one card or the whole cart. Shipping is collected at checkout. Ships after the charge.",
            },
            {
              n: "03",
              t: "Keep the slip",
              d: "Stock ticks down. You get an order code as the packing slip.",
            },
          ].map((step) => (
            <div key={step.n}>
              <p className="font-mono text-xs tabular-nums text-muted-foreground">{step.n}</p>
              <h3 className="mt-2 font-display text-2xl">{step.t}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{step.d}</p>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
