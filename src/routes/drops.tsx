import { createFileRoute, Link } from "@tanstack/react-router";
import { ProductGrid } from "@/components/product-card";
import { listProducts } from "@/lib/catalog";

export const Route = createFileRoute("/drops")({
  loader: () => listProducts({ data: { inStock: true, sort: "newest", limit: 24 } }),
  component: Drops,
});

function Drops() {
  const products = Route.useLoaderData();
  return (
    <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-10">
      <p className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em]">
        <span className="live-dot size-2 rounded-full bg-primary" />
        Fresh from the desk
      </p>
      <h1 className="mt-3 text-4xl md:text-5xl">New drops</h1>
      <p className="mt-2 max-w-xl text-sm text-muted-foreground">
        Newest listings first. Buy now — ships after Stripe checkout.
      </p>
      <div className="mt-8">
        <ProductGrid products={products} />
      </div>
      {products.length === 0 ? (
        <Link to="/shop" className="mt-6 inline-flex text-sm font-semibold text-primary">
          Open the shop
        </Link>
      ) : null}
    </main>
  );
}
