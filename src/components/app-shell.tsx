import { Link, useNavigate } from "@tanstack/react-router";
import { Lock, Search } from "lucide-react";
import { type FormEvent, type ReactNode, useState } from "react";
import { CartButton, CartSheet } from "@/components/cart-sheet";
import { HubMark } from "@/components/hub-mark";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

const NAV = [{ to: "/shop" as const, label: "Shop" }];

export function AppShell({ children }: { children: ReactNode }) {
  const [cartOpen, setCartOpen] = useState(false);
  const [q, setQ] = useState("");
  const navigate = useNavigate();

  function onSearch(event: FormEvent) {
    event.preventDefault();
    const query = q.trim();
    void navigate({ to: "/shop", search: query ? { q: query } : { q: undefined } });
  }

  return (
    <div className="flex min-h-dvh min-w-0 w-full flex-col bg-background text-foreground">
      <header className="sticky top-0 z-40 border-b border-border hub-plate">
        <div className="mx-auto flex h-16 max-w-6xl items-center gap-3 px-4 sm:px-6">
          <Link to="/" className="flex items-center gap-2.5 shrink-0">
            <HubMark className="size-9" />
            <span className="flex flex-col leading-none">
              <span className="font-mono text-xs uppercase tracking-[0.22em] text-muted-foreground">PNW Card</span>
              <span className="font-display text-xl tracking-tight">Hub</span>
            </span>
          </Link>
          <nav className="ml-4 hidden items-center gap-1 md:flex">
            {NAV.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                className={cn(
                  "rounded-md px-3 py-2 text-sm text-muted-foreground transition-colors duration-150 hover:bg-muted hover:text-foreground",
                )}
                activeProps={{ className: "text-foreground bg-muted" }}
              >
                {item.label}
              </Link>
            ))}
          </nav>
          <form onSubmit={onSearch} className="ml-auto hidden max-w-xs flex-1 md:block">
            <label className="relative block">
              <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search boxes"
                className="pl-9"
              />
            </label>
          </form>
          <div className="ml-auto flex items-center gap-1 md:ml-2">
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
        <nav className="flex gap-1 overflow-x-auto border-t border-border px-4 py-1 md:hidden">
          {NAV.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className="shrink-0 rounded-md px-3 py-2 text-sm text-muted-foreground"
              activeProps={{ className: "text-foreground" }}
            >
              {item.label}
            </Link>
          ))}
          <Link
            to="/desk"
            className="shrink-0 rounded-md px-3 py-2 text-sm text-muted-foreground"
            activeProps={{ className: "text-foreground" }}
          >
            Desk
          </Link>
        </nav>
      </header>
      <div className="min-w-0 flex-1">{children}</div>
      <footer className="border-t border-border hub-plate">
        <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-10 sm:flex-row sm:items-end sm:justify-between sm:px-6">
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.22em] text-muted-foreground">Pacific Northwest</p>
            <p className="mt-2 font-display text-2xl">PNW Card Hub</p>
            <p className="mt-1 max-w-sm text-sm text-muted-foreground">
              Singles and slabs listed from the case. Ships after checkout.
            </p>
          </div>
          <div className="space-y-2 text-xs text-muted-foreground">
            <p className="font-mono uppercase tracking-[0.16em]">Ships after checkout · Stripe</p>
            <Link
              to="/desk"
              className="inline-flex items-center gap-1.5 text-sm text-foreground hover:text-primary"
            >
              <Lock className="size-3.5" />
              Owner desk
            </Link>
          </div>
        </div>
      </footer>
      <CartSheet open={cartOpen} onOpenChange={setCartOpen} />
    </div>
  );
}
