import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

export const getProfile = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data: profile, error } = await context.supabase
      .from("profiles")
      .select("*")
      .eq("id", context.userId)
      .single();

    if (error) throw error;
    return profile;
  });

export const updateProfile = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((data: { full_name?: string; avatar_url?: string }) => 
    z.object({
      full_name: z.string().min(3).optional(),
      avatar_url: z.string().url().optional().nullable()
    }).parse(data)
  )
  .handler(async ({ data, context }) => {
    const { data: profile, error } = await context.supabase
      .from("profiles")
      .update(data as any)
      .eq("id", context.userId)
      .select()
      .single();

    if (error) throw error;
    return profile;
  });

export const getTenantSettings = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    // Busca o tenant do perfil do usuário para garantir isolamento
    const { data: profile } = await context.supabase
      .from("profiles")
      .select("tenant_id")
      .eq("id", context.userId)
      .single();

    if (!profile?.tenant_id) throw new Error("Tenant não encontrado");

    const { data: tenant, error } = await context.supabase
      .from("tenants")
      .select("*")
      .eq("id", profile.tenant_id)
      .single();

    if (error) throw error;
    return tenant;
  });

export const updateTenantSettings = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((data: { name?: string; settings?: any }) => 
    z.object({
      name: z.string().min(3).optional(),
      settings: z.any().optional()
    }).parse(data)
  )
  .handler(async ({ data, context }) => {
    const { data: profile } = await context.supabase
      .from("profiles")
      .select("tenant_id")
      .eq("id", context.userId)
      .single();

    if (!profile?.tenant_id) throw new Error("Tenant não encontrado");

    const { data: tenant, error } = await context.supabase
      .from("tenants")
      .update(data as any)
      .eq("id", profile.tenant_id)
      .select()
      .single();

    if (error) throw error;
    return tenant;
  });
