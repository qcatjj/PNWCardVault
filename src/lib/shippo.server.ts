import { env } from "@/lib/env.server";
import type { ShippoRate } from "@/lib/shippo-rates";

export { pickUspsRate } from "@/lib/shippo-rates";

export const DEFAULT_PARCEL = {
  length: "9",
  width: "6",
  height: "0.5",
  distance_unit: "in",
  weight: "4",
  mass_unit: "oz",
};

const FROM_REQUIRED = [
  "SHIP_FROM_NAME",
  "SHIP_FROM_STREET1",
  "SHIP_FROM_CITY",
  "SHIP_FROM_STATE",
  "SHIP_FROM_ZIP",
  "SHIP_FROM_PHONE",
] as const;

export function missingShipEnv(): string[] {
  const missing: string[] = FROM_REQUIRED.filter((k) => !env(k));
  if (!env("SHIPPO_API_TOKEN")) missing.unshift("SHIPPO_API_TOKEN");
  return missing;
}

export function fromAddress() {
  return {
    name: env("SHIP_FROM_NAME"),
    street1: env("SHIP_FROM_STREET1"),
    street2: env("SHIP_FROM_STREET2") || undefined,
    city: env("SHIP_FROM_CITY"),
    state: env("SHIP_FROM_STATE"),
    zip: env("SHIP_FROM_ZIP"),
    country: "US",
    phone: env("SHIP_FROM_PHONE"),
    email: env("SHIP_FROM_EMAIL") || undefined,
  };
}

async function shippo<T>(path: string, body?: unknown): Promise<T> {
  const res = await fetch(`https://api.goshippo.com${path}`, {
    method: body ? "POST" : "GET",
    headers: {
      Authorization: `ShippoToken ${env("SHIPPO_API_TOKEN")}`,
      "Content-Type": "application/json",
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const json = (await res.json().catch(() => ({}))) as T & { detail?: string };
  if (!res.ok)
    throw new Error(`Shippo ${path} failed (${res.status}): ${JSON.stringify(json).slice(0, 300)}`);
  return json;
}

export type ShipTo = {
  name: string;
  street1: string;
  street2?: string;
  city: string;
  state: string;
  zip: string;
  country: string;
  email?: string;
  phone?: string;
};

export async function getRates(to: ShipTo, orderRef: string) {
  const shipment = await shippo<{ object_id: string; rates: ShippoRate[] }>("/shipments/", {
    address_from: fromAddress(),
    address_to: to,
    parcels: [DEFAULT_PARCEL],
    metadata: orderRef.slice(0, 100),
    async: false,
  });
  return shipment;
}

export type LabelResult = {
  trackingNumber: string;
  labelUrl: string;
  trackingUrl: string;
  transactionId: string;
};

export async function buyLabel(rateId: string, orderRef: string): Promise<LabelResult> {
  const tx = await shippo<{
    object_id: string;
    status: string;
    tracking_number?: string;
    tracking_url_provider?: string;
    label_url?: string;
    messages?: Array<{ text?: string }>;
  }>("/transactions/", {
    rate: rateId,
    label_file_type: "PDF_4x6",
    async: false,
    metadata: orderRef.slice(0, 100),
  });
  if (tx.status !== "SUCCESS" || !tx.label_url) {
    throw new Error(
      `Label purchase failed: ${tx.messages?.map((m) => m.text).join("; ") || tx.status}`,
    );
  }
  return {
    trackingNumber: tx.tracking_number ?? "",
    labelUrl: tx.label_url,
    trackingUrl: tx.tracking_url_provider ?? "",
    transactionId: tx.object_id,
  };
}
