import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

export const checkDeskPin = createServerFn({ method: "POST" })
  .validator(z.object({ pin: z.string().min(4).max(8) }))
  .handler(async ({ data }) => {
    const { verifyDeskPin } = await import("./desk-secrets.server");
    if (!verifyDeskPin(data.pin)) throw new Error("Wrong PIN.");
    return { ok: true as const };
  });

export const checkDeskEmail = createServerFn({ method: "POST" })
  .validator(z.object({ email: z.string().email() }))
  .handler(async ({ data }) => {
    const { verifyDeskEmail } = await import("./desk-secrets.server");
    if (!verifyDeskEmail(data.email)) throw new Error("That login can’t open the desk.");
    return { ok: true as const };
  });
