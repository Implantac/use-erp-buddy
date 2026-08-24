import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const getReportTemplates = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data: roleData } = await context.supabase
      .from("user_roles")
      .select("tenant_id")
      .eq("user_id", context.userId)
      .limit(1)
      .single();

    if (!roleData?.tenant_id) throw new Error("Tenant not found");

    const { data, error } = await context.supabase
      .from("report_templates")
      .select("*")
      .eq("tenant_id", roleData.tenant_id);

    if (error) throw error;
    return data;
  });

export const getRecentExports = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("report_exports")
      .select("*, report_templates(name)")
      .eq("profile_id", context.userId)
      .order("created_at", { ascending: false })
      .limit(10);

    if (error) throw error;
    return data;
  });

export const requestReportExport = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((data: { template_id: string; name: string; format: "csv" | "pdf"; filters: any }) =>
    z.object({
      template_id: z.string().uuid(),
      name: z.string().min(1),
      format: z.enum(["csv", "pdf"]),
      filters: z
        .object({
          from: z.string().optional(),
          to: z.string().optional(),
          company_id: z.string().uuid().optional(),
          unit_id: z.string().uuid().optional(),
        })
        .default({}),
    }).parse(data)
  )
  .handler(async ({ data, context }) => {
    const { buildReportData, toCsv, toPdf, uploadReportFile, createReportSignedUrl, slugify } =
      await import("./reports.server");

    const { data: roleData } = await context.supabase
      .from("user_roles")
      .select("tenant_id")
      .eq("user_id", context.userId)
      .limit(1)
      .single();

    if (!roleData?.tenant_id) throw new Error("Tenant not found");
    const tenantId = roleData.tenant_id;

    // O template é lido com o client do usuário (RLS garante o isolamento).
    const { data: template, error: templateError } = await context.supabase
      .from("report_templates")
      .select("id, name, category")
      .eq("id", data.template_id)
      .eq("tenant_id", tenantId)
      .single();

    if (templateError || !template) throw new Error("Modelo de relatório não encontrado");

    const report = await buildReportData(template.category as any, tenantId, data.filters);

    const filePath = `${tenantId}/${slugify(data.name)}-${Date.now()}.${data.format}`;
    if (data.format === "csv") {
      await uploadReportFile(filePath, new TextEncoder().encode(toCsv(report)), "text/csv; charset=utf-8");
    } else {
      await uploadReportFile(filePath, toPdf(data.name, report), "application/pdf");
    }

    const { data: reportExport, error } = await context.supabase
      .from("report_exports")
      .insert({
        tenant_id: tenantId,
        profile_id: context.userId,
        template_id: data.template_id,
        name: data.name,
        format: data.format,
        filters: data.filters,
        file_path: filePath,
        status: "completed",
      })
      .select()
      .single();

    if (error) throw error;

    await context.supabase.from("audit_logs").insert({
      tenant_id: tenantId,
      user_id: context.userId,
      action: "report_export",
      entity_name: "report",
      entity_id: reportExport.id,
      new_data: { name: data.name, format: data.format, rows: report.rows.length },
    });

    return { ...reportExport, rows: report.rows.length, url: await createReportSignedUrl(filePath) };
  });

export const getReportDownloadUrl = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((data: { export_id: string }) => z.object({ export_id: z.string().uuid() }).parse(data))
  .handler(async ({ data, context }) => {
    const { createReportSignedUrl } = await import("./reports.server");

    const { data: row, error } = await context.supabase
      .from("report_exports")
      .select("file_path")
      .eq("id", data.export_id)
      .eq("profile_id", context.userId)
      .single();

    if (error || !row?.file_path) throw new Error("Arquivo não disponível para download");
    return { url: await createReportSignedUrl(row.file_path) };
  });

