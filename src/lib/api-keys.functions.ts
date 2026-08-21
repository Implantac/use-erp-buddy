import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const getApiKeys = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("api_keys")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw error;
    return data;
  });

export const createApiKey = createServerFn({ method: "POST" })
  .validator((data: unknown) => z.object({
    label: z.string().min(3),
    tenant_id: z.string().uuid(),
    expires_at: z.string().optional(),
  }).parse(data))
  .middleware([requireSupabaseAuth])
  .handler(async ({ input, context }) => {
    // In a real app, we'd hash the key. For this demo, we'll return the raw key once.
    const rawKey = `ub_${Math.random().toString(36).substring(2, 15)}`;
    const prefix = rawKey.substring(0, 6);
    
    const { data, error } = await context.supabase
      .from("api_keys")
      .insert({
        tenant_id: input.tenant_id,
        label: input.label,
        key_hash: rawKey, // Simplified for demo; should be bcrypt/scrypt hash
        key_prefix: prefix,
        expires_at: input.expires_at,
      })
      .select()
      .single();

    if (error) throw error;
    return { ...data, rawKey };
  });

export const revokeApiKey = createServerFn({ method: "POST" })
  .validator((data: unknown) => z.object({
    id: z.string().uuid(),
  }).parse(data))
  .middleware([requireSupabaseAuth])
  .handler(async ({ input, context }) => {
    const { error } = await context.supabase
      .from("api_keys")
      .update({ is_active: false })
      .eq("id", input.id);

    if (error) throw error;
    return { success: true };
  });
