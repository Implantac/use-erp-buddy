import { supabaseAdmin } from "@/integrations/supabase/client.server";

export async function getAuthAttempts(identifier: string, type: string, minutes: number = 15) {
  const since = new Date(Date.now() - minutes * 60 * 1000).toISOString();
  
  console.log(`Checking attempts for ${identifier} (${type}) since ${since}`);
  
  const { count, error } = await supabaseAdmin
    .from('auth_attempts')
    .select('*', { count: 'exact', head: true })
    .eq('identifier', identifier)
    .eq('type', type)
    .gte('attempted_at', since);
    
  if (error) {
    console.error("Error fetching auth attempts:", error);
    return 0;
  }
  
  console.log(`Found ${count} attempts`);
  return count || 0;
}

export async function recordAuthAttempt(identifier: string, type: string, ip?: string) {
  console.log(`Recording failed attempt for ${identifier} (${type})`);
  const { error } = await supabaseAdmin
    .from('auth_attempts')
    .insert({
      identifier,
      type,
      ip_address: ip || null
    });
    
  if (error) {
    console.error("Error recording auth attempt:", error);
  }
}

export async function clearAuthAttempts(identifier: string, type: string) {
  console.log(`Clearing attempts for ${identifier} (${type})`);
  const { error } = await supabaseAdmin
    .from('auth_attempts')
    .delete()
    .eq('identifier', identifier)
    .eq('type', type);
    
  if (error) {
    console.error("Error clearing auth attempts:", error);
  }
}

export async function cleanupOldAttempts() {
  const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  
  const { error } = await supabaseAdmin
    .from('auth_attempts')
    .delete()
    .lt('attempted_at', twentyFourHoursAgo);
    
  if (error) {
    console.error("Error cleaning up old auth attempts:", error);
  }
}
