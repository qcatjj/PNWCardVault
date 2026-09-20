import { getRequest } from "@tanstack/react-start/server";
import { env, isWorkspacePreview } from "@/lib/env.server";

export type PaymentMode = "preview-test" | "live" | "test" | "pending";

export function paymentMode(): PaymentMode {
  const key = env("STRIPE_SECRET_KEY");
  if (key?.startsWith("sk_live_") || key?.startsWith("rk_live_")) return "live";
  if (key?.startsWith("sk_test_") || key?.startsWith("rk_test_")) return "test";
  const onVercel = Boolean(env("VERCEL") || env("VERCEL_ENV"));
  if (!onVercel && isWorkspacePreview()) return "preview-test";
  return "pending";
}

function stripeKey() {
  return env("STRIPE_SECRET_KEY");
}

function stripeReady(key: string | undefined) {
  return Boolean(
    key?.startsWith("sk_live_") ||
      key?.startsWith("sk_test_") ||
      key?.startsWith("rk_live_") ||
      key?.startsWith("rk_test_"),
  );
}

function publicOrigin() {
  const request = getRequest();
  const host = request?.headers.get("x-forwarded-host") || request?.headers.get("host") || "";
  const proto = request?.headers.get("x-forwarded-proto") || "https";
  if (!host) return "";
  return `${proto}://${host.split(",")[0]!.trim()}`;
}

export type CheckoutItem = {
  title: string;
  qty: number;
  priceCents: number;
  productId: number;
};

export async function createStripeCheckoutSession(
  items: CheckoutItem[],
  email: string,
  cancelPath = "/checkout",
) {
  const key = stripeKey();
  if (!stripeReady(key)) {
    throw new Error("Stripe is not connected yet. Add STRIPE_SECRET_KEY.");
  }
  const origin = publicOrigin();
  if (!origin) throw new Error("Could not start Stripe checkout.");
  const cancel = cancelPath.startsWith("/") ? cancelPath : "/checkout";
  const params = new URLSearchParams();
  params.set("mode", "payment");
  params.set("customer_email", email);
  params.set("billing_address_collection", "required");
  params.set("phone_number_collection[enabled]", "true");
  params.append("shipping_address_collection[allowed_countries][]", "US");
  params.append("shipping_address_collection[allowed_countries][]", "CA");
  params.set("success_url", `${origin}/order/stripe?session_id={CHECKOUT_SESSION_ID}`);
  params.set("cancel_url", `${origin}${cancel}`);
  params.set("submit_type", "pay");
  params.set("payment_intent_data[description]", "PNW Card Vault");
  params.set("payment_intent_data[statement_descriptor]", "PNW CARD VAULT");
  params.set(
    "metadata[items]",
    JSON.stringify(items.map((item) => ({ productId: item.productId, qty: item.qty }))),
  );
  items.forEach((item, index) => {
    params.set(`line_items[${index}][quantity]`, String(item.qty));
    params.set(`line_items[${index}][price_data][currency]`, "usd");
    params.set(`line_items[${index}][price_data][unit_amount]`, String(item.priceCents));
    params.set(`line_items[${index}][price_data][product_data][name]`, item.title.slice(0, 120));
  });
  const res = await fetch("https://api.stripe.com/v1/checkout/sessions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: params,
  });
  const json = (await res.json()) as { id?: string; url?: string; error?: { message?: string } };
  if (!res.ok || !json.url) {
    throw new Error(json.error?.message || "Stripe checkout did not start.");
  }
  return { id: json.id ?? "", url: json.url };
}

type StripeCard = { brand?: string; last4?: string };
type StripePaymentMethod = { card?: StripeCard | null; type?: string };
type StripeIntent = { id?: string; payment_method?: StripePaymentMethod | string | null };

export async function paidStripeItems(sessionId: string) {
  const key = stripeKey();
  if (!stripeReady(key) || !key) return null;
  const qs = new URLSearchParams();
  qs.append("expand[]", "payment_intent.payment_method");
  const res = await fetch(
    `https://api.stripe.com/v1/checkout/sessions/${encodeURIComponent(sessionId)}?${qs}`,
    { headers: { Authorization: `Bearer ${key}` } },
  );
  const json = (await res.json()) as {
    payment_status?: string;
    payment_intent?: StripeIntent | string;
    metadata?: { items?: string };
    error?: { message?: string };
  };
  if (!res.ok || json.payment_status !== "paid") return null;
  let items: Array<{ productId: number; qty: number }> = [];
  try {
    items = JSON.parse(json.metadata?.items || "[]") as Array<{ productId: number; qty: number }>;
  } catch {
    items = [];
  }
  if (items.length === 0) return null;
  const intent = typeof json.payment_intent === "object" ? json.payment_intent : null;
  const method = typeof intent?.payment_method === "object" ? intent.payment_method : null;
  const brand = method?.card?.brand || (method?.type === "link" ? "link" : "card");
  const last4 = method?.card?.last4 || "paid";
  const paymentIntent =
    typeof json.payment_intent === "string"
      ? json.payment_intent
      : intent?.id || sessionId;
  return { items, paymentIntent, brand, last4 };
}
