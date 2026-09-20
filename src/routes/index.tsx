import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { ProductGrid } from "@/components/product-card";
import { ScoreCard } from "@/components/score-card";
import { ShowStack } from "@/components/show-stack";
import { listProducts } from "@/lib/catalog";
import type { Product } from "@/lib/catalog-types";
import { getScoreboard, matchListings } from "@/lib/scores";

const BOXES = [
  { id: "basketball" as const, label: "Basketball" },
  { id: "wnba" as const, label: "Women's hoops" },
  { id: "football" as const, label: "Football" },
  { id: "baseball" as const, label: "Baseball" },
  { id: "nonsport" as const, label: "Non-sport" },
];

export const Route = createFileRoute("/")({
  loader: async () => {
    const [stock, games] = await Promise.all([
      listProducts({ data: { inStock: true, sort: "newest", limit: 48 } }),
      getScoreboard(),
    ]);
    const featured = stock.filter((item) => item.featured).slice(0, 8);
    const latest = stock.slice(0, 16);
    const slabs = stock.filter((item) => item.kind === "slab").slice(0, 8);
    return { featured, latest, slabs, games, stock };
  },
  component: Home,
});

function Home() {
  const { featured, latest, slabs, games, stock } = Route.useLoaderData();
  const pool = unique([...featured, ...latest]);
  const hot = (featured.length ? featured : latest).slice(0, 8);
  const under50 = pool.filter((item) => item.priceCents <= 5000).slice(0, 8);
  const shorts = pool.filter((item) => Boolean(item.serialNum)).slice(0, 8);
  const board = games
    .filter((game) => game.state !== "pre")
    .map((game) => ({ game, cards: matchListings(game, stock).slice(0, 4) }))
    .filter((row) => row.cards.length > 0)
    .slice(0, 3);

  return (
    <main>
      <section className="mx-auto grid max-w-6xl items-center gap-10 px-4 pt-10 pb-6 sm:px-6 lg:grid-cols-[1.08fr_0.92fr] lg:pt-16">
        <div className="relative z-10">
          <p className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-foreground">
            <span className="live-dot size-2 rounded-full bg-primary" />
            Cards on the table
          </p>
          <h1 className="mt-4 max-w-xl text-6xl text-foreground md:text-8xl">
            Own the
            <br />
            <span className="stroke-title">hobby.</span>
          </h1>
          <p className="mt-5 max-w-xl text-base text-muted-foreground md:text-lg">
            Pacific Northwest sports-card shop for singles and slabs. Buy now with Stripe — ships after checkout.
          </p>
          <div className="mt-8 flex max-w-md flex-col gap-3 sm:flex-row">
            <Link
              to="/shop"
              className="inline-flex h-12 items-center justify-center rounded-xl bg-primary px-5 text-sm font-bold text-primary-foreground shadow-[0_10px_32px_color-mix(in_oklab,var(--color-primary)_16%,transparent)]"
            >
              Shop cards
            </Link>
            <Link
              to="/drops"
              className="inline-flex h-12 items-center justify-center rounded-xl border border-border bg-foreground/5 px-5 text-sm font-bold"
            >
              View new drops
            </Link>
          </div>
        </div>
        <ShowStack />
      </section>

      <section className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-2 sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0">
          <Chip to="/shop">All</Chip>
          {BOXES.map((box) => (
            <Chip key={box.id} to="/shop" search={{ sport: box.id }}>
              {box.label}
            </Chip>
          ))}
          <Chip to="/shop" search={{ kind: "slab" }}>
            Slabs
          </Chip>
          <Chip to="/shop" search={{ kind: "single" }}>
            Raw
          </Chip>
          <Chip to="/shop" search={{ kind: "sealed" }}>
            Sealed
          </Chip>
          <Chip to="/shop" search={{ kind: "auto" }}>
            Autographs
          </Chip>
        </div>
      </section>

      {board.length > 0 ? (
        <section className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
          <div className="mb-6 flex items-end justify-between gap-4">
            <div>
              <p className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em]">
                <span className="live-dot size-2 rounded-full bg-primary" />
                Tonight
              </p>
              <h2 className="mt-2 text-3xl md:text-4xl">On the board</h2>
            </div>
            <Link to="/scores" className="hidden items-center gap-1 text-sm font-semibold text-primary sm:inline-flex">
              All scores <ArrowRight className="size-4" />
            </Link>
          </div>
          <div className="space-y-8">
            {board.map(({ game, cards }) => (
              <div key={game.id} className="grid gap-4 lg:grid-cols-[minmax(0,18rem)_1fr] lg:items-start">
                <ScoreCard game={game} />
                <ProductGrid products={cards} />
              </div>
            ))}
          </div>
        </section>
      ) : null}

      <Shelf title="Hot right now" products={hot} />
      <Shelf title="New drops" products={latest.slice(0, 8)} to="/drops" />
      <Shelf title="Slab vault" products={slabs} to="/shop" search={{ kind: "slab" }} />
      <Shelf title="Under $50" products={under50} />
      <Shelf title="1/1 + short prints" products={shorts} />

      <section id="about" className="mx-auto mt-8 mb-10 max-w-6xl px-4 sm:px-6">
        <div className="overflow-hidden rounded-[26px] border border-border bg-card px-6 py-10 sm:flex sm:items-center sm:justify-between sm:px-10">
          <div className="max-w-xl">
            <p className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em]">
              <span className="live-dot size-2 rounded-full bg-primary" />
              About the shop
            </p>
            <h2 className="mt-3 text-4xl md:text-5xl">Cards. Sealed. Culture.</h2>
            <p className="mt-3 text-sm text-muted-foreground md:text-base">
              PNW Card Hub is a private Pacific Northwest shop. Listings come from the owner desk. No buyer account —
              pay on Stripe and keep the order code as the packing slip.
            </p>
          </div>
          <Link
            to="/shop"
            className="mt-6 inline-flex h-12 items-center rounded-xl bg-primary px-5 text-sm font-bold text-primary-foreground sm:mt-0"
          >
            Shop the case
          </Link>
        </div>
      </section>
    </main>
  );
}

function unique(items: Product[]) {
  const seen = new Set<number>();
  return items.filter((item) => {
    if (seen.has(item.id)) return false;
    seen.add(item.id);
    return true;
  });
}

function Shelf({
  title,
  products,
  to,
  search,
}: {
  title: string;
  products: Product[];
  to?: "/shop" | "/drops";
  search?: { kind?: string };
}) {
  if (products.length === 0) return null;
  return (
    <section className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <div className="mb-6 flex items-end justify-between gap-4">
        <h2 className="text-3xl md:text-4xl">{title}</h2>
        {to ? (
          <Link to={to} search={search} className="hidden items-center gap-1 text-sm font-semibold text-primary sm:inline-flex">
            See all <ArrowRight className="size-4" />
          </Link>
        ) : (
          <Link to="/shop" className="hidden items-center gap-1 text-sm font-semibold text-primary sm:inline-flex">
            Shop all <ArrowRight className="size-4" />
          </Link>
        )}
      </div>
      <ProductGrid products={products} />
    </section>
  );
}

function Chip({
  to,
  search,
  children,
}: {
  to: "/shop";
  search?: { sport?: string; kind?: string };
  children: string;
}) {
  return (
    <Link
      to={to}
      search={search}
      className="inline-flex h-11 shrink-0 items-center rounded-xl border border-border bg-foreground/5 px-3.5 text-sm font-semibold text-muted-foreground hover:text-foreground"
    >
      {children}
    </Link>
  );
}
