import { createFileRoute, Link } from "@tanstack/react-router";
import { ShareButton } from "@/components/share-button";
import { getOrder } from "@/lib/catalog";
import { formatPrice } from "@/lib/format";
import { brandLabel } from "@/lib/stripe-test";

export const Route = createFileRoute("/order/$code")({
  loader: async ({ params }) => getOrder({ data: { code: params.code } }),
  component: OrderPage,
});

function OrderPage() {
  const order = Route.useLoaderData();
  if (!order) {
    return (
      <main className="mx-auto max-w-xl px-4 py-24 text-center">
        <h1 className="font-display text-3xl">No order with that code.</h1>
        <Link to="/shop" className="mt-6 inline-block text-sm text-primary">
          Shop the vault
        </Link>
      </main>
    );
  }

  const stripe = order.payment?.provider === "stripe" ? order.payment : null;
  const paid = order.status === "paid" && stripe;

  return (
    <main className="mx-auto max-w-xl px-4 py-16 sm:px-6">
      <p className="text-xs font-medium uppercase tracking-[0.18em] text-live">
        {paid ? "Paid" : "Reserved"}
      </p>
      <h1 className="mt-2 font-display text-4xl">{paid ? "You got it." : "Marked sold."}</h1>
      <p className="mt-3 text-sm text-muted-foreground">
        {paid
          ? `Charged ${brandLabel(stripe.brand)} •••• ${stripe.last4} through Stripe${stripe.mode === "test" ? " in this preview" : ""}. Stock is down. Keep the vault code — that is the packing slip.`
          : "Sold from the desk. Stock is down on those listings. Share the receipt link if you need to pull it back up."}
      </p>
      <div className="mt-8 rounded-xl border border-border bg-card p-6">
        <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Vault code</p>
        <p className="mt-1 font-display text-3xl tabular-nums tracking-wide">{order.code}</p>
        {paid ? (
          <p className="mt-2 text-xs text-muted-foreground">
            Stripe · {brandLabel(stripe.brand)} •••• {stripe.last4}
          </p>
        ) : (
          <p className="mt-2 text-xs text-muted-foreground">Desk sale · no card charge</p>
        )}
        <ul className="mt-6 space-y-3 border-t border-border pt-4">
          {order.items.map((item) => (
            <li key={`${item.productId}-${item.slug}`} className="flex justify-between gap-3 text-sm">
              <span>
                {item.title}
                <span className="text-muted-foreground"> × {item.qty}</span>
              </span>
              <span className="tabular-nums">{formatPrice(item.priceCents * item.qty)}</span>
            </li>
          ))}
        </ul>
        <div className="mt-4 flex justify-between border-t border-border pt-4">
          <span>Total</span>
          <span className="font-display text-2xl tabular-nums">{formatPrice(order.totalCents)}</span>
        </div>
      </div>
      <div className="mt-6 flex flex-col gap-3 sm:flex-row">
        <ShareButton path={`/order/${order.code}`} title={`PNWCardVault ${order.code}`} label="Copy receipt link" />
        <Link
          to="/shop"
          className="inline-flex h-11 items-center justify-center rounded-md border border-border px-4 text-sm"
        >
          Back to the shop
        </Link>
      </div>
    </main>
  );
}
