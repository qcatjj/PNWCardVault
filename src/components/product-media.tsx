import { type MouseEvent as ReactMouseEvent, useState } from "react";
import { ZoomIn, X } from "lucide-react";
import { CardFace } from "@/components/card-face";
import { productImageSrc, type Product } from "@/lib/catalog-types";
import { cn } from "@/lib/utils";

export function ProductMedia({
  product,
  className,
  sizes = "(min-width: 1024px) 260px, (min-width: 768px) 30vw, 50vw",
  priority = false,
  zoomable = false,
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
  priority?: boolean;
  zoomable?: boolean;
}) {
  const front = productImageSrc(product);
  const back = product.imageUrlBack || null;
  const [side, setSide] = useState<"front" | "back">("front");
  const src = side === "back" && back ? back : front;
  const sold = product.qty <= 0;
  const [lens, setLens] = useState<{ x: number; y: number } | null>(null);
  const [full, setFull] = useState(false);
  const srcSet = src && src.startsWith("/img/") ? `${src}?w=480 480w, ${src} 1000w` : undefined;

  function onMove(event: ReactMouseEvent<HTMLDivElement>) {
    if (!zoomable) return;
    const box = event.currentTarget.getBoundingClientRect();
    setLens({
      x: ((event.clientX - box.left) / box.width) * 100,
      y: ((event.clientY - box.top) / box.height) * 100,
    });
  }

  return (
    <div
      className={cn(
        "relative overflow-hidden hub-well",
        zoomable && src && "cursor-zoom-in",
        className,
      )}
      onMouseMove={onMove}
      onMouseLeave={() => setLens(null)}
      onClick={zoomable && src ? () => setFull(true) : undefined}
    >
      {src ? (
        <img
          src={src}
          srcSet={srcSet}
          alt={product.title}
          sizes={sizes}
          loading={priority ? "eager" : "lazy"}
          decoding="async"
          fetchPriority={priority ? "high" : "auto"}
          className="h-full w-full object-cover transition-transform duration-150"
          style={
            lens ? { transform: "scale(2.2)", transformOrigin: `${lens.x}% ${lens.y}%` } : undefined
          }
        />
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
              "min-h-9 rounded-md px-3 py-1.5 text-xs font-semibold",
              side === "front"
                ? "bg-primary text-primary-foreground"
                : "bg-background/80 text-muted-foreground",
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
              "min-h-9 rounded-md px-3 py-1.5 text-xs font-semibold",
              side === "back"
                ? "bg-primary text-primary-foreground"
                : "bg-background/80 text-muted-foreground",
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
      {zoomable && src ? (
        <span className="pointer-events-none absolute right-2 bottom-2 inline-flex items-center gap-1 rounded-md bg-background/85 px-2 py-1 text-xs font-medium">
          <ZoomIn className="size-3.5" /> Tap to zoom
        </span>
      ) : null}
      {full && src ? (
        <div
          role="dialog"
          aria-label="Zoomed card photo"
          className="fixed inset-0 z-[60] overflow-auto bg-background/95 [touch-action:pinch-zoom]"
          onClick={(event) => {
            event.stopPropagation();
            setFull(false);
          }}
        >
          <button
            type="button"
            aria-label="Close zoom"
            className="fixed top-4 right-4 z-[61] flex size-11 items-center justify-center rounded-full bg-card"
          >
            <X className="size-5" />
          </button>
          <img
            src={src}
            alt={product.title}
            className="mx-auto my-6 w-auto max-w-[min(1000px,160vw)]"
          />
        </div>
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
