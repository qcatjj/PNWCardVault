import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { authMiddleware } from "@/lib/auth/middleware";
import { inferSport, type SportId } from "@/lib/catalog-types";
import { requireOwner } from "@/lib/desk-owner";

export type CardIdentity = {
  title: string;
  player: string;
  setName: string;
  year: number | null;
  sport: SportId;
  parallel: string | null;
  serialNum: string | null;
  cardNumber: string | null;
  grade: string | null;
};

const sports: SportId[] = ["basketball", "wnba", "football", "baseball", "nonsport"];

function asSport(value: unknown, ...hints: Array<string | null | undefined>): SportId {
  const lower = String(value ?? "").toLowerCase().trim();
  if (lower === "nba" || lower === "ncaab" || lower === "hoops") return "basketball";
  if (lower === "nfl" || lower === "ncaaf") return "football";
  if (lower === "mlb") return "baseball";
  if (sports.includes(lower as SportId)) return lower as SportId;
  return inferSport(lower, ...hints) ?? "basketball";
}

function clean(value: unknown, max: number) {
  const text = String(value ?? "")
    .replace(/\s+/g, " ")
    .trim();
  return text.slice(0, max);
}

function parseIdentity(raw: string): CardIdentity | null {
  const jsonMatch = raw.match(/\{[\s\S]*\}/);
  if (!jsonMatch) return null;
  try {
    const data = JSON.parse(jsonMatch[0]) as Record<string, unknown>;
    const player = clean(data.player, 80);
    const setName = clean(data.setName, 80);
    const yearNum = Number(data.year);
    const year = Number.isFinite(yearNum) && yearNum >= 1950 && yearNum <= 2030 ? yearNum : null;
    const parallel = clean(data.parallel, 40) || null;
    const serialNum = clean(data.serialNum, 20) || null;
    const cardNumber = clean(data.cardNumber, 20) || null;
    const title =
      clean(data.title, 120) ||
      [year, setName, player, parallel, cardNumber ? `#${cardNumber}` : ""]
        .filter(Boolean)
        .join(" ")
        .slice(0, 120);
    if (title.length < 3 && player.length < 3) return null;
    const sport = inferSport(String(data.sport ?? ""), title, player, setName, parallel) ?? asSport(data.sport, title, player, setName);
    return {
      title: title || player,
      player,
      setName,
      year,
      sport,
      parallel,
      serialNum,
      cardNumber,
      grade: clean(data.grade, 20) || null,
    };
  } catch {
    return null;
  }
}

function outputText(body: Record<string, unknown>): string {
  if (typeof body.output_text === "string") return body.output_text;
  const output = body.output;
  if (Array.isArray(output)) {
    const chunks: string[] = [];
    for (const item of output) {
      if (!item || typeof item !== "object") continue;
      const content = (item as { content?: unknown }).content;
      if (!Array.isArray(content)) continue;
      for (const part of content) {
        if (!part || typeof part !== "object") continue;
        const text = (part as { text?: unknown }).text;
        if (typeof text === "string") chunks.push(text);
      }
    }
    if (chunks.length) return chunks.join("\n");
  }
  const choices = body.choices;
  if (Array.isArray(choices)) {
    const msg = choices[0] as { message?: { content?: unknown } } | undefined;
    const content = msg?.message?.content;
    if (typeof content === "string") return content;
  }
  return "";
}

const prompt = [
  "Read the sports or trading card in this photo.",
  "Return JSON only, no markdown:",
  '{"title":"listing title","player":"name","setName":"Topps Chrome","year":2025,"sport":"basketball","parallel":"Refractor","serialNum":"/99","cardNumber":"251","grade":"Raw"}',
  "sport must be basketball, wnba, football, baseball, or nonsport.",
  "Use logos and league marks: NBA or NCAA hoops = basketball, WNBA = wnba, NFL or NCAA football = football, MLB = baseball.",
  "Marvel, Deadpool, Garbage Pail Kids, Pokemon, Disney, Magic = nonsport.",
  "Do not default to basketball if the card is football, baseball, WNBA, or non-sport.",
  "Empty string or null for anything you cannot read. year must be a number or null.",
].join(" ");

async function callXai(image: string): Promise<string> {
  const apiKey = process.env.XAI_API_KEY;
  if (!apiKey) throw new Error("Card reader is unavailable.");

  const res = await fetch("https://api.x.ai/v1/responses", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "grok-4.5",
      max_output_tokens: 400,
      input: [
        {
          role: "user",
          content: [
            { type: "input_image", image_url: image, detail: "low" },
            { type: "input_text", text: prompt },
          ],
        },
      ],
    }),
  });

  if (res.ok) {
    const body = (await res.json()) as Record<string, unknown>;
    return outputText(body);
  }

  const fallback = await fetch("https://api.x.ai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "grok-4.5",
      max_tokens: 400,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: prompt },
            { type: "image_url", image_url: { url: image } },
          ],
        },
      ],
    }),
  });
  if (!fallback.ok) {
    throw new Error("Could not read that card.");
  }
  const body = (await fallback.json()) as Record<string, unknown>;
  return outputText(body);
}

export const readCardFromPhoto = createServerFn({ method: "POST" })
  .validator(z.object({ image: z.string().min(32).max(280000) }))
  .middleware([authMiddleware])
  .handler(async ({ data, context }): Promise<{ ok: true; identity: CardIdentity } | { ok: false; error: string }> => {
    await requireOwner(context.userId);
    if (!data.image.startsWith("data:image/")) {
      return { ok: false, error: "Need a photo from your camera." };
    }
    try {
      const raw = await callXai(data.image);
      const identity = parseIdentity(raw);
      if (!identity) return { ok: false, error: "Could not read the card. Type the name below." };
      return { ok: true, identity };
    } catch (err) {
      return { ok: false, error: err instanceof Error ? err.message : "Could not read that card." };
    }
  });
