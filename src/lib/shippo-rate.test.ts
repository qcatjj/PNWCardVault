import { test } from "node:test";
import assert from "node:assert/strict";

import { pickUspsRate } from "./shippo-rates.ts";

test("picks cheapest USPS Ground Advantage", () => {
  const r = pickUspsRate([
    {
      object_id: "a",
      provider: "USPS",
      amount: "9.00",
      currency: "USD",
      servicelevel: { token: "usps_priority" },
    },
    {
      object_id: "b",
      provider: "USPS",
      amount: "5.10",
      currency: "USD",
      servicelevel: { token: "usps_ground_advantage" },
    },
    {
      object_id: "c",
      provider: "UPS",
      amount: "3.00",
      currency: "USD",
      servicelevel: { token: "ups_ground" },
    },
  ]);
  assert.equal(r?.object_id, "b");
});

test("returns null without USPS rates", () => {
  assert.equal(
    pickUspsRate([{ object_id: "c", provider: "UPS", amount: "3", currency: "USD" }]),
    null,
  );
});
