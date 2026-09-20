export const SPORTS = [
  { id: "basketball", label: "Basketball" },
  { id: "wnba", label: "WNBA" },
  { id: "football", label: "Football" },
  { id: "baseball", label: "Baseball" },
  { id: "nonsport", label: "Non-sport" },
] as const;

export const KINDS = [
  { id: "single", label: "Singles" },
  { id: "slab", label: "Slabs" },
  { id: "auto", label: "Autos" },
  { id: "relic", label: "Relics" },
  { id: "break-spot", label: "Break spots" },
] as const;

export type SportId = (typeof SPORTS)[number]["id"];
export type KindId = (typeof KINDS)[number]["id"];

export type Product = {
  id: number;
  slug: string;
  title: string;
  player: string | null;
  setName: string | null;
  year: number | null;
  sport: string;
  kind: string;
  parallel: string | null;
  serialNum: string | null;
  grade: string | null;
  priceCents: number;
  compareAtCents: number | null;
  qty: number;
  description: string | null;
  imageKey: string;
  imageUrl: string | null;
  imageUrlBack?: string | null;
  imageDepiction?: boolean;
  featured: boolean;
  dropId: number | null;
  dropSlug: string | null;
  dropTitle: string | null;
  shortCode: string | null;
  onBlock: boolean;
  queuePos?: number | null;
};

export type Drop = {
  id: number;
  slug: string;
  title: string;
  subtitle: string | null;
  kind: string;
  status: string;
  imageKey: string;
  blurb: string | null;
  productCount: number;
};

export type OrderItem = {
  productId: number;
  slug: string;
  title: string;
  qty: number;
  priceCents: number;
  imageKey: string;
  imageUrl?: string | null;
};

export type OrderPayment =
  | { provider: "stripe"; brand: string; last4: string; mode: "test" | "live" }
  | { provider: "desk" };

export type Order = {
  code: string;
  items: OrderItem[];
  totalCents: number;
  status: string;
  createdAt: string;
  payment: OrderPayment | null;
};

export type ListFilters = {
  sport?: string;
  kind?: string;
  q?: string;
  featured?: boolean;
  dropSlug?: string;
  inStock?: boolean;
  sort?: "newest" | "price-asc" | "price-desc";
  limit?: number;
};

export function sportLabel(id: string) {
  return SPORTS.find((s) => s.id === id)?.label ?? id;
}

const SPORT_HINTS: { id: SportId; re: RegExp }[] = [
  {
    id: "wnba",
    re: /\bwnba\b|caitlin clark|paige bueckers|napheesa|angel reese|a'?ja wilson|breanna stewart|cameron brink|kelsey plum/,
  },
  {
    id: "football",
    re: /\bnfl\b|\bncaaf\b|\bfootball\b|\bgridiron\b|bo nix|patrick mahomes|josh allen|lamar jackson|joe burrow|jayden daniels|caleb williams/,
  },
  {
    id: "baseball",
    re: /\bmlb\b|\bbaseball\b|\bbowman\b|topps series|topps update|\bsabermetric\b/,
  },
  {
    id: "basketball",
    re: /\bnba\b|\bncaab\b|\bbasketball\b|\bhoops\b|cooper flagg|wembanyama|gilgeous|lamelo|lebron|stephen curry/,
  },
  {
    id: "nonsport",
    re: /\bpokemon\b|\bpokémon\b|\bmarvel\b|\bdeadpool\b|\bgpk\b|garbage pail|\bmtg\b|magic:? the gathering|\byugioh\b|\byu-gi-oh\b|\bdisney\b|\bloungefly\b|\bscryfall\b/,
  },
];

/** Guess sport from title, player, set, or catalog console name. */
export function inferSport(...parts: Array<string | null | undefined>): SportId | null {
  const hay = parts.filter(Boolean).join(" ").toLowerCase();
  if (!hay.trim()) return null;
  const exact = hay.trim();
  if (exact === "nba" || exact === "ncaab" || exact === "hoops") return "basketball";
  if (exact === "nfl" || exact === "ncaaf") return "football";
  if (exact === "mlb") return "baseball";
  if (SPORTS.some((s) => s.id === exact)) return exact as SportId;
  for (const row of SPORT_HINTS) {
    if (row.re.test(hay)) return row.id;
  }
  return null;
}

export function resolveSport(selected: SportId, ...hints: Array<string | null | undefined>): SportId {
  return inferSport(...hints) ?? selected;
}

export function kindLabel(id: string) {
  return KINDS.find((k) => k.id === id)?.label ?? id;
}

export function productImageSrc(product: {
  imageKey?: string | null;
  imageUrl?: string | null;
}) {
  if (product.imageUrl) return product.imageUrl;
  if (!product.imageKey || product.imageKey === "face") return null;
  return `/cards/${product.imageKey}.jpg`;
}

export function listingPath(product: Pick<Product, "slug" | "shortCode">) {
  return product.shortCode ? `/v/${product.shortCode}` : `/c/${product.slug}`;
}

export function productMeta(product: Pick<Product, "setName" | "parallel" | "serialNum" | "grade" | "year">) {
  return [product.year, product.setName, product.parallel, product.serialNum, product.grade]
    .filter(Boolean)
    .join(" · ");
}

export function productName(product: Pick<Product, "player" | "title">) {
  return product.player || product.title;
}
