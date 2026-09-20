import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { authMiddleware } from "@/lib/auth/middleware";
import { requireOwner } from "@/lib/desk-owner";
import { inferSport, type SportId } from "@/lib/catalog-types";

export type FoundImage = {
  url: string;
  thumb: string;
  label: string;
  source: string;
  kind: "card" | "player";
};

export type CardMatch = {
  id: string;
  title: string;
  player: string;
  setName: string;
  year: number | null;
  sport: SportId;
  parallel: string | null;
  serialNum: string | null;
  cardNumber: string | null;
  source: string;
  sourceLabel: string;
  sourceUrl: string;
  ebayUrl: string;
  imageUrl: string | null;
  imageKind: "card" | "player" | null;
};

const UA = "PNWCardHub/1.0 (personal sports-card shop; catalog lookup)";
const CARD_HOST =
  /ebayimg|tcdb|comc|beckett|goldin|pwcc|fanatics|psacard|sportscardspro|pricecharting|collectors\.com|alt\.xyz|cardladder|pokemontcg|scryfall|tcgdex|sportlots|130point|heritage|panini|topps\.com/i;
const SKIP_PHOTO =
  /calendar|logo|vector|clipart|pngtree|freepik|favicon|sprite|printable|template|mondaymandala|suncatcher|dreamcalendar|quantum|processor|computer|dolly|parton|stock-photo|shutterstock/i;

const SOURCE_LABELS: Record<string, string> = {
  sportscardspro: "Sports Cards Pro",
  pricecharting: "Price Charting",
  espn: "ESPN",
  wikipedia: "Wikipedia",
  sportsdb: "TheSportsDB",
  commons: "Wikimedia",
  ebay: "eBay",
  pokemontcg: "Pokémon TCG",
  scryfall: "Scryfall",
  tcgdex: "TCGdex",
  openverse: "Openverse",
  web: "Web",
};

// Public example token from SportsCardsPro / PriceCharting API docs.
const SCP_TOKEN = "c0b53bce27c1bdab90b1605249e600dc43dfd1d5";

function sourceLabel(source: string) {
  return SOURCE_LABELS[source] ?? "Web";
}

function withTimeout(ms: number) {
  return AbortSignal.timeout(ms);
}

async function fetchText(url: string, ms = 6000): Promise<string | null> {
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": UA, Accept: "application/json, text/html;q=0.8" },
      signal: withTimeout(ms),
    });
    if (!res.ok) return null;
    return await res.text();
  } catch {
    return null;
  }
}

async function fetchJson<T>(url: string, ms = 7000): Promise<T | null> {
  const text = await fetchText(url, ms);
  if (!text) return null;
  try {
    return JSON.parse(text) as T;
  } catch {
    return null;
  }
}

function pushUnique(out: FoundImage[], item: FoundImage) {
  const key = item.url.split("?")[0];
  if (!key.startsWith("https://")) return;
  if (SKIP_PHOTO.test(key) || SKIP_PHOTO.test(item.label)) return;
  if (out.some((x) => x.url.split("?")[0] === key)) return;
  out.push(item);
}

function queryBits(data: {
  player?: string;
  setName?: string;
  year?: number;
  sport?: string;
  title?: string;
}) {
  const player = data.player?.trim() || "";
  const setName = data.setName?.trim() || "";
  const year = data.year ? String(data.year) : "";
  const title = data.title?.trim() || "";
  const sport = data.sport === "nonsport" ? "trading card" : data.sport?.trim() || "";
  const cardQuery = [player && `"${player}"`, setName && `"${setName}"`, "trading card"]
    .filter(Boolean)
    .join(" ");
  const personQuery = player || title.split(" ").slice(0, 3).join(" ");
  return { player, setName, year, title, sport, cardQuery, personQuery };
}

function mapSport(consoleName: string, productName = ""): SportId {
  return inferSport(consoleName, productName) ?? "nonsport";
}

function parseConsole(consoleName: string, productName = "") {
  const yearMatch = consoleName.match(/\b(19|20)\d{2}\b/);
  const year = yearMatch ? Number(yearMatch[0]) : null;
  const setName = consoleName
    .replace(/^(Basketball|Football|Baseball|Hockey|Soccer|Wrestling|Racing|UFC|WNBA|Non-?Sport)\s+Cards\s+/i, "")
    .replace(/^\d{4}\s+/, "")
    .trim();
  return { sport: mapSport(consoleName, productName), year, setName: setName || consoleName };
}

function parseProductName(name: string) {
  let rest = name.trim();
  let parallel: string | null = null;
  let cardNumber: string | null = null;
  const par = rest.match(/\[([^\]]+)\]/);
  if (par) {
    parallel = par[1].trim();
    rest = rest.replace(par[0], " ").replace(/\s+/g, " ").trim();
  }
  const num = rest.match(/#(\S+)/);
  if (num) {
    cardNumber = num[1];
    rest = rest.replace(num[0], " ").replace(/\s+/g, " ").trim();
  }
  const serialNum = parallel?.match(/\/\d+/)?.[0] ?? null;
  return { player: rest, parallel, cardNumber, serialNum };
}

function slugPart(value: string) {
  return value
    .toLowerCase()
    .replace(/#/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

function buildTitle(parts: {
  year: number | null;
  setName: string;
  player: string;
  parallel: string | null;
  cardNumber: string | null;
}) {
  const parallel = parts.parallel?.replace(/\s*\/\d+\s*$/, "").trim();
  return [parts.year, parts.setName, parts.player, parallel, parts.cardNumber ? `#${parts.cardNumber}` : ""]
    .map((bit) => (bit == null ? "" : String(bit).trim()))
    .filter(Boolean)
    .join(" ")
    .slice(0, 120);
}

function ebaySearch(title: string) {
  return `https://www.ebay.com/sch/261328/i.html?_nkw=${encodeURIComponent(title)}`;
}

async function fromCatalog(host: "sportscardspro" | "pricecharting", query: string): Promise<CardMatch[]> {
  const q = query.trim();
  if (q.length < 3) return [];
  const domain = host === "pricecharting" ? "www.pricecharting.com" : "www.sportscardspro.com";
  const url = `https://${domain}/api/products?t=${SCP_TOKEN}&q=${encodeURIComponent(q)}`;
  const body = await fetchJson<{
    products?: { id: string | number; "console-name"?: string; "product-name"?: string }[];
  }>(url, 8000);
  const out: CardMatch[] = [];
  for (const raw of body?.products ?? []) {
    const consoleName = raw["console-name"] || "";
    const productName = raw["product-name"] || "";
    if (!productName) continue;
    const parsedConsole = parseConsole(consoleName, productName);
    const parsedName = parseProductName(productName);
    const title = buildTitle({
      year: parsedConsole.year,
      setName: parsedConsole.setName,
      player: parsedName.player,
      parallel: parsedName.parallel,
      cardNumber: parsedName.cardNumber,
    });
    const sourceUrl = `https://${domain}/game/${slugPart(consoleName)}/${slugPart(productName)}`;
    out.push({
      id: `${host}-${raw.id}`,
      title,
      player: parsedName.player,
      setName: parsedConsole.setName,
      year: parsedConsole.year,
      sport: inferSport(consoleName, productName, parsedName.player, title) ?? parsedConsole.sport,
      parallel: parsedName.parallel,
      serialNum: parsedName.serialNum,
      cardNumber: parsedName.cardNumber,
      source: host,
      sourceLabel: sourceLabel(host),
      sourceUrl,
      ebayUrl: ebaySearch(title),
      imageUrl: null,
      imageKind: null,
    });
    if (out.length >= 8) break;
  }
  return out;
}

async function fromEspn(person: string, sport: string | undefined): Promise<FoundImage[]> {
  if (!person) return [];
  const url =
    "https://site.web.api.espn.com/apis/common/v3/search?region=us&lang=en&limit=5&type=player&query=" +
    encodeURIComponent(person);
  const body = await fetchJson<{
    items?: { id: string; displayName: string; league?: string; sport?: string }[];
  }>(url);
  const items = body?.items ?? [];
  const out: FoundImage[] = [];
  const sportHint = sport === "wnba" ? "wnba" : sport === "football" ? "nfl" : sport === "baseball" ? "mlb" : "";
  for (const item of items.slice(0, 3)) {
    const league = (item.league || sportHint || "nba").toLowerCase();
    const head = `https://a.espncdn.com/i/headshots/${league}/players/full/${item.id}.png`;
    pushUnique(out, {
      url: head,
      thumb: head,
      label: `${item.displayName} · ESPN`,
      source: "espn",
      kind: "player",
    });
  }
  return out;
}

async function fromSportsDb(person: string): Promise<FoundImage[]> {
  if (!person) return [];
  const url =
    "https://www.thesportsdb.com/api/v1/json/3/searchplayers.php?p=" + encodeURIComponent(person.replace(/\s+/g, "_"));
  const body = await fetchJson<{
    player?: { strPlayer: string; strThumb?: string | null; strCutout?: string | null; strTeam?: string | null }[] | null;
  }>(url);
  const out: FoundImage[] = [];
  for (const p of body?.player ?? []) {
    if (p.strCutout) {
      pushUnique(out, {
        url: p.strCutout,
        thumb: p.strCutout,
        label: `${p.strPlayer} cutout`,
        source: "sportsdb",
        kind: "player",
      });
    }
    if (p.strThumb) {
      pushUnique(out, {
        url: p.strThumb,
        thumb: p.strThumb,
        label: `${p.strPlayer}${p.strTeam ? ` · ${p.strTeam}` : ""}`,
        source: "sportsdb",
        kind: "player",
      });
    }
  }
  return out;
}

async function fromWikipedia(person: string): Promise<FoundImage[]> {
  if (!person) return [];
  const url =
    "https://en.wikipedia.org/w/api.php?action=query&generator=search&gsrlimit=4&prop=pageimages&piprop=thumbnail|original&pithumbsize=800&format=json&origin=*&gsrsearch=" +
    encodeURIComponent(person);
  const body = await fetchJson<{
    query?: {
      pages?: Record<
        string,
        {
          title: string;
          index: number;
          thumbnail?: { source: string };
          original?: { source: string };
        }
      >;
    };
  }>(url);
  const pages = Object.values(body?.query?.pages ?? {}).sort((a, b) => a.index - b.index);
  const out: FoundImage[] = [];
  for (const page of pages) {
    const src = page.original?.source || page.thumbnail?.source;
    if (!src) continue;
    pushUnique(out, {
      url: src,
      thumb: page.thumbnail?.source || src,
      label: page.title,
      source: "wikipedia",
      kind: "player",
    });
  }
  return out;
}

async function fromBing(query: string): Promise<FoundImage[]> {
  if (!query) return [];
  const url = "https://www.bing.com/images/async?q=" + encodeURIComponent(query) + "&first=0&count=35";
  const html = await fetchText(url, 8000);
  if (!html) return [];
  const un = html.replaceAll("&" + "quot;", '"');
  const murls = [...un.matchAll(/"murl":"(https?:\/\/[^"]+)"/g)].map((m) => m[1]);
  const tokens = query
    .toLowerCase()
    .replace(/['"]/g, "")
    .split(/\s+/)
    .filter((t) => t.length > 3 && !/^(card|chrome|prizm|topps|panini|with|from|this|that|trading)$/.test(t));
  const out: FoundImage[] = [];
  for (const raw of murls) {
    if (SKIP_PHOTO.test(raw)) continue;
    const isCardHost = CARD_HOST.test(raw);
    const looksImage = /\.(jpg|jpeg|png|webp)(\?|$)/i.test(raw);
    if (!isCardHost && !looksImage) continue;
    const hay = raw.toLowerCase();
    const tokenHit = tokens.length === 0 || tokens.some((t) => hay.includes(t));
    if (!isCardHost && !tokenHit) continue;
    pushUnique(out, {
      url: raw.replace(/\/s-l\d+\./, "/s-l1600."),
      thumb: raw,
      label: isCardHost ? "Listing photo" : "Web photo",
      source: isCardHost ? "ebay" : "web",
      kind: isCardHost ? "card" : "player",
    });
    if (out.length >= 8) break;
  }
  return out;
}

function score(item: FoundImage) {
  if (item.kind === "card") return 8;
  if (item.source === "espn") return 4;
  if (item.source === "sportsdb") return 4;
  if (item.source === "wikipedia") return 3;
  if (item.source === "openverse") return 2;
  return 1;
}

async function fromCommons(query: string): Promise<FoundImage[]> {
  if (!query) return [];
  const searchUrl =
    "https://commons.wikimedia.org/w/api.php?action=query&list=search&srnamespace=6&srlimit=6&format=json&origin=*&srsearch=" +
    encodeURIComponent(query + " card");
  const search = await fetchJson<{ query?: { search?: { title: string }[] } }>(searchUrl);
  const titles = (search?.query?.search ?? []).map((s) => s.title).filter(Boolean);
  if (titles.length === 0) return [];
  const infoUrl =
    "https://commons.wikimedia.org/w/api.php?action=query&prop=imageinfo&iiprop=url&iiurlwidth=640&format=json&origin=*&titles=" +
    encodeURIComponent(titles.join("|"));
  const info = await fetchJson<{
    query?: { pages?: Record<string, { title: string; imageinfo?: { url?: string; thumburl?: string }[] }> };
  }>(infoUrl);
  const out: FoundImage[] = [];
  for (const page of Object.values(info?.query?.pages ?? {})) {
    const ii = page.imageinfo?.[0];
    const url = ii?.url;
    if (!url) continue;
    const label = page.title.replace(/^File:/, "");
    if (SKIP_PHOTO.test(label) || SKIP_PHOTO.test(url)) continue;
    pushUnique(out, {
      url,
      thumb: ii.thumburl || url,
      label,
      source: "commons",
      kind: /card|chrome|prizm|topps|panini/i.test(label) ? "card" : "player",
    });
  }
  return out;
}

async function fromOpenverse(query: string): Promise<FoundImage[]> {
  if (!query) return [];
  const url =
    "https://api.openverse.org/v1/images/?page_size=6&q=" + encodeURIComponent(`${query} trading card`);
  const body = await fetchJson<{
    results?: { url?: string; thumbnail?: string; title?: string }[];
  }>(url);
  const out: FoundImage[] = [];
  for (const item of body?.results ?? []) {
    if (!item.url) continue;
    pushUnique(out, {
      url: item.url,
      thumb: item.thumbnail || item.url,
      label: item.title || "Openverse",
      source: "openverse",
      kind: /card|topps|panini|prizm/i.test(item.title || "") ? "card" : "player",
    });
  }
  return out;
}

async function fromPokemonTcg(query: string): Promise<CardMatch[]> {
  const q = query.trim();
  if (q.length < 3) return [];
  const name = q.split(/\s+/).slice(0, 3).join(" ");
  const url = "https://api.pokemontcg.io/v2/cards?pageSize=6&q=" + encodeURIComponent(`name:"${name}"`);
  const body = await fetchJson<{
    data?: {
      id: string;
      name: string;
      number?: string;
      rarity?: string;
      set?: { name?: string; releaseDate?: string };
      images?: { large?: string; small?: string };
    }[];
  }>(url, 8000);
  const out: CardMatch[] = [];
  for (const card of body?.data ?? []) {
    const year = card.set?.releaseDate ? Number(card.set.releaseDate.slice(0, 4)) : null;
    const title = buildTitle({
      year: Number.isFinite(year) ? year : null,
      setName: card.set?.name || "Pokémon",
      player: card.name,
      parallel: card.rarity || null,
      cardNumber: card.number || null,
    });
    out.push({
      id: `pokemontcg-${card.id}`,
      title,
      player: card.name,
      setName: card.set?.name || "Pokémon",
      year: Number.isFinite(year as number) ? year : null,
      sport: "nonsport",
      parallel: card.rarity || null,
      serialNum: null,
      cardNumber: card.number || null,
      source: "pokemontcg",
      sourceLabel: sourceLabel("pokemontcg"),
      sourceUrl: `https://pokemontcg.io/card/${card.id}`,
      ebayUrl: ebaySearch(title),
      imageUrl: card.images?.large || card.images?.small || null,
      imageKind: card.images?.large || card.images?.small ? "card" : null,
    });
  }
  return out;
}

async function fromScryfall(query: string): Promise<CardMatch[]> {
  const q = query.trim();
  if (q.length < 3) return [];
  const url = "https://api.scryfall.com/cards/search?unique=prints&q=" + encodeURIComponent(q);
  const body = await fetchJson<{
    data?: {
      id: string;
      name: string;
      set_name?: string;
      collector_number?: string;
      released_at?: string;
      scryfall_uri?: string;
      image_uris?: { normal?: string; large?: string };
    }[];
  }>(url, 7000);
  const out: CardMatch[] = [];
  for (const card of (body?.data ?? []).slice(0, 6)) {
    const year = card.released_at ? Number(card.released_at.slice(0, 4)) : null;
    const image = card.image_uris?.large || card.image_uris?.normal || null;
    const title = buildTitle({
      year: Number.isFinite(year) ? year : null,
      setName: card.set_name || "Magic",
      player: card.name,
      parallel: null,
      cardNumber: card.collector_number || null,
    });
    out.push({
      id: `scryfall-${card.id}`,
      title,
      player: card.name,
      setName: card.set_name || "Magic",
      year: Number.isFinite(year as number) ? year : null,
      sport: "nonsport",
      parallel: null,
      serialNum: null,
      cardNumber: card.collector_number || null,
      source: "scryfall",
      sourceLabel: sourceLabel("scryfall"),
      sourceUrl: card.scryfall_uri || "https://scryfall.com",
      ebayUrl: ebaySearch(title),
      imageUrl: image,
      imageKind: image ? "card" : null,
    });
  }
  return out;
}

async function fromTcgdex(query: string): Promise<CardMatch[]> {
  const q = query.trim();
  if (q.length < 3) return [];
  const name = q.split(/\s+/)[0] ?? q;
  const url = "https://api.tcgdex.net/v2/en/cards?name=" + encodeURIComponent(name);
  const body = await fetchJson<
    {
      id: string;
      name: string;
      localId?: string;
      image?: string;
      set?: { name?: string };
    }[]
  >(url, 7000);
  const rows = Array.isArray(body) ? body : [];
  const out: CardMatch[] = [];
  for (const card of rows.slice(0, 6)) {
    const image = card.image ? `${card.image}/high.webp` : null;
    const title = buildTitle({
      year: null,
      setName: card.set?.name || "TCG",
      player: card.name,
      parallel: null,
      cardNumber: card.localId || null,
    });
    out.push({
      id: `tcgdex-${card.id}`,
      title,
      player: card.name,
      setName: card.set?.name || "TCG",
      year: null,
      sport: "nonsport",
      parallel: null,
      serialNum: null,
      cardNumber: card.localId || null,
      source: "tcgdex",
      sourceLabel: sourceLabel("tcgdex"),
      sourceUrl: `https://www.tcgdex.net/card/${card.id}`,
      ebayUrl: ebaySearch(title),
      imageUrl: image,
      imageKind: image ? "card" : null,
    });
  }
  return out;
}

function matchFromImage(item: FoundImage, query: string, player: string): CardMatch {
  const title = item.label && item.label.length > 4 ? item.label.replace(/\.[a-z]+$/i, "") : query;
  return {
    id: `${item.source}-${item.url.slice(-24)}`,
    title: title.slice(0, 120),
    player: player || title.split(" ").slice(0, 3).join(" "),
    setName: "",
    year: null,
    sport: "basketball",
    parallel: null,
    serialNum: null,
    cardNumber: null,
    source: item.source,
    sourceLabel: sourceLabel(item.source),
    sourceUrl: item.url,
    ebayUrl: ebaySearch(query),
    imageUrl: item.url,
    imageKind: item.kind,
  };
}

async function extraSourceMatches(query: string, playerHint: string, sport?: string): Promise<CardMatch[]> {
  const player = playerHint || query.split(/\s+/).slice(0, 3).join(" ");
  const settled = await Promise.allSettled([
    fromEspn(player, sport),
    fromSportsDb(player),
    fromWikipedia(player),
    fromCommons(query),
    fromOpenverse(player),
    fromBing(`"${player}" sports card`),
  ]);
  const images: FoundImage[] = [];
  for (const result of settled) {
    if (result.status === "fulfilled") {
      for (const item of result.value) pushUnique(images, item);
    }
  }
  images.sort((a, b) => score(b) - score(a));
  const tokens = query
    .toLowerCase()
    .split(/\s+/)
    .filter((t) => t.length > 3 && !/^(card|chrome|prizm|topps|panini|the|with)$/.test(t));
  const out: CardMatch[] = [];
  const seen = new Set<string>();
  for (const item of images) {
    const hay = `${item.label} ${item.url}`.toLowerCase();
    const related =
      item.source === "espn" ||
      item.source === "sportsdb" ||
      item.kind === "card" ||
      tokens.some((t) => hay.includes(t));
    if (!related) continue;
    const key = item.source + item.kind;
    if (seen.has(key) && item.kind !== "card") continue;
    seen.add(key);
    out.push(matchFromImage(item, query, player));
    if (out.length >= 8) break;
  }
  return out;
}

async function attachStockPhotos(matches: CardMatch[]): Promise<CardMatch[]> {
  const players = [...new Set(matches.map((m) => m.player).filter((p) => p.length >= 3))].slice(0, 4);
  const stock = new Map<string, FoundImage>();
  await Promise.all(
    players.map(async (player) => {
      const sport = matches.find((m) => m.player === player)?.sport;
      const settled = await Promise.allSettled([
        fromEspn(player, sport),
        fromSportsDb(player),
        fromWikipedia(player),
        fromBing(`"${player}" sports card`),
        fromCommons(player),
        fromOpenverse(player),
      ]);
      const images: FoundImage[] = [];
      for (const result of settled) {
        if (result.status === "fulfilled") {
          for (const item of result.value) pushUnique(images, item);
        }
      }
      images.sort((a, b) => score(b) - score(a));
      if (images[0]) stock.set(player, images[0]);
    }),
  );
  return matches.map((match) => {
    if (match.imageUrl) return match;
    const photo = stock.get(match.player);
    if (!photo) return match;
    return { ...match, imageUrl: photo.url, imageKind: photo.kind };
  });
}

export async function findCardMatches(query: string): Promise<CardMatch[]> {
  const q = query.trim();
  if (q.length < 3) return [];
  const [scp, pc] = await Promise.all([fromCatalog("sportscardspro", q), fromCatalog("pricecharting", q)]);
  const catalog = [...scp];
  const seen = new Set(catalog.map((m) => m.title.toLowerCase()));
  for (const row of pc) {
    const key = row.title.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    catalog.push(row);
  }
  return catalog.slice(0, 10);
}

const lookupFields = z.object({
  player: z.string().max(80).optional(),
  setName: z.string().max(80).optional(),
  year: z.number().int().min(1950).max(2030).optional(),
  sport: z.string().max(40).optional(),
  title: z.string().max(120).optional(),
  query: z.string().max(160).optional(),
});

export const searchCardMatches = createServerFn({ method: "POST" })
  .validator(z.object({ query: z.string().min(3).max(160) }))
  .middleware([authMiddleware])
  .handler(async ({ data, context }): Promise<CardMatch[]> => {
    await requireOwner(context.userId);
    return findCardMatches(data.query);
  });

export const searchCardImages = createServerFn({ method: "POST" })
  .validator(lookupFields)
  .middleware([authMiddleware])
  .handler(async ({ context }): Promise<FoundImage[]> => {
    await requireOwner(context.userId);
    return [];
  });
