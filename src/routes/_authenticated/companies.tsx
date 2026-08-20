import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/companies")({
  component: () => (
    <div className="p-8">
      <Outlet />
    </div>
  ),
});
