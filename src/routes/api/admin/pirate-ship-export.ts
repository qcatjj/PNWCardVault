import { createFileRoute } from "@tanstack/react-router";
import { env } from "@/lib/env.server";
import {
  sessionToRow,
  toPirateShipCsv,
  type ShipRow,
  type StripeSessionLike,
} from "@/lib/pirate-ship-export";

function safeEqual(a: string, b: string) {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

// GET /api/admin/pirate-ship-export?days=30
// Auth: header "Authorization: Bearer <ADMIN_EXPORT_TOKEN>" (or ?token=...).
async function handle(request: Request) {
  const expected = env("ADMIN_EXPORT_TOKEN");
  if (!expected) return new Response("ADMIN_EXPORT_TOKEN is not configured.", { status: 503 });
  const url = new URL(request.url);
  const header = request.headers.get("authorization") || "";
  const given = header.startsWith("Bearer ")
    ? header.slice(7)
    : url.searchParams.get("token") || "";
  if (!given || !safeEqual(given, expected)) return new Response("Unauthorized", { status: 401 });
  const key = env("STRIPE_SECRET_KEY");
  if (!key) return new Response("STRIPE_SECRET_KEY is not configured.", { status: 503 });

  const days = Math.min(Math.max(Number(url.searchParams.get("days")) || 30, 1), 365);
  const since = Math.floor(Date.now() / 1000) - days * 86400;
  const rows: ShipRow[] = [];
  let startingAfter = "";
  for (let page = 0; page < 50; page++) {
    const qs = new URLSearchParams({
      status: "complete",
      limit: "100",
      "created[gte]": String(since),
    });
    if (startingAfter) qs.set("starting_after", startingAfter);
    const res = await fetch(`https://api.stripe.com/v1/checkout/sessions?${qs}`, {
      headers: { Authorization: `Bearer ${key}` },
    });
    const json = (await res.json()) as {
      data?: StripeSessionLike[];
      has_more?: boolean;
      error?: { message?: string };
    };
    if (!res.ok) return new Response(json.error?.message || "Stripe error", { status: 502 });
    for (const s of json.data ?? []) {
      const row = sessionToRow(s);
      if (row) rows.push(row);
    }
    if (!json.has_more || !json.data?.length) break;
    startingAfter = json.data[json.data.length - 1]!.id;
  }
  const date = new Date().toISOString().slice(0, 10);
  return new Response(toPirateShipCsv(rows), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="pirate-ship-${date}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}

export const Route = createFileRoute("/api/admin/pirate-ship-export")({
  server: { handlers: { GET: ({ request }) => handle(request) } },
});
