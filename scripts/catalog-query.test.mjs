import test from "node:test";
import assert from "node:assert/strict";
import { PGlite } from "@electric-sql/pglite";
import { listingSport, matchesKind, matchesSport } from "../src/lib/catalog-types.ts";
import { buildListQuery, buildRelatedQuery } from "../src/lib/catalog-query.ts";
import { publicImageSql, listingPhotoPatch, storedBackImage, storedFrontImage } from "../src/lib/listing-image.ts";
import { hashString } from "../src/lib/listing-facts.ts";
import { imageCacheTokenMatches, lightImageHash } from "../src/lib/light-image-hash.ts";

const LIVE = [
  { id: 20, title: "2025 Topps Chrome Retail Rookie Autograph Lathan Ransom Red Refractor #RRA-LRA 1/5", player: "Lathan Ransom", set_name: "Topps Chrome Retail Rookie Autograph", parallel: "Red Refractor", description: null, sport: "football", kind: "single" },
  { id: 21, title: "Dak Prescott Dallas Cowboys /50 Football Card", player: "Dak Prescott", set_name: "Resurgence", parallel: null, description: "Near mint", sport: "football", kind: "single" },
  { id: 22, title: "RJ Harvey 2025 Topps Chrome RC Autograph Refractor /299 Broncos", player: "RJ Harvey", set_name: "Topps Chrome", parallel: "Refractor", description: null, sport: "football", kind: "single" },
  { id: 23, title: "2025 Topps Chrome Jack Sawyer RC Autograph /250 Pittsburgh Steelers", player: "Jack Sawyer", set_name: "Resurgence", parallel: "Refractor", description: null, sport: "football", kind: "single" },
  { id: 24, title: "Zach Charbonnet 2023 Panini Contenders Optic Rookie Patch Autographs RC", player: "Zach Charbonnet", set_name: "Contenders Optic", parallel: null, description: null, sport: "football", kind: "single" },
  { id: 25, title: "Denzel Burke RC Auto Topps Chrome Teal Refractor /199", player: "Denzel Burke", set_name: "Topps Chrome", parallel: "Teal Refractor", description: null, sport: "football", kind: "single" },
  { id: 26, title: "2026 Topps Flagship Emeka Egbuka Autograph Player-Worn Patch /99 Buccaneers", player: "Emeka Egbuka", set_name: "Topps Flagship", parallel: "Certified Autograph Memorabilia", description: null, sport: "football", kind: "single" },
  { id: 27, title: "Cooper DeJean Topps Chrome Rookie RC Philadelphia Eagles CB Refractor", player: "Cooper DeJean", set_name: "Topps Chrome", parallel: "Refractor", description: null, sport: "football", kind: "single" },
  { id: 28, title: "2024 Donruss Optic Cooper DeJean Rated Rookie Blue Philadelphia Eagles", player: "Cooper DeJean", set_name: "Donruss Optic", parallel: "Blue", description: null, sport: "football", kind: "single" },
];

const EXTRA = [
  { id: 1, title: "Michael Jordan 1991 Upper Deck", player: null, set_name: null, parallel: null, description: null, sport: "football", kind: "single" },
  { id: 2, title: "Sue Bird Seattle Storm", player: null, set_name: null, parallel: null, description: null, sport: "football", kind: "single" },
  { id: 3, title: "Hobby box with guaranteed autograph", player: null, set_name: null, parallel: null, description: null, sport: "basketball", kind: "sealed" },
  { id: 4, title: "Break spot", player: null, set_name: null, parallel: null, description: null, sport: "basketball", kind: "break-spot" },
  { id: 5, title: "PSA 10 signed card", player: null, set_name: null, parallel: null, description: null, sport: "basketball", kind: "slab" },
  { id: 6, title: "Non-auto card", player: null, set_name: null, parallel: null, description: null, sport: "baseball", kind: "single" },
  { id: 7, title: "Unsigned rookie card", player: null, set_name: null, parallel: null, description: null, sport: "baseball", kind: "single" },
  { id: 8, title: "Facsimile signature", player: null, set_name: null, parallel: null, description: null, sport: "nonsport", kind: "single" },
  { id: 9, title: "Disney Ariel", player: null, set_name: null, parallel: null, description: null, sport: "football", kind: "relic" },
  { id: 10, title: "Plain card", player: null, set_name: null, parallel: null, description: "NBA rookie card", sport: "unknown", kind: "auto" },
];

function productOf(row) {
  return {
    sport: row.sport,
    title: row.title,
    player: row.player,
    setName: row.set_name,
    parallel: row.parallel,
    description: row.description,
    kind: row.kind,
  };
}

function expectedIds(rows, sport, kind) {
  return rows
    .filter((row) => {
      const product = productOf(row);
      const resolved = listingSport(product);
      const sportOk = !sport || matchesSport(resolved, sport);
      const kindOk = !kind || matchesKind(product, kind);
      return sportOk && kindOk;
    })
    .map((row) => row.id)
    .sort((a, b) => a - b);
}

let db;
let rows;

test("catalog filters and image urls", async (t) => {
  db = new PGlite();
  await db.exec(`
    create table drops (id integer primary key, slug text, title text);
    create table products (
      id integer primary key,
      slug text,
      title text,
      player text,
      set_name text,
      year integer,
      sport text,
      kind text,
      parallel text,
      serial_num text,
      grade text,
      price_cents integer default 1000,
      compare_at_cents integer,
      qty integer default 1,
      description text,
      image_key text default 'face',
      image_url text,
      image_url_back text,
      image_depiction boolean default false,
      featured boolean default false,
      drop_id integer,
      short_code text,
      on_block boolean default false,
      queue_pos integer
    );
  `);
  rows = [...EXTRA, ...LIVE];
  for (const row of rows) {
    await db.query(
      `insert into products (id, slug, title, player, set_name, parallel, description, sport, kind, price_cents, featured)
       values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)`,
      [row.id, `card-${row.id}`, row.title, row.player, row.set_name, row.parallel, row.description, row.sport, row.kind, 1000 + row.id, row.id % 2 === 0],
    );
  }

  await t.test("sport and kind filters match the javascript categories, and limit stays in SQL", async () => {
    const sports = [undefined, "basketball", "wnba", "football", "baseball", "nonsport", "NBA"];
    const kinds = [undefined, "single", "slab", "auto", "relic", "sealed"];
    for (const sport of sports) {
      for (const kind of kinds) {
        const query = buildListQuery({ sport, kind, limit: 80 });
        assert.match(query.text, /limit 80/);
        assert.doesNotMatch(query.text, /image_url as "imageUrl"/);
        assert.match(query.text, /\/img\//);
        const result = await db.query(query.text, query.params);
        const got = result.rows.map((row) => Number(row.id)).sort((a, b) => a - b);
        assert.deepEqual(got, expectedIds(rows, sport, kind), JSON.stringify({ sport, kind, got }));
      }
    }
  });

  await t.test("a sport filter no longer drops the SQL limit", async () => {
    const query = buildListQuery({ sport: "football", kind: "auto", limit: 2, sort: "newest" });
    assert.match(query.text, /limit 2/);
    const result = await db.query(query.text, query.params);
    assert.equal(result.rows.length, 2);
    const unlimited = expectedIds(rows, "football", "auto");
    assert.ok(unlimited.length > 2);
  });

  await t.test("related query is capped in SQL and skips the current card", async () => {
    const query = buildRelatedQuery({ sport: "football", excludeId: 23, limit: 4 });
    assert.match(query.text, /limit 4/);
    assert.match(query.text, /p\.id <> \$1/);
    const result = await db.query(query.text, query.params);
    assert.equal(result.rows.length, 4);
    assert.ok(result.rows.every((row) => Number(row.id) !== 23));
    for (const row of result.rows) {
      assert.ok(String(row.imageUrl ?? "").length < 200);
      assert.equal(row.imageUrl, null);
    }
  });

  await t.test("data urls become stable /img paths without leaving the database", async () => {
    const blob = `data:image/jpeg;base64,${"A".repeat(5000)}ZZ`;
    const back = "https://cdn.example/card.jpg";
    await db.query(`update products set image_url = $1, image_url_back = $2 where id = 20`, [blob, back]);
    const frontSql = publicImageSql("image_url", "front", "id");
    const backSql = publicImageSql("image_url_back", "back", "id");
    const result = await db.query(
      `select ${frontSql} as front, ${backSql} as back,
              octet_length((${frontSql})) as front_bytes,
              octet_length(image_url) as stored_bytes
       from products where id = 20`,
    );
    const hash = lightImageHash(blob);
    assert.equal(result.rows[0].front, `/img/20/front-${hash}.webp`);
    assert.equal(result.rows[0].back, back);
    assert.ok(Number(result.rows[0].front_bytes) < 80);
    assert.ok(Number(result.rows[0].stored_bytes) > 5000);
    assert.notEqual(hash, hashString(blob));
    assert.equal(imageCacheTokenMatches(blob, hash), true);
    assert.equal(imageCacheTokenMatches(blob, hashString(blob)), true);
    assert.equal(imageCacheTokenMatches(blob, "nope"), false);
  });
});

test("desk edits do not write public image paths back over stored photos", () => {
  const front = "/img/20/front-abc123.webp";
  const back = "/img/20/back-abc123.webp";
  assert.deepEqual(listingPhotoPatch(front, back), {});
  assert.deepEqual(listingPhotoPatch("data:image/jpeg;base64,AAAA", back), {
    imageUrl: "data:image/jpeg;base64,AAAA",
  });
  assert.deepEqual(listingPhotoPatch(front, null), { imageUrlBack: null });
  assert.deepEqual(listingPhotoPatch(front, "https://cdn.example/new.jpg"), {
    imageUrlBack: "https://cdn.example/new.jpg",
  });
});

test("a desk save that still shows /img urls does not replace the stored blobs", async () => {
  const db = new PGlite();
  await db.exec(`create table products (id integer primary key, image_url text, image_url_back text)`);
  await db.query(`insert into products (id, image_url, image_url_back) values (7, $1, $2)`, [
    "data:image/jpeg;base64,FRONT",
    "data:image/jpeg;base64,BACK",
  ]);
  const front = storedFrontImage("/img/7/front-abc123.webp");
  const back = storedBackImage("/img/7/back-def456.webp");
  await db.query(
    `update products set
       image_url = coalesce($1, image_url),
       image_url_back = case $3 when 'keep' then image_url_back when 'clear' then null else $2 end
     where id = 7`,
    [front, back.mode === "set" ? back.url : null, back.mode],
  );
  const kept = await db.query(`select image_url, image_url_back from products where id = 7`);
  assert.equal(kept.rows[0].image_url, "data:image/jpeg;base64,FRONT");
  assert.equal(kept.rows[0].image_url_back, "data:image/jpeg;base64,BACK");

  const cleared = storedBackImage(null);
  const replacement = storedFrontImage("data:image/jpeg;base64,NEW");
  await db.query(
    `update products set
       image_url = coalesce($1, image_url),
       image_url_back = case $3 when 'keep' then image_url_back when 'clear' then null else $2 end
     where id = 7`,
    [replacement, null, cleared.mode],
  );
  const next = await db.query(`select image_url, image_url_back from products where id = 7`);
  assert.equal(next.rows[0].image_url, "data:image/jpeg;base64,NEW");
  assert.equal(next.rows[0].image_url_back, null);
});

test("shop catalog query without a limit stays unbounded", () => {
  const query = buildListQuery({ sport: "basketball", sort: "price-asc" });
  assert.doesNotMatch(query.text, /\blimit\b/);
  assert.match(query.text, /price_cents asc/);
});
