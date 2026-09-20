import { createFileRoute, Link, Navigate } from "@tanstack/react-router";
import { fulfillStripeCheckout } from "@/lib/stripe-api";

export const Route = createFileRoute("/order/stripe")({
  validateSearch: (search: Record<string, unknown>) => ({
    session_id: typeof search.session_id === "string" ? search.session_id : undefined,
  }),
  loaderDeps: ({ search }) => search,
  loader: async ({ deps }) => {
    const sessionId = deps.session_id;
    if (!sessionId) return { code: null as string | null, error: "Missing Stripe session." };
    try {
      const order = await fulfillStripeCheckout({ data: { sessionId } });
      return { code: order.code, error: null as string | null };
    } catch (err) {
      return { code: null, error: err instanceof Error ? err.message : "Could not finish the order." };
    }
  },
  component: StripeReturn,
});

function StripeReturn() {
  const { code, error } = Route.useLoaderData();
  if (code) return <Navigate to="/order/$code" params={{ code }} />;
  return (
    <main className="mx-auto max-w-xl px-4 py-24 text-center">
      <h1 className="font-display text-3xl">Payment did not land.</h1>
      <p className="mt-3 text-sm text-muted-foreground">{error}</p>
      <Link to="/checkout" className="mt-6 inline-block text-sm text-primary">
        Back to checkout
      </Link>
    </main>
  );
}
