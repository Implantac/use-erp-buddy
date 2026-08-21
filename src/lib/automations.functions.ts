import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

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
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
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
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => ruleSchema.parse(data))
  .handler(async ({ data, context }) => {
    // profile likely has tenant_id via RLS on user_roles/tenants 
    // but in this project tenant_id is often directly on the records.
    // We fetch tenant_id from user_roles or similar if needed, 
    // but usually the middleware context handles the user.
    
    // First, get the tenant_id for this user
    const { data: userRole } = await context.supabase
      .from("user_roles")
      .select("tenant_id")
      .eq("user_id", context.userId)
      .limit(1)
      .single();

    if (!userRole) throw new Error("No tenant associated with user");

    const { data: rule, error } = await context.supabase
      .from("automation_rules")
      .insert([{ 
        ...data, 
        tenant_id: userRole.tenant_id,
        condition_json: data.condition_json || {},
        action_config: data.action_config || {}
      }])
      .select()
      .single();

    if (error) throw new Error(error.message);
    return rule;
  });

/**
 * Get system notifications
 */
export const getNotifications = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
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
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => z.object({ id: z.string() }).parse(data))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("system_notifications")
      .update({ is_read: true })
      .eq("id", (data as { id: string }).id);

    if (error) throw new Error(error.message);
    return { success: true };
  });
