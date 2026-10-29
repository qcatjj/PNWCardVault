import { createHash } from "node:crypto";
import { hashString } from "./listing-facts.ts";
import { IMAGE_HASH_CHARS, IMAGE_HASH_EDGE } from "./listing-image.ts";

/** Same material as publicImageSql: length, first edge, last edge. */
export function lightImageHash(value: string): string {
  const material = `${value.length}:${value.slice(0, IMAGE_HASH_EDGE)}:${value.slice(-IMAGE_HASH_EDGE)}`;
  return createHash("md5").update(material).digest("hex").slice(0, IMAGE_HASH_CHARS);
}

/** Current light hash, or the older full-string hash still used by links already in the wild. */
export function imageCacheTokenMatches(dataUrl: string, token: string): boolean {
  return hashString(dataUrl) === token || lightImageHash(dataUrl) === token;
}
