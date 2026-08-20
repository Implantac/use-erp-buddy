import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/units")({
  component: () => (
    <div className="p-8">
      <Outlet />
    </div>
  ),
});
