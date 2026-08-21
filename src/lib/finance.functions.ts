import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

export const getTransactions = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .validator((data: {
    page?: number;
    pageSize?: number;
    startDate?: string;
    endDate?: string;
    type?: 'income' | 'expense';
  } | undefined) => z.object({
    page: z.number().default(1),
    pageSize: z.number().default(10),
    startDate: z.string().optional(),
    endDate: z.string().optional(),
    type: z.enum(['income', 'expense']).optional(),
  }).parse(data))
  .handler(async ({ data, context }) => {
    const { page, pageSize, startDate, endDate, type } = data;
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    let query = context.supabase
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
  .middleware([requireSupabaseAuth])
  .validator((data) => z.object({
    tenant_id: z.string().uuid(),
    company_id: z.string().uuid().nullable().optional(),
    type: z.enum(['income', 'expense']),
    amount: z.number().positive(),
    description: z.string().min(1),
    date: z.string().optional(),
    status: z.string().default('completed'),
    category: z.string().nullable().optional(),
  }).parse(data))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("transactions").insert(data as any);
    if (error) throw new Error(error.message);
    return { success: true };
  });

export const getFinanceSummary = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data: transactions, error } = await context.supabase
      .from("transactions")
      .select("type, amount");

    if (error) throw error;

    const summary = (transactions || []).reduce((acc: { income: number; expense: number }, curr: { type: 'income' | 'expense'; amount: number }) => {
      if (curr.type === 'income') acc.income += Number(curr.amount);
      else acc.expense += Number(curr.amount);
      return acc;
    }, { income: 0, expense: 0 });

    return {
      ...summary,
      balance: summary.income - summary.expense,
    };
  });

export const getFinanceChartData = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    // Busca transações dos últimos 6 meses
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const { data: transactions, error } = await context.supabase
      .from("transactions")
      .select("type, amount, date")
      .gte("date", sixMonthsAgo.toISOString().split('T')[0]);

    if (error) throw error;

    const monthlyData: Record<string, { month: string; income: number; expense: number }> = {};
    
    // Nomes dos meses em português
    const monthNames = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];

    (transactions || []).forEach((tx) => {
      const date = new Date(tx.date);
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      
      if (!monthlyData[key]) {
        monthlyData[key] = {
          month: `${monthNames[date.getMonth()]}/${date.getFullYear().toString().slice(-2)}`,
          income: 0,
          expense: 0
        };
      }

      if (tx.type === 'income') monthlyData[key].income += Number(tx.amount);
      else monthlyData[key].expense += Number(tx.amount);
    });

    return Object.values(monthlyData).sort((a, b) => {
      const [mA, yA] = a.month.split('/');
      const [mB, yB] = b.month.split('/');
      const monthIndexA = monthNames.indexOf(mA);
      const monthIndexB = monthNames.indexOf(mB);
      const dateA = new Date(`20${yA}-${String(monthIndexA !== -1 ? monthIndexA + 1 : 1).padStart(2, '0')}-01`);
      const dateB = new Date(`20${yB}-${String(monthIndexB !== -1 ? monthIndexB + 1 : 1).padStart(2, '0')}-01`);
      return dateA.getTime() - dateB.getTime();
    });
  });
