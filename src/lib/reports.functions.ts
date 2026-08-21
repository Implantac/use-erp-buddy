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
      template_id: z.string(),
      name: z.string(),
      format: z.enum(["csv", "pdf"]),
      filters: z.record(z.any())
    }).parse(data)
  )
  .handler(async ({ data, context }) => {
    const { data: roleData } = await context.supabase
      .from("user_roles")
      .select("tenant_id")
      .eq("user_id", context.userId)
      .limit(1)
      .single();

    if (!roleData?.tenant_id) throw new Error("Tenant not found");

    // Create the export record
    const { data: reportExport, error } = await context.supabase
      .from("report_exports")
      .insert({
        tenant_id: roleData.tenant_id,
        profile_id: context.userId,
        template_id: data.template_id,
        name: data.name,
        format: data.format,
        filters: data.filters,
        status: "completed"
      })
      .select()
      .single();

    if (error) throw error;

    // Log the action using audit_logs table (since logs table doesn't exist or is different)
    await context.supabase.from("audit_logs").insert({
      tenant_id: roleData.tenant_id,
      user_id: context.userId,
      action: "report_export",
      entity_name: "report",
      entity_id: reportExport.id,
      new_data: { name: data.name, format: data.format }
    });

    return reportExport;
  });
