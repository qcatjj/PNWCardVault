/** Shared catalog freshness window for the home page and /shop. */
export const CATALOG_CACHE_MS = 120_000;

/**
 * Anonymous catalog HTML. Cart and sign-in state live in the browser, and
 * checkout still refuses a sale when qty has already hit zero.
 */
export const CATALOG_CACHE_CONTROL = "public, max-age=120";
