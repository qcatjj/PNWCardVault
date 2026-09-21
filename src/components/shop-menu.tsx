import * as Dialog from "@radix-ui/react-dialog";
import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { ChevronDown, Menu, Search, X } from "lucide-react";
import { type FormEvent, useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import { KINDS, SPORTS } from "@/lib/catalog-types";
import { cn } from "@/lib/utils";

type ShopQuery = { sport?: string; kind?: string; q?: string };

function readShopSearch(search: unknown): ShopQuery {
  if (!search || typeof search !== "object") return {};
  const value = search as Record<string, unknown>;
  return {
    sport: typeof value.sport === "string" ? value.sport : undefined,
    kind: typeof value.kind === "string" ? value.kind : undefined,
    q: typeof value.q === "string" ? value.q : undefined,
  };
}

export function ShopMenu() {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const location = useRouterState({ select: (s) => s.location });
  const current = readShopSearch(location.search);
  const navigate = useNavigate();
  const onShop = location.pathname === "/shop";

  const [openSports, setOpenSports] = useState<Record<string, boolean>>(() =>
    current.sport ? { [current.sport]: true } : { basketball: true },
  );

  function toggleSport(id: string) {
    setOpenSports((prev) => ({ ...prev, [id]: !prev[id] }));
  }

  function onSearch(event: FormEvent) {
    event.preventDefault();
    const query = q.trim();
    setOpen(false);
    void navigate({ to: "/shop", search: query ? { q: query } : {} });
  }

  const sportOpen = useMemo(() => openSports, [openSports]);

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger asChild>
        <button
          type="button"
          aria-label="Browse categories"
          className="flex size-11 shrink-0 items-center justify-center rounded-xl text-muted-foreground hover:bg-muted hover:text-foreground"
        >
          <Menu className="size-5" />
        </button>
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-background/70 backdrop-blur-sm" />
        <Dialog.Content className="fixed top-0 left-0 z-50 flex h-dvh w-[min(22rem,92vw)] flex-col border-r border-border bg-card outline-none">
          <div className="flex items-center justify-between border-b border-border px-4 py-4">
            <Dialog.Title className="font-display text-2xl text-card-foreground">Browse</Dialog.Title>
            <Dialog.Close asChild>
              <button type="button" className="flex size-11 items-center justify-center rounded-xl hover:bg-muted" aria-label="Close menu">
                <X className="size-5" />
              </button>
            </Dialog.Close>
          </div>

          <div className="flex-1 overflow-y-auto px-3 py-4 pb-[calc(1.5rem+env(safe-area-inset-bottom))]">
            <form onSubmit={onSearch} className="mb-4 px-1">
              <label className="relative block">
                <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="Search cards"
                  className="rounded-xl border-border bg-foreground/5 pl-9"
                />
              </label>
            </form>

            <p className="px-2 pb-1 font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Shop</p>
            <NavLink to="/" onPick={() => setOpen(false)} active={location.pathname === "/"}>
              Home
            </NavLink>
            <NavLink to="/shop" search={{}} onPick={() => setOpen(false)} active={onShop && !current.sport && !current.kind && !current.q}>
              All cards
            </NavLink>
            <NavLink to="/drops" onPick={() => setOpen(false)} active={location.pathname.startsWith("/drops")}>
              New drops
            </NavLink>

            <p className="mt-5 px-2 pb-1 font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Sports</p>
            {SPORTS.map((sport) => {
              const expanded = Boolean(sportOpen[sport.id]);
              const sportActive = onShop && current.sport === sport.id;
              return (
                <div key={sport.id} className="mb-0.5">
                  <div className="flex items-center gap-0.5">
                    <Link
                      to="/shop"
                      search={{ sport: sport.id }}
                      onClick={() => setOpen(false)}
                      className={cn(
                        "flex h-11 min-w-0 flex-1 items-center rounded-xl px-3 text-sm font-semibold",
                        sportActive && !current.kind ? "bg-muted text-foreground" : "text-muted-foreground hover:bg-muted hover:text-foreground",
                      )}
                    >
                      {sport.label}
                    </Link>
                    <button
                      type="button"
                      aria-label={`${expanded ? "Hide" : "Show"} ${sport.label} types`}
                      aria-expanded={expanded}
                      onClick={() => toggleSport(sport.id)}
                      className="flex size-11 shrink-0 items-center justify-center rounded-xl text-muted-foreground hover:bg-muted hover:text-foreground"
                    >
                      <ChevronDown className={cn("size-4 transition-transform duration-150", expanded && "rotate-180")} />
                    </button>
                  </div>
                  {expanded ? (
                    <div className="mb-1 ml-3 border-l border-border pl-2">
                      {KINDS.map((kind) => (
                        <NavLink
                          key={kind.id}
                          to="/shop"
                          search={{ sport: sport.id, kind: kind.id }}
                          onPick={() => setOpen(false)}
                          active={sportActive && current.kind === kind.id}
                          nested
                        >
                          {kind.label}
                        </NavLink>
                      ))}
                    </div>
                  ) : null}
                </div>
              );
            })}

            <p className="mt-5 px-2 pb-1 font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Card type</p>
            {KINDS.map((kind) => (
              <NavLink
                key={kind.id}
                to="/shop"
                search={{ kind: kind.id }}
                onPick={() => setOpen(false)}
                active={onShop && current.kind === kind.id && !current.sport}
              >
                {kind.label}
              </NavLink>
            ))}

            <p className="mt-5 px-2 pb-1 font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">More</p>
            <NavLink to="/scores" onPick={() => setOpen(false)} active={location.pathname.startsWith("/scores")}>
              Live scores
            </NavLink>
            <NavLink to="/contact" onPick={() => setOpen(false)} active={location.pathname.startsWith("/contact")}>
              Contact & reviews
            </NavLink>
            <a
              href="/#about"
              onClick={() => setOpen(false)}
              className="flex h-11 items-center rounded-xl px-3 text-sm font-semibold text-muted-foreground hover:bg-muted hover:text-foreground"
            >
              About
            </a>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

function NavLink({
  to,
  search,
  active,
  nested,
  onPick,
  children,
}: {
  to: "/" | "/shop" | "/drops" | "/scores" | "/contact";
  search?: ShopQuery;
  active?: boolean;
  nested?: boolean;
  onPick: () => void;
  children: string;
}) {
  return (
    <Link
      to={to}
      search={search}
      onClick={onPick}
      className={cn(
        "flex items-center rounded-xl px-3 text-sm font-semibold",
        nested ? "h-10" : "h-11",
        active ? "bg-muted text-foreground" : "text-muted-foreground hover:bg-muted hover:text-foreground",
      )}
    >
      {children}
    </Link>
  );
}
