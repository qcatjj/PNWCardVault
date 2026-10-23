// Pirate Ship spreadsheet import format. Defaults: one card in a bubble mailer.
export const PIRATE_SHIP_HEADERS = [
  "Name",
  "Company",
  "Address 1",
  "Address 2",
  "City",
  "State",
  "Zip",
  "Country",
  "Email",
  "Phone",
  "Order ID",
  "Pounds",
  "Ounces",
  "Length",
  "Width",
  "Height",
] as const;

export const DEFAULT_PACKAGE = { pounds: "0", ounces: "4", length: "9", width: "6", height: "0.5" };

export type ShipRow = {
  name: string;
  company?: string;
  line1: string;
  line2?: string;
  city: string;
  state: string;
  zip: string;
  country: string;
  email?: string;
  phone?: string;
  orderId: string;
};

export function csvCell(value: string | undefined): string {
  let v = value ?? "";
  // Guard against spreadsheet formula injection.
  if (/^[=+\-@\t\r]/.test(v)) v = `'${v}`;
  return /[",\r\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v;
}

export function toPirateShipCsv(rows: ShipRow[]): string {
  const lines = [PIRATE_SHIP_HEADERS.join(",")];
  for (const r of rows) {
    lines.push(
      [
        r.name,
        r.company,
        r.line1,
        r.line2,
        r.city,
        r.state,
        r.zip,
        r.country,
        r.email,
        r.phone,
        r.orderId,
        DEFAULT_PACKAGE.pounds,
        DEFAULT_PACKAGE.ounces,
        DEFAULT_PACKAGE.length,
        DEFAULT_PACKAGE.width,
        DEFAULT_PACKAGE.height,
      ]
        .map(csvCell)
        .join(","),
    );
  }
  return lines.join("\r\n") + "\r\n";
}

type Addr = {
  line1?: string | null;
  line2?: string | null;
  city?: string | null;
  state?: string | null;
  postal_code?: string | null;
  country?: string | null;
};
export type StripeSessionLike = {
  id: string;
  payment_status?: string;
  customer_details?: {
    name?: string | null;
    email?: string | null;
    phone?: string | null;
    address?: Addr | null;
  } | null;
  shipping_details?: { name?: string | null; address?: Addr | null } | null;
  collected_information?: {
    shipping_details?: { name?: string | null; address?: Addr | null } | null;
  } | null;
};

export function sessionToRow(s: StripeSessionLike): ShipRow | null {
  if (s.payment_status !== "paid") return null;
  const ship = s.collected_information?.shipping_details ?? s.shipping_details ?? null;
  const a = ship?.address;
  if (!a?.line1) return null;
  return {
    name: ship?.name || s.customer_details?.name || "",
    line1: a.line1,
    line2: a.line2 ?? "",
    city: a.city ?? "",
    state: a.state ?? "",
    zip: a.postal_code ?? "",
    country: a.country ?? "US",
    email: s.customer_details?.email ?? "",
    phone: s.customer_details?.phone ?? "",
    orderId: s.id,
  };
}
