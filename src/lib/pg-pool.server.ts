import { Pool } from "pg";
import { postgresPoolConfig } from "./env.server";

const globalRef = globalThis as typeof globalThis & {
  __hubPgPool__?: Pool;
};

/** One Pool per process — Vercel + Supabase session mode only allows ~15 clients. */
export function getSharedPgPool(connectionString: string): Pool {
  globalRef.__hubPgPool__ ??= new Pool(postgresPoolConfig(connectionString));
  return globalRef.__hubPgPool__;
}
