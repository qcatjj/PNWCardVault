import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/scores")({
  component: () => <Outlet />,
});
