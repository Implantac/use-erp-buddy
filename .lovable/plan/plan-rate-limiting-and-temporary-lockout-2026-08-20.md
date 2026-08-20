# Plan: Rate Limiting and Temporary Lockout

Implement security measures to protect against brute-force attacks on login and password reset flows.

## User Review Required

> [!IMPORTANT]
> This plan implements a custom rate-limiting table in the database and server functions to track and block excessive attempts.

## Proposed Changes

### Database Layer
- Create `public.auth_attempts` table to track failed attempts by IP and email.
- Implement cleanup function for old attempt records.
- Grant necessary permissions.

### Server Functions (`src/lib/auth.functions.ts`)
- `checkRateLimit`: Server function to verify if an IP/email is currently blocked.
- `recordAttempt`: Server function to log a failed attempt and potentially trigger a lockout.
- `resetAttempts`: Server function to clear attempts after a successful operation.

### Frontend Integration
- **Login Flow (`src/routes/auth/index.tsx`)**:
  - Call `checkRateLimit` before attempting `signInWithPassword`.
  - On failure, call `recordAttempt`.
  - On success, call `resetAttempts`.
  - Display user-friendly lockout message with time remaining.
- **Password Reset Flow (`src/routes/auth/index.tsx`)**:
  - Implement similar logic for `resetPasswordForEmail`.
- **Password Update Flow (`src/routes/auth/reset-password.tsx`)**:
  - Implement similar logic for `updateUser` (password change).

## Technical Details
- **Lockout Thresholds**:
  - 5 failed attempts = 15 minute lockout.
  - 10 failed attempts = 1 hour lockout.
- **Tracking**: Combined IP and email tracking to prevent distributed brute force and single-account targeting.
- **Edge Compatibility**: Uses standard PostgreSQL functions and TanStack Server Functions, compatible with Cloudflare Workers.
