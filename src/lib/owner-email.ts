/** Inboxes that can open the owner desk. Shop stays public. */
export const OWNER_EMAILS = [
  "coachingcenterapp2026@gmail.com",
  "qcstevejohns@gmail.com",
] as const;

export const OWNER_EMAIL = OWNER_EMAILS[0];

export function normalizeEmail(email: string | null | undefined) {
  return (email ?? "").trim().toLowerCase();
}

export function isOwnerEmail(email: string | null | undefined) {
  const normalized = normalizeEmail(email);
  return OWNER_EMAILS.some((owner) => owner === normalized);
}
