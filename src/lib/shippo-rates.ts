export type ShippoRate = {
  object_id: string;
  provider: string;
  amount: string;
  currency: string;
  servicelevel?: { token?: string; name?: string };
};

/** Cheapest USPS Ground Advantage rate (tracked); falls back to cheapest tracked USPS non-express. */
export function pickUspsRate(rates: ShippoRate[]): ShippoRate | null {
  const usps = rates.filter((r) => r.provider?.toUpperCase() === "USPS");
  const byPrice = (a: ShippoRate, b: ShippoRate) => Number(a.amount) - Number(b.amount);
  const ground = usps
    .filter((r) => r.servicelevel?.token === "usps_ground_advantage")
    .sort(byPrice);
  if (ground[0]) return ground[0];
  // First Class / Media Mail are excluded; Priority is tracked.
  const tracked = usps.filter((r) => r.servicelevel?.token === "usps_priority").sort(byPrice);
  return tracked[0] ?? null;
}
