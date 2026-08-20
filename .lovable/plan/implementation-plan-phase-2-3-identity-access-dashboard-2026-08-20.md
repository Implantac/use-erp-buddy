# Implementation Plan - Phase 2 & 3: Identity, Access & Dashboard

Building upon the established Phase 1 foundation (Multi-tenant DB, RLS), this plan focuses on wiring up authentication, tenant selection, and the core dashboard structure.

## Proposed Changes

### 1. Authentication Integration (Phase 2)
- Integrate `supabase.auth` in `src/routes/auth.tsx`.
- Implement `signInWithPassword` and `signUp` (which triggers the DB `handle_new_user` function).
- Add Social Auth (Google) configuration.
- Implement Password Recovery flow.

### 2. Tenant & Context Management (Phase 2/3)
- Create a protected layout route `src/routes/_authenticated.tsx`.
- Implement a "Tenant Selector" if a user belongs to multiple organizations.
- Establish a global context/hook for the active Tenant/Company/Unit.

### 3. Dashboard Shell (Phase 3)
- Create `src/routes/_authenticated/dashboard.tsx`.
- Design a high-end sidebar navigation supporting the hierarchical structure (Tenant > Company > Unit).
- Implement an activity feed/audit log view using the existing `audit_logs` table.

## Technical Details
- **Auth**: Use `supabase.auth` for session management. `attachSupabaseAuth` middleware is already registered in `src/start.ts`.
- **State**: Use TanStack Query for data fetching and caching (Tenants, Profiles).
- **Security**: All dashboard routes will be under the `_authenticated` layout gate.
- **Components**: Sidebar using `@/components/ui/sidebar`, Breadcrumbs for navigation within the hierarchy.

## Security & Privacy
- **RLS**: Policies are already in place; all queries must use `supabase` client which carries the JWT.
- **Access Control**: Use `has_role` helper for UI-level permission gating.
