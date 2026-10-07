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
  { id: "sealed", label: "Sealed" },
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
    re: /\bwnba\b|caitlin clark|paige bueckers|napheesa|angel reese|a'?ja wilson|breanna stewart|cameron brink|kelsey plum|sue bird|diana taurasi|sabrina ionescu|jewell loyd|candace parker|lisa leslie|seattle storm|las vegas aces|new york liberty|indiana fever/,
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
    re: /\bnba\b|\bncaab\b|\bbasketball\b|\bhoops\b|cooper flagg|wembanyama|gilgeous|lamelo|lebron|stephen curry|steph curry|michael jordan|kobe bryant|luka don[cč]i[cć]|jayson tatum|giannis|nikola jokic|nikola jokić|kevin durant|anthony edwards|chet holmgren|kevin garnett|tim duncan|shaquille o'?neal|allen iverson|scottie pippen|larry bird|magic johnson|kareem|bill russell|los angeles lakers|boston celtics|chicago bulls|golden state warriors|oklahoma city thunder|san antonio spurs|portland trail blazers|seattle supersonics/,
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

/** Resolve old/imported listings as well as new uploads, without rewriting inventory. */
export function listingSport(product: Pick<Product, "sport" | "title" | "player" | "setName" | "parallel" | "description">): string {
  return inferSport(product.title, product.player, product.setName, product.parallel)
    ?? inferSport(product.description)
    ?? inferSport(product.sport)
    ?? product.sport;
}

/** WNBA is both its own category and part of the overall basketball inventory. */
export function matchesSport(actual: string, requested: string): boolean {
  const sport = inferSport(requested) ?? requested;
  return actual === sport || (sport === "basketball" && actual === "wnba");
}

/** Autographs can also be singles, slabs, or patch cards. */
export function matchesKind(product: Pick<Product, "kind" | "title" | "setName" | "parallel" | "description">, requested: string): boolean {
  if (requested === "sealed") return product.kind === "sealed" || product.kind === "break-spot";
  if (product.kind === requested) return true;
  if (requested !== "auto" || product.kind === "sealed" || product.kind === "break-spot") return false;
  const details = [product.title, product.setName, product.parallel, product.description].filter(Boolean).join(" ");
  if (/\b(?:non[- ]?auto|no autograph|not autographed|unsigned|facsimile|printed signature)\b/i.test(details)) return false;
  return /\b(?:auto(?:s|graph(?:s|ed)?)?|on[- ]card auto|signed|signature(?:s)?)\b/i.test(details);
}

export function kindLabel(id: string) {
  if (id === "break-spot") return "Sealed";
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
