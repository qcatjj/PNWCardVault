/**
 * Public /img URLs for listing photos stored as base64 data URLs.
 *
 * The hash is a short md5 of the length plus the first and last 48 characters.
 * Postgres computes that in the SELECT (see publicImageSql) so catalog queries
 * never ship the blob. The /img route hashes the same way, and still accepts
 * the older full-string hash so existing links keep their long cache.
 */

export const IMAGE_HASH_EDGE = 48;
export const IMAGE_HASH_CHARS = 12;

const IDENT = /^[a-z_][a-z0-9_]*(\.[a-z_][a-z0-9_]*)?$/i;

function sqlIdent(value: string): string {
  if (!IDENT.test(value)) throw new Error("Invalid SQL identifier.");
  return value;
}

/** SQL text expression. `column` is read in the database and is not returned. */
export function publicImageSql(column: string, side: "front" | "back", idExpr = "p.id"): string {
  const col = sqlIdent(column);
  const id = sqlIdent(idExpr);
  if (side !== "front" && side !== "back") throw new Error("Invalid image side.");
  return `case
    when ${col} is null or ${col} = '' then null
    when left(${col}, 11) = 'data:image/' then
      '/img/' || (${id})::text || '/${side}-' ||
      substr(md5(length(${col})::text || ':' || left(${col}, ${IMAGE_HASH_EDGE}) || ':' || right(${col}, ${IMAGE_HASH_EDGE})), 1, ${IMAGE_HASH_CHARS})
      || '.webp'
    else ${col}
  end`;
}

export function isPublicImagePath(url: string): boolean {
  const path = url.split("?")[0] ?? url;
  return /^\/img\/\d+\/(front|back)-[a-z0-9]+\.webp$/i.test(path);
}

/** A photo the desk actually uploaded. Public /img paths must not be written back over the blob. */
export function storedFrontImage(url: string | null | undefined): string | null {
  if (!url) return null;
  const trimmed = url.trim();
  if (!trimmed || isPublicImagePath(trimmed)) return null;
  return trimmed;
}

export type BackWrite =
  | { mode: "keep" }
  | { mode: "clear" }
  | { mode: "set"; url: string };

export function storedBackImage(url: string | null | undefined): BackWrite {
  if (url === undefined) return { mode: "keep" };
  if (url === null) return { mode: "clear" };
  const trimmed = url.trim();
  if (!trimmed) return { mode: "clear" };
  if (isPublicImagePath(trimmed)) return { mode: "keep" };
  return { mode: "set", url: trimmed };
}

/** Fields safe to send with a listing edit. Omitted photos keep the stored blob. */
export function listingPhotoPatch(
  front: string | null,
  back: string | null,
): { imageUrl?: string; imageUrlBack?: string | null } {
  const patch: { imageUrl?: string; imageUrlBack?: string | null } = {};
  const nextFront = storedFrontImage(front);
  if (nextFront) patch.imageUrl = nextFront;
  const backWrite = storedBackImage(back);
  if (backWrite.mode === "clear") patch.imageUrlBack = null;
  if (backWrite.mode === "set") patch.imageUrlBack = backWrite.url;
  return patch;
}
