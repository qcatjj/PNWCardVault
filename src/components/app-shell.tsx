import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { Home, LayoutGrid, Lock, Search, ShoppingBag } from "lucide-react";
import { type FormEvent, type ReactNode, useState } from "react";
import { CartButton, CartSheet } from "@/components/cart-sheet";
import { HubMark } from "@/components/hub-mark";
import { LiveTicker } from "@/components/live-ticker";
import { Input } from "@/components/ui/input";
import { cartCount, useCart } from "@/lib/cart";
import { cn } from "@/lib/utils";

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
    <div className="flex min-h-dvh min-w-0 w-full flex-col bg-background text-foreground">
      <header className="sticky top-0 z-40 border-b border-border hub-plate pt-[env(safe-area-inset-top)]">
        <div className="mx-auto flex h-14 max-w-6xl items-center gap-3 px-4 sm:px-6">
          <Link to="/" className="flex items-center gap-2.5 shrink-0">
            <HubMark className="size-8" />
            <span className="flex flex-col leading-none">
              <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground">PNW Card</span>
              <span className="font-display text-lg tracking-tight">Hub</span>
            </span>
          </Link>
          <form onSubmit={onSearch} className="ml-auto hidden max-w-xs flex-1 md:block">
            <label className="relative block">
              <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search cards"
                className="pl-9"
              />
            </label>
          </form>
          <div className="ml-auto hidden items-center gap-1 md:flex">
            <Link
              to="/shop"
              className="flex h-11 items-center rounded-md px-3 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground"
              activeProps={{ className: "text-foreground bg-muted" }}
            >
              Shop
            </Link>
            <Link
              to="/desk"
              aria-label="Owner desk"
              className="flex h-11 items-center gap-1.5 rounded-md px-2.5 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground"
              activeProps={{ className: "text-foreground bg-muted" }}
            >
              <Lock className="size-4" />
              Desk
            </Link>
            <CartButton onClick={() => setCartOpen(true)} />
          </div>
        </div>
        <LiveTicker />
      </header>
      <div className="min-w-0 flex-1 pb-[calc(4.25rem+env(safe-area-inset-bottom))] md:pb-0">{children}</div>
      <footer className="hidden border-t border-border hub-plate md:block">
        <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-10 sm:flex-row sm:items-end sm:justify-between sm:px-6">
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.22em] text-muted-foreground">Pacific Northwest</p>
            <p className="mt-2 font-display text-2xl">PNW Card Hub</p>
            <p className="mt-1 max-w-sm text-sm text-muted-foreground">
              Singles and slabs listed from the case. Ships after checkout.
            </p>
          </div>
          <p className="font-mono text-xs uppercase tracking-[0.16em] text-muted-foreground">
            Ships after checkout · Stripe
          </p>
        </div>
      </footer>
      <nav
        className="fixed inset-x-0 bottom-0 z-40 border-t border-primary/40 bg-background/90 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl md:hidden"
        aria-label="App"
      >
        <div className="grid h-[4.25rem] grid-cols-4">
          <TabLink to="/" label="Home" active={pathname === "/"}>
            <Home className="size-5" />
          </TabLink>
          <TabLink to="/shop" label="Shop" active={pathname.startsWith("/shop") || pathname.startsWith("/c/")}>
            <LayoutGrid className="size-5" />
          </TabLink>
          <button
            type="button"
            onClick={() => setCartOpen(true)}
            className="relative flex flex-col items-center justify-center gap-0.5 text-[11px] font-medium text-muted-foreground"
          >
            <ShoppingBag className="size-5" />
            Cart
            {count > 0 ? (
              <span className="absolute top-1.5 right-[calc(50%-1.35rem)] flex size-4 items-center justify-center rounded-full bg-primary text-[10px] font-medium text-primary-foreground tabular-nums">
                {count}
              </span>
            ) : null}
          </button>
          <TabLink to="/desk" label="Desk" active={pathname.startsWith("/desk") || pathname.startsWith("/login")}>
            <Lock className="size-5" />
          </TabLink>
        </div>
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
  to: "/" | "/shop" | "/desk";
  label: string;
  active: boolean;
  children: ReactNode;
}) {
  return (
    <Link
      to={to}
      className={cn(
        "flex flex-col items-center justify-center gap-0.5 text-[11px] font-medium",
        active ? "text-primary" : "text-muted-foreground",
      )}
    >
      {children}
      {label}
    </Link>
  );
}
