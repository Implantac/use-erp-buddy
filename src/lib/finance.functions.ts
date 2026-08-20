import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";

export const getTransactions = createServerFn({ method: "GET" })
  .inputValidator((data) => z.object({
    page: z.number().default(1),
    pageSize: z.number().default(10),
    startDate: z.string().optional(),
    endDate: z.string().optional(),
    type: z.enum(['income', 'expense']).optional(),
  }).parse(data))
  .handler(async ({ data }) => {
    const { page, pageSize, startDate, endDate, type } = data;
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    let query = supabase
      .from("transactions")
      .select("*, companies(name)", { count: "exact" });

    if (startDate) query = query.gte("date", startDate);
    if (endDate) query = query.lte("date", endDate);
    if (type) query = query.eq("type", type);

    const { data: transactions, count, error } = await query
      .range(from, to)
      .order("date", { ascending: false });

    if (error) throw error;

    return {
      transactions,
      totalCount: count || 0,
    };
  });

export const createTransaction = createServerFn({ method: "POST" })
  .inputValidator((data) => z.object({
    tenant_id: z.string(),
    company_id: z.string().nullable().optional(),
    type: z.enum(['income', 'expense']),
    amount: z.number(),
    description: z.string().nullable().optional(),
    date: z.string().optional(),
    status: z.string().default('completed'),
    category: z.string().nullable().optional(),
  }).parse(data))
  .handler(async ({ data }) => {
    const { error } = await supabase.from("transactions").insert(data as any);
    if (error) throw error;
    return { success: true };
  });

export const getFinanceSummary = createServerFn({ method: "GET" })
  .handler(async () => {
    const { data: transactions, error } = await supabase
      .from("transactions")
      .select("type, amount");

    if (error) throw error;

    const summary = (transactions || []).reduce((acc, curr) => {
      if (curr.type === 'income') acc.income += Number(curr.amount);
      else acc.expense += Number(curr.amount);
      return acc;
    }, { income: 0, expense: 0 });

    return {
      ...summary,
      balance: summary.income - summary.expense,
    };
  });
