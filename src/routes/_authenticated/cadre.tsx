/**
 * cadre.tsx — Layout wrapper for all /cadre/* routes
 *
 * This file MUST contain only <Outlet /> so that child routes
 * (/cadre/submit, /cadre/history, etc.) render their own components.
 *
 * The actual home dashboard lives in cadre.index.tsx
 * which TanStack Router maps to /cadre (index route).
 */
import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/cadre")({
  component: CadreLayout,
});

function CadreLayout() {
  return <Outlet />;
}
