import { createServerFn } from "@tanstack/react-start";

export type ScoreGame = {
  id: string;
  sport: string;
  away: string;
  home: string;
  awayScore: string;
  homeScore: string;
  state: "pre" | "in" | "post";
  clock: string;
};

const BOARDS = [
  { sport: "NBA", url: "https://site.api.espn.com/apis/site/v2/sports/basketball/nba/scoreboard" },
  { sport: "WNBA", url: "https://site.api.espn.com/apis/site/v2/sports/basketball/wnba/scoreboard" },
  { sport: "NFL", url: "https://site.api.espn.com/apis/site/v2/sports/football/nfl/scoreboard" },
  { sport: "MLB", url: "https://site.api.espn.com/apis/site/v2/sports/baseball/mlb/scoreboard" },
  { sport: "CFB", url: "https://site.api.espn.com/apis/site/v2/sports/football/college-football/scoreboard" },
] as const;

const RANK = { in: 0, pre: 1, post: 2 } as const;
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
  const awayAbbr = away?.team?.abbreviation;
  const homeAbbr = home?.team?.abbreviation;
  if (!awayAbbr || !homeAbbr) return null;
  const raw = event.status?.type?.state;
  const state: ScoreGame["state"] = raw === "in" || raw === "post" ? raw : "pre";
  return {
    id: String(event.id ?? `${sport}-${awayAbbr}-${homeAbbr}`),
    sport,
    away: awayAbbr,
    home: homeAbbr,
    awayScore: state === "pre" ? "" : String(away?.score ?? "0"),
    homeScore: state === "pre" ? "" : String(home?.score ?? "0"),
    state,
    clock: event.status?.type?.shortDetail || (state === "post" ? "Final" : ""),
  };
}

type EspnScoreboard = { events?: EspnEvent[] };
type EspnEvent = {
  id?: string;
  competitions?: Array<{
    competitors?: Array<{
      homeAway?: string;
      score?: string;
      team?: { abbreviation?: string };
    }>;
  }>;
  status?: { type?: { state?: string; shortDetail?: string } };
};
