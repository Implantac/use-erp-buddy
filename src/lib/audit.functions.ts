import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

const getAuditLogsSchema = z.object({
  limit: z.number().default(100),
  offset: z.number().default(0),
  entityName: z.string().optional(),
  action: z.string().optional(),
  companyId: z.string().optional(),
  unitId: z.string().optional(),
  userId: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
}).optional();

export const getAuditLogs = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .validator((data: unknown) => getAuditLogsSchema.parse(data))
  .handler(async ({ data, context }) => {
    let query = context.supabase
      .from("audit_logs" as any)
      .select("*, profiles(full_name), companies(name), units(name)")
      .order("created_at", { ascending: false });

    if (data?.limit && !data.offset) {
       query = query.limit(data.limit);
    } else if (data?.limit && data.offset) {
       query = query.range(data.offset, data.offset + data.limit - 1);
    }

    if (data?.entityName) {
      query = (query as any).eq("entity_name", data.entityName);
    }
    if (data?.action) {
      query = (query as any).eq("action", data.action);
    }
    if (data?.companyId) {
      query = (query as any).eq("company_id", data.companyId);
    }
    if (data?.unitId) {
      query = (query as any).eq("unit_id", data.unitId);
    }
    if (data?.userId) {
      query = (query as any).eq("user_id", data.userId);
    }
    if (data?.startDate) {
      query = (query as any).gte("created_at", data.startDate);
    }
    if (data?.endDate) {
      query = (query as any).lte("created_at", data.endDate);
    }

    const { data: logs, error } = await query;
    if (error) throw error;
    return logs as any[];
  });

export const exportAuditLogsCsv = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .validator((data: unknown) => getAuditLogsSchema.parse(data))
  .handler(async ({ data, context }) => {
    let query = context.supabase
      .from("audit_logs" as any)
      .select("*, profiles(full_name), companies(name), units(name)")
      .order("created_at", { ascending: false });

    // For export we might want a larger limit or no limit
    query = query.limit(1000);

    if (data?.entityName) {
      query = (query as any).eq("entity_name", data.entityName);
    }
    if (data?.action) {
      query = (query as any).eq("action", data.action);
    }
    if (data?.companyId) {
      query = (query as any).eq("company_id", data.companyId);
    }
    if (data?.unitId) {
      query = (query as any).eq("unit_id", data.unitId);
    }
    if (data?.userId) {
      query = (query as any).eq("user_id", data.userId);
    }
    if (data?.startDate) {
      query = (query as any).gte("created_at", data.startDate);
    }
    if (data?.endDate) {
      query = (query as any).lte("created_at", data.endDate);
    }

    const { data: logs, error } = await query;
    if (error) throw error;

    if (!logs || logs.length === 0) {
      return "Data,Usuario,Acao,Entidade,Empresa,Unidade,Detalhes\n";
    }

    const headers = ["Data", "Usuario", "Acao", "Entidade", "Empresa", "Unidade", "Detalhes"];
    const rows = (logs as any[]).map(log => [
      new Date(log.created_at).toLocaleString('pt-BR'),
      log.profiles?.full_name || 'Sistema',
      log.action,
      log.entity_name,
      log.companies?.name || '-',
      log.units?.name || '-',
      JSON.stringify(log.new_data || {}).replace(/"/g, '""')
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(","))
    ].join("\n");

    return csvContent;
  });
