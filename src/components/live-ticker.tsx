import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { getScoreboard, type ScoreGame } from "@/lib/scores";

const HOLD: ScoreGame[] = [
  { id: "h1", sport: "HUB", away: "PNW", home: "LIVE", awayScore: "", homeScore: "", state: "pre", clock: "Scoreboard warming up" },
];

export function LiveTicker() {
  const { data } = useQuery({
    queryKey: ["scoreboard"],
    queryFn: () => getScoreboard(),
    staleTime: 20_000,
    refetchInterval: 30_000,
  });

  const base = data && data.length > 0 ? data : HOLD;
  const loop = base.length < 8 ? [...base, ...base, ...base, ...base] : [...base, ...base];
  const seconds = Math.max(32, loop.length * 3.2);
  const live = (data ?? []).some((game) => game.state === "in");

  return (
    <div className="ticker-track flex h-8 items-stretch rounded-xl border border-border">
      <Link
        to="/scores"
        className="flex shrink-0 items-center gap-1.5 bg-primary px-2.5 font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-primary-foreground"
      >
        <span className="live-dot size-1.5 rounded-full bg-primary-foreground" />
        {live ? "Live" : "Scores"}
      </Link>
      <div className="min-w-0 flex-1 overflow-hidden">
        <div className="ticker flex w-max items-center" style={{ animationDuration: `${seconds}s` }}>
          {loop.map((game, index) => (
            <TickItem key={`${game.id}-${index}`} game={game} />
          ))}
        </div>
      </div>
    </div>
  );
}

function TickItem({ game }: { game: ScoreGame }) {
  return (
    <Link to="/scores" className="flex h-8 shrink-0 items-center gap-2 border-r border-border px-3 hover:bg-muted">
      <span className="font-mono text-[10px] font-medium tracking-[0.14em] text-accent">{game.sport}</span>
      <span className="font-mono text-[12px] font-semibold tabular-nums text-foreground">
        {game.away}
        {game.awayScore ? ` ${game.awayScore}` : ""}
        <span className="px-1 text-muted-foreground">{game.state === "pre" ? "@" : "–"}</span>
        {game.homeScore ? `${game.homeScore} ` : ""}
        {game.home}
      </span>
      <span className="font-mono text-[10px] tracking-[0.08em] text-live">{game.clock}</span>
    </Link>
  );
}
