import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Lock } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { CardElement } from "@/components/card-element";
import { ProductMedia } from "@/components/product-media";
import { StripeWordmark } from "@/components/stripe-mark";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { type CartLine, cartTotal, useCart } from "@/lib/cart";
import { getProduct, placeOrder } from "@/lib/catalog";
import type { Product } from "@/lib/catalog-types";
import { formatPrice } from "@/lib/format";
import { getPaymentMode, startStripeCheckout, type PaymentMode } from "@/lib/stripe-api";
import {
  type CardValue,
  TEST_CARD,
  cardComplete,
  tokenizeCard,
} from "@/lib/stripe-test";

type CheckoutSearch = {
  bin?: string;
  qty?: number;
};

export const Route = createFileRoute("/checkout")({
  validateSearch: (search: Record<string, unknown>): CheckoutSearch => ({
    bin: typeof search.bin === "string" ? search.bin : undefined,
    qty:
      typeof search.qty === "number"
        ? search.qty
        : typeof search.qty === "string" && Number(search.qty) > 0
          ? Number(search.qty)
          : undefined,
  }),
  loaderDeps: ({ search }) => search,
  loader: async ({ deps }) => {
    const mode = await getPaymentMode();
    if (!deps.bin) return { product: null as Product | null, mode };
    const product = await getProduct({ data: { slug: deps.bin } });
    return { product, mode };
  },
  component: CheckoutPage,
});

function productLine(product: Product, qty: number): CartLine {
  return {
    productId: product.id,
    slug: product.slug,
    title: product.title,
    priceCents: product.priceCents,
    imageKey: product.imageKey,
    imageUrl: product.imageUrl,
    qty: Math.max(1, Math.min(qty, product.qty)),
    maxQty: product.qty,
    kind: product.kind,
  };
}

function CheckoutPage() {
  const { product, mode } = Route.useLoaderData();
  const { bin, qty: qtyParam } = Route.useSearch();
  const cartLines = useCart((s) => s.lines);
  const clear = useCart((s) => s.clear);
  const remove = useCart((s) => s.remove);
  const navigate = useNavigate();

  const lines = useMemo(() => {
    if (bin && product && product.qty > 0) return [productLine(product, qtyParam ?? 1)];
    return cartLines;
  }, [bin, product, qtyParam, cartLines]);

  const total = cartTotal(lines);
  const [email, setEmail] = useState("");
  const [zip, setZip] = useState("");
  const [card, setCard] = useState<CardValue>({ number: "", expMonth: "", expYear: "", cvc: "" });
  const [cardError, setCardError] = useState<string | null>(null);
  const [pending, setPending] = useState<"card" | "link" | "stripe" | null>(null);

  const binMissing = Boolean(bin) && !product;
  const binSold = product !== null && product.qty <= 0;

  function afterPaid() {
    if (bin) remove(lines[0].productId);
    else clear();
  }

  async function payTestToken(token: string) {
    if (lines.length === 0 || pending) return;
    setPending(token === "tok_link" ? "link" : "card");
    try {
      await wait(700);
      const order = await placeOrder({
        data: {
          items: lines.map((l) => ({ productId: l.productId, qty: l.qty })),
          payment: { token },
        },
      });
      afterPaid();
      await navigate({ to: "/order/$code", params: { code: order.code } });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Your card was declined.";
      setCardError(message);
      toast.error(message);
    } finally {
      setPending(null);
    }
  }

  async function onPayCard() {
    if (!emailOk(email)) {
      toast.error("Enter an email for the Stripe receipt.");
      return;
    }
    if (!/^\d{5}$/.test(zip)) {
      toast.error("Enter a 5-digit billing ZIP.");
      return;
    }
    const tokenized = tokenizeCard(card);
    if (!tokenized.ok) {
      setCardError(tokenized.error);
      return;
    }
    setCardError(null);
    await payTestToken(tokenized.token);
  }

  async function onPayLink() {
    if (!emailOk(email)) {
      toast.error("Enter an email to pay with Link.");
      return;
    }
    setCardError(null);
    await payTestToken("tok_link");
  }

  async function onPayLive() {
    if (!emailOk(email)) {
      toast.error("Enter an email for the Stripe receipt.");
      return;
    }
    if (lines.length === 0 || pending) return;
    setPending("stripe");
    try {
      const cancelPath = bin
        ? `/checkout?bin=${encodeURIComponent(bin)}${qtyParam ? `&qty=${qtyParam}` : ""}`
        : "/checkout";
      const session = await startStripeCheckout({
        data: {
          email: email.trim(),
          cancelPath,
          items: lines.map((line) => ({
            productId: line.productId,
            title: line.title,
            qty: line.qty,
            priceCents: line.priceCents,
          })),
        },
      });
      window.location.assign(session.url);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Could not start Stripe checkout.";
      toast.error(message);
      setPending(null);
    }
  }

  function fillTestCard() {
    setEmail(TEST_CARD.email);
    setZip(TEST_CARD.zip);
    setCard({
      number: TEST_CARD.number,
      expMonth: TEST_CARD.expMonth,
      expYear: TEST_CARD.expYear,
      cvc: TEST_CARD.cvc,
    });
    setCardError(null);
  }

  if (binMissing) {
    return (
      <main className="mx-auto max-w-xl px-4 py-24 text-center">
        <h1 className="font-display text-3xl">That listing walked.</h1>
        <Link to="/shop" className="mt-6 inline-block text-sm text-primary">
          Shop the hub
        </Link>
      </main>
    );
  }

  if (binSold) {
    return (
      <main className="mx-auto max-w-xl px-4 py-24 text-center">
        <h1 className="font-display text-3xl">Already sold.</h1>
        <p className="mt-2 text-sm text-muted-foreground">Someone else hit buy now first.</p>
        <Link to="/shop" className="mt-6 inline-block text-sm text-primary">
          Back to the shop
        </Link>
      </main>
    );
  }

  if (lines.length === 0) {
    return (
      <main className="mx-auto max-w-xl px-4 py-24 text-center">
        <h1 className="font-display text-3xl">Nothing to check out.</h1>
        <p className="mt-2 text-sm text-muted-foreground">Add a listing, then come back.</p>
        <Link to="/shop" className="mt-6 inline-block text-sm text-primary">
          Shop the hub
        </Link>
      </main>
    );
  }

  const busy = pending !== null;
  const canPayCard = emailOk(email) && /^\d{5}$/.test(zip) && cardComplete(card) && !busy;
  const canPayLive = emailOk(email) && !busy;

  return (
    <main>
      <ModeBanner mode={mode} onFillTest={fillTestCard} />

      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-10 sm:px-6 lg:grid-cols-[minmax(0,1fr)_22rem] lg:items-start">
        <section className="lg:order-2">
          <h2 className="font-display text-2xl">Order</h2>
          <OrderLines lines={lines} total={total} />
        </section>

        <section className="lg:order-1">
          <h1 className="font-display text-4xl">Checkout</h1>
          {mode === "pending" ? (
            <PendingPay />
          ) : mode === "live" || mode === "test" ? (
            <LivePay
              email={email}
              onEmail={setEmail}
              total={total}
              busy={busy}
              canPay={canPayLive}
              test={mode === "test"}
              onPay={() => void onPayLive()}
            />
          ) : (
            <PreviewPay
              email={email}
              zip={zip}
              card={card}
              cardError={cardError}
              total={total}
              busy={busy}
              pending={pending}
              canPayCard={canPayCard}
              onEmail={setEmail}
              onZip={setZip}
              onCard={setCard}
              onPayCard={() => void onPayCard()}
              onPayLink={() => void onPayLink()}
            />
          )}
        </section>
      </div>
    </main>
  );
}

function ModeBanner({ mode, onFillTest }: { mode: PaymentMode; onFillTest: () => void }) {
  if (mode === "live") {
    return (
      <div className="border-b border-border bg-muted">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-2 px-4 py-2.5 sm:px-6">
          <p className="text-xs text-muted-foreground">
            Pay on Stripe. Shipping address is collected there. Ships after the charge.
          </p>
        </div>
      </div>
    );
  }
  if (mode === "test") {
    return (
      <div className="border-b border-border bg-muted">
        <div className="mx-auto max-w-6xl px-4 py-2.5 sm:px-6">
          <p className="text-xs text-muted-foreground">
            <span className="mr-2 inline-flex rounded-sm bg-accent/25 px-1.5 py-0.5 font-medium tracking-wide text-live uppercase">
              Test
            </span>
            Stripe test mode. Use card 4242 4242 4242 4242. No real money moves.
          </p>
        </div>
      </div>
    );
  }
  if (mode === "pending") {
    return (
      <div className="border-b border-border bg-muted">
        <div className="mx-auto max-w-6xl px-4 py-2.5 sm:px-6">
          <p className="text-xs text-muted-foreground">
            Payments connect to Stripe so the owner gets paid. Checkout opens as soon as that account is linked.
          </p>
        </div>
      </div>
    );
  }
  return (
    <div className="border-b border-border bg-muted">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-2 px-4 py-2.5 sm:px-6">
        <p className="text-xs text-muted-foreground">
          <span className="mr-2 inline-flex rounded-sm bg-accent/25 px-1.5 py-0.5 font-medium tracking-wide text-live uppercase">
            Preview
          </span>
          This preview does not charge a real card. Use {TEST_CARD.display}.
        </p>
        <button type="button" onClick={onFillTest} className="text-xs text-primary hover:underline">
          Fill preview card
        </button>
      </div>
    </div>
  );
}

function OrderLines({ lines, total }: { lines: CartLine[]; total: number }) {
  return (
    <>
      <ul className="mt-4 divide-y divide-border rounded-xl border border-border bg-card">
        {lines.map((line) => (
          <li key={line.productId} className="flex gap-4 p-4">
            <div className="w-14 shrink-0 overflow-hidden rounded-md border border-border">
              <ProductMedia product={lineAsProduct(line)} className="aspect-[2.5/3.5]" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium">{line.title}</p>
              <p className="mt-1 text-xs text-muted-foreground">Qty {line.qty}</p>
            </div>
            <p className="tabular-nums text-sm">{formatPrice(line.priceCents * line.qty)}</p>
          </li>
        ))}
      </ul>
      <div className="mt-4 flex items-center justify-between text-sm">
        <span className="text-muted-foreground">Shipping</span>
        <span>Included</span>
      </div>
      <div className="mt-2 flex items-center justify-between">
        <span>Total</span>
        <span className="font-display text-2xl tabular-nums">{formatPrice(total)}</span>
      </div>
    </>
  );
}

function PendingPay() {
  return (
    <>
      <p className="mt-2 max-w-md text-sm text-muted-foreground">
        The shop is live. Card charges wait on the owner’s Stripe account so the money lands there — not in a
        test shop.
      </p>
      <Button type="button" className="mt-8 w-full" size="lg" disabled>
        <Lock className="size-4" />
        Waiting on Stripe
      </Button>
      <div className="mt-3 flex items-center justify-between gap-3">
        <StripeWordmark />
        <p className="text-xs text-muted-foreground">Ships after checkout.</p>
      </div>
    </>
  );
}

function LivePay({
  email,
  onEmail,
  total,
  busy,
  canPay,
  onPay,
  test,
}: {
  email: string;
  onEmail: (value: string) => void;
  total: number;
  busy: boolean;
  canPay: boolean;
  onPay: () => void;
  test?: boolean;
}) {
  return (
    <>
      <p className="mt-2 max-w-md text-sm text-muted-foreground">
        {test
          ? "This is a Stripe test checkout. Use 4242 4242 4242 4242, any future date, any CVC. Nothing is charged."
          : "Pay with Stripe. You’ll add card and shipping on their page — we never store that here."}
      </p>
      <form
        className="mt-8 space-y-5"
        onSubmit={(event) => {
          event.preventDefault();
          onPay();
        }}
      >
        <div className="space-y-2">
          <Label htmlFor="email">Email for receipt</Label>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            inputMode="email"
            placeholder="you@email.com"
            value={email}
            onChange={(e) => onEmail(e.target.value)}
          />
        </div>
        <Button type="submit" className="w-full" size="lg" disabled={!canPay}>
          <Lock className="size-4" />
          {busy ? "Opening Stripe…" : `Pay ${formatPrice(total)} with Stripe`}
        </Button>
        <div className="flex items-center justify-between gap-3">
          <StripeWordmark />
          <p className="text-xs text-muted-foreground">Ships after checkout.</p>
        </div>
      </form>
    </>
  );
}

function PreviewPay({
  email,
  zip,
  card,
  cardError,
  total,
  busy,
  pending,
  canPayCard,
  onEmail,
  onZip,
  onCard,
  onPayCard,
  onPayLink,
}: {
  email: string;
  zip: string;
  card: CardValue;
  cardError: string | null;
  total: number;
  busy: boolean;
  pending: "card" | "link" | "stripe" | null;
  canPayCard: boolean;
  onEmail: (value: string) => void;
  onZip: (value: string) => void;
  onCard: (value: CardValue) => void;
  onPayCard: () => void;
  onPayLink: () => void;
}) {
  return (
    <>
      <p className="mt-2 max-w-md text-sm text-muted-foreground">
        Preview checkout only. Live buyers pay on Stripe — this screen never charges a real card.
      </p>
      <form
        className="mt-8 space-y-5"
        onSubmit={(event) => {
          event.preventDefault();
          onPayCard();
        }}
      >
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            inputMode="email"
            placeholder="you@email.com"
            value={email}
            onChange={(e) => onEmail(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="card-number">Payment</Label>
          <CardElement value={card} onChange={onCard} error={cardError} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="zip">Billing ZIP</Label>
          <Input
            id="zip"
            inputMode="numeric"
            autoComplete="postal-code"
            placeholder="98901"
            maxLength={5}
            value={zip}
            onChange={(e) => onZip(e.target.value.replace(/\D/g, "").slice(0, 5))}
            className="max-w-40"
          />
        </div>
        <Button type="submit" className="w-full" size="lg" disabled={!canPayCard}>
          <Lock className="size-4" />
          {pending === "card" ? "Processing…" : `Pay ${formatPrice(total)}`}
        </Button>
        <Button type="button" variant="secondary" className="w-full" onClick={onPayLink} disabled={busy}>
          {pending === "link" ? "Redirecting…" : "Pay with Link (preview)"}
        </Button>
        <div className="flex items-center justify-between gap-3">
          <StripeWordmark />
          <p className="text-xs text-muted-foreground">Ships after checkout.</p>
        </div>
      </form>
    </>
  );
}

function emailOk(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

function wait(ms: number) {
  return new Promise((resolve) => {
    window.setTimeout(resolve, ms);
  });
}

function lineAsProduct(line: CartLine): Product {
  return {
    id: line.productId,
    slug: line.slug,
    title: line.title,
    player: null,
    setName: null,
    year: null,
    sport: "basketball",
    kind: line.kind,
    parallel: null,
    serialNum: null,
    grade: null,
    priceCents: line.priceCents,
    compareAtCents: null,
    qty: line.maxQty,
    description: null,
    imageKey: line.imageKey,
    imageUrl: line.imageUrl ?? null,
    featured: false,
    dropId: null,
    dropSlug: null,
    dropTitle: null,
    shortCode: null,
    onBlock: false,
  };
}
