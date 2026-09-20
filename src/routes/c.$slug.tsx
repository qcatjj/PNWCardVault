import { createFileRoute, notFound } from "@tanstack/react-router";
import { ListingMissing, ProductView } from "@/components/product-view";
import { getProduct, listProducts } from "@/lib/catalog";

export const Route = createFileRoute("/c/$slug")({
  loader: async ({ params }) => loadListing(params.slug),
  component: ProductPage,
  notFoundComponent: ListingMissing,
});

async function loadListing(slug: string) {
  const product = await getProduct({ data: { slug } });
  if (!product) throw notFound();
  const related = (await listProducts({ data: { sport: product.sport, limit: 8 } })).filter(
    (item) => item.slug !== product.slug,
  );
  return { product, related: related.slice(0, 4) };
}

function ProductPage() {
  const data = Route.useLoaderData();
  return <ProductView product={data.product} related={data.related} />;
}