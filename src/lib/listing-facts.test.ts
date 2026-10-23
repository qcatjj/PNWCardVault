import { test } from "node:test";
import assert from "node:assert/strict";
import {
  gradeInfo,
  inBand,
  isAuto,
  isRookie,
  publicImageUrls,
  serialOf,
  teamOf,
} from "./listing-facts.ts";

const base = {
  kind: "single",
  grade: "Raw",
  serialNum: null,
  parallel: null,
  setName: null,
  description: null,
};

test("derives badges from stored listing data", () => {
  const p = {
    ...base,
    title: "2025 Topps Chrome Jack Sawyer RC Autograph /250 Pittsburgh Steelers",
  };
  assert.equal(serialOf(p), "/250");
  assert.ok(isRookie(p));
  assert.ok(isAuto(p));
  assert.equal(teamOf(p), "Steelers");
  assert.deepEqual(gradeInfo(p), { graded: false, label: "Raw" });
  assert.equal(serialOf({ ...base, title: "Red Refractor #RRA-LRA 1/5" }), "1/5");
  assert.deepEqual(gradeInfo({ ...base, title: "Luka PSA 10 Prizm" }), {
    graded: true,
    label: "PSA 10",
  });
});

test("price bands and image urls", () => {
  assert.ok(inBand(3000, "25-100"));
  assert.ok(!inBand(3000, "u25"));
  assert.ok(inBand(3000, undefined));
  const out = publicImageUrls({
    id: 7,
    imageUrl: "data:image/jpeg;base64,AAAA",
    imageUrlBack: "https://x/y.jpg",
  });
  assert.match(out.imageUrl!, /^\/img\/7\/front-[a-z0-9]+\.webp$/);
  assert.equal(out.imageUrlBack, "https://x/y.jpg");
});
