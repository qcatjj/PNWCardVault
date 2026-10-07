import test from "node:test";
import assert from "node:assert/strict";
import { listingSport, matchesKind, matchesSport } from "../src/lib/catalog-types.ts";

const card = (fields) => ({ sport: "", title: "Trading card", player: null, setName: null, parallel: null, description: null, ...fields });

test("autographed singles, slabs and patch cards appear in Autos", () => {
  for (const title of ["Denzel Burke RC Auto Topps Chrome Teal Refractor /199", "Zach Charbonnet Rookie Patch Autographs RC", "Jack Sawyer RC Autograph /250", "RJ Harvey RC Autograph Refractor", "Retail Rookie Autograph Lathan Ransom"]) {
    const product = card({ title, kind: "single" });
    assert.equal(matchesKind(product, "auto"), true);
    assert.equal(matchesKind(product, "single"), true);
  }
  assert.equal(matchesKind(card({ title: "PSA 10 signed card", kind: "slab" }), "auto"), true);
  assert.equal(matchesKind(card({ kind: "relic", parallel: "Certified Autograph Memorabilia" }), "auto"), true);
  assert.equal(matchesKind(card({ kind: "auto" }), "auto"), true);
});

test("base cards, unsigned cards and sealed products do not match Autos", () => {
  for (const title of ["Cooper DeJean Rated Rookie Blue", "Non-auto card", "Facsimile signature", "Unsigned rookie card"]) {
    assert.equal(matchesKind(card({ title, kind: "single" }), "auto"), false);
  }
  assert.equal(matchesKind(card({ title: "Hobby box with guaranteed autograph", kind: "sealed" }), "auto"), false);
  assert.equal(matchesKind(card({ kind: "break-spot" }), "sealed"), true);
  assert.equal(matchesKind(card({ kind: "single" }), "slab"), false);
});

test("existing basketball listings are recognized despite stale or missing categories", () => {
  assert.equal(listingSport(card({ title: "Michael Jordan 1991 Upper Deck", sport: "football" })), "basketball");
  assert.equal(listingSport(card({ player: "Kobe Bryant" })), "basketball");
  assert.equal(listingSport(card({ title: "Topps Chrome Luka Doncic" })), "basketball");
  assert.equal(listingSport(card({ description: "NBA rookie card" })), "basketball");
  assert.equal(listingSport(card({ sport: "NBA" })), "basketball");
});

test("basketball includes WNBA while the WNBA category remains specific", () => {
  const sport = listingSport(card({ title: "Sue Bird Seattle Storm", sport: "football" }));
  assert.equal(sport, "wnba");
  assert.equal(matchesSport(sport, "basketball"), true);
  assert.equal(matchesSport(sport, "wnba"), true);
  assert.equal(matchesSport("basketball", "wnba"), false);
});

test("other sports stay separate and unknown listings preserve their category", () => {
  for (const [title, sport] of [["NFL Cooper DeJean", "football"], ["MLB Topps Update", "baseball"], ["Disney Ariel", "nonsport"]]) {
    assert.equal(listingSport(card({ title })), sport);
    assert.equal(matchesSport(sport, "basketball"), false);
  }
  assert.equal(listingSport(card({ sport: "baseball" })), "baseball");
  assert.equal(listingSport(card({ sport: "unknown" })), "unknown");
});
