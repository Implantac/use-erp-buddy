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
    description: z.string().optional(),
    sku: z.string().optional(),
    price: z.number().default(0),
    cost_price: z.number().default(0),
    stock_quantity: z.number().default(0),
    category_id: z.string().optional(),
    image_url: z.string().optional(),
    tenant_id: z.string(),
  }).parse(data))
  .handler(async ({ data }) => {
    const { error } = await supabase.from("products").insert(data);
    if (error) throw error;
    return { success: true };
  });

export const updateProduct = createServerFn({ method: "POST" })
  .inputValidator((data) => z.object({
    id: z.string(),
    name: z.string().optional(),
    description: z.string().optional(),
    sku: z.string().optional(),
    price: z.number().optional(),
    stock_quantity: z.number().optional(),
    active: z.boolean().optional(),
  }).parse(data))
  .handler(async ({ data }) => {
    const { id, ...updates } = data;
    const { error } = await supabase.from("products").update(updates).eq("id", id);
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
