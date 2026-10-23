import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { authMiddleware } from "@/lib/auth/middleware";
import { requireOwner } from "@/lib/desk-owner";

export type AdminOrder = {
  sessionId: string;
  created: number;
  email: string;
  amountCents: number;
  name: string;
  address: string;
  label: null | {
    status: "purchasing" | "bought";
    trackingNumber?: string;
    labelUrl?: string;
    trackingUrl?: string;
  };
};

type Addr = {
  line1?: string | null;
  line2?: string | null;
  city?: string | null;
  state?: string | null;
  postal_code?: string | null;
  country?: string | null;
};
type Session = {
  id: string;
  created: number;
  payment_status?: string;
  amount_total?: number;
  metadata?: Record<string, string>;
  customer_details?: { name?: string | null; email?: string | null; phone?: string | null } | null;
  shipping_details?: { name?: string | null; address?: Addr | null } | null;
  collected_information?: {
    shipping_details?: { name?: string | null; address?: Addr | null } | null;
  } | null;
};

async function stripe<T>(path: string, form?: URLSearchParams): Promise<T> {
  const { env } = await import("@/lib/env.server");
  const key = env("STRIPE_SECRET_KEY");
  if (!key) throw new Error("STRIPE_SECRET_KEY is not configured.");
  const res = await fetch(`https://api.stripe.com/v1${path}`, {
    method: form ? "POST" : "GET",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: form,
  });
  const json = (await res.json()) as T & { error?: { message?: string } };
  if (!res.ok) throw new Error(json.error?.message || `Stripe ${path} failed`);
  return json;
}

function shipOf(s: Session) {
  return s.collected_information?.shipping_details ?? s.shipping_details ?? null;
}

function toOrder(s: Session): AdminOrder | null {
  const ship = shipOf(s);
  const a = ship?.address;
  if (s.payment_status !== "paid" || !a?.line1) return null;
  const m = s.metadata ?? {};
  return {
    sessionId: s.id,
    created: s.created,
    email: s.customer_details?.email ?? "",
    amountCents: s.amount_total ?? 0,
    name: ship?.name || s.customer_details?.name || "",
    address: [
      a.line1,
      a.line2,
      `${a.city ?? ""}, ${a.state ?? ""} ${a.postal_code ?? ""}`,
      a.country,
    ]
      .filter(Boolean)
      .join(" · "),
    label: m.label_tracking
      ? {
          status: "bought",
          trackingNumber: m.label_tracking,
          labelUrl: m.label_url,
          trackingUrl: m.label_tracking_url,
        }
      : m.label_status === "purchasing"
        ? { status: "purchasing" }
        : null,
  };
}

export const listPaidOrders = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }): Promise<{ orders: AdminOrder[]; missingEnv: string[] }> => {
    await requireOwner(context.userId);
    const { missingShipEnv } = await import("@/lib/shippo.server");
    const since = Math.floor(Date.now() / 1000) - 60 * 86400;
    const qs = new URLSearchParams({
      status: "complete",
      limit: "100",
      "created[gte]": String(since),
    });
    const json = await stripe<{ data: Session[] }>(`/checkout/sessions?${qs}`);
    return {
      orders: json.data.map(toOrder).filter((o): o is AdminOrder => o !== null),
      missingEnv: missingShipEnv(),
    };
  });

const inFlight = new Set<string>();

export const buyOrderLabel = createServerFn({ method: "POST" })
  .validator(
    z.object({ sessionId: z.string().regex(/^cs_[A-Za-z0-9_]+$/), force: z.boolean().optional() }),
  )
  .middleware([authMiddleware])
  .handler(async ({ data, context }): Promise<AdminOrder> => {
    await requireOwner(context.userId);
    const { missingShipEnv, getRates, pickUspsRate, buyLabel } =
      await import("@/lib/shippo.server");
    const missing = missingShipEnv();
    if (missing.length) throw new Error(`Set these env vars first: ${missing.join(", ")}`);
    if (inFlight.has(data.sessionId))
      throw new Error("A label purchase for this order is already running.");
    inFlight.add(data.sessionId);
    const path = `/checkout/sessions/${encodeURIComponent(data.sessionId)}`;
    try {
      const s = await stripe<Session>(path);
      const order = toOrder(s);
      if (!order) throw new Error("Order is not paid or has no shipping address.");
      if (order.label?.status === "bought") return order; // never double-buy
      if (order.label?.status === "purchasing" && !data.force) {
        throw new Error(
          "A previous purchase did not finish. Check Shippo for an existing label before retrying.",
        );
      }
      await stripe(path, new URLSearchParams({ "metadata[label_status]": "purchasing" }));
      const ship = shipOf(s)!;
      const a = ship.address!;
      const shipment = await getRates(
        {
          name: order.name,
          street1: a.line1!,
          street2: a.line2 || undefined,
          city: a.city ?? "",
          state: a.state ?? "",
          zip: a.postal_code ?? "",
          country: a.country ?? "US",
          email: order.email || undefined,
          phone: s.customer_details?.phone || undefined,
        },
        s.id,
      );
      const rate = pickUspsRate(shipment.rates ?? []);
      if (!rate) throw new Error("No tracked USPS rate available for this address.");
      const label = await buyLabel(rate.object_id, s.id);
      const meta = new URLSearchParams({
        "metadata[label_status]": "bought",
        "metadata[label_tracking]": label.trackingNumber,
        "metadata[label_url]": label.labelUrl.slice(0, 500),
        "metadata[label_tracking_url]": label.trackingUrl.slice(0, 500),
        "metadata[label_transaction]": label.transactionId,
        "metadata[label_rate]":
          `${rate.servicelevel?.name ?? ""} ${rate.amount} ${rate.currency}`.slice(0, 500),
      });
      const updated = await stripe<Session>(path, meta);
      return toOrder(updated)!;
    } finally {
      inFlight.delete(data.sessionId);
    }
  });
