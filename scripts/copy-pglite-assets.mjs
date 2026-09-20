#!/usr/bin/env node
import { copyFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";

const destDir = join(process.cwd(), ".vercel/output/functions/__server.func/_libs");
mkdirSync(destDir, { recursive: true });
const src = join(process.cwd(), "node_modules/@electric-sql/pglite/dist");
for (const name of ["pglite.wasm", "pglite.data", "initdb.wasm"]) {
  copyFileSync(join(src, name), join(destDir, name));
}
