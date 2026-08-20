import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const authSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

export const createUserAdmin = createServerFn({ method: "POST" })
  .validator((data: z.infer<typeof authSchema>) => authSchema.parse(data))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    
    // 1. Create user in auth.users
    const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: data.email,
      password: data.password,
      email_confirm: true,
      user_metadata: { full_name: "Admin Suporte" }
    });

    if (authError) throw authError;
    if (!authUser.user) throw new Error("User creation failed");

    // 2. Create default tenant
    const { data: tenant, error: tenantError } = await supabaseAdmin
      .from('tenants')
      .insert({ name: 'Administração Use Business', slug: 'admin' })
      .select('id')
      .single();

    if (tenantError) throw tenantError;

    // 3. Assign admin role
    const { error: roleError } = await supabaseAdmin
      .from('user_roles')
      .insert({
        user_id: authUser.user.id,
        tenant_id: tenant.id,
        role: 'admin'
      });

    if (roleError) throw roleError;

    return { success: true, userId: authUser.user.id };
  });
