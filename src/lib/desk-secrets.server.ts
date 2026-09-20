import { timingSafeEqual } from "node:crypto";
import { isOwnerEmail } from "./owner-email";

function pinBytes(value: string) {
  return Buffer.from(value.normalize("NFKC"), "utf8");
}

/** Server-only. Override on Vercel with DESK_PIN. Never import this from client files. */
export function verifyDeskPin(pin: string) {
  const expected = (process.env.DESK_PIN?.trim() || "5821").replace(/\s+/g, "");
  const got = pin.trim().replace(/\s+/g, "");
  const a = pinBytes(got);
  const b = pinBytes(expected);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

export function verifyDeskEmail(email: string) {
  return isOwnerEmail(email);
}
