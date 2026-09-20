import { Link } from "@tanstack/react-router";
import type { ScoreGame } from "@/lib/scores";
import { cn } from "@/lib/utils";

export function ScoreCard({ game }: { game: ScoreGame }) {
  const live = game.state === "in";
  return (
    <Link
      to="/scores/$id"
      params={{ id: game.id }}
      className="block rounded-[20px] border border-border bg-foreground/[0.04] p-4 transition-[transform,border-color] duration-200 hover:-translate-y-0.5 hover:border-foreground/25"
    >
      <div className="mb-3 flex items-center justify-between gap-2">
        <span className="font-mono text-[10px] font-semibold tracking-[0.16em] text-muted-foreground">{game.sport}</span>
        <span
          className={cn(
            "font-mono text-[10px] font-semibold tracking-[0.12em]",
            live ? "text-primary" : "text-muted-foreground",
          )}
        >
          {live ? "LIVE · " : ""}
          {game.clock}
        </span>
      </div>
      <TeamRow name={game.awayName} abbr={game.away} score={game.awayScore} lead={Number(game.awayScore) > Number(game.homeScore)} />
      <TeamRow name={game.homeName} abbr={game.home} score={game.homeScore} lead={Number(game.homeScore) > Number(game.awayScore)} />
      <p className="mt-3 font-mono text-[10px] font-semibold tracking-[0.14em] text-primary">In the case →</p>
    </Link>
  );
}

function TeamRow({
  name,
  abbr,
  score,
  lead,
}: {
  name: string;
  abbr: string;
  score: string;
  lead: boolean;
}) {
  return (
    <div className="flex items-baseline justify-between gap-3 py-1">
      <span className={cn("truncate font-display text-2xl", lead ? "text-foreground" : "text-muted-foreground")}>
        {name || abbr}
      </span>
      <span className={cn("font-mono text-2xl tabular-nums", lead ? "text-primary" : "text-foreground")}>
        {score || "—"}
      </span>
    </div>
  );
}
