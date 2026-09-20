import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import type { Product } from "@/lib/catalog-types";

export function BinButton({
  product,
  className,
  size = "lg",
  label,
}: {
  product: Product;
  className?: string;
  size?: "default" | "sm" | "lg";
  label?: string;
}) {
  const sold = product.qty <= 0;

  if (sold) {
    return (
      <Button disabled className={className} size={size}>
        Sold out
      </Button>
    );
  }

  return (
    <Button asChild size={size} className={className}>
      <Link to="/checkout" search={{ bin: product.slug }}>
        {label ?? "Buy now"}
      </Link>
    </Button>
  );
}
