import { useState } from "react";
import { CardFace } from "@/components/card-face";
import { productImageSrc, type Product } from "@/lib/catalog-types";
import { cn } from "@/lib/utils";

export function ProductMedia({
  product,
  className,
  sizes = "(min-width: 768px) 360px, 50vw",
}: {
  product: Pick<
    Product,
    | "title"
    | "qty"
    | "imageKey"
    | "imageUrl"
    | "imageUrlBack"
    | "imageDepiction"
    | "player"
    | "sport"
    | "kind"
    | "year"
    | "parallel"
    | "serialNum"
    | "grade"
  >;
  className?: string;
  sizes?: string;
}) {
  const front = productImageSrc(product);
  const back = product.imageUrlBack || null;
  const [side, setSide] = useState<"front" | "back">("front");
  const src = side === "back" && back ? back : front;
  const sold = product.qty <= 0;

  return (
    <div className={cn("relative overflow-hidden hub-well", className)}>
      {src ? (
        <img src={src} alt={product.title} sizes={sizes} className="h-full w-full object-cover" />
      ) : (
        <CardFace product={product} className="h-full w-full rounded-none border-0" />
      )}
      {back ? (
        <div className="absolute top-2 left-2 flex gap-1">
          <button
            type="button"
            onClick={(event) => {
              event.preventDefault();
              event.stopPropagation();
              setSide("front");
            }}
            className={cn(
              "rounded-sm px-2 py-1 text-xs font-medium",
              side === "front" ? "bg-primary text-primary-foreground" : "bg-background/80 text-muted-foreground",
            )}
          >
            Front
          </button>
          <button
            type="button"
            onClick={(event) => {
              event.preventDefault();
              event.stopPropagation();
              setSide("back");
            }}
            className={cn(
              "rounded-sm px-2 py-1 text-xs font-medium",
              side === "back" ? "bg-primary text-primary-foreground" : "bg-background/80 text-muted-foreground",
            )}
          >
            Back
          </button>
        </div>
      ) : null}
      {product.imageDepiction ? (
        <span className="absolute top-2 right-2 rounded-sm bg-background/85 px-2 py-1 text-xs font-medium text-muted-foreground">
          Depiction
        </span>
      ) : null}
      {sold ? (
        <div className="absolute inset-0 flex items-end bg-background/55 p-3">
          <span className="rounded-sm bg-destructive px-2.5 py-1 text-xs font-medium text-destructive-foreground">
            Sold out
          </span>
        </div>
      ) : null}
    </div>
  );
}
