import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

const getAuditLogsSchema = z.object({
  limit: z.number().default(100),
  offset: z.number().default(0),
  entityName: z.string().optional(),
  action: z.string().optional(),
}).optional();

export const getAuditLogs = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .validator((data: unknown) => getAuditLogsSchema.parse(data))
  .handler(async ({ data, context }) => {
    let query = context.supabase
      .from("audit_logs" as any)
      .select("*, profiles(full_name)")
      .order("created_at", { ascending: false })
      .range(data?.offset || 0, (data?.offset || 0) + (data?.limit || 100) - 1);

    if (data?.entityName) {
      query = (query as any).eq("entity_name", data.entityName);
    }
    if (data?.action) {
      query = (query as any).eq("action", data.action);
    }

    const { data: logs, error } = await query;
    if (error) throw error;
    return logs as any[];
  });
