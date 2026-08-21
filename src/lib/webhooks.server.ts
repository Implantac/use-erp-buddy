import { SupabaseClient } from "@supabase/supabase-js";

export async function triggerWebhook(
  supabase: SupabaseClient,
  tenant_id: string,
  event: string,
  payload: any
) {
  try {
    // 1. Find active subscriptions for this tenant and event
    const { data: subs, error: subsError } = await supabase
      .from("webhook_subscriptions")
      .select("*")
      .eq("tenant_id", tenant_id)
      .eq("is_active", true)
      .contains("events", [event]);

    if (subsError || !subs?.length) return;

    // 2. Dispatch to each target
    for (const sub of subs) {
      const startTime = Date.now();
      let responseStatus = 0;
      let responseBody = "";
      let isSuccess = false;

      try {
        const response = await fetch(sub.target_url, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Webhook-Signature": sub.secret, // Simplified; in prod use HMAC
            "X-Webhook-Event": event,
          },
          body: JSON.stringify({
            event,
            timestamp: new Date().toISOString(),
            payload,
          }),
        });

        responseStatus = response.status;
        responseBody = await response.text();
        isSuccess = response.ok;
      } catch (fetchError: any) {
        responseBody = fetchError.message || "Connection failed";
      }

      // 3. Log the delivery
      await supabase.from("webhook_logs").insert({
        tenant_id,
        subscription_id: sub.id,
        event_type: event,
        target_url: sub.target_url,
        payload,
        response_status: responseStatus,
        response_body: responseBody.slice(0, 1000), // Truncate long bodies
        is_success: isSuccess,
      });
    }
  } catch (err) {
    console.error("Webhook dispatch error:", err);
  }
}
