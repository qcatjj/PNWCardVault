import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { listProducts } from "@/lib/catalog";
import { listingPath, productName, type Product } from "@/lib/catalog-types";
import { formatPriceShort } from "@/lib/format";

const SPORT_ABBR: Record<string, string> = {
  basketball: "NBA",
  wnba: "WNBA",
  football: "NFL",
  baseball: "MLB",
  nonsport: "HBY",
};

const KIND_ABBR: Record<string, string> = {
  single: "BIN",
  slab: "SLAB",
  auto: "AUTO",
  relic: "RELIC",
  "break-spot": "SPOT",
};

const HOLD: Array<{ key: string; sport: string; name: string; price: string; kind: string; to: "/shop" }> = [
  { key: "h1", sport: "NBA", name: "Waiting on listings", price: "—", kind: "HUB", to: "/shop" },
  { key: "h2", sport: "NFL", name: "Desk is open", price: "—", kind: "LIVE", to: "/shop" },
  { key: "h3", sport: "MLB", name: "PNW Card Hub", price: "—", kind: "SHOP", to: "/shop" },
  { key: "h4", sport: "WNBA", name: "Singles and slabs", price: "—", kind: "BIN", to: "/shop" },
];

type Tick = {
  key: string;
  sport: string;
  name: string;
  price: string;
  kind: string;
  to: "/shop" | "/c/$slug" | "/v/$code";
  params?: { slug: string } | { code: string };
};

function toTick(product: Product): Tick {
  const path = listingPath(product);
  const short = product.shortCode;
  return {
    key: String(product.id),
    sport: SPORT_ABBR[product.sport] ?? product.sport.toUpperCase().slice(0, 3),
    name: productName(product),
    price: formatPriceShort(product.priceCents),
    kind: KIND_ABBR[product.kind] ?? "BIN",
    to: short ? "/v/$code" : "/c/$slug",
    params: short ? { code: short } : { slug: product.slug },
  };
}

export function LiveTicker() {
  const { data } = useQuery({
    queryKey: ["live-ticker"],
    queryFn: () => listProducts({ data: { inStock: true, sort: "newest", limit: 24 } }),
    staleTime: 30_000,
  });

  const listed = (data ?? []).map(toTick);
  const base = listed.length > 0 ? listed : HOLD;
  const loop = base.length < 6 ? [...base, ...base, ...base, ...base] : [...base, ...base];
  const seconds = Math.max(28, loop.length * 2.4);

  return (
    <div className="ticker-track flex h-8 items-stretch">
      <p className="flex shrink-0 items-center gap-1.5 bg-live px-2.5 font-mono text-[10px] font-medium uppercase tracking-[0.18em] text-background">
        <span className="live-dot size-1.5 rounded-full bg-background" />
        Live
      </p>
      <div className="min-w-0 flex-1 overflow-hidden">
        <div className="ticker flex w-max items-center" style={{ animationDuration: `${seconds}s` }}>
          {loop.map((item, index) => (
            <TickItem key={`${item.key}-${index}`} item={item} />
          ))}
        </div>
      </div>
    </div>
  );
}

function TickItem({ item }: { item: Tick }) {
  const body = (
    <>
      <span className="font-mono text-[10px] font-medium tracking-[0.14em] text-accent">{item.sport}</span>
      <span className="max-w-40 truncate text-[12px] font-medium text-foreground">{item.name}</span>
      <span className="font-mono text-[12px] tabular-nums text-primary">{item.price}</span>
      <span className="font-mono text-[10px] tracking-[0.12em] text-live">{item.kind}</span>
    </>
  );

  const className =
    "flex h-8 shrink-0 items-center gap-2 border-r border-border px-3 hover:bg-muted";

  if (item.to === "/shop") {
    return (
      <Link to="/shop" className={className}>
        {body}
      </Link>
    );
  }
  if (item.to === "/v/$code") {
    return (
      <Link to="/v/$code" params={{ code: (item.params as { code: string }).code }} className={className}>
        {body}
      </Link>
    );
  }
  return (
    <Link to="/c/$slug" params={{ slug: (item.params as { slug: string }).slug }} className={className}>
      {body}
    </Link>
  );
}
