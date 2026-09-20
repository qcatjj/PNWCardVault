import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { authMiddleware } from "@/lib/auth/middleware";
import { requireOwner } from "@/lib/desk-owner";

export const SHOP_EMAIL = "pnwcardhub@gmail.com";

export type ShopReview = {
  id: number;
  name: string;
  rating: number;
  body: string;
  createdAt: string;
};

export type ShopMessage = {
  id: number;
  name: string;
  email: string;
  body: string;
  createdAt: string;
};

const nameSchema = z.string().trim().max(40);
const bodySchema = z.string().trim().min(10).max(800);
const trapSchema = z.string().max(80).optional();

function displayName(name: string) {
  const trimmed = name.trim();
  return trimmed || "Collector";
}

function mapTime(value: string | Date) {
  return value instanceof Date ? value.toISOString() : String(value);
}

function mapReview(row: { id: number; name: string; rating: number; body: string; createdAt: string | Date }): ShopReview {
  return { ...row, rating: Number(row.rating), createdAt: mapTime(row.createdAt) };
}

export const listReviews = createServerFn({ method: "GET" }).handler(async (): Promise<ShopReview[]> => {
  const { getSql } = await import("./db");
  const sql = await getSql();
  const rows = await sql.query<{ id: number; name: string; rating: number; body: string; createdAt: string | Date }>(
    `select id, name, rating, body, created_at as "createdAt"
     from shop_reviews
     where hidden = false
     order by created_at desc
     limit 40`,
  );
  return rows.map(mapReview);
});

export const postReview = createServerFn({ method: "POST" })
  .validator(
    z.object({
      name: nameSchema.optional(),
      rating: z.number().int().min(1).max(5),
      body: bodySchema,
      company: trapSchema,
    }),
  )
  .handler(async ({ data }): Promise<ShopReview> => {
    if (data.company?.trim()) {
      return { id: 0, name: "Collector", rating: data.rating, body: data.body, createdAt: new Date().toISOString() };
    }
    const { getSql } = await import("./db");
    const sql = await getSql();
    const rows = await sql.query<{ id: number; name: string; rating: number; body: string; createdAt: string | Date }>(
      `insert into shop_reviews (name, rating, body)
       values ($1, $2, $3)
       returning id, name, rating, body, created_at as "createdAt"`,
      [displayName(data.name ?? ""), data.rating, data.body],
    );
    const row = rows[0];
    if (!row) throw new Error("Could not save that review.");
    return mapReview(row);
  });

export const postQuestion = createServerFn({ method: "POST" })
  .validator(
    z.object({
      name: nameSchema.optional(),
      email: z.string().trim().email().max(120),
      body: z.string().trim().min(10).max(2000),
      company: trapSchema,
    }),
  )
  .handler(async ({ data }): Promise<{ ok: true }> => {
    if (data.company?.trim()) return { ok: true };
    const { getSql } = await import("./db");
    const sql = await getSql();
    await sql.query(`insert into shop_messages (name, email, body) values ($1, $2, $3)`, [
      displayName(data.name ?? ""),
      data.email.trim().toLowerCase(),
      data.body,
    ]);
    return { ok: true };
  });

export const listInbox = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }): Promise<{ messages: ShopMessage[]; reviews: ShopReview[] }> => {
    await requireOwner(context.userId);
    const { getSql } = await import("./db");
    const sql = await getSql();
    const [messages, reviews] = await Promise.all([
      sql.query<{ id: number; name: string; email: string; body: string; createdAt: string | Date }>(
        `select id, name, email, body, created_at as "createdAt"
         from shop_messages
         order by created_at desc
         limit 80`,
      ),
      sql.query<{ id: number; name: string; rating: number; body: string; createdAt: string | Date }>(
        `select id, name, rating, body, created_at as "createdAt"
         from shop_reviews
         where hidden = false
         order by created_at desc
         limit 80`,
      ),
    ]);
    return {
      messages: messages.map((row) => ({ ...row, createdAt: mapTime(row.createdAt) })),
      reviews: reviews.map(mapReview),
    };
  });

export const hideReview = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(z.object({ id: z.number().int().positive() }))
  .handler(async ({ data, context }): Promise<{ ok: true }> => {
    await requireOwner(context.userId);
    const { getSql } = await import("./db");
    const sql = await getSql();
    await sql.query(`update shop_reviews set hidden = true where id = $1`, [data.id]);
    return { ok: true };
  });
