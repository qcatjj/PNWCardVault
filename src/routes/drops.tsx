import { createFileRoute, Navigate } from "@tanstack/react-router";

export const Route = createFileRoute("/drops")({
  component: () => <Navigate to="/shop" />,
});
