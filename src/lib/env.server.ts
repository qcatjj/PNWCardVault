export function env(key: string): string | undefined {
  const v = process.env[key]?.trim();
  return v || undefined;
}

/**
 * Workspace preview vs deployed app. The deployer writes GROK_PROJECT_ID on
 * every publish; the sandbox preview never has it. Single source of truth for
 * the split — gate audience, gate endpoints and connector-token semantics all
 * key off this predicate.
 */
export function isWorkspacePreview(): boolean {
  return !env("GROK_PROJECT_ID");
}

/** Pool options for hosted Postgres (Supabase, Neon, etc.). SSL is required off-localhost. */
export function postgresPoolConfig(connectionString: string) {
  const local = /localhost|127\.0\.0\.1/i.test(connectionString);
  return {
    connectionString,
    ssl: local ? undefined : { rejectUnauthorized: false as const },
  };
}
