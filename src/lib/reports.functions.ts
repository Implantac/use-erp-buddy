import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const getReportTemplates = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data: profile } = await context.supabase
      .from("profiles")
      .select("tenant_id")
      .eq("id", context.userId)
      .single();

    if (!profile) throw new Error("Profile not found");

    const { data, error } = await context.supabase
      .from("report_templates")
      .select("*")
      .eq("tenant_id", profile.tenant_id);

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
  .inputValidator((data) => z.object({
    template_id: z.string(),
    name: z.string(),
    format: z.enum(["csv", "pdf"]),
    filters: z.record(z.any())
  }).parse(data))
  .handler(async ({ data, context }) => {
    const { data: profile } = await context.supabase
      .from("profiles")
      .select("tenant_id")
      .eq("id", context.userId)
      .single();

    if (!profile) throw new Error("Profile not found");

    // Create the export record
    const { data: reportExport, error } = await context.supabase
      .from("report_exports")
      .insert({
        tenant_id: profile.tenant_id,
        profile_id: context.userId,
        template_id: data.template_id,
        name: data.name,
        format: data.format,
        filters: data.filters,
        status: "completed" // Mocking immediate completion for now
      })
      .select()
      .single();

    if (error) throw error;

    // Log the action
    await context.supabase.from("logs").insert({
      tenant_id: profile.tenant_id,
      profile_id: context.userId,
      action: "report_export",
      entity_type: "report",
      entity_id: reportExport.id,
      details: { name: data.name, format: data.format }
    });

    return reportExport;
  });
