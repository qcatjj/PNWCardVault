import { createFileRoute, Navigate } from "@tanstack/react-router";

export const Route = createFileRoute("/live")({
  component: () => <Navigate to="/shop" />,
});
