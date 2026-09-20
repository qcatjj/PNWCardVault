import { createServerFn } from "@tanstack/react-start";
import { authMiddleware } from "@/lib/auth/middleware";
import { isOwnerEmail } from "@/lib/owner-email";

export type DeskContext = {
  claimed: boolean;
  isOwner: boolean;
};

async function emailForUser(userId: string) {
  const { getSql } = await import("./db");
  const sql = await getSql();
  const rows = await sql.query<{ email: string }>(`select email from "user" where id = $1`, [userId]);
  return rows[0]?.email ?? null;
}

async function bindOwner(userId: string) {
  const { getSql } = await import("./db");
  const sql = await getSql();
  await sql.query(
    `insert into shop_owner (id, user_id) values (1, $1)
     on conflict (id) do update set user_id = excluded.user_id`,
    [userId],
  );
}

export async function readDeskOwner(userId: string): Promise<DeskContext> {
  const email = await emailForUser(userId);
  const owner = isOwnerEmail(email);
  if (owner) await bindOwner(userId);
  const { getSql } = await import("./db");
  const sql = await getSql();
  const rows = await sql.query<{ user_id: string }>(`select user_id from shop_owner where id = 1`);
  return { claimed: Boolean(rows[0]?.user_id), isOwner: owner };
}

export async function requireOwner(userId: string) {
  if (import.meta.env.VITE_AUTH_ENABLED === "false") return;
  const email = await emailForUser(userId);
  if (!isOwnerEmail(email)) {
    throw new Error("This desk belongs to the shop owner.");
  }
  await bindOwner(userId);
}

export const getDeskContext = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }): Promise<DeskContext> => {
    return readDeskOwner(context.userId);
  });

export const claimDesk = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .handler(async ({ context }): Promise<DeskContext> => {
    return readDeskOwner(context.userId);
  });
