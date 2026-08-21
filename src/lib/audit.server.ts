import { SupabaseClient } from "@supabase/supabase-js";

interface AuditLogEntry {
  tenant_id: string;
  user_id: string;
  company_id?: string;
  unit_id?: string;
  action: 'insert' | 'update' | 'delete' | 'login' | 'logout' | 'approve' | 'transfer';
  entity_name: string;
  entity_id?: string;
  old_data?: any;
  new_data?: any;
  ip_address?: string;
}


export async function logAudit(supabase: SupabaseClient, entry: AuditLogEntry) {
  try {
    const { error } = await supabase.from("audit_logs" as any).insert(entry as any);
    if (error) console.error("Failed to write audit log:", error);
  } catch (err) {
    console.error("Audit logging error:", err);
  }
}
