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

    // 1. Get the subscription to find the target URL
    const { data: sub, error: subError } = await supabase
      .from("webhook_subscriptions")
      .select("target_url, secret")
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

    const duration = Date.now() - startTime;

    // 3. Log the attempt in webhook_logs
    const { data: logEntry, error: logError } = await supabase
      .from("webhook_logs")
      .insert({
        subscription_id,
        event,
        payload,
        response_status: status,
        response_body: responseBody.substring(0, 1000), // Truncate if too long
        delivery_duration_ms: duration,
        success
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
  }).parse(data))
  .middleware([requireSupabaseAuth])
  .handler(async ({ data: input, context }) => {
    const { data, error } = await context.supabase
      .from("webhook_logs")
      .select("*")
      .eq("subscription_id", input.subscription_id)
      .order("created_at", { ascending: false })
      .limit(10);

    if (error) throw error;
    return data;
  });
