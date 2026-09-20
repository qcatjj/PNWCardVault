import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ScoreCard } from "@/components/score-card";
import { getScoreboard } from "@/lib/scores";

export const Route = createFileRoute("/scores")({
  loader: () => getScoreboard(),
  component: Scores,
});

const ORDER = ["NBA", "WNBA", "NFL", "MLB"];

function Scores() {
  const initial = Route.useLoaderData();
  const { data } = useQuery({
    queryKey: ["scoreboard"],
    queryFn: () => getScoreboard(),
    initialData: initial,
    staleTime: 20_000,
    refetchInterval: 30_000,
  });
  const games = data ?? [];
  const sports = ORDER.filter((sport) => games.some((game) => game.sport === sport));

  return (
    <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-10">
      <p className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em]">
        <span className="live-dot size-2 rounded-full bg-primary" />
        Live board
      </p>
      <h1 className="mt-3 text-4xl md:text-5xl">Scores</h1>
      <p className="mt-2 max-w-xl text-sm text-muted-foreground">
        Tap a game to see if those teams — or tonight’s names — are in the case.
      </p>

      {games.length === 0 ? (
        <div className="mt-10 rounded-[20px] border border-border bg-card px-6 py-16 text-center">
          <p className="font-display text-3xl">Board is quiet.</p>
          <p className="mt-2 text-sm text-muted-foreground">No games in the feed right now. Check back closer to tip / kickoff.</p>
        </div>
      ) : (
        <div className="mt-8 space-y-10">
          {sports.map((sport) => (
            <section key={sport}>
              <h2 className="mb-4 text-2xl">{sport}</h2>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {games
                  .filter((game) => game.sport === sport)
                  .map((game) => (
                    <ScoreCard key={game.id} game={game} />
                  ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </main>
  );
}
