import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";
import { logAudit } from "./audit.server";

// --- Schemas ---

const createShipmentSchema = z.object({
  sale_id: z.string().uuid(),
  carrier_id: z.string().uuid().optional(),
  shipping_method_id: z.string().uuid().optional(),
  tracking_code: z.string().optional(),
  estimated_delivery: z.string().optional(),
});

const updateShipmentStatusSchema = z.object({
  shipment_id: z.string().uuid(),
  status: z.enum(['pending', 'shipped', 'delivered', 'returned']),
  location: z.string().optional(),
  notes: z.string().optional(),
});

// --- Functions ---

export const getCarriers = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("carriers")
      .select("*")
      .eq("active", true)
      .order("name");
    
    if (error) throw error;
    return data;
  });

export const getShippingMethods = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("shipping_methods")
      .select("*")
      .eq("active", true)
      .order("name");
    
    if (error) throw error;
    return data;
  });

export const getShipments = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("shipments")
      .select(`
        *,
        sales(created_at, customers(name)),
        carriers(name),
        shipping_methods(name)
      `)
      .order("created_at", { ascending: false });
    
    if (error) throw error;
    return data;
  });

export const createShipment = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((data: unknown) => createShipmentSchema.parse(data))
  .handler(async ({ data, context }) => {
    const { data: roleData } = await context.supabase
      .from("user_roles")
      .select("tenant_id")
      .eq("user_id", context.userId)
      .limit(1)
      .single();

    if (!roleData?.tenant_id) throw new Error("Tenant not found");

    const { data: shipment, error } = await context.supabase
      .from("shipments")
      .insert({
        tenant_id: roleData.tenant_id,
        sale_id: data.sale_id,
        carrier_id: data.carrier_id ?? null,
        shipping_method_id: data.shipping_method_id ?? null,
        tracking_code: data.tracking_code ?? null,
        estimated_delivery: data.estimated_delivery ?? null,
        status: 'pending'
      })
      .select()
      .single();

    if (error) throw error;

    await logAudit(context.supabase, {
      user_id: context.userId,
      tenant_id: roleData.tenant_id,
      action: "insert",
      entity_name: "shipments",
      entity_id: shipment.id,
      new_data: shipment,
    });

    return shipment;
  });

export const updateShipmentStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((data: unknown) => updateShipmentStatusSchema.parse(data))
  .handler(async ({ data, context }) => {
    const updateData: any = { status: data.status };
    if (data.status === 'shipped') updateData.shipped_at = new Date().toISOString();
    if (data.status === 'delivered') updateData.delivered_at = new Date().toISOString();

    const { data: shipment, error } = await context.supabase
      .from("shipments")
      .update(updateData)
      .eq("id", data.shipment_id)
      .select()
      .single();

    if (error) throw error;

    // Create delivery log
    await context.supabase
      .from("delivery_logs")
      .insert({
        tenant_id: shipment.tenant_id,
        shipment_id: data.shipment_id,
        status: data.status,
        location: data.location ?? null,
        notes: data.notes ?? null,
      });

    await logAudit(context.supabase, {
      user_id: context.userId,
      tenant_id: shipment.tenant_id,
      action: "update",
      entity_name: "shipments",
      entity_id: data.shipment_id,
      new_data: updateData,
    });

    return shipment;
  });
