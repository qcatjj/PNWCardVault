import { Search } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { searchCardMatches, type CardMatch } from "@/lib/card-images";
import { sportLabel } from "@/lib/catalog-types";
import { cn } from "@/lib/utils";

type Props = {
  value: string;
  onChange: (value: string) => void;
  onPick: (match: CardMatch) => void;
  pickedId?: string | null;
};

export function CardLookup({ value, onChange, onPick, pickedId }: Props) {
  const [matches, setMatches] = useState<CardMatch[]>([]);
  const [searching, setSearching] = useState(false);
  const [looked, setLooked] = useState(false);

  useEffect(() => {
    const query = value.trim();
    if (query.length < 3) {
      setMatches([]);
      setLooked(false);
      return;
    }
    const handle = window.setTimeout(() => {
      setSearching(true);
      void searchCardMatches({ data: { query } })
        .then((found) => {
          setMatches(found);
          setLooked(true);
        })
        .catch((err) => {
          toast.error(err instanceof Error ? err.message : "Could not search for that card.");
        })
        .finally(() => setSearching(false));
    }, 400);
    return () => window.clearTimeout(handle);
  }, [value]);

  return (
    <div className="space-y-3">
      <label className="relative block">
        <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder="Cooper Flagg Topps Chrome 251"
          className="pl-9"
          autoComplete="off"
          autoCorrect="off"
          spellCheck={false}
        />
      </label>
      {searching ? <p className="text-xs text-muted-foreground">Checking card catalogs…</p> : null}
      {!searching && looked && matches.length === 0 ? (
        <p className="text-xs text-muted-foreground">No catalog match. Keep the title below and use your photo.</p>
      ) : null}
      {matches.length > 0 ? (
        <ul className="divide-y divide-border overflow-hidden rounded-lg border border-border">
          {matches.map((match) => {
            const selected = pickedId === match.id;
            return (
              <li key={match.id}>
                <button
                  type="button"
                  onClick={() => onPick(match)}
                  className={cn(
                    "flex w-full items-start justify-between gap-3 px-3 py-2.5 text-left",
                    selected ? "bg-muted" : "hover:bg-muted/60",
                  )}
                >
                  <span>
                    <span className="block text-sm font-medium leading-snug">{match.title}</span>
                    <span className="mt-0.5 block text-xs text-muted-foreground">
                      {match.sourceLabel}
                      {match.setName ? ` · ${match.setName}` : ""}
                    </span>
                  </span>
                  <span className="shrink-0 text-xs text-muted-foreground">{sportLabel(match.sport)}</span>
                </button>
              </li>
            );
          })}
        </ul>
      ) : !searching && !looked ? (
        <p className="text-xs text-muted-foreground">
          Catalog search fills the name, set, year, and sport. Snap your own photo — we don’t pull listing pictures from the web.
        </p>
      ) : null}
    </div>
  );
}
