// Pure helpers that derive display facts from stored listing data (never rewrites stored titles).
import type { Product } from "./catalog-types";

type Facts = Pick<
  Product,
  "title" | "kind" | "grade" | "serialNum" | "parallel" | "setName" | "description"
>;

const GRADER = /\b(PSA|BGS|SGC|CGC|CSG|HGA|TAG)\s*(?:GEM\s*(?:MT|MINT)?\s*)?(\d{1,2}(?:\.5)?)\b/i;

export function gradeInfo(p: Facts): { graded: boolean; label: string } {
  const grade = (p.grade ?? "").trim();
  if (grade && !/^raw$/i.test(grade)) return { graded: true, label: grade };
  const m = p.title.match(GRADER);
  if (m) return { graded: true, label: `${m[1]!.toUpperCase()} ${m[2]}` };
  if (p.kind === "slab") return { graded: true, label: "Graded" };
  return { graded: false, label: "Raw" };
}

export function serialOf(p: Facts): string | null {
  if (p.serialNum?.trim()) return p.serialNum.trim();
  const m = p.title.match(/(?:^|\s)(\d{1,4}\/\d{1,4}|\/\d{1,4})(?=\s|$)/);
  return m ? m[1]! : null;
}

export function isRookie(p: Facts): boolean {
  return /\b(RC|rookie)\b/i.test(`${p.title} ${p.parallel ?? ""}`);
}

export function isAuto(p: Facts): boolean {
  const hay = `${p.title} ${p.setName ?? ""} ${p.parallel ?? ""}`;
  if (/\b(non[- ]?auto|facsimile|unsigned)\b/i.test(hay)) return false;
  return /\b(auto(?:graph(?:s|ed)?)?|signed|signatures?)\b/i.test(hay);
}

const TEAMS = [
  // NFL
  "Cardinals",
  "Falcons",
  "Ravens",
  "Bills",
  "Panthers",
  "Bears",
  "Bengals",
  "Browns",
  "Cowboys",
  "Broncos",
  "Lions",
  "Packers",
  "Texans",
  "Colts",
  "Jaguars",
  "Chiefs",
  "Raiders",
  "Chargers",
  "Rams",
  "Dolphins",
  "Vikings",
  "Patriots",
  "Saints",
  "Giants",
  "Jets",
  "Eagles",
  "Steelers",
  "49ers",
  "Seahawks",
  "Buccaneers",
  "Titans",
  "Commanders",
  // NBA
  "Hawks",
  "Celtics",
  "Nets",
  "Hornets",
  "Bulls",
  "Cavaliers",
  "Mavericks",
  "Nuggets",
  "Pistons",
  "Warriors",
  "Rockets",
  "Pacers",
  "Clippers",
  "Lakers",
  "Grizzlies",
  "Heat",
  "Bucks",
  "Timberwolves",
  "Pelicans",
  "Knicks",
  "Thunder",
  "Magic",
  "76ers",
  "Suns",
  "Trail Blazers",
  "Kings",
  "Spurs",
  "Raptors",
  "Jazz",
  "Wizards",
  "SuperSonics",
  // MLB
  "Diamondbacks",
  "Braves",
  "Orioles",
  "Red Sox",
  "Cubs",
  "White Sox",
  "Reds",
  "Guardians",
  "Rockies",
  "Tigers",
  "Astros",
  "Royals",
  "Angels",
  "Dodgers",
  "Marlins",
  "Brewers",
  "Twins",
  "Mets",
  "Yankees",
  "Athletics",
  "Phillies",
  "Pirates",
  "Padres",
  "Mariners",
  "Rays",
  "Rangers",
  "Blue Jays",
  "Nationals",
  // WNBA
  "Storm",
  "Aces",
  "Liberty",
  "Fever",
  "Sky",
  "Lynx",
  "Mercury",
  "Sparks",
  "Wings",
  "Dream",
  "Mystics",
  "Valkyries",
  "Sun",
];
const TEAM_RE = new RegExp(`\\b(${TEAMS.map((t) => t.replace(/ /g, "\\s+")).join("|")})\\b`, "i");

export function teamOf(p: Pick<Product, "title" | "description">): string | null {
  const m = p.title.match(TEAM_RE);
  if (!m) return null;
  const hit = m[1]!.toLowerCase().replace(/\s+/g, " ");
  return TEAMS.find((t) => t.toLowerCase() === hit) ?? m[1]!;
}

export const PRICE_BANDS = [
  { id: "u25", label: "Under $25", min: 0, max: 2500 },
  { id: "25-100", label: "$25–$100", min: 2500, max: 10000 },
  { id: "100p", label: "$100+", min: 10000, max: Infinity },
] as const;

export function inBand(priceCents: number, band: string | undefined): boolean {
  const b = PRICE_BANDS.find((x) => x.id === band);
  return !b || (priceCents >= b.min && priceCents < b.max);
}

/** Small FNV-1a hash used to version image URLs. */
export function hashString(value: string): string {
  let h = 0x811c9dc5;
  const step = Math.max(1, Math.floor(value.length / 4096));
  for (let i = 0; i < value.length; i += step) {
    h ^= value.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return ((h ^ value.length) >>> 0).toString(36);
}

/** Swap inline data: images for cacheable optimized URLs on public listings. */
export function publicImageUrls<T extends Pick<Product, "id" | "imageUrl" | "imageUrlBack">>(
  p: T,
): T {
  const swap = (url: string | null | undefined, side: "front" | "back") =>
    url && url.startsWith("data:image/")
      ? `/img/${p.id}/${side}-${hashString(url)}.webp`
      : (url ?? null);
  return { ...p, imageUrl: swap(p.imageUrl, "front"), imageUrlBack: swap(p.imageUrlBack, "back") };
}
