import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

export const getTeamMembers = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    // Busca papéis do tenant atual (assumindo um por vez para simplificar ou filtrando depois)
    const { data: members, error } = await context.supabase
      .from("user_roles")
      .select(`
        id,
        role,
        user_id,
        profiles:user_id (
          full_name,
          avatar_url
        )
      `);

    if (error) throw error;
    return members;
  });

export const addTeamMember = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((data: { email: string; role: 'admin' | 'manager' | 'user' | 'viewer'; tenant_id: string }) => 
    z.object({
      email: z.string().email(),
      role: z.enum(['admin', 'manager', 'user', 'viewer']),
      tenant_id: z.string().uuid()
    }).parse(data)
  )
  .handler(async ({ data, context }) => {
    // Nota: Em um sistema real, aqui enviaríamos um convite. 
    // Para simplificar a fase de fundação, vamos buscar o usuário pelo email e associar se existir.
    
    // Importante: supabase.auth.admin requer service role, que temos via supabaseAdmin se necessário.
    // Mas vamos usar o cliente autenticado para buscar na tabela profiles se o email for público 
    // ou apenas registrar a intenção se o usuário não existir.
    
    // Por enquanto, vamos retornar um erro amigável se o fluxo de convite não estiver pronto.
    throw new Error("O fluxo de convite via email está em desenvolvimento. Por favor, adicione o UUID do usuário diretamente (em breve).");
  });

export const removeTeamMember = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((data: { id: string }) => z.object({ id: z.string().uuid() }).parse(data))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("user_roles")
      .delete()
      .eq("id", data.id);

    if (error) throw error;
    return { success: true };
  });
