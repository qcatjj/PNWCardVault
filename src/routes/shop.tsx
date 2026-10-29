import { createFileRoute, Link } from "@tanstack/react-router";
import { ProductGrid } from "@/components/product-card";
import { KINDS, SPORTS, type Product } from "@/lib/catalog-types";
import { gradeInfo, inBand, PRICE_BANDS, teamOf } from "@/lib/listing-facts";
import { useEffect, useState } from "react";
import { CATALOG_CACHE_CONTROL, CATALOG_CACHE_MS } from "@/lib/catalog-cache";
import { listProducts } from "@/lib/catalog";
import { cn } from "@/lib/utils";

type ShopSearch = {
  sport?: string;
  kind?: string;
  q?: string;
  sort?: "newest" | "price-asc" | "price-desc";
  set?: string;
  year?: string;
  team?: string;
  price?: string;
  cond?: "raw" | "graded";
  filters?: "open";
};

const str = (v: unknown) => (typeof v === "string" && v ? v : undefined);

export const Route = createFileRoute("/shop")({
  validateSearch: (search: Record<string, unknown>): ShopSearch => ({
    sport: typeof search.sport === "string" ? search.sport : undefined,
    kind: typeof search.kind === "string" ? search.kind : undefined,
    q: typeof search.q === "string" ? search.q : undefined,
    sort:
      search.sort === "price-asc" || search.sort === "price-desc" || search.sort === "newest"
        ? search.sort
        : undefined,
    set: str(search.set),
    year: str(search.year) ?? (typeof search.year === "number" ? String(search.year) : undefined),
    team: str(search.team),
    price: str(search.price),
    cond: search.cond === "raw" || search.cond === "graded" ? search.cond : undefined,
    filters: search.filters === "open" ? "open" : undefined,
  }),
  loaderDeps: ({ search }) => ({
    sport: search.sport,
    kind: search.kind,
    q: search.q,
    sort: search.sort,
  }),
  staleTime: CATALOG_CACHE_MS,
  preloadStaleTime: CATALOG_CACHE_MS,
  headers: () => ({ "Cache-Control": CATALOG_CACHE_CONTROL }),
  loader: ({ deps }) => listProducts({ data: deps }),
  head: () => ({
    meta: [
      { title: "Shop sports cards · PNW Card Hub" },
      {
        name: "description",
        content:
          "Browse singles, autos, rookies and slabs by sport, set, year, team and price. $6 tracked USPS shipping from Selah, WA.",
      },
    ],
  }),
  component: Shop,
});

function Shop() {
  const all = Route.useLoaderData();
  const search = Route.useSearch();
  const [open, setOpen] = useState(search.filters === "open");
  useEffect(() => {
    if (search.filters === "open") setOpen(true);
  }, [search.filters]);
  const facets = buildFacets(all);
  const products = all.filter(
    (p) =>
      (!search.set || p.setName === search.set) &&
      (!search.year || String(p.year) === search.year) &&
      (!search.team || teamOf(p) === search.team) &&
      inBand(p.priceCents, search.price) &&
      (!search.cond || (search.cond === "graded") === gradeInfo(p).graded),
  );
  const extraActive = [search.set, search.year, search.team, search.price, search.cond].filter(
    Boolean,
  ).length;

  return (
    <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-10">
      <h1 className="text-4xl md:text-5xl">Shop</h1>
      <p className="mt-2 max-w-xl text-sm text-muted-foreground">
        Filter a box, open a listing, pay with Stripe.
      </p>

      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="mt-6 inline-flex min-h-11 items-center rounded-xl border border-border bg-card px-4 text-sm font-semibold md:hidden"
        aria-expanded={open}
        aria-controls="filters"
      >
        {open ? "Hide filters" : `Filters${extraActive ? ` (${extraActive})` : ""}`}
      </button>
      <div id="filters" className={cn("md:block", open ? "block" : "hidden")}>
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

        <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
          <FacetSelect label="Set / brand" value={search.set} options={facets.sets} param="set" />
          <FacetSelect label="Year" value={search.year} options={facets.years} param="year" />
          <FacetSelect label="Team" value={search.team} options={facets.teams} param="team" />
          <FacetSelect
            label="Price"
            value={search.price}
            options={PRICE_BANDS.map((b) => ({ value: b.id, label: b.label }))}
            param="price"
          />
          <FacetSelect
            label="Condition"
            value={search.cond}
            options={[
              { value: "raw", label: "Raw" },
              { value: "graded", label: "Graded" },
            ]}
            param="cond"
          />
        </div>
      </div>

      <div className="mt-6 mb-8 flex flex-wrap items-center justify-between gap-3">
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
        "inline-flex min-h-11 shrink-0 items-center rounded-xl border px-3.5 text-sm font-semibold transition-colors duration-150",
        active
          ? "border-primary bg-primary text-primary-foreground"
          : "border-border bg-card text-muted-foreground hover:text-foreground",
      )}
    >
      {children}
    </Link>
  );
}

type Opt = { value: string; label: string };

function buildFacets(products: Product[]) {
  const uniq = (values: Array<string | null | undefined>): Opt[] =>
    [...new Set(values.filter((v): v is string => Boolean(v)))]
      .sort((a, b) => a.localeCompare(b))
      .map((v) => ({ value: v, label: v }));
  return {
    sets: uniq(products.map((p) => p.setName)),
    years: uniq(products.map((p) => (p.year ? String(p.year) : null))).reverse(),
    teams: uniq(products.map((p) => teamOf(p))),
  };
}

function FacetSelect({
  label,
  value,
  options,
  param,
}: {
  label: string;
  value: string | undefined;
  options: Opt[];
  param: "set" | "year" | "team" | "price" | "cond";
}) {
  const navigate = Route.useNavigate();
  if (options.length === 0) return null;
  return (
    <label className="flex flex-col gap-1 text-xs font-semibold text-muted-foreground">
      {label}
      <select
        value={value ?? ""}
        onChange={(event) => {
          const next = event.target.value || undefined;
          void navigate({ search: (prev: ShopSearch) => ({ ...prev, [param]: next }) });
        }}
        className="h-11 rounded-xl border border-border bg-card px-3 text-sm font-semibold text-foreground"
      >
        <option value="">All</option>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
}
