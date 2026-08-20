import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";
import { getAuthAttempts, recordAuthAttempt, clearAuthAttempts } from "./auth.server";

export const checkRateLimit = createServerFn({ method: "POST" })
  .inputValidator((data) => z.object({
    identifier: z.string(),
    type: z.enum(['login', 'reset_password'])
  }).parse(data))
  .handler(async ({ data }) => {
    // Check 15m window (5 attempts)
    const count15m = await getAuthAttempts(data.identifier, data.type, 15);
    if (count15m >= 5) {
      return { blocked: true, remainingMinutes: 15 };
    }
    
    // Check 1h window (10 attempts)
    const count1h = await getAuthAttempts(data.identifier, data.type, 60);
    if (count1h >= 10) {
      return { blocked: true, remainingMinutes: 60 };
    }
    
    return { blocked: false };
  });

export const logFailedAttempt = createServerFn({ method: "POST" })
  .inputValidator((data) => z.object({
    identifier: z.string(),
    type: z.enum(['login', 'reset_password'])
  }).parse(data))
  .handler(async ({ data }) => {
    await recordAuthAttempt(data.identifier, data.type, undefined);
    return { success: true };
  });

export const resetAuthAttempts = createServerFn({ method: "POST" })
  .inputValidator((data) => z.object({
    identifier: z.string(),
    type: z.enum(['login', 'reset_password'])
  }).parse(data))
  .handler(async ({ data }) => {
    await clearAuthAttempts(data.identifier, data.type);
    return { success: true };
  });

export const getCurrentUser = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    return context.userId;
  });
