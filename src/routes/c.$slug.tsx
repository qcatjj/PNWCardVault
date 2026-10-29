import { createFileRoute, notFound } from "@tanstack/react-router";
import { ListingMissing, ProductView } from "@/components/product-view";
import { getProduct, listRelated } from "@/lib/catalog";
import { productHead } from "@/lib/product-seo";

export const Route = createFileRoute("/c/$slug")({
  loader: async ({ params }) => loadListing(params.slug),
  head: ({ loaderData }) => productHead(loaderData?.product),
  component: ProductPage,
  notFoundComponent: ListingMissing,
});

async function loadListing(slug: string) {
  const product = await getProduct({ data: { slug } });
  if (!product) throw notFound();
  const related = await listRelated({
    data: { sport: product.sport, excludeId: product.id, limit: 4 },
  });
  return { product, related };
}

function ProductPage() {
  const data = Route.useLoaderData();
  return <ProductView product={data.product} related={data.related} />;
}
