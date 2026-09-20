import { createFileRoute, Link } from "@tanstack/react-router";
import { ProductGrid } from "@/components/product-card";
import { KINDS, SPORTS } from "@/lib/catalog-types";
import { listProducts } from "@/lib/catalog";
import { cn } from "@/lib/utils";

type ShopSearch = {
  sport?: string;
  kind?: string;
  q?: string;
  sort?: "newest" | "price-asc" | "price-desc";
};

export const Route = createFileRoute("/shop")({
  validateSearch: (search: Record<string, unknown>): ShopSearch => ({
    sport: typeof search.sport === "string" ? search.sport : undefined,
    kind: typeof search.kind === "string" ? search.kind : undefined,
    q: typeof search.q === "string" ? search.q : undefined,
    sort:
      search.sort === "price-asc" || search.sort === "price-desc" || search.sort === "newest"
        ? search.sort
        : undefined,
  }),
  loaderDeps: ({ search }) => search,
  loader: ({ deps }) => listProducts({ data: deps }),
  component: Shop,
});

function Shop() {
  const products = Route.useLoaderData();
  const search = Route.useSearch();

  return (
    <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <p className="font-mono text-xs uppercase tracking-[0.22em] text-muted-foreground">The hub</p>
      <h1 className="mt-2 font-display text-4xl">Open boxes</h1>
      <p className="mt-3 max-w-xl text-sm text-muted-foreground">
        Every card has its own buy link. Filter a box, open a listing, pay with Stripe. Ships after checkout.
      </p>

      <div className="mt-8 flex flex-wrap gap-2">
        <FilterChip to="/shop" search={{ ...search, sport: undefined }} active={!search.sport}>
          All sports
        </FilterChip>
        {SPORTS.map((sport) => (
          <FilterChip
            key={sport.id}
            to="/shop"
            search={{ ...search, sport: sport.id }}
            active={search.sport === sport.id}
          >
            {sport.label}
          </FilterChip>
        ))}
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        <FilterChip to="/shop" search={{ ...search, kind: undefined }} active={!search.kind}>
          Any type
        </FilterChip>
        {KINDS.map((kind) => (
          <FilterChip
            key={kind.id}
            to="/shop"
            search={{ ...search, kind: kind.id }}
            active={search.kind === kind.id}
          >
            {kind.label}
          </FilterChip>
        ))}
      </div>

      <div className="mt-6 mb-8 flex items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          {search.q ? `Results for “${search.q}” · ` : null}
          {products.length} listing{products.length === 1 ? "" : "s"}
        </p>
        <div className="flex gap-2">
          {(
            [
              ["newest", "Newest"],
              ["price-asc", "Price ↑"],
              ["price-desc", "Price ↓"],
            ] as const
          ).map(([value, label]) => (
            <FilterChip
              key={value}
              to="/shop"
              search={{ ...search, sort: value === "newest" ? undefined : value }}
              active={(search.sort ?? "newest") === value}
            >
              {label}
            </FilterChip>
          ))}
        </div>
      </div>

      <ProductGrid products={products} />
    </main>
  );
}

function FilterChip({
  to,
  search,
  active,
  children,
}: {
  to: "/shop";
  search: ShopSearch;
  active: boolean;
  children: string;
}) {
  return (
    <Link
      to={to}
      search={search}
      className={cn(
        "rounded-full border px-3 py-1.5 text-sm transition-colors duration-150",
        active
          ? "border-primary bg-primary text-primary-foreground"
          : "border-border bg-card text-muted-foreground hover:text-foreground",
      )}
    >
      {children}
    </Link>
  );
}
