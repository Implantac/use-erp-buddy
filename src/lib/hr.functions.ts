import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";
import { logAudit } from "./audit.server";

// --- Schemas ---

const hireEmployeeSchema = z.object({
  full_name: z.string().min(3),
  email: z.string().email().optional().nullable(),
  phone: z.string().optional().nullable(),
  document_number: z.string().optional().nullable(),
  hire_date: z.string(),
  salary: z.number().nonnegative(),
  company_id: z.string().uuid().optional().nullable(),
  unit_id: z.string().uuid().optional().nullable(),
  department_id: z.string().uuid().optional().nullable(),
  job_position_id: z.string().uuid().optional().nullable(),
});

const generatePayrollSchema = z.object({
  employee_id: z.string().uuid(),
  month: z.number().min(1).max(12),
  year: z.number(),
  additions: z.number().default(0),
  deductions: z.number().default(0),
});

// --- Functions ---

export const getEmployees = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("employees")
      .select(`
        *,
        departments(name),
        job_positions(title),
        companies(name),
        units(name)
      `)
      .order("full_name");
    
    if (error) throw error;
    return data;
  });

export const hireEmployee = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((data: unknown) => hireEmployeeSchema.parse(data))
  .handler(async ({ data, context }) => {
    const { data: roleData } = await context.supabase
      .from("user_roles")
      .select("tenant_id")
      .eq("user_id", context.userId)
      .limit(1)
      .single();

    if (!roleData?.tenant_id) throw new Error("Tenant not found");

    const { data: employee, error } = await context.supabase
      .from("employees")
      .insert({
        tenant_id: roleData.tenant_id,
        ...data,
        status: 'active'
      })
      .select()
      .single();

    if (error) throw error;

    await logAudit(context.supabase, {
      user_id: context.userId,
      tenant_id: roleData.tenant_id,
      action: "insert",
      entity_name: "employees",
      entity_id: employee.id,
      new_data: employee,
    });

    return employee;
  });

export const getDepartments = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("departments")
      .select("*")
      .order("name");
    
    if (error) throw error;
    return data;
  });

export const getJobPositions = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("job_positions")
      .select("*, departments(name)")
      .order("title");
    
    if (error) throw error;
    return data;
  });

export const getPayrollRecords = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("payroll_records")
      .select("*, employees(full_name)")
      .order("period_year", { ascending: false })
      .order("period_month", { ascending: false });
    
    if (error) throw error;
    return data;
  });

export const generatePayroll = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((data: unknown) => generatePayrollSchema.parse(data))
  .handler(async ({ data, context }) => {
    const { data: employee, error: empError } = await context.supabase
      .from("employees")
      .select("tenant_id, salary")
      .eq("id", data.employee_id)
      .single();

    if (empError || !employee) throw new Error("Employee not found");

    const netSalary = employee.salary + data.additions - data.deductions;

    const { data: record, error } = await context.supabase
      .from("payroll_records")
      .insert({
        tenant_id: employee.tenant_id,
        employee_id: data.employee_id,
        period_month: data.month,
        period_year: data.year,
        base_salary: employee.salary,
        additions: data.additions,
        deductions: data.deductions,
        net_salary: netSalary,
        status: 'pending'
      })
      .select()
      .single();

    if (error) throw error;

    await logAudit(context.supabase, {
      user_id: context.userId,
      tenant_id: employee.tenant_id,
      action: "insert",
      entity_name: "payroll_records",
      entity_id: record.id,
      new_data: record,
    });

    return record;
  });
