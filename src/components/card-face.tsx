import { kindLabel, sportLabel, type Product } from "@/lib/catalog-types";
import { cn } from "@/lib/utils";

export function CardFace({
  product,
  className,
}: {
  product: Pick<Product, "player" | "title" | "sport" | "kind" | "year" | "parallel" | "serialNum" | "grade">;
  className?: string;
}) {
  const name = product.player || product.title;
  const initials = name
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");

  return (
    <div
      className={cn(
        "relative aspect-[2.5/3.5] overflow-hidden rounded-lg border border-border bg-muted",
        className,
      )}
    >
      <div className="absolute inset-[7%] rounded-md border border-primary/25 bg-background" />
      <div className="absolute inset-[12%] flex flex-col justify-between rounded-sm bg-card p-3">
        <div className="flex items-start justify-between gap-2">
          <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
            Vault
          </p>
          <p className="text-xs tabular-nums text-muted-foreground">{product.year ?? "—"}</p>
        </div>
        <div className="flex flex-1 items-center justify-center">
          <span className="font-display text-5xl tracking-tight text-primary/80">{initials || "PNW"}</span>
        </div>
        <div>
          <p className="font-display text-lg leading-tight text-foreground">{name}</p>
          <p className="mt-1 text-xs text-muted-foreground">
            {sportLabel(product.sport)} · {kindLabel(product.kind)}
            {product.serialNum ? ` · ${product.serialNum}` : ""}
          </p>
        </div>
      </div>
    </div>
  );
}
