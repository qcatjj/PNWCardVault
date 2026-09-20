import { listingPath, productName, type Product } from "./catalog-types";

export function formatPrice(cents: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(cents / 100);
}

export function formatPriceShort(cents: number) {
  return formatPrice(cents).replace(".00", "");
}

function extras(product: Product) {
  return [product.parallel, product.serialNum, product.grade].filter(Boolean).join(" ");
}

export function chatLine(product: Product, origin: string) {
  const extra = extras(product);
  const price = formatPriceShort(product.priceCents);
  return `BIN ${price} · ${productName(product)}${extra ? ` · ${extra}` : ""} · ${origin}${listingPath(product)}`;
}

export function onBlockLine(product: Product, origin: string) {
  const extra = extras(product);
  return `ON THE BLOCK · ${productName(product)}${extra ? ` · ${extra}` : ""} · BIN ${formatPriceShort(product.priceCents)} · ${origin}${listingPath(product)}`;
}

export function upNextLine(product: Product, origin: string) {
  const extra = extras(product);
  return `UP NEXT · ${productName(product)}${extra ? ` · ${extra}` : ""} · BIN ${formatPriceShort(product.priceCents)} · ${origin}${listingPath(product)}`;
}

export function soldCallout(product: Pick<Product, "player" | "title" | "priceCents">) {
  return `SOLD · ${productName(product)} · ${formatPriceShort(product.priceCents)}`;
}
