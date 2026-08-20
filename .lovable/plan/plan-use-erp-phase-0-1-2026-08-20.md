# Plan - Use ERP (Phase 0 & 1)

Building a robust, multi-tenant ERP platform based on the "USE BUSINESS OS" specifications.

## Phase 0: Foundation & Architecture
- [ ] Initialize project structure with a modern, high-end design system (Tailwind v4, Shadcn).
- [ ] Configure Lovable Cloud (Supabase) for multi-tenancy.
- [ ] Set up global navigation and theme (Dark/Light mode, Enterprise aesthetic).

## Phase 1: Organizational Database (Core)
- [ ] Create `tenants` table (The root of all data isolation).
- [ ] Create `organization_groups` table.
- [ ] Create `companies` table (Multi-company support).
- [ ] Create `units` and `locations` tables (Branches, Warehouses, Factories).
- [ ] Implement `profiles` and `user_roles` with RLS isolation.
- [ ] Setup Audit logging structure.

## Phase 2: Identity & Access
- [ ] Implement Auth flow (Sign up, Login, Role-based dashboard).
- [ ] Create Tenant selection/onboarding flow.

## Technical Details
- **Architecture**: Modular domain-driven design.
- **Multi-tenancy**: Row Level Security (RLS) on every table using `tenant_id`.
- **UI/UX**: Clean, enterprise-grade interface using Lucide icons and subtle transitions.
- **Database**: PostgreSQL (Supabase) with strict foreign keys and audit triggers.
