import {
  AUTO_DETAIL_RE,
  NON_AUTO_DETAIL_RE,
  SPORT_HINTS,
  type SportId,
} from "./catalog-types.ts";

function sqlRegex(re: RegExp): string {
  const pattern = re.source.replace(/\\b/g, "\\y");
  if (pattern.includes("$re$")) throw new Error("Catalog regex cannot be dollar-quoted.");
  return `$re$${pattern}$re$`;
}

/** Same resolution order as inferSport(), as a SQL expression. `hay` is a SQL expression. */
function inferSportSql(hay: string): string {
  const hints = SPORT_HINTS.map(
    (row) => `when (${hay}) ~* ${sqlRegex(row.re)} then '${row.id}'`,
  ).join("\n      ");
  return `(
    case
      when btrim(${hay}) = '' then null
      when lower(btrim(${hay})) in ('nba', 'ncaab', 'hoops') then 'basketball'
      when lower(btrim(${hay})) in ('nfl', 'ncaaf') then 'football'
      when lower(btrim(${hay})) = 'mlb' then 'baseball'
      when lower(btrim(${hay})) in ('basketball', 'wnba', 'football', 'baseball', 'nonsport') then lower(btrim(${hay}))
      ${hints}
      else null
    end
  )`;
}

function textHay(alias: string, columns: string[]): string {
  const parts = columns
    .map((column) => `nullif(btrim(${alias}.${column}), '')`)
    .join(", ");
  return `concat_ws(' ', ${parts})`;
}

/** Resolved sport, matching listingSport() without reading image columns. */
export function resolvedSportSql(alias = "p"): string {
  const titleHay = textHay(alias, ["title", "player", "set_name", "parallel"]);
  const description = `coalesce(${alias}.description, '')`;
  const stored = `coalesce(${alias}.sport, '')`;
  return `coalesce(${inferSportSql(titleHay)}, ${inferSportSql(description)}, ${inferSportSql(stored)}, ${alias}.sport)`;
}

/** `param` is a placeholder such as `$2` bound to the requested sport id. */
export function sportWhereSql(alias: string, param: string): string {
  const resolved = resolvedSportSql(alias);
  return `(${resolved} = ${param} or (${param} = 'basketball' and ${resolved} = 'wnba'))`;
}

/** `param` is a placeholder bound to the requested kind. Mirrors matchesKind(). */
export function kindWhereSql(alias: string, param: string): string {
  const details = textHay(alias, ["title", "set_name", "parallel", "description"]);
  return `(
    case
      when ${param} = 'sealed' then ${alias}.kind in ('sealed', 'break-spot')
      when ${alias}.kind = ${param} then true
      when ${param} <> 'auto' or ${alias}.kind in ('sealed', 'break-spot') then false
      when (${details}) ~* ${sqlRegex(NON_AUTO_DETAIL_RE)} then false
      else (${details}) ~* ${sqlRegex(AUTO_DETAIL_RE)}
    end
  )`;
}

export type { SportId };
