import { createFileRoute, Navigate } from "@tanstack/react-router";

export const Route = createFileRoute("/drop/$slug")({
  component: () => <Navigate to="/shop" />,
});
