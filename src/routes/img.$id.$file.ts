import { createFileRoute } from "@tanstack/react-router";
import { hashString } from "@/lib/listing-facts";

// Serves listing photos stored as data: URLs as cacheable, resized WebP files.
// /img/<id>/<front|back>-<hash>.webp?w=480|1000
async function handle(id: string, file: string, url: URL) {
  const m = /^(front|back)-([a-z0-9]+)\.webp$/.exec(file);
  const productId = Number(id);
  if (!m || !Number.isInteger(productId) || productId <= 0)
    return new Response("Not found", { status: 404 });
  const { getSql } = await import("@/lib/db");
  const sql = await getSql();
  const rows = await sql.query<{ front: string | null; back: string | null }>(
    `select image_url as front, image_url_back as back from products where id = $1`,
    [productId],
  );
  const dataUrl = m[1] === "back" ? rows[0]?.back : rows[0]?.front;
  const parsed = dataUrl ? /^data:(image\/[a-z+.-]+);base64,(.+)$/i.exec(dataUrl) : null;
  if (!dataUrl || !parsed) return new Response("Not found", { status: 404 });
  const current = hashString(dataUrl) === m[2];
  const cache = current ? "public, max-age=31536000, immutable" : "public, max-age=300";
  const input = Buffer.from(parsed[2]!, "base64");
  const width = url.searchParams.get("w") === "480" ? 480 : 1000;
  try {
    const sharp = (await import("sharp")).default;
    const out = await sharp(input)
      .rotate()
      .resize({ width, withoutEnlargement: true })
      .webp({ quality: 78 })
      .toBuffer();
    return new Response(new Uint8Array(out), {
      headers: { "Content-Type": "image/webp", "Cache-Control": cache },
    });
  } catch {
    // Fall back to the original bytes if the optimizer is unavailable.
    return new Response(new Uint8Array(input), {
      headers: { "Content-Type": parsed[1]!, "Cache-Control": cache },
    });
  }
}

export const Route = createFileRoute("/img/$id/$file")({
  server: {
    handlers: {
      GET: ({ params, request }) => handle(params.id, params.file, new URL(request.url)),
    },
  },
});
