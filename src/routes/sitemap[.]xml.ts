import { createFileRoute } from "@tanstack/react-router";

const ORIGIN = "https://pnwcardhub.app";
const STATIC = ["/", "/shop", "/drops", "/scores", "/contact"];

function esc(value: string) {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

async function sitemap() {
  const { getSql } = await import("@/lib/db");
  const sql = await getSql();
  const rows = await sql.query<{ slug: string }>(`select slug from products order by id desc`);
  const drops = await sql
    .query<{ slug: string }>(`select slug from drops order by id desc`)
    .catch(() => []);
  const urls = [
    ...STATIC,
    ...rows.map((r) => `/c/${encodeURIComponent(r.slug)}`),
    ...drops.map((d) => `/drop/${encodeURIComponent(d.slug)}`),
  ];
  const body = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map((u) => `  <url><loc>${esc(ORIGIN + u)}</loc></url>`).join("\n")}
</urlset>
`;
  return new Response(body, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, max-age=3600",
    },
  });
}

export const Route = createFileRoute("/sitemap.xml")({
  server: { handlers: { GET: () => sitemap() } },
});
