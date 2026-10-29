import { inferSport, type ListFilters } from "./catalog-types.ts";
import { kindWhereSql, sportWhereSql } from "./catalog-filter.ts";
import { publicImageSql } from "./listing-image.ts";

/**
 * Listing columns for every read except /img.
 * image_url and image_url_back stay in the database; only a short /img path
 * (or an already-short https URL) is selected.
 */
export const PRODUCT_COLUMNS = `
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
  ${publicImageSql("p.image_url", "front")} as "imageUrl",
  ${publicImageSql("p.image_url_back", "back")} as "imageUrlBack",
  p.image_depiction as "imageDepiction",
  p.featured,
  p.drop_id as "dropId",
  p.short_code as "shortCode",
  p.on_block as "onBlock",
  p.queue_pos as "queuePos",
  d.slug as "dropSlug",
  d.title as "dropTitle"
`;

function clampLimit(limit: number | null | undefined, max: number): number | null {
  if (typeof limit !== "number" || !Number.isFinite(limit)) return null;
  return Math.min(Math.max(Math.floor(limit), 1), max);
}

export function buildListQuery(filters: ListFilters): { text: string; params: unknown[] } {
  const clauses: string[] = [];
  const params: unknown[] = [];
  let i = 1;

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
  if (filters.sport) {
    clauses.push(sportWhereSql("p", `$${i++}`));
    params.push(inferSport(filters.sport) ?? filters.sport);
  }
  if (filters.kind) {
    clauses.push(kindWhereSql("p", `$${i++}`));
    params.push(filters.kind);
  }

  const where = clauses.length ? `where ${clauses.join(" and ")}` : "";
  let order = "p.featured desc, p.id desc";
  if (filters.sort === "price-asc") order = "p.price_cents asc, p.id desc";
  if (filters.sort === "price-desc") order = "p.price_cents desc, p.id desc";
  const limit = clampLimit(filters.limit, 80);
  const limitSql = limit ? `limit ${limit}` : "";

  return {
    text: `select ${PRODUCT_COLUMNS}
       from products p
       left join drops d on d.id = p.drop_id
       ${where}
       order by ${order}
       ${limitSql}`,
    params,
  };
}

export function buildRelatedQuery(input: {
  sport: string;
  excludeId: number;
  limit?: number;
}): { text: string; params: unknown[] } {
  const limit = clampLimit(input.limit ?? 4, 8) ?? 4;
  return {
    text: `select ${PRODUCT_COLUMNS}
       from products p
       left join drops d on d.id = p.drop_id
       where p.id <> $1 and ${sportWhereSql("p", "$2")}
       order by p.featured desc, p.id desc
       limit ${limit}`,
    params: [input.excludeId, inferSport(input.sport) ?? input.sport],
  };
}
