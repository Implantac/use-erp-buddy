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
  .validator((data: unknown) => z.object({
    tenant_id: z.string().uuid(),
    label: z.string().min(3),
    target_url: z.string().url(),
    events: z.array(z.string()),
  }).parse(data))
  .middleware([requireSupabaseAuth])
  .handler(async ({ data: input, context }) => {
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
  .validator((data: unknown) => z.object({
    id: z.string().uuid(),
  }).parse(data))
  .middleware([requireSupabaseAuth])
  .handler(async ({ data: input, context }) => {
    const { error } = await context.supabase
      .from("webhook_subscriptions")
      .delete()
      .eq("id", input.id);

    if (error) throw error;
    return { success: true };
  });
