import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";
import { logAudit } from "./audit.server";

// Customer Schemas
const customerSchema = z.object({
  name: z.string().min(2),
  document: z.string().optional().nullable(),
  email: z.string().email().optional().nullable().or(z.literal("")),
  phone: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
  tenant_id: z.string().uuid(),
});

// CRM Interaction & Opportunity Schemas
const opportunitySchema = z.object({
  title: z.string().min(3),
  description: z.string().optional().nullable(),
  customer_id: z.string().uuid(),
  company_id: z.string().uuid(),
  value: z.number().nonnegative(),
  stage: z.enum(['lead', 'qualification', 'proposal', 'negotiation', 'closed_won', 'closed_lost']),
  probability: z.number().min(0).max(100),
  expected_closing_date: z.string().optional().nullable(),
  assigned_to: z.string().uuid().optional().nullable(),
  tenant_id: z.string().uuid(),
});

const interactionSchema = z.object({
  opportunity_id: z.string().uuid().optional().nullable(),
  customer_id: z.string().uuid(),
  type: z.enum(['call', 'email', 'meeting', 'note']),
  description: z.string().min(5),
  tenant_id: z.string().uuid(),
});

// Customer Functions
export const getCustomers = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .validator((data: any) => z.object({
    search: z.string().optional(),
  }).parse(data))
  .handler(async ({ data, context }) => {
    let query = context.supabase
      .from("customers")
      .select("*")
      .order("name");

    if (data.search) {
      query = query.ilike("name", `%${data.search}%`);
    }

    const { data: customers, error } = await query;
    if (error) throw error;
    return customers;
  });

export const createCustomer = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((data: unknown) => customerSchema.parse(data))
  .handler(async ({ data, context }) => {
    const typedData = customerSchema.parse(data);
    const { data: customer, error } = await context.supabase
      .from("customers")
      .insert({
        ...typedData,
        document: typedData.document || null,
        email: typedData.email || null,
        phone: typedData.phone || null,
        address: typedData.address || null,
      })
      .select()
      .single();

    if (error) throw error;

    await logAudit(context.supabase, {
      tenant_id: typedData.tenant_id,
      user_id: context.userId,
      action: 'insert',
      entity_name: 'customers',
      entity_id: customer.id,
      new_data: typedData
    });

    return customer;
  });

// Opportunities Functions
export const getOpportunities = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("crm_opportunities")
      .select("*, customers(name), profiles(full_name)")
      .order("created_at", { ascending: false });

    if (error) throw error;
    return data;
  });

export const createOpportunity = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((data: unknown) => opportunitySchema.parse(data))
  .handler(async ({ data, context }) => {
    const typedData = opportunitySchema.parse(data);
    const { data: opportunity, error } = await context.supabase
      .from("crm_opportunities")
      .insert({
        ...typedData,
        description: typedData.description || null,
        expected_closing_date: typedData.expected_closing_date || null,
        assigned_to: typedData.assigned_to || null,
      })
      .select()
      .single();

    if (error) throw error;

    await logAudit(context.supabase, {
      tenant_id: typedData.tenant_id,
      user_id: context.userId,
      action: 'insert',
      entity_name: 'crm_opportunities',
      entity_id: opportunity.id,
      new_data: typedData
    });

    return opportunity;
  });

export const updateOpportunityStage = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((data: any) => z.object({
    id: z.string().uuid(),
    stage: z.enum(['lead', 'qualification', 'proposal', 'negotiation', 'closed_won', 'closed_lost']),
    tenant_id: z.string().uuid(),
  }).parse(data))
  .handler(async ({ data, context }) => {
    const { data: opportunity, error } = await context.supabase
      .from("crm_opportunities")
      .update({ stage: data.stage })
      .eq("id", data.id)
      .select()
      .single();

    if (error) throw error;

    await logAudit(context.supabase, {
      tenant_id: data.tenant_id,
      user_id: context.userId,
      action: 'update',
      entity_name: 'crm_opportunities',
      entity_id: data.id,
      new_data: { stage: data.stage }
    });

    return opportunity;
  });

// Interaction Functions
export const getInteractions = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .validator((data: { customer_id?: string, opportunity_id?: string }) => z.object({
    customer_id: z.string().uuid().optional(),
    opportunity_id: z.string().uuid().optional(),
  }).parse(data))
  .handler(async ({ data, context }) => {
    let query = context.supabase
      .from("crm_interactions")
      .select("*, profiles(full_name)")
      .order("date", { ascending: false });

    if (data.customer_id) query = query.eq("customer_id", data.customer_id);
    if (data.opportunity_id) query = query.eq("opportunity_id", data.opportunity_id);

    const { data: interactions, error } = await query;
    if (error) throw error;
    return interactions;
  });

export const createInteraction = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((data: unknown) => interactionSchema.parse(data))
  .handler(async ({ data, context }) => {
    const typedData = interactionSchema.parse(data);
    const { data: interaction, error } = await context.supabase
      .from("crm_interactions")
      .insert({
        ...typedData,
        opportunity_id: typedData.opportunity_id || null,
        performed_by: context.userId
      })
      .select()
      .single();

    if (error) throw error;

    return interaction;
  });
