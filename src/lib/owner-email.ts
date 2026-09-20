/** Only this inbox can open the owner desk. Shop stays public. */
export const OWNER_EMAIL = "coachingcenterapp2026@gmail.com";

export function normalizeEmail(email: string | null | undefined) {
  return (email ?? "").trim().toLowerCase();
}

export function isOwnerEmail(email: string | null | undefined) {
  return normalizeEmail(email) === OWNER_EMAIL;
}
