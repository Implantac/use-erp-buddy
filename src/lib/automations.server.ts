import { supabaseAdmin } from "@/integrations/supabase/client.server";

export async function evaluateRules(entityType: string, eventType: string, data: any, tenantId: string) {
  // Fetch active rules for this tenant and event
  const { data: rules, error } = await supabaseAdmin
    .from("automation_rules")
    .select("*")
    .eq("tenant_id", tenantId)
    .eq("entity_type", entityType)
    .eq("event_type", eventType)
    .eq("is_active", true);

  if (error || !rules) return;

  for (const rule of rules) {
    // Basic logic for demonstration - in production this would be a more robust engine
    if (rule.action_type === "NOTIFY") {
      const config = rule.action_config as any;
      await supabaseAdmin
        .from("system_notifications")
        .insert([{
          tenant_id: tenantId,
          user_id: null, // Global notification for the tenant
          title: rule.name,
          message: config?.message || `Evento ${eventType} em ${entityType} detectado.`,
          type: "INFO"
        }]);
    }
  }
}
