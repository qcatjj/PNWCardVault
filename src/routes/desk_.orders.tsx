import { pageHead } from "@/lib/product-seo";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { formatPrice } from "@/lib/format";
import { buyOrderLabel, listPaidOrders, type AdminOrder } from "@/lib/orders-admin";

export const Route = createFileRoute("/desk_/orders")({
  head: () => pageHead("Orders", "Owner order desk."),
  component: OrdersPage,
});

function OrdersPage() {
  const [orders, setOrders] = useState<AdminOrder[] | null>(null);
  const [missing, setMissing] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await listPaidOrders();
      setOrders(res.orders);
      setMissing(res.missingEnv);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function buy(order: AdminOrder) {
    const force = order.label?.status === "purchasing";
    if (!window.confirm(`Buy a USPS label for ${order.name}? This charges your Shippo account.`))
      return;
    setBusy(order.sessionId);
    try {
      const updated = await buyOrderLabel({ data: { sessionId: order.sessionId, force } });
      setOrders(
        (prev) => prev?.map((o) => (o.sessionId === updated.sessionId ? updated : o)) ?? null,
      );
      if (updated.label?.labelUrl) window.open(updated.label.labelUrl, "_blank", "noopener");
      toast.success(`Label bought · ${updated.label?.trackingNumber ?? ""}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(null);
    }
  }

  return (
    <main className="mx-auto max-w-4xl px-4 py-10">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-3xl">Orders</h1>
        <Link to="/desk" className="text-sm text-muted-foreground underline">
          Back to desk
        </Link>
      </div>
      <p className="mt-2 text-sm text-muted-foreground">
        Paid Stripe orders from the last 60 days.
      </p>
      {missing.length > 0 && (
        <p className="mt-4 rounded-md border border-border bg-muted p-3 text-sm">
          Label buying is off until these env vars are set: {missing.join(", ")}
        </p>
      )}
      {error && (
        <p className="mt-6 text-sm text-destructive">
          {error} — <Link to="/desk">sign in on the desk</Link> as the shop owner.
        </p>
      )}
      {!orders && !error && <p className="mt-6 text-sm">Loading…</p>}
      {orders?.length === 0 && <p className="mt-6 text-sm">No paid orders yet.</p>}
      <ul className="mt-6 divide-y divide-border rounded-xl border border-border bg-card">
        {orders?.map((o) => (
          <li key={o.sessionId} className="flex flex-wrap items-center gap-4 p-4">
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium">
                {o.name}{" "}
                <span className="text-muted-foreground">· {formatPrice(o.amountCents)}</span>
              </p>
              <p className="text-xs text-muted-foreground">{o.address}</p>
              <p className="text-xs text-muted-foreground">
                {new Date(o.created * 1000).toLocaleString()} · {o.email} ·{" "}
                {o.sessionId.slice(0, 18)}…
              </p>
            </div>
            {o.label?.status === "bought" ? (
              <div className="text-right text-xs">
                <a
                  href={o.label.labelUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline"
                >
                  Label PDF
                </a>
                <p>
                  {o.label.trackingUrl ? (
                    <a
                      href={o.label.trackingUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="underline"
                    >
                      {o.label.trackingNumber}
                    </a>
                  ) : (
                    o.label.trackingNumber
                  )}
                </p>
              </div>
            ) : (
              <Button
                type="button"
                size="sm"
                disabled={busy !== null || missing.length > 0}
                onClick={() => void buy(o)}
              >
                {busy === o.sessionId
                  ? "Buying…"
                  : o.label?.status === "purchasing"
                    ? "Retry label"
                    : "Buy label"}
              </Button>
            )}
          </li>
        ))}
      </ul>
      <p className="mt-6 text-xs text-muted-foreground">
        Fallback: /api/admin/pirate-ship-export (Bearer ADMIN_EXPORT_TOKEN) downloads a Pirate Ship
        CSV.
      </p>
    </main>
  );
}
