import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const simulateWebhook = createServerFn({ method: "POST" })
  .validator((data: unknown) => z.object({
    subscription_id: z.string().uuid(),
    event: z.string(),
    payload: z.any(),
  }).parse(data))
  .middleware([requireSupabaseAuth])
  .handler(async ({ data: input, context }) => {
    const { subscription_id, event, payload } = input;
    const { supabase } = context;

    // 1. Get the subscription to find the target URL and tenant_id
    const { data: sub, error: subError } = await supabase
      .from("webhook_subscriptions")
      .select("target_url, secret, tenant_id")
      .eq("id", subscription_id)
      .single();

    if (subError || !sub) {
      throw new Error("Assinatura de webhook não encontrada");
    }

    const startTime = Date.now();
    let status = 0;
    let responseBody = "";
    let success = false;

    try {
      // 2. Simulate the POST request
      const response = await fetch(sub.target_url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-webhook-event": event,
          "x-webhook-signature": `sha256=simulated_${Math.random().toString(36).substring(7)}`,
        },
        body: JSON.stringify({
          event,
          payload,
          timestamp: new Date().toISOString(),
          simulated: true
        }),
      });

      status = response.status;
      responseBody = await response.text();
      success = response.ok;
    } catch (err: any) {
      status = 500;
      responseBody = err.message || "Falha na conexão";
      success = false;
    }

    // 3. Log the attempt in webhook_logs
    const { data: logEntry, error: logError } = await supabase
      .from("webhook_logs")
      .insert({
        tenant_id: sub.tenant_id,
        subscription_id,
        event_type: event,
        target_url: sub.target_url,
        payload,
        response_status: status,
        response_body: responseBody.substring(0, 1000),
        is_success: success
      })
      .select()
      .single();

    if (logError) {
      console.error("Erro ao registrar log de webhook:", logError);
    }

    return {
      success,
      status,
      response: responseBody,
      log_id: logEntry?.id
    };
  });

export const getWebhookLogs = createServerFn({ method: "GET" })
  .validator((data: unknown) => z.object({
    subscription_id: z.string().uuid(),
    page: z.number().default(0),
    pageSize: z.number().default(10),
    status: z.enum(["all", "success", "failure"]).default("all"),
    event: z.string().optional(),
    search: z.string().optional(),
  }).parse(data))
  .middleware([requireSupabaseAuth])
  .handler(async ({ data: input, context }) => {
    let query = context.supabase
      .from("webhook_logs")
      .select("*", { count: "exact" })
      .eq("subscription_id", input.subscription_id);

    if (input.status === "success") {
      query = query.eq("is_success", true);
    } else if (input.status === "failure") {
      query = query.eq("is_success", false);
    }

    if (input.event) {
      query = query.eq("event_type", input.event);
    }
    
    if (input.search) {
      // Search in event_type, target_url, or response_body. 
      // For JSONB payload search, we cast it to text.
      query = query.or(`event_type.ilike.%${input.search}%,target_url.ilike.%${input.search}%,response_body.ilike.%${input.search}%,payload.cd.ilike.%${input.search}%`);
      // Note: .cd is a PostgREST trick to cast to text for ilike if standard cast is restricted, 
      // but usually payload.ilike works if the server allows it or we use a custom RPC.
      // However, searching the JSONB payload directly via 'or' in PostgREST is best done 
      // by ensuring we target the fields the user cares about.
    }

    const from = input.page * input.pageSize;
    const to = from + input.pageSize - 1;

    const { data, count, error } = await query
      .order("created_at", { ascending: false })
      .range(from, to);

    if (error) throw error;
    
    return {
      data,
      total: count || 0,
      page: input.page,
      pageSize: input.pageSize
    };
  });

export const resendWebhook = createServerFn({ method: "POST" })
  .validator((data: unknown) => z.object({
    log_id: z.string().uuid(),
  }).parse(data))
  .middleware([requireSupabaseAuth])
  .handler(async ({ data: input, context }) => {
    const { log_id } = input;
    const { supabase } = context;

    // 1. Get the original log entry
    const { data: log, error: logError } = await supabase
      .from("webhook_logs")
      .select("*")
      .eq("id", log_id)
      .single();

    if (logError || !log) {
      throw new Error("Log de webhook não encontrado");
    }

    if (!log.subscription_id) {
      throw new Error("Log não possui um ID de assinatura válido");
    }

    // 2. Get the current subscription details
    const { data: sub, error: subError } = await supabase
      .from("webhook_subscriptions")
      .select("target_url, secret")
      .eq("id", log.subscription_id)
      .single();

    if (subError || !sub) {
      throw new Error("Assinatura de webhook original não encontrada ou removida");
    }

    // 3. Perform the retry request
    let status = 0;
    let responseBody = "";
    let success = false;

    try {
      const response = await fetch(sub.target_url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-webhook-event": log.event_type,
          "x-webhook-signature": sub.secret || "", // Use real secret if available, or HMAC logic
          "x-webhook-retry": "true",
          "x-original-log-id": log_id
        },
        body: JSON.stringify({
          event: log.event_type,
          payload: log.payload,
          timestamp: new Date().toISOString(),
          retry: true
        }),
      });

      status = response.status;
      responseBody = await response.text();
      success = response.ok;
    } catch (err: any) {
      status = 500;
      responseBody = err.message || "Falha na conexão ao reenviar";
      success = false;
    }

    // 4. Create a NEW log entry for the retry
    const { data: newLog } = await supabase
      .from("webhook_logs")
      .insert({
        tenant_id: log.tenant_id,
        subscription_id: log.subscription_id,
        event_type: log.event_type,
        target_url: sub.target_url,
        payload: log.payload,
        response_status: status,
        response_body: responseBody.substring(0, 1000),
        is_success: success
      })
      .select()
      .single();

    return {
      success,
      status,
      log_id: newLog?.id
    };
  });
