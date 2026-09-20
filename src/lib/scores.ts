import { createServerFn } from "@tanstack/react-start";
import type { Product, SportId } from "./catalog-types";

export type ScoreGame = {
  id: string;
  sport: string;
  away: string;
  home: string;
  awayName: string;
  homeName: string;
  awayScore: string;
  homeScore: string;
  state: "pre" | "in" | "post";
  clock: string;
  needles: string[];
};

const BOARDS = [
  { sport: "NBA", url: "https://site.api.espn.com/apis/site/v2/sports/basketball/nba/scoreboard" },
  { sport: "WNBA", url: "https://site.api.espn.com/apis/site/v2/sports/basketball/wnba/scoreboard" },
  { sport: "NFL", url: "https://site.api.espn.com/apis/site/v2/sports/football/nfl/scoreboard" },
  { sport: "MLB", url: "https://site.api.espn.com/apis/site/v2/sports/baseball/mlb/scoreboard" },
] as const;

const RANK = { in: 0, pre: 1, post: 2 } as const;
const SKIP = new Set(["the", "and", "of", "at", "fc", "city", "team", "club", "univ", "university"]);
let cache: { at: number; games: ScoreGame[] } | null = null;
const TTL_MS = 20_000;

export const getScoreboard = createServerFn({ method: "GET" }).handler(async (): Promise<ScoreGame[]> => {
  if (cache && Date.now() - cache.at < TTL_MS) return cache.games;

  const batches = await Promise.all(BOARDS.map((board) => fetchBoard(board.sport, board.url)));
  const games = batches
    .flat()
    .sort((a, b) => RANK[a.state] - RANK[b.state] || a.sport.localeCompare(b.sport))
    .slice(0, 48);

  cache = { at: Date.now(), games };
  return games;
});

export function catalogSports(sport: string): SportId[] {
  if (sport === "NBA") return ["basketball"];
  if (sport === "WNBA") return ["wnba", "basketball"];
  if (sport === "NFL") return ["football"];
  if (sport === "MLB") return ["baseball"];
  return [];
}

export function primarySport(sport: string): SportId | null {
  if (sport === "NBA") return "basketball";
  if (sport === "WNBA") return "wnba";
  if (sport === "NFL") return "football";
  if (sport === "MLB") return "baseball";
  return null;
}

export function matchListings(game: ScoreGame, products: Product[]) {
  const sports = catalogSports(game.sport);
  const needles = game.needles.map((n) => n.toLowerCase()).filter(Boolean);
  if (!needles.length) return [];
  return products.filter((product) => {
    if (sports.length && !sports.includes(product.sport as SportId)) return false;
    const hay = [product.title, product.player, product.setName, product.description]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();
    return needles.some((needle) => containsNeedle(hay, needle));
  });
}

export function findGame(games: ScoreGame[], id: string) {
  return games.find((game) => game.id === id) ?? null;
}

function containsNeedle(hay: string, needle: string) {
  if (needle.length <= 3) {
    return new RegExp(`(?:^|[^a-z0-9])${escapeReg(needle)}(?:$|[^a-z0-9])`, "i").test(hay);
  }
  return hay.includes(needle);
}

function escapeReg(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

async function fetchBoard(sport: string, url: string): Promise<ScoreGame[]> {
  try {
    const res = await fetch(url, {
      headers: { Accept: "application/json" },
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return [];
    const json = (await res.json()) as EspnScoreboard;
    return (json.events ?? []).map((event) => toGame(sport, event)).filter((game): game is ScoreGame => Boolean(game));
  } catch {
    return [];
  }
}

function toGame(sport: string, event: EspnEvent): ScoreGame | null {
  const competition = event.competitions?.[0];
  const away = competition?.competitors?.find((row) => row.homeAway === "away");
  const home = competition?.competitors?.find((row) => row.homeAway === "home");
  if (!away?.team?.abbreviation || !home?.team?.abbreviation) return null;
  const raw = event.status?.type?.state;
  const state: ScoreGame["state"] = raw === "in" || raw === "post" ? raw : "pre";
  const needles = unique([
    ...teamNeedles(away.team),
    ...teamNeedles(home.team),
    ...athleteNeedles(away.leaders),
    ...athleteNeedles(home.leaders),
  ]);
  return {
    id: `${sport}-${event.id ?? `${away.team.abbreviation}-${home.team.abbreviation}`}`,
    sport,
    away: away.team.abbreviation,
    home: home.team.abbreviation,
    awayName: away.team.shortDisplayName || away.team.name || away.team.abbreviation,
    homeName: home.team.shortDisplayName || home.team.name || home.team.abbreviation,
    awayScore: state === "pre" ? "" : String(away.score ?? "0"),
    homeScore: state === "pre" ? "" : String(home.score ?? "0"),
    state,
    clock: event.status?.type?.shortDetail || (state === "post" ? "Final" : ""),
    needles,
  };
}

function teamNeedles(team: EspnTeam) {
  return [team.name, team.shortDisplayName, team.displayName, team.abbreviation, team.location].flatMap((value) => {
    if (!value || value.length < 2) return [];
    if (SKIP.has(value.toLowerCase())) return [];
    return [value];
  });
}

function athleteNeedles(groups: EspnLeaderGroup[] | undefined) {
  const names: string[] = [];
  for (const group of groups ?? []) {
    const athlete = group.leaders?.[0]?.athlete;
    const full = athlete?.fullName || athlete?.displayName;
    if (!full) continue;
    names.push(full);
    const last = full.split(/\s+/).at(-1);
    if (last && last.length >= 4 && !SKIP.has(last.toLowerCase())) names.push(last);
  }
  return names;
}

function unique(values: string[]) {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const value of values) {
    const key = value.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(value);
  }
  return out;
}

type EspnTeam = {
  abbreviation?: string;
  displayName?: string;
  shortDisplayName?: string;
  name?: string;
  location?: string;
};

type EspnLeaderGroup = {
  leaders?: Array<{
    athlete?: { fullName?: string; displayName?: string };
  }>;
};

type EspnScoreboard = { events?: EspnEvent[] };
type EspnEvent = {
  id?: string;
  competitions?: Array<{
    competitors?: Array<{
      homeAway?: string;
      score?: string;
      team?: EspnTeam;
      leaders?: EspnLeaderGroup[];
    }>;
  }>;
  status?: { type?: { state?: string; shortDetail?: string } };
};
