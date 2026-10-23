import { createFileRoute, notFound } from "@tanstack/react-router";
import { ListingMissing, ProductView } from "@/components/product-view";
import { getProduct, listProducts } from "@/lib/catalog";
import { productHead } from "@/lib/product-seo";

export const Route = createFileRoute("/v/$code")({
  loader: async ({ params }) => {
    const product = await getProduct({ data: { slug: params.code } });
    if (!product) throw notFound();
    const related = (await listProducts({ data: { sport: product.sport, limit: 8 } })).filter(
      (item) => item.slug !== product.slug,
    );
    return { product, related: related.slice(0, 4) };
  },
  head: ({ loaderData }) => productHead(loaderData?.product),
  component: ShortListing,
  notFoundComponent: ListingMissing,
});

function ShortListing() {
  const data = Route.useLoaderData();
  return <ProductView product={data.product} related={data.related} />;
}
