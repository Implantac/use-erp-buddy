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
      avatar_url: z.string().url().optional()
    }).parse(data)
  )
  .handler(async ({ data, context }) => {
    const updateData: any = {};
    if (data.full_name !== undefined) updateData.full_name = data.full_name;
    if (data.avatar_url !== undefined) updateData.avatar_url = data.avatar_url;

    const { data: profile, error } = await context.supabase
      .from("profiles")
      .update(updateData)
      .eq("id", context.userId)
      .select()
      .single();


    if (error) throw error;
    return profile;
  });

export const getTenantSettings = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data: tenant, error } = await context.supabase
      .from("tenants")
      .select("*")
      .single();

    if (error) throw error;
    return tenant;
  });
