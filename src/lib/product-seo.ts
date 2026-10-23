import type { Product } from "@/lib/catalog-types";
import { productMeta, productName } from "@/lib/catalog-types";
import { gradeInfo } from "@/lib/listing-facts";

const ORIGIN = "https://pnwcardhub.app";

function abs(url: string | null | undefined) {
  if (!url || url.startsWith("data:")) return undefined;
  return url.startsWith("http") ? url : `${ORIGIN}${url}`;
}

export function productHead(product: Product | undefined) {
  if (!product) return { meta: [{ title: "Listing not found · PNW Card Hub" }] };
  const title = `${product.title} · PNW Card Hub`;
  const details = productMeta(product);
  const price = (product.priceCents / 100).toFixed(2);
  const description =
    `${productName(product)}${details ? ` — ${details}` : ""}. $${price}. $6 tracked USPS shipping from Selah, WA. Secure Stripe checkout.`.slice(
      0,
      300,
    );
  const url = `${ORIGIN}/c/${encodeURIComponent(product.slug)}`;
  const image = abs(
    product.imageUrl ?? (product.imageKey ? `/cards/${product.imageKey}.webp` : null),
  );
  const graded = gradeInfo(product).graded;
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.title,
    description: product.description || description,
    url,
    ...(image ? { image: [image] } : {}),
    ...(product.setName ? { brand: { "@type": "Brand", name: product.setName } } : {}),
    sku: String(product.id),
    category: "Sports Trading Cards",
    offers: {
      "@type": "Offer",
      url,
      priceCurrency: "USD",
      price,
      availability: product.qty > 0 ? "https://schema.org/InStock" : "https://schema.org/SoldOut",
      itemCondition: graded
        ? "https://schema.org/NewCondition"
        : "https://schema.org/UsedCondition",
      seller: { "@type": "Organization", name: "PNW Card Hub" },
      shippingDetails: {
        "@type": "OfferShippingDetails",
        shippingRate: { "@type": "MonetaryAmount", value: "6.00", currency: "USD" },
        shippingDestination: { "@type": "DefinedRegion", addressCountry: "US" },
      },
    },
  };
  return {
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: product.title },
      { property: "og:description", content: description },
      { property: "og:type", content: "product" },
      { property: "og:url", content: url },
      ...(image ? [{ property: "og:image", content: image }] : []),
    ],
    links: [{ rel: "canonical", href: url }],
    scripts: [
      { type: "application/ld+json", children: JSON.stringify(jsonLd).replace(/</g, "\\u003c") },
    ],
  };
}

export function pageHead(title: string, description: string) {
  return {
    meta: [
      { title: `${title} · PNW Card Hub` },
      { name: "description", content: description },
      { property: "og:title", content: `${title} · PNW Card Hub` },
    ],
  };
}
