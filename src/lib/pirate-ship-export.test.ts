import { test } from "node:test";
import assert from "node:assert/strict";
import { sessionToRow, toPirateShipCsv } from "./pirate-ship-export.ts";

test("paid session with shipping becomes a Pirate Ship row", () => {
  const row = sessionToRow({
    id: "cs_1",
    payment_status: "paid",
    customer_details: { email: "a@b.co", name: "Bill" },
    collected_information: {
      shipping_details: {
        name: "Ann, Lee",
        address: {
          line1: "1 Main",
          city: "Seattle",
          state: "WA",
          postal_code: "98101",
          country: "US",
        },
      },
    },
  });
  assert.ok(row);
  const csv = toPirateShipCsv([row]);
  assert.match(csv, /^Name,Company,Address 1/);
  assert.match(csv, /"Ann, Lee",,1 Main,,Seattle,WA,98101,US,a@b\.co,,cs_1,0,4,9,6,0\.5/);
});

test("unpaid or addressless sessions are skipped", () => {
  assert.equal(sessionToRow({ id: "x", payment_status: "unpaid" }), null);
  assert.equal(sessionToRow({ id: "y", payment_status: "paid" }), null);
});
