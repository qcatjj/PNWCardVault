import { Badge } from "@/components/ui/badge";
import type { Product } from "@/lib/catalog-types";
import { productName } from "@/lib/catalog-types";
import { gradeInfo, isAuto, isRookie, serialOf } from "@/lib/listing-facts";
import { cn } from "@/lib/utils";

type P = Pick<
  Product,
  | "title"
  | "player"
  | "kind"
  | "grade"
  | "serialNum"
  | "parallel"
  | "setName"
  | "description"
  | "year"
>;

export function ListingBadges({ product, className }: { product: P; className?: string }) {
  const grade = gradeInfo(product);
  const serial = serialOf(product);
  return (
    <div className={cn("flex flex-wrap items-center gap-1.5", className)}>
      <Badge tone={grade.graded ? "accent" : "muted"}>{grade.label}</Badge>
      {serial ? <Badge className="bg-accent/25 text-accent-foreground">{serial}</Badge> : null}
      {isRookie(product) ? <Badge className="bg-primary/15 text-primary">RC</Badge> : null}
      {isAuto(product) ? <Badge className="bg-accent/25 text-accent-foreground">Auto</Badge> : null}
    </div>
  );
}

/** Player in bold, the rest of the listing details smaller. Stored titles are unchanged. */
export function ListingTitle({
  product,
  as: Tag = "h3",
  size = "card",
}: {
  product: P;
  as?: "h1" | "h3";
  size?: "card" | "page";
}) {
  const name = productName(product);
  const details = [product.year, product.setName, product.parallel].filter(Boolean).join(" · ");
  const hasPlayer = Boolean(product.player);
  return (
    <div>
      <Tag
        className={cn(
          "font-sans normal-case tracking-normal text-card-foreground",
          size === "card"
            ? "line-clamp-2 text-[15px] font-bold leading-snug"
            : "text-3xl font-extrabold md:text-4xl",
        )}
      >
        {name}
      </Tag>
      {hasPlayer && details ? (
        <p
          className={cn(
            "text-muted-foreground",
            size === "card" ? "mt-0.5 line-clamp-1 text-xs" : "mt-2 text-base",
          )}
        >
          {details}
        </p>
      ) : null}
      {size === "page" ? (
        <p className="mt-1 text-xs text-muted-foreground/80">{product.title}</p>
      ) : null}
    </div>
  );
}
