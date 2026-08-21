import { createServerFn } from "@tanstack/react-router";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";

/**
 * Zod schemas for validation
 */
const ruleSchema = z.object({
  name: z.string().min(3),
  entity_type: z.string(),
  event_type: z.string(),
  action_type: z.string(),
  condition_json: z.record(z.any()).optional(),
  action_config: z.record(z.any()).optional(),
});

/**
 * Get all automation rules for the current tenant
 */
export const getAutomationRules = createServerFn({ method: "GET" })
  .handler(async () => {
    const { data, error } = await supabase
      .from("automation_rules")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw new Error(error.message);
    return data;
  });

/**
 * Create a new automation rule
 */
export const createAutomationRule = createServerFn({ method: "POST" })
  .inputValidator((data) => ruleSchema.parse(data))
  .handler(async ({ data }) => {
    // Get tenant_id from profile
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Unauthorized");

    const { data: profile } = await supabase
      .from("profiles")
      .select("tenant_id")
      .eq("id", user.id)
      .single();

    if (!profile) throw new Error("Profile not found");

    const { data: rule, error } = await supabase
      .from("automation_rules")
      .insert([{ ...data, tenant_id: profile.tenant_id }])
      .select()
      .single();

    if (error) throw new Error(error.message);
    return rule;
  });

/**
 * Get system notifications
 */
export const getNotifications = createServerFn({ method: "GET" })
  .handler(async () => {
    const { data, error } = await supabase
      .from("system_notifications")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(50);

    if (error) throw new Error(error.message);
    return data;
  });

/**
 * Mark notification as read
 */
export const markNotificationRead = createServerFn({ method: "POST" })
  .inputValidator((data) => z.object({ id: z.string() }).parse(data))
  .handler(async ({ data }) => {
    const { error } = await supabase
      .from("system_notifications")
      .update({ is_read: true })
      .eq("id", data.id);

    if (error) throw new Error(error.message);
    return { success: true };
  });
