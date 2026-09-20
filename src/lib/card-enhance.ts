import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { authMiddleware } from "@/lib/auth/middleware";
import { requireOwner } from "@/lib/desk-owner";

export const DEPICTION_NOTE =
  "This is a depiction of the card. The listing photo was AI-enhanced for shop quality. You receive the physical card described, in the condition noted.";

const MODELS = ["grok-imagine-image-2.0", "grok-imagine-image", "grok-imagine-image-quality"] as const;

function enhancePrompt(side: "front" | "back", title?: string) {
  const face = side === "back" ? "back" : "front";
  const named = title?.trim() ? ` The card is: ${title.trim()}.` : "";
  return [
    `This photo is the ${face} of a real sports trading card.${named}`,
    "Make a premium online-shop product photo of THIS SAME card, in the style of a high-end singles shop scan: card squared to the camera, filling the frame, sharp focus, even catalog lighting that shows foil, texture, and print, thin soft shadow, dark charcoal seamless background, a little margin around the edges.",
    "Keep the exact card. Same player, set, year, number, parallel, logos, colors, wear, and every line of text. Do not redesign it, do not invent a different card, do not add holofoil that is not already there.",
    "Crop out hands, tables, and clutter. Portrait trading-card crop. This is a depiction of the card for the listing, not a replacement of the physical card.",
  ].join(" ");
}

function apiError(body: Record<string, unknown>, status: number) {
  const err = body.error;
  if (err && typeof err === "object" && "message" in err && typeof (err as { message: unknown }).message === "string") {
    return (err as { message: string }).message;
  }
  if (typeof body.error === "string") return body.error;
  return `Enhance failed (${status}). Try the raw photo.`;
}

function resultUrl(body: Record<string, unknown>): string | null {
  if (typeof body.url === "string" && body.url.startsWith("https://")) return body.url;
  const data = body.data;
  if (Array.isArray(data) && data[0] && typeof data[0] === "object") {
    const first = data[0] as { url?: unknown; b64_json?: unknown };
    if (typeof first.url === "string" && first.url.startsWith("https://")) return first.url;
    if (typeof first.b64_json === "string" && first.b64_json.length > 20) {
      return `data:image/png;base64,${first.b64_json}`;
    }
  }
  return null;
}

async function persistImage(url: string): Promise<string | null> {
  if (url.startsWith("data:image/")) return url.length <= 280000 ? url : null;
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(20000) });
    if (!res.ok) return url;
    const buf = Buffer.from(await res.arrayBuffer());
    if (buf.byteLength === 0) return url;
    if (buf.byteLength > 220000) return url;
    const mime = (res.headers.get("content-type") || "image/jpeg").split(";")[0].trim();
    if (!mime.startsWith("image/")) return url;
    const data = `data:${mime};base64,${buf.toString("base64")}`;
    return data.length <= 280000 ? data : url;
  } catch {
    return url;
  }
}

async function requestEdit(apiKey: string, model: string, prompt: string, image: string) {
  const res = await fetch("https://api.x.ai/v1/images/edits", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    signal: AbortSignal.timeout(120000),
    body: JSON.stringify({
      model,
      prompt,
      image: { url: image, type: "image_url" },
      resolution: "1k",
    }),
  });
  const text = await res.text();
  let body: Record<string, unknown> = {};
  try {
    body = JSON.parse(text) as Record<string, unknown>;
  } catch {
    body = { raw: text.slice(0, 200) };
  }
  return { ok: res.ok, status: res.status, body };
}

export const enhanceListingPhoto = createServerFn({ method: "POST" })
  .validator(
    z.object({
      image: z.string().min(20).max(280000),
      side: z.enum(["front", "back"]).default("front"),
      title: z.string().max(120).optional(),
    }),
  )
  .middleware([authMiddleware])
  .handler(
    async ({
      data,
      context,
    }): Promise<{ ok: true; url: string } | { ok: false; error: string }> => {
      await requireOwner(context.userId);
      const apiKey = process.env.XAI_API_KEY;
      if (!apiKey) {
        return {
          ok: false,
          error: "Photo enhance needs an xAI API key on Vercel (XAI_API_KEY).",
        };
      }

      const prompt = enhancePrompt(data.side, data.title);
      let lastError = "Could not enhance that photo.";

      for (const model of MODELS) {
        try {
          const result = await requestEdit(apiKey, model, prompt, data.image);
          if (!result.ok) {
            lastError = apiError(result.body, result.status);
            if (
              result.status === 400 ||
              result.status === 403 ||
              result.status === 404 ||
              result.status === 422
            ) {
              continue;
            }
            return { ok: false, error: lastError };
          }
          const url = resultUrl(result.body);
          if (!url) {
            lastError = "Enhance did not return a photo.";
            continue;
          }
          const stored = await persistImage(url);
          if (!stored) {
            lastError = "Enhanced photo was too large to save. Use the raw photo.";
            continue;
          }
          return { ok: true, url: stored };
        } catch (err) {
          lastError = err instanceof Error ? err.message : "Enhance timed out.";
        }
      }

      return { ok: false, error: lastError };
    },
  );
