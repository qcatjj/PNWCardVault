import { createFileRoute, Link, Navigate } from "@tanstack/react-router";
import { ProductGrid } from "@/components/product-card";
import { catalogSports, findGame, getScoreboard, matchListings, primarySport } from "@/lib/scores";
import { listProducts } from "@/lib/catalog";
import { sportLabel } from "@/lib/catalog-types";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/scores/$id")({
  loader: async ({ params }) => {
    const [games, stock] = await Promise.all([
      getScoreboard(),
      listProducts({ data: { inStock: true, limit: 80 } }),
    ]);
    const game = findGame(games, params.id);
    const hits = game ? matchListings(game, stock) : [];
    const box = game ? primarySport(game.sport) : null;
    const also = box
      ? stock.filter((item) => item.sport === box && !hits.some((hit) => hit.id === item.id)).slice(0, 8)
      : [];
    return { game, hits, also };
  },
  component: GameCase,
});

function GameCase() {
  const { game, hits, also } = Route.useLoaderData();
  if (!game) return <Navigate to="/scores" />;

  const live = game.state === "in";
  const sports = catalogSports(game.sport);

  return (
    <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-10">
      <nav className="mb-6 text-sm text-muted-foreground">
        <Link to="/scores" className="hover:text-foreground">
          Scores
        </Link>
        <span className="px-2">/</span>
        <span className="text-foreground">
          {game.away} @ {game.home}
        </span>
      </nav>

      <section className="rounded-[24px] border border-border bg-foreground/[0.04] px-5 py-6 sm:px-8">
        <p className="inline-flex items-center gap-2 font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
          {live ? (
            <>
              <span className="live-dot size-2 rounded-full bg-primary" />
              Live
            </>
          ) : null}
          {game.sport}
          <span className="text-muted-foreground">·</span>
          {game.clock}
        </p>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <ScoreLine
            name={game.awayName}
            abbr={game.away}
            score={game.awayScore}
            lead={Number(game.awayScore) > Number(game.homeScore)}
          />
          <ScoreLine
            name={game.homeName}
            abbr={game.home}
            score={game.homeScore}
            lead={Number(game.homeScore) > Number(game.awayScore)}
          />
        </div>
      </section>

      <section className="mt-10">
        <h2 className="text-3xl md:text-4xl">In the case</h2>
        <p className="mt-2 max-w-xl text-sm text-muted-foreground">
          {hits.length
            ? `Listings that match ${game.awayName} or ${game.homeName} — including names from tonight’s box.`
            : `Nothing for ${game.awayName} or ${game.homeName} is listed right now.`}
        </p>
        <div className="mt-6">
          {hits.length > 0 ? (
            <ProductGrid products={hits} />
          ) : (
            <div className="rounded-[20px] border border-border bg-card px-6 py-12 text-center">
              <p className="font-display text-3xl">Those teams aren’t in the case.</p>
              <p className="mt-2 text-sm text-muted-foreground">Check another game, or open the sport box.</p>
              {sports[0] ? (
                <Link
                  to="/shop"
                  search={{ sport: sports[0] }}
                  className="mt-5 inline-flex h-12 items-center rounded-xl bg-primary px-5 text-sm font-bold text-primary-foreground"
                >
                  Shop {sportLabel(sports[0])}
                </Link>
              ) : (
                <Link
                  to="/shop"
                  className="mt-5 inline-flex h-12 items-center rounded-xl bg-primary px-5 text-sm font-bold text-primary-foreground"
                >
                  Shop the case
                </Link>
              )}
            </div>
          )}
        </div>
      </section>

      {also.length > 0 ? (
        <section className="mt-12">
          <h2 className="text-3xl">Also on the table</h2>
          <p className="mt-2 text-sm text-muted-foreground">Same sport, still in stock.</p>
          <div className="mt-6">
            <ProductGrid products={also} />
          </div>
        </section>
      ) : null}
    </main>
  );
}

function ScoreLine({
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
    <div>
      <p className="font-mono text-[10px] tracking-[0.16em] text-muted-foreground">{abbr}</p>
      <div className="mt-1 flex items-baseline justify-between gap-3">
        <h1 className={cn("text-4xl md:text-5xl", lead ? "text-foreground" : "text-muted-foreground")}>{name}</h1>
        <p className={cn("font-mono text-4xl tabular-nums md:text-5xl", lead ? "text-primary" : "text-foreground")}>
          {score || "—"}
        </p>
      </div>
    </div>
  );
}
