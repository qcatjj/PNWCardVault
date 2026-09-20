import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { Home, LayoutGrid, Lock, Search, ShoppingBag, Sparkles } from "lucide-react";
import { type FormEvent, type ReactNode, useState } from "react";
import { CartButton, CartSheet } from "@/components/cart-sheet";
import { HubMark } from "@/components/hub-mark";
import { LiveTicker } from "@/components/live-ticker";
import { SportsBackdrop } from "@/components/sports-backdrop";
import { Input } from "@/components/ui/input";
import { cartCount, useCart } from "@/lib/cart";
import { cn } from "@/lib/utils";

const NAV = [
  { to: "/shop" as const, label: "Shop" },
  { to: "/drops" as const, label: "New drops" },
  { to: "/shop" as const, label: "Singles", search: { kind: "single" } },
  { to: "/shop" as const, label: "Slabs", search: { kind: "slab" } },
  { to: "/shop" as const, label: "Sealed", search: { kind: "sealed" } },
  { to: "/scores" as const, label: "Scores" },
];

export function AppShell({ children }: { children: ReactNode }) {
  const [cartOpen, setCartOpen] = useState(false);
  const [q, setQ] = useState("");
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const count = useCart((s) => cartCount(s.lines));

  function onSearch(event: FormEvent) {
    event.preventDefault();
    const query = q.trim();
    void navigate({ to: "/shop", search: query ? { q: query } : { q: undefined } });
  }

  return (
    <div className="relative flex min-h-dvh min-w-0 w-full flex-col bg-background text-foreground">
      <SportsBackdrop />
      <header className="sticky top-2 z-40 px-3 pt-[env(safe-area-inset-top)] sm:px-4">
        <div className="glass mx-auto flex h-14 max-w-6xl items-center gap-3 rounded-[22px] border border-border px-3 sm:px-4">
          <Link to="/" className="flex items-center gap-2.5 shrink-0">
            <HubMark className="size-8 text-base" />
            <span className="flex flex-col leading-none">
              <span className="font-display text-lg tracking-tight">PNW Card Hub</span>
              <span className="hidden font-mono text-[9px] uppercase tracking-[0.22em] text-muted-foreground sm:block">
                Cards · drops · culture
              </span>
            </span>
          </Link>
          <nav className="ml-2 hidden items-center gap-0.5 lg:flex">
            {NAV.map((item) => (
              <Link
                key={item.label}
                to={item.to}
                search={"search" in item ? item.search : undefined}
                className="flex h-10 items-center rounded-xl px-3 text-sm font-semibold text-muted-foreground hover:bg-muted hover:text-foreground"
                activeProps={{ className: "text-foreground" }}
              >
                {item.label}
              </Link>
            ))}
            <a
              href="/#about"
              className="flex h-10 items-center rounded-xl px-3 text-sm font-semibold text-muted-foreground hover:bg-muted hover:text-foreground"
            >
              About
            </a>
          </nav>
          <form onSubmit={onSearch} className="ml-auto hidden max-w-xs flex-1 md:block">
            <label className="relative block">
              <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search cards, sets, grades"
                className="rounded-xl border-border bg-foreground/5 pl-9"
              />
            </label>
          </form>
          <div className="ml-auto flex items-center gap-1 md:ml-2">
            <Link
              to="/desk"
              aria-label="Owner desk"
              className="flex size-11 items-center justify-center rounded-xl text-muted-foreground hover:bg-muted hover:text-foreground"
            >
              <Lock className="size-4" />
            </Link>
            <CartButton onClick={() => setCartOpen(true)} />
          </div>
        </div>
        <div className="mx-auto mt-2 max-w-6xl overflow-hidden rounded-xl">
          <LiveTicker />
        </div>
      </header>
      <div className="relative z-10 min-w-0 flex-1 pb-[calc(5rem+env(safe-area-inset-bottom))] md:pb-0">{children}</div>
      <footer className="relative z-10 hidden border-t border-border md:block">
        <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-10 sm:flex-row sm:items-end sm:justify-between sm:px-6">
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.22em] text-muted-foreground">Pacific Northwest</p>
            <p className="mt-2 font-display text-3xl">PNW Card Hub</p>
            <p className="mt-1 max-w-sm text-sm text-muted-foreground">
              Singles and slabs from the case. Ships after checkout.
            </p>
          </div>
          <p className="font-mono text-xs uppercase tracking-[0.16em] text-muted-foreground">
            Ships after checkout · Stripe
          </p>
        </div>
      </footer>
      <nav
        className="fixed inset-x-2.5 bottom-2.5 z-40 grid h-[4.25rem] grid-cols-4 rounded-[20px] border border-border bg-background/90 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl md:hidden"
        aria-label="App"
      >
        <TabLink to="/" label="Home" active={pathname === "/"}>
          <Home className="size-5" />
        </TabLink>
        <TabLink to="/shop" label="Shop" active={pathname.startsWith("/shop") || pathname.startsWith("/c/")}>
          <LayoutGrid className="size-5" />
        </TabLink>
        <TabLink to="/drops" label="Drops" active={pathname.startsWith("/drops")}>
          <Sparkles className="size-5" />
        </TabLink>
        <button
          type="button"
          onClick={() => setCartOpen(true)}
          className="relative flex flex-col items-center justify-center gap-0.5 text-[11px] font-semibold text-muted-foreground"
        >
          <ShoppingBag className="size-5" />
          Cart
          {count > 0 ? (
            <span className="absolute top-1.5 right-[calc(50%-1.35rem)] flex size-4 items-center justify-center rounded-full bg-primary text-[10px] font-medium text-primary-foreground tabular-nums">
              {count}
            </span>
          ) : null}
        </button>
      </nav>
      <CartSheet open={cartOpen} onOpenChange={setCartOpen} />
    </div>
  );
}

function TabLink({
  to,
  label,
  active,
  children,
}: {
  to: "/" | "/shop" | "/drops";
  label: string;
  active: boolean;
  children: ReactNode;
}) {
  return (
    <Link
      to={to}
      className={cn(
        "flex flex-col items-center justify-center gap-0.5 text-[11px] font-semibold",
        active ? "text-primary" : "text-muted-foreground",
      )}
    >
      {children}
      {label}
    </Link>
  );
}
