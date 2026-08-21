import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const getWebhookSubscriptions = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("webhook_subscriptions")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw error;
    return data;
  });

export const createWebhookSubscription = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .input(z.object({
    tenant_id: z.string().uuid(),
    label: z.string().min(3),
    target_url: z.string().url(),
    events: z.array(z.string()),
  }))
  .handler(async ({ input, context }) => {
    const secret = `whsec_${Math.random().toString(36).substring(2, 15)}`;
    
    const { data, error } = await context.supabase
      .from("webhook_subscriptions")
      .insert({
        ...input,
        secret,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  });

export const deleteWebhookSubscription = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .input(z.object({
    id: z.string().uuid(),
  }))
  .handler(async ({ input, context }) => {
    const { error } = await context.supabase
      .from("webhook_subscriptions")
      .delete()
      .eq("id", input.id);

    if (error) throw error;
    return { success: true };
  });
