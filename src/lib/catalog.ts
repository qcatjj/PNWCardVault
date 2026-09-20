import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { authMiddleware } from "@/lib/auth/middleware";
import { requireOwner } from "@/lib/desk-owner";
import { slugify } from "./utils";
import { chargeTestToken } from "./stripe-test";
import type { Drop, ListFilters, Order, OrderItem, OrderPayment, Product } from "./catalog-types";
import { resolveSport } from "./catalog-types";
import type { Sql } from "./db";

type ProductRow = {
  id: number;
  slug: string;
  title: string;
  player: string | null;
  setName: string | null;
  year: number | null;
  sport: string;
  kind: string;
  parallel: string | null;
  serialNum: string | null;
  grade: string | null;
  priceCents: number;
  compareAtCents: number | null;
  qty: number;
  description: string | null;
  imageKey: string;
  imageUrl: string | null;
  imageUrlBack: string | null;
  imageDepiction: boolean;
  featured: boolean;
  dropId: number | null;
  dropSlug: string | null;
  dropTitle: string | null;
  shortCode: string | null;
  onBlock: boolean;
  queuePos: number | null;
};

const productSelect = `
  p.id,
  p.slug,
  p.title,
  p.player,
  p.set_name as "setName",
  p.year,
  p.sport,
  p.kind,
  p.parallel,
  p.serial_num as "serialNum",
  p.grade,
  p.price_cents as "priceCents",
  p.compare_at_cents as "compareAtCents",
  p.qty,
  p.description,
  p.image_key as "imageKey",
  p.image_url as "imageUrl",
  p.image_url_back as "imageUrlBack",
  p.image_depiction as "imageDepiction",
  p.featured,
  p.drop_id as "dropId",
  p.short_code as "shortCode",
  p.on_block as "onBlock",
  p.queue_pos as "queuePos",
  d.slug as "dropSlug",
  d.title as "dropTitle"
`;

function mapProduct(row: ProductRow): Product {
  return {
    ...row,
    year: row.year == null ? null : Number(row.year),
    priceCents: Number(row.priceCents),
    compareAtCents: row.compareAtCents == null ? null : Number(row.compareAtCents),
    qty: Number(row.qty),
    featured: Boolean(row.featured),
    dropId: row.dropId == null ? null : Number(row.dropId),
    imageUrl: row.imageUrl || null,
    imageUrlBack: row.imageUrlBack || null,
    imageDepiction: Boolean(row.imageDepiction),
    shortCode: row.shortCode,
    onBlock: Boolean(row.onBlock),
    queuePos: row.queuePos == null ? null : Number(row.queuePos),
  };
}

const filtersSchema = z.object({
  sport: z.string().nullish(),
  kind: z.string().nullish(),
  q: z.string().nullish(),
  featured: z.boolean().nullish(),
  dropSlug: z.string().nullish(),
  inStock: z.boolean().nullish(),
  sort: z.enum(["newest", "price-asc", "price-desc"]).nullish(),
  limit: z.number().nullish(),
});

export const listProducts = createServerFn({ method: "GET" })
  .validator(filtersSchema)
  .handler(async ({ data }): Promise<Product[]> => {
    const { getSql } = await import("./db");
    const sql = await getSql();
    const filters: ListFilters = {
      sport: data.sport ?? undefined,
      kind: data.kind ?? undefined,
      q: data.q ?? undefined,
      featured: data.featured ?? undefined,
      dropSlug: data.dropSlug ?? undefined,
      inStock: data.inStock ?? undefined,
      sort: data.sort ?? undefined,
      limit: data.limit ?? undefined,
    };
    const clauses: string[] = [];
    const params: unknown[] = [];
    let i = 1;

    if (filters.sport) {
      clauses.push(`p.sport = $${i++}`);
      params.push(filters.sport);
    }
    if (filters.kind) {
      clauses.push(`p.kind = $${i++}`);
      params.push(filters.kind);
    }
    if (filters.dropSlug) {
      clauses.push(`d.slug = $${i++}`);
      params.push(filters.dropSlug);
    }
    if (filters.featured) clauses.push(`p.featured = true`);
    if (filters.inStock) clauses.push(`p.qty > 0`);
    if (filters.q?.trim()) {
      clauses.push(
        `(p.title ilike $${i} or coalesce(p.player, '') ilike $${i} or coalesce(p.set_name, '') ilike $${i})`,
      );
      params.push(`%${filters.q.trim()}%`);
      i += 1;
    }

    const where = clauses.length ? `where ${clauses.join(" and ")}` : "";
    let order = "p.featured desc, p.id desc";
    if (filters.sort === "price-asc") order = "p.price_cents asc, p.id desc";
    if (filters.sort === "price-desc") order = "p.price_cents desc, p.id desc";
    const limit = typeof filters.limit === "number" ? Math.min(Math.max(filters.limit, 1), 80) : null;

    const rows = await sql.query<ProductRow>(
      `select ${productSelect}
       from products p
       left join drops d on d.id = p.drop_id
       ${where}
       order by ${order}
       ${limit ? `limit ${limit}` : ""}`,
      params,
    );
    return rows.map(mapProduct);
  });

export const getProduct = createServerFn({ method: "GET" })
  .validator(z.object({ slug: z.string() }))
  .handler(async ({ data }): Promise<Product | null> => {
    const { getSql } = await import("./db");
    const sql = await getSql();
    const rows = await sql.query<ProductRow>(
      `select ${productSelect}
       from products p
       left join drops d on d.id = p.drop_id
       where (p.slug = $1 or lower(coalesce(p.short_code, '')) = lower($1))
       limit 1`,
      [data.slug],
    );
    return rows[0] ? mapProduct(rows[0]) : null;
  });

type DropRow = {
  id: number;
  slug: string;
  title: string;
  subtitle: string | null;
  kind: string;
  status: string;
  imageKey: string;
  blurb: string | null;
  productCount: number;
};

function mapDrop(row: DropRow): Drop {
  return { ...row, id: Number(row.id), productCount: Number(row.productCount) };
}

export const listDrops = createServerFn({ method: "GET" }).handler(async (): Promise<Drop[]> => {
  const { getSql } = await import("./db");
  const sql = await getSql();
  const rows = await sql.query<DropRow>(
    `select
       d.id, d.slug, d.title, d.subtitle, d.kind, d.status,
       d.image_key as "imageKey", d.blurb,
       (select count(*)::int from products p where p.drop_id = d.id) as "productCount"
     from drops d
     order by d.id asc`,
  );
  return rows.map(mapDrop);
});

export const getDrop = createServerFn({ method: "GET" })
  .validator(z.object({ slug: z.string() }))
  .handler(async ({ data }): Promise<{ drop: Drop; products: Product[] } | null> => {
    const { getSql } = await import("./db");
    const sql = await getSql();
    const drops = await sql.query<DropRow>(
      `select
         d.id, d.slug, d.title, d.subtitle, d.kind, d.status,
         d.image_key as "imageKey", d.blurb,
         (select count(*)::int from products p where p.drop_id = d.id) as "productCount"
       from drops d
       where d.slug = $1
       limit 1`,
      [data.slug],
    );
    if (!drops[0]) return null;
    const products = await sql.query<ProductRow>(
      `select ${productSelect}
       from products p
       left join drops d on d.id = p.drop_id
       where d.slug = $1
       order by case when p.qty = 0 then 1 else 0 end, p.price_cents desc, p.id desc`,
      [data.slug],
    );
    return { drop: mapDrop(drops[0]), products: products.map(mapProduct) };
  });

const imageUrlSchema = z
  .string()
  .max(280000)
  .refine((value) => value.startsWith("https://") || value.startsWith("data:image/"), "Photo must be a URL or an uploaded image.");

export const createListing = createServerFn({ method: "POST" })
  .validator(
    z.object({
      title: z.string().min(3).max(120),
      player: z.string().max(80).optional(),
      setName: z.string().max(80).optional(),
      year: z.number().int().min(1950).max(2030).optional(),
      sport: z.enum(["basketball", "wnba", "football", "baseball", "nonsport"]),
      kind: z.enum(["single", "slab", "auto", "relic", "break-spot"]),
      parallel: z.string().max(40).optional(),
      serialNum: z.string().max(20).optional(),
      grade: z.string().max(20).optional(),
      priceCents: z.number().int().min(100).max(10000000),
      qty: z.number().int().min(1).max(99),
      description: z.string().max(800).optional(),
      featured: z.boolean().optional(),
      imageUrl: imageUrlSchema.optional(),
      imageUrlBack: imageUrlSchema.optional(),
      imageDepiction: z.boolean().optional(),
    }),
  )
  .middleware([authMiddleware])
  .handler(async ({ data, context }): Promise<{ slug: string; shortCode: string }> => {
    await requireOwner(context.userId);
    const { getSql } = await import("./db");
    const sql = await getSql();
    const sport = resolveSport(data.sport, data.title, data.player, data.setName, data.parallel);
    let slug = slugify(data.title);
    const existing = await sql.query<{ slug: string }>(`select slug from products where slug = $1`, [slug]);
    if (existing[0]) slug = `${slug}-${Math.random().toString(36).slice(2, 6)}`;
    let shortCode = makeShortCode(data.player, data.title);
    const taken = await sql.query<{ short_code: string }>(
      `select short_code from products where lower(short_code) = lower($1)`,
      [shortCode],
    );
    if (taken[0]) shortCode = `${shortCode}${Math.random().toString(36).slice(2, 4).toUpperCase()}`.slice(0, 10);
    await sql.query(
      `insert into products (
         slug, title, player, set_name, year, sport, kind, parallel, serial_num, grade,
         price_cents, qty, description, image_key, image_url, image_url_back, image_depiction, featured, short_code
       ) values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,'face',$14,$15,$16,$17,$18)`,
      [
        slug,
        data.title.trim(),
        data.player?.trim() || null,
        data.setName?.trim() || null,
        data.year ?? null,
        sport,
        data.kind,
        data.parallel?.trim() || null,
        data.serialNum?.trim() || null,
        data.grade?.trim() || null,
        data.priceCents,
        data.qty,
        data.description?.trim() || null,
        data.imageUrl?.trim() || null,
        data.imageUrlBack?.trim() || null,
        Boolean(data.imageDepiction),
        Boolean(data.featured),
        shortCode,
      ],
    );
    return { slug, shortCode };
  });

function makeShortCode(player: string | undefined, title: string) {
  const source = player?.trim() || title;
  const last = source.split(/\s+/).filter(Boolean).at(-1) ?? source;
  const code = last.replace(/[^a-zA-Z0-9]/g, "").slice(0, 8).toUpperCase();
  return code || "CARD";
}

function orderCode() {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "PNW-";
  for (let i = 0; i < 6; i += 1) code += alphabet[Math.floor(Math.random() * alphabet.length)];
  return code;
}

type OrderRow = {
  code: string;
  itemsJson: string;
  totalCents: number;
  status: string;
  createdAt: string;
  paymentJson: string | null;
  stripeSessionId?: string | null;
};

function mapPayment(json: string | null | undefined): OrderPayment | null {
  if (!json) return null;
  try {
    const parsed = JSON.parse(json) as {
      provider?: string;
      brand?: string;
      last4?: string;
      mode?: string;
    };
    if (parsed.provider === "stripe" && parsed.brand && parsed.last4) {
      return {
        provider: "stripe",
        brand: parsed.brand,
        last4: parsed.last4,
        mode: parsed.mode === "live" ? "live" : "test",
      };
    }
    if (parsed.provider === "desk") return { provider: "desk" };
  } catch {
    /* ignore */
  }
  return null;
}

function mapOrder(row: OrderRow): Order {
  let items: OrderItem[] = [];
  try {
    items = JSON.parse(row.itemsJson) as OrderItem[];
  } catch {
    items = [];
  }
  return {
    code: row.code,
    items,
    totalCents: Number(row.totalCents),
    status: row.status,
    createdAt: String(row.createdAt),
    payment: mapPayment(row.paymentJson),
  };
}

async function orderByStripeSession(sql: Sql, sessionId: string): Promise<Order | null> {
  const rows = await sql.query<OrderRow>(
    `select code, items_json as "itemsJson", total_cents as "totalCents", status, created_at as "createdAt",
            payment_json as "paymentJson"
     from orders where stripe_session_id = $1 limit 1`,
    [sessionId],
  );
  return rows[0] ? mapOrder(rows[0]) : null;
}

export const placeOrder = createServerFn({ method: "POST" })
  .validator(
    z.object({
      items: z
        .array(z.object({ productId: z.number().int(), qty: z.number().int().min(1).max(99) }))
        .min(1)
        .max(40),
      payment: z
        .object({
          token: z.string().min(3).max(80).optional(),
          stripeSessionId: z.string().min(3).max(200).optional(),
        })
        .optional(),
    }),
  )
  .handler(async ({ data }): Promise<Order> => {
    const { getSql } = await import("./db");
    const { paymentMode } = await import("./stripe-checkout.server");
    const { paidStripeItems } = await import("./stripe-checkout.server");
    const sql = await getSql();
    const sessionId = data.payment?.stripeSessionId ?? null;

    if (sessionId) {
      const existing = await orderByStripeSession(sql, sessionId);
      if (existing) return existing;
    }

    let payment: OrderPayment = { provider: "desk" };
    let status = "placed";
    let items = data.items;
    if (sessionId) {
      const paid = await paidStripeItems(sessionId);
      if (!paid) throw new Error("Stripe payment was not completed.");
      payment = { provider: "stripe", brand: paid.brand, last4: paid.last4, mode: "live" };
      status = "paid";
      items = paid.items;
    } else if (data.payment?.token) {
      if (paymentMode() !== "preview-test") {
        throw new Error("Live checkout uses Stripe. Test cards are preview-only.");
      }
      const charged = chargeTestToken(data.payment.token);
      payment = { provider: "stripe", brand: charged.brand, last4: charged.last4, mode: "test" };
      status = "paid";
    } else {
      throw new Error("Payment is required.");
    }
    const snapshot: OrderItem[] = [];
    let total = 0;
    const reserved: { id: number; qty: number }[] = [];
    let code = orderCode();

    try {
      for (const item of items) {
        const rows = await sql.query<{
          id: number;
          slug: string;
          title: string;
          priceCents: number;
          imageKey: string;
          imageUrl: string | null;
          qty: number;
        }>(
          `update products
           set qty = qty - $1
           where id = $2 and qty >= $1
           returning id, slug, title, price_cents as "priceCents", image_key as "imageKey",
                     image_url as "imageUrl", qty`,
          [item.qty, item.productId],
        );
        const row = rows[0];
        if (!row) {
          throw new Error("One of the listings sold while you were checking out. Refresh and try again.");
        }
        reserved.push({ id: Number(row.id), qty: item.qty });
        const price = Number(row.priceCents);
        snapshot.push({
          productId: Number(row.id),
          slug: row.slug,
          title: row.title,
          qty: item.qty,
          priceCents: price,
          imageKey: row.imageKey,
          imageUrl: row.imageUrl || null,
        });
        total += price * item.qty;
      }

      for (let attempt = 0; attempt < 5; attempt += 1) {
        const clash = await sql.query<{ code: string }>(`select code from orders where code = $1`, [code]);
        if (!clash[0]) break;
        code = orderCode();
      }

      await sql.query(
        `insert into orders (code, items_json, total_cents, status, payment_json, stripe_session_id) values ($1, $2, $3, $4, $5, $6)`,
        [code, JSON.stringify(snapshot), total, status, JSON.stringify(payment), sessionId],
      );
    } catch (err) {
      for (const item of reserved) {
        await sql.query(`update products set qty = qty + $1 where id = $2`, [item.qty, item.id]);
      }
      if (sessionId) {
        const existing = await orderByStripeSession(sql, sessionId);
        if (existing) return existing;
      }
      throw err;
    }

    return {
      code,
      items: snapshot,
      totalCents: total,
      status,
      createdAt: new Date().toISOString(),
      payment,
    };
  });

export const getOrder = createServerFn({ method: "GET" })
  .validator(z.object({ code: z.string() }))
  .handler(async ({ data }): Promise<Order | null> => {
    const { getSql } = await import("./db");
    const sql = await getSql();
    const rows = await sql.query<OrderRow>(
      `select code, items_json as "itemsJson", total_cents as "totalCents", status, created_at as "createdAt",
              payment_json as "paymentJson"
       from orders where code = $1 limit 1`,
      [data.code.toUpperCase()],
    );
    return rows[0] ? mapOrder(rows[0]) : null;
  });

export type Inventory = {
  products: Product[];
  orders: Order[];
};

export const getInventory = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }): Promise<Inventory> => {
    await requireOwner(context.userId);
    const { getSql } = await import("./db");
  const sql = await getSql();
  const productRows = await sql.query<ProductRow>(
    `select ${productSelect}
     from products p
     left join drops d on d.id = p.drop_id
     order by p.id desc`,
  );
  const orderRows = await sql.query<OrderRow>(
    `select code, items_json as "itemsJson", total_cents as "totalCents", status, created_at as "createdAt",
            payment_json as "paymentJson"
     from orders order by created_at desc limit 24`,
  );
  return { products: productRows.map(mapProduct), orders: orderRows.map(mapOrder) };
});

export const setListingQty = createServerFn({ method: "POST" })
  .validator(z.object({ productId: z.number().int(), qty: z.number().int().min(0).max(99) }))
  .middleware([authMiddleware])
  .handler(async ({ data, context }): Promise<{ ok: true }> => {
    await requireOwner(context.userId);
    const { getSql } = await import("./db");
    const sql = await getSql();
    const rows = await sql.query<{ id: number }>(`update products set qty = $1 where id = $2 returning id`, [
      data.qty,
      data.productId,
    ]);
    if (!rows[0]) throw new Error("Listing not found.");
    return { ok: true };
  });
