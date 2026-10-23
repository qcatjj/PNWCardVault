import { pageHead } from "@/lib/product-seo";
import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/scores")({
  head: () => pageHead("Scores", "Live scores matched to cards in the PNW Card Hub case."),
  component: () => <Outlet />,
});
