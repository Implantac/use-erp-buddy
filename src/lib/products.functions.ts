import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

export const getProducts = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .validator((data: {
    page?: number;
    pageSize?: number;
    search?: string;
    categoryId?: string;
  } | undefined) => z.object({
    page: z.number().default(1),
    pageSize: z.number().default(10),
    search: z.string().optional(),
    categoryId: z.string().optional(),
  }).parse(data))
  .handler(async ({ data, context }) => {
    const { page, pageSize, search, categoryId } = data;
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    let query = context.supabase
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
  .middleware([requireSupabaseAuth])
  .validator((data) => z.object({
    name: z.string().min(2, "Nome deve ter pelo menos 2 caracteres"),
    description: z.string().nullable().optional(),
    sku: z.string().nullable().optional(),
    price: z.number().min(0, "Preço não pode ser negativo").nullable().optional(),
    cost_price: z.number().min(0, "Preço de custo não pode ser negativo").nullable().optional(),
    stock_quantity: z.number().int().min(0, "Estoque não pode ser negativo").nullable().optional(),
    min_stock: z.number().min(0).optional(),
    unit_of_measure: z.string().optional(),
    category_id: z.string().uuid().nullable().optional(),
    image_url: z.string().url("URL de imagem inválida").nullable().optional().or(z.literal("")),
    brand: z.string().nullable().optional(),
    weight: z.number().min(0).optional(),
    length: z.number().min(0).optional(),
    width: z.number().min(0).optional(),
    height: z.number().min(0).optional(),
    barcode: z.string().nullable().optional(),
    custom_attributes: z.record(z.any()).optional(),
    tenant_id: z.string().uuid(),
  }).parse(data))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("products").insert(data as any);
    if (error) {
      console.error("Error creating product:", error);
      throw new Error(error.message);
    }
    return { success: true };
  });

export const updateProduct = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((data: any) => z.object({
    id: z.string().uuid(),
    updates: z.object({
      name: z.string().min(2).optional(),
      description: z.string().nullable().optional(),
      sku: z.string().nullable().optional(),
      price: z.number().min(0).nullable().optional(),
      stock_quantity: z.number().int().min(0).nullable().optional(),
      active: z.boolean().optional(),
      category_id: z.string().uuid().nullable().optional(),
      brand: z.string().nullable().optional(),
      weight: z.number().min(0).optional(),
      length: z.number().min(0).optional(),
      width: z.number().min(0).optional(),
      height: z.number().min(0).optional(),
      barcode: z.string().nullable().optional(),
      custom_attributes: z.record(z.any()).optional(),
    }),
  }).parse(data))
  .handler(async ({ data, context }) => {
    const { id, updates } = data;
    const { error } = await context.supabase.from("products").update(updates as any).eq("id", id);
    if (error) {
      console.error("Error updating product:", error);
      throw new Error(error.message);
    }
    return { success: true };
  });

export const getCategories = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .validator((data: { onlyActive?: boolean } | undefined) => z.object({
    onlyActive: z.boolean().default(false),
  }).parse(data))
  .handler(async ({ data, context }) => {
    let query = context.supabase
      .from("categories")
      .select("*")
      .order("name");

    if (data.onlyActive) {
      query = query.eq("active", true);
    }

    const { data: categories, error } = await query;

    if (error) throw error;
    return categories;
  });

export const createCategory = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((data) => z.object({
    name: z.string().min(2, "O nome deve ter pelo menos 2 caracteres"),
    tenant_id: z.string().uuid(),
  }).parse(data))
  .handler(async ({ data, context }) => {
    const insertData = {
      ...data,
      active: true,
    };
    const { error } = await context.supabase.from("categories").insert(insertData as any);
    if (error) {
      console.error("Error creating category:", error);
      throw new Error(error.message);
    }
    return { success: true };
  });

export const updateCategory = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((data: any) => z.object({
    id: z.string().uuid(),
    updates: z.object({
      name: z.string().min(2).optional(),
      active: z.boolean().optional(),
    }),
  }).parse(data))
  .handler(async ({ data, context }) => {
    const { id, updates } = data;
    const { error } = await context.supabase.from("categories").update(updates as any).eq("id", id);
    if (error) {
      console.error("Error updating category:", error);
      throw new Error(error.message);
    }
    return { success: true };
  });
