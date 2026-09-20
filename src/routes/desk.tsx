import { createFileRoute, Link, useNavigate, useRouter } from "@tanstack/react-router";
import { Lock } from "lucide-react";
import { type FormEvent, type ReactNode, useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { CardLookup } from "@/components/card-lookup";
import { ListingShots, type PhotoMode } from "@/components/listing-shots";
import { ProductMedia } from "@/components/product-media";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { DeskAuth } from "@/components/desk-auth";
import { UserButton } from "@/lib/auth/gates";
import { authEnabled } from "@/lib/auth/client";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { createListing, getInventory, setListingQty, type Inventory } from "@/lib/catalog";
import { KINDS, productName, resolveSport, SPORTS, type Product } from "@/lib/catalog-types";
import type { CardMatch } from "@/lib/card-images";
import { readCardFromPhoto, type CardIdentity } from "@/lib/card-read";
import { enhanceListingPhoto } from "@/lib/card-enhance";
import { getDeskContext, type DeskContext } from "@/lib/desk-owner";
import { formatPrice } from "@/lib/format";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/desk")({
  component: DeskPage,
});

function isUnauthorized(err: unknown) {
  const message = err instanceof Error ? err.message : String(err ?? "");
  const hay = message.toLowerCase();
  return hay.includes("unauthorized") || hay.includes("401");
}

function DeskSkeleton() {
  return (
    <main className="mx-auto grid min-h-[70dvh] max-w-md place-items-center px-4 py-16">
      <div className="w-full rounded-xl border border-border bg-card p-6 sm:p-8">
        <div className="mb-5 size-11 animate-pulse rounded-lg bg-muted" />
        <div className="h-8 w-48 animate-pulse rounded-md bg-muted" />
        <div className="mt-3 h-16 w-full animate-pulse rounded-md bg-muted" />
        <div className="mt-6 h-11 w-full animate-pulse rounded-md bg-muted" />
      </div>
    </main>
  );
}

function DeskPage() {
  const { user, isPending } = useCurrentUserState();
  const [ctx, setCtx] = useState<DeskContext | null>(null);
  const [phase, setPhase] = useState<"loading" | "ready" | "auth" | "error">("loading");
  const [error, setError] = useState<string | null>(null);
  const [waited, setWaited] = useState(false);

  useEffect(() => {
    const handle = window.setTimeout(() => setWaited(true), 4000);
    return () => window.clearTimeout(handle);
  }, []);

  const load = useCallback(() => {
    setPhase("loading");
    setError(null);
    void getDeskContext()
      .then((next) => {
        setCtx(next);
        setPhase("ready");
      })
      .catch((err) => {
        if (isUnauthorized(err)) {
          setCtx(null);
          setPhase("auth");
          return;
        }
        setCtx(null);
        setError(err instanceof Error ? err.message : "Could not open the desk.");
        setPhase("error");
      });
  }, []);

  useEffect(() => {
    load();
  }, [load, user?.id]);

  if (!authEnabled) return <DeskHome />;

  if (ctx?.isOwner) return <DeskHome />;

  if (phase === "loading" || (isPending && !waited && phase !== "error")) {
    return <DeskSkeleton />;
  }

  if (phase === "error") {
    return (
      <main className="mx-auto grid min-h-[70dvh] max-w-md place-items-center px-4 py-16">
        <div className="w-full rounded-xl border border-border bg-card p-6 sm:p-8">
          <h1 className="font-display text-3xl">Desk didn’t open</h1>
          <p className="mt-2 text-sm text-muted-foreground">{error}</p>
          <Button type="button" className="mt-6 w-full" onClick={load}>
            Try again
          </Button>
        </div>
      </main>
    );
  }

  if (ctx && !ctx.isOwner) {
    return (
      <main className="mx-auto grid min-h-[70dvh] max-w-md place-items-center px-4 py-16">
        <div className="w-full rounded-xl border border-border bg-card p-6 sm:p-8">
          <div className="mb-5 grid size-11 place-items-center rounded-lg bg-muted text-muted-foreground">
            <Lock className="size-5" />
          </div>
          <h1 className="font-display text-3xl">Staff only</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            This login can’t open the desk. Sign out and try again.
          </p>
          <div className="mt-6">
            <DeskAuth onDone={load} />
          </div>
        </div>
      </main>
    );
  }

  return <DeskLock onDone={load} />;
}

function DeskLock({ onDone }: { onDone: () => void }) {
  return (
    <main className="mx-auto grid min-h-[70dvh] max-w-md place-items-center px-4 py-16">
      <div className="w-full rounded-xl border border-border bg-card p-6 sm:p-8">
        <div className="mb-5 grid size-11 place-items-center rounded-lg bg-muted text-muted-foreground">
          <Lock className="size-5" />
        </div>
        <h1 className="font-display text-3xl">Desk</h1>
        <p className="mt-2 text-sm text-muted-foreground">Staff only. The shop stays public.</p>
        <div className="mt-6">
          <DeskAuth onDone={onDone} />
        </div>
      </div>
    </main>
  );
}

function DeskHome() {
  const [tab, setTab] = useState<"list" | "stock">("list");

  return (
    <main className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="font-mono text-xs uppercase tracking-[0.22em] text-muted-foreground">Owner desk</p>
          <h1 className="mt-2 font-display text-4xl">List a card</h1>
          <p className="mt-3 max-w-xl text-sm text-muted-foreground">
            Snap the front. Confirm the details. Post.
          </p>
        </div>
        {authEnabled ? <UserButton /> : null}
      </div>

      <div className="mt-6 flex gap-1 rounded-lg border border-border bg-muted p-1">
        <button
          type="button"
          onClick={() => setTab("list")}
          className={cn("h-11 flex-1 rounded-md text-sm", tab === "list" ? "bg-card text-foreground" : "text-muted-foreground")}
        >
          New listing
        </button>
        <button
          type="button"
          onClick={() => setTab("stock")}
          className={cn(
            "h-11 flex-1 rounded-md text-sm",
            tab === "stock" ? "bg-card text-foreground" : "text-muted-foreground",
          )}
        >
          Inventory
        </button>
      </div>

      {tab === "list" ? <ListForm /> : <InventoryPanel />}
    </main>
  );
}

function InventoryPanel() {
  const router = useRouter();
  const [inventory, setInventory] = useState<Inventory | null>(null);
  const [busy, setBusy] = useState<number | null>(null);

  async function refresh() {
    const next = await getInventory();
    setInventory(next);
    await router.invalidate();
  }

  useEffect(() => {
    void refresh().catch((err) => {
      toast.error(err instanceof Error ? err.message : "Could not load inventory.");
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function setQty(product: Product, qty: number) {
    if (busy) return;
    setBusy(product.id);
    try {
      await setListingQty({ data: { productId: product.id, qty } });
      toast.success(qty === 0 ? "Marked sold out." : `Qty set to ${qty}.`);
      await refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not update stock.");
    } finally {
      setBusy(null);
    }
  }

  if (!inventory) {
    return <div className="mt-8 h-40 animate-pulse rounded-xl bg-muted" />;
  }

  const { products, orders } = inventory;

  return (
    <div className="mt-8 space-y-10">
      <section>
        <h2 className="mb-3 font-display text-2xl">Listed</h2>
        {products.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nothing listed yet.</p>
        ) : (
          <ul className="divide-y divide-border overflow-hidden rounded-xl border border-border bg-card">
            {products.map((item) => (
              <li key={item.id} className="flex flex-wrap items-center gap-3 px-3 py-3">
                <div className="w-10 overflow-hidden rounded-sm border border-border">
                  <ProductMedia product={item} className="aspect-[2.5/3.5]" />
                </div>
                <div className="min-w-0 flex-1">
                  <Link to="/c/$slug" params={{ slug: item.slug }} className="block truncate text-sm font-medium">
                    {productName(item)}
                  </Link>
                  <p className="text-xs tabular-nums text-muted-foreground">
                    {formatPrice(item.priceCents)}
                    {item.shortCode ? ` · /v/${item.shortCode}` : ""}
                  </p>
                </div>
                {item.qty <= 0 ? <Badge tone="sold">Sold out</Badge> : <Badge>{item.qty} left</Badge>}
                <div className="flex items-center gap-1">
                  {item.qty > 0 ? (
                    <Button type="button" size="sm" variant="outline" disabled={busy !== null} onClick={() => void setQty(item, 0)}>
                      Sold out
                    </Button>
                  ) : (
                    <Button type="button" size="sm" variant="secondary" disabled={busy !== null} onClick={() => void setQty(item, 1)}>
                      Restock
                    </Button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <h2 className="mb-3 font-display text-2xl">Orders</h2>
        <p className="mb-4 text-sm text-muted-foreground">
          Order codes only — no buyer names stored here. Shipping details stay in Stripe.
        </p>
        {orders.length === 0 ? (
          <p className="text-sm text-muted-foreground">No orders yet.</p>
        ) : (
          <ul className="divide-y divide-border overflow-hidden rounded-xl border border-border bg-card">
            {orders.map((order) => (
              <li key={order.code} className="flex items-start justify-between gap-3 px-4 py-3">
                <div className="min-w-0">
                  <Link to="/order/$code" params={{ code: order.code }} className="font-medium tabular-nums">
                    {order.code}
                  </Link>
                  <p className="truncate text-xs text-muted-foreground">
                    {order.payment?.provider === "stripe" ? `Stripe · •••• ${order.payment.last4}` : "No card"}
                    {" · "}
                    {order.items.map((item) => item.title).join(", ")}
                  </p>
                </div>
                <p className="shrink-0 tabular-nums text-sm">{formatPrice(order.totalCents)}</p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function ListForm() {
  const navigate = useNavigate();
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [reading, setReading] = useState(false);
  const [more, setMore] = useState(false);
  const [lookup, setLookup] = useState("");
  const [pickedId, setPickedId] = useState<string | null>(null);
  const [player, setPlayer] = useState("");
  const [setName, setSetName] = useState("");
  const [year, setYear] = useState("");
  const [title, setTitle] = useState("");
  const [sport, setSport] = useState<(typeof SPORTS)[number]["id"]>("basketball");
  const [parallel, setParallel] = useState("");
  const [serialNum, setSerialNum] = useState("");
  const [grade, setGrade] = useState("");
  const [front, setFront] = useState<string | null>(null);
  const [back, setBack] = useState<string | null>(null);
  const [photoMode, setPhotoMode] = useState<PhotoMode>("raw");
  const [enhancingFront, setEnhancingFront] = useState(false);
  const [enhancingBack, setEnhancingBack] = useState(false);
  const usedOwnFront = useRef(false);
  const readFor = useRef<string | null>(null);
  const photoModeRef = useRef<PhotoMode>("raw");
  const rawFront = useRef<string | null>(null);
  const rawBack = useRef<string | null>(null);
  const enhancedCache = useRef<{ front?: { src: string; url: string }; back?: { src: string; url: string } }>({});

  function applyIdentity(identity: CardIdentity) {
    setTitle(identity.title);
    setPlayer(identity.player);
    setSetName(identity.setName);
    setYear(identity.year ? String(identity.year) : "");
    setSport(resolveSport(identity.sport, identity.title, identity.player, identity.setName, identity.parallel));
    setParallel(identity.parallel ?? "");
    setSerialNum(identity.serialNum ?? "");
    if (identity.grade) setGrade(identity.grade);
    setLookup(identity.title);
  }

  function applyMatch(match: CardMatch) {
    setPickedId(match.id);
    setLookup(match.title);
    setTitle(match.title);
    setPlayer(match.player);
    setSetName(match.setName);
    setYear(match.year ? String(match.year) : "");
    setSport(resolveSport(match.sport, match.title, match.player, match.setName, match.parallel));
    setParallel(match.parallel ?? "");
    setSerialNum(match.serialNum ?? "");
  }

  async function enhanceSide(side: "front" | "back", source: string, listingTitle?: string) {
    const cached = enhancedCache.current[side];
    if (cached?.src === source) {
      if (side === "front") setFront(cached.url);
      else setBack(cached.url);
      return;
    }
    const setBusy = side === "front" ? setEnhancingFront : setEnhancingBack;
    setBusy(true);
    try {
      const result = await enhanceListingPhoto({
        data: { image: source, side, title: listingTitle || title || lookup || undefined },
      });
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      enhancedCache.current[side] = { src: source, url: result.url };
      if (photoModeRef.current !== "enhanced") return;
      if (side === "front") setFront(result.url);
      else setBack(result.url);
      toast.success("Studio shot ready. This is a depiction of the card.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not enhance that photo.");
    } finally {
      setBusy(false);
    }
  }

  function changePhotoMode(next: PhotoMode) {
    photoModeRef.current = next;
    setPhotoMode(next);
    if (next === "raw") {
      if (rawFront.current) setFront(rawFront.current);
      setBack(rawBack.current);
      return;
    }
    if (rawFront.current) void enhanceSide("front", rawFront.current);
    if (rawBack.current) void enhanceSide("back", rawBack.current);
  }

  async function readFront(url: string) {
    if (readFor.current === url) return;
    readFor.current = url;
    setReading(true);
    try {
      const result = await readCardFromPhoto({ data: { image: url } });
      if (result.ok) {
        applyIdentity(result.identity);
        toast.success("Read the card. Check the details, add a price, post.");
      } else {
        toast.message(result.error);
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not read that card.");
    } finally {
      setReading(false);
    }
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const price = Number(form.get("price"));
    const qty = Number(form.get("qty") || 1);
    if (!Number.isFinite(price) || price <= 0) {
      toast.error("Set a price.");
      return;
    }
    if (!front) {
      toast.error("Take a front photo of the card.");
      return;
    }
    const listingTitle = title.trim() || player.trim();
    if (listingTitle.length < 3) {
      toast.error("Add a title or pick a match.");
      return;
    }
    setPending(true);
    try {
      const result = await createListing({
        data: {
          title: listingTitle,
          player: player || undefined,
          setName: setName || undefined,
          year: year.trim() ? Number(year) : undefined,
          sport: resolveSport(sport, listingTitle, player, setName, parallel),
          kind: String(form.get("kind") ?? "single") as (typeof KINDS)[number]["id"],
          parallel: parallel || undefined,
          serialNum: serialNum || undefined,
          grade: (String(form.get("grade") ?? "") || grade) || undefined,
          priceCents: Math.round(price * 100),
          qty: Number.isFinite(qty) ? qty : 1,
          description: String(form.get("description") ?? "") || undefined,
          featured: form.get("featured") === "on",
          imageUrl: front,
          imageUrlBack: back || undefined,
          imageDepiction:
            photoMode === "enhanced" &&
            Boolean(enhancedCache.current.front?.url) &&
            front === enhancedCache.current.front?.url,
        },
      });
      toast.success("Listed.");
      await router.invalidate();
      await navigate({ to: "/c/$slug", params: { slug: result.slug } });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not list that card.");
    } finally {
      setPending(false);
    }
  }

  const step = !front ? 1 : !(title.trim() || player.trim()) ? 2 : 3;

  return (
    <form onSubmit={onSubmit} className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
      <div className="space-y-6">
        <section className="rounded-xl border border-border bg-card p-4 sm:p-5">
          <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">Step {step} · Photo</p>
          <h2 className="mt-1 font-display text-2xl">Front and back</h2>
          <p className="mt-1 text-sm text-muted-foreground">Camera on your phone works. Front is required.</p>
          <div className="mt-4">
            <ListingShots
              front={front}
              back={back}
              mode={photoMode}
              onModeChange={changePhotoMode}
              reading={reading}
              enhancingFront={enhancingFront}
              enhancingBack={enhancingBack}
              onFront={(url) => {
                if (!url) {
                  usedOwnFront.current = false;
                  rawFront.current = null;
                  enhancedCache.current.front = undefined;
                  setFront(null);
                  return;
                }
                usedOwnFront.current = true;
                rawFront.current = url;
                enhancedCache.current.front = undefined;
                setFront(url);
                void readFront(url);
                if (photoModeRef.current === "enhanced") void enhanceSide("front", url);
              }}
              onBack={(url) => {
                if (!url) {
                  rawBack.current = null;
                  enhancedCache.current.back = undefined;
                  setBack(null);
                  return;
                }
                rawBack.current = url;
                enhancedCache.current.back = undefined;
                setBack(url);
                if (photoModeRef.current === "enhanced") void enhanceSide("back", url);
              }}
            />
          </div>
        </section>

        <section className="rounded-xl border border-border bg-card p-4 sm:p-5">
          <h2 className="font-display text-2xl">Details</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Type a name, year, and set. Tap a match to fill the listing. Photos come from your camera, not the web.
          </p>
          <div className="mt-4 space-y-3">
            <CardLookup value={lookup} onChange={setLookup} pickedId={pickedId} onPick={applyMatch} />
            <Field label="Title" htmlFor="title">
              <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="2023 Prizm Cooper Flagg RC" />
            </Field>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Player" htmlFor="player">
                <Input id="player" value={player} onChange={(e) => setPlayer(e.target.value)} />
              </Field>
              <Field label="Set" htmlFor="setName">
                <Input id="setName" value={setName} onChange={(e) => setSetName(e.target.value)} />
              </Field>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Year" htmlFor="year">
                <Input id="year" inputMode="numeric" value={year} onChange={(e) => setYear(e.target.value)} />
              </Field>
              <Field label="Sport" htmlFor="sport">
                <select
                  id="sport"
                  value={sport}
                  onChange={(e) => setSport(e.target.value as (typeof SPORTS)[number]["id"])}
                  className="h-11 w-full rounded-md border border-input bg-background px-3 text-sm"
                >
                  {SPORTS.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.label}
                    </option>
                  ))}
                </select>
              </Field>
            </div>
            <button type="button" className="text-sm text-muted-foreground underline-offset-4 hover:underline" onClick={() => setMore((v) => !v)}>
              {more ? "Hide extra fields" : "Parallel, serial, grade"}
            </button>
            {more ? (
              <div className="grid gap-3 sm:grid-cols-3">
                <Field label="Parallel" htmlFor="parallel">
                  <Input id="parallel" value={parallel} onChange={(e) => setParallel(e.target.value)} />
                </Field>
                <Field label="Serial" htmlFor="serialNum">
                  <Input id="serialNum" value={serialNum} onChange={(e) => setSerialNum(e.target.value)} />
                </Field>
                <Field label="Grade" htmlFor="grade">
                  <Input id="grade" value={grade} onChange={(e) => setGrade(e.target.value)} />
                </Field>
              </div>
            ) : null}
          </div>
        </section>
      </div>

      <aside className="space-y-6 lg:sticky lg:top-24 lg:self-start">
        <section className="rounded-xl border border-border bg-card p-4 sm:p-5">
          <h2 className="font-display text-2xl">Price & post</h2>
          <div className="mt-4 space-y-3">
            <Field label="Price (USD)" htmlFor="price">
              <Input id="price" name="price" inputMode="decimal" placeholder="25" required />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Qty" htmlFor="qty">
                <Input id="qty" name="qty" inputMode="numeric" defaultValue="1" />
              </Field>
              <Field label="Kind" htmlFor="kind">
                <select id="kind" name="kind" defaultValue="single" className="h-11 w-full rounded-md border border-input bg-background px-3 text-sm">
                  {KINDS.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.label}
                    </option>
                  ))}
                </select>
              </Field>
            </div>
            <Field label="Notes" htmlFor="description">
              <Textarea id="description" name="description" rows={3} placeholder="Surface, centering, pack-fresh…" />
            </Field>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" name="featured" className="size-4 rounded border-input" />
              Feature on the home page
            </label>
            <Button type="submit" className="w-full" disabled={pending}>
              {pending ? "Posting…" : "Post listing"}
            </Button>
          </div>
        </section>
      </aside>
    </form>
  );
}

function Field({
  label,
  htmlFor,
  children,
}: {
  label: string;
  htmlFor: string;
  children: ReactNode;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={htmlFor}>{label}</Label>
      {children}
    </div>
  );
}
