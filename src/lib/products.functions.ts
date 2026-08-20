import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";

export const getProducts = createServerFn({ method: "GET" })
  .inputValidator((data) => z.object({
    page: z.number().default(1),
    pageSize: z.number().default(10),
    search: z.string().optional(),
    categoryId: z.string().optional(),
  }).parse(data))
  .handler(async ({ data }) => {
    const { page, pageSize, search, categoryId } = data;
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    let query = supabase
      .from("products")
      .select("*, categories(name)", { count: "exact" });

    if (search) {
      query = query.ilike("name", `%${search}%`);
    }

    if (categoryId) {
      query = query.eq("category_id", categoryId);
    }

    const { data: products, count, error } = await query
      .range(from, to)
      .order("created_at", { ascending: false });

    if (error) throw error;

    return {
      products,
      totalCount: count || 0,
    };
  });

export const createProduct = createServerFn({ method: "POST" })
  .inputValidator((data) => z.object({
    name: z.string().min(2),
    description: z.string().nullable().optional(),
    sku: z.string().nullable().optional(),
    price: z.number().nullable().optional(),
    cost_price: z.number().nullable().optional(),
    stock_quantity: z.number().nullable().optional(),
    category_id: z.string().nullable().optional(),
    image_url: z.string().nullable().optional(),
    tenant_id: z.string(),
  }).parse(data))
  .handler(async ({ data }) => {
    const { error } = await supabase.from("products").insert(data as any);
    if (error) throw error;
    return { success: true };
  });

export const updateProduct = createServerFn({ method: "POST" })
  .inputValidator((data) => z.object({
    id: z.string(),
    name: z.string().optional(),
    description: z.string().nullable().optional(),
    sku: z.string().nullable().optional(),
    price: z.number().nullable().optional(),
    stock_quantity: z.number().nullable().optional(),
    active: z.boolean().nullable().optional(),
  }).parse(data))
  .handler(async ({ data }) => {
    const { id, ...updates } = data;
    const { error } = await supabase.from("products").update(updates as any).eq("id", id);
    if (error) throw error;
    return { success: true };
  });

export const getCategories = createServerFn({ method: "GET" })
  .handler(async () => {
    const { data: categories, error } = await supabase
      .from("categories")
      .select("*")
      .order("name");

    if (error) throw error;
    return categories;
  });
