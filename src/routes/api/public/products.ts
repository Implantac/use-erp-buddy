import { createFileRoute } from '@tanstack/react-router';
import { z } from 'zod';
import { supabaseAdmin } from '@/integrations/supabase/client.server';

export const Route = createFileRoute('/api/public/products')({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const url = new URL(request.url);
        const apiKey = request.headers.get('x-api-key');

        if (!apiKey) {
          return new Response(JSON.stringify({ error: 'Missing API Key' }), { 
            status: 401,
            headers: { 'Content-Type': 'application/json' }
          });
        }

        // Validate API Key (Security Gate)
        const { data: keyData, error: keyError } = await supabaseAdmin
          .from('api_keys')
          .select('tenant_id, is_active')
          .eq('key_hash', apiKey)
          .single();

        if (keyError || !keyData?.is_active) {
          return new Response(JSON.stringify({ error: 'Invalid or inactive API Key' }), { 
            status: 403,
            headers: { 'Content-Type': 'application/json' }
          });
        }

        // Fetch products for the tenant
        const { data: products, error: productsError } = await supabaseAdmin
          .from('products')
          .select('*')
          .eq('tenant_id', keyData.tenant_id);

        if (productsError) {
          return new Response(JSON.stringify({ error: 'Database error' }), { 
            status: 500,
            headers: { 'Content-Type': 'application/json' }
          });
        }

        // Log access in audit (optional but recommended)
        await supabaseAdmin.from('api_keys').update({ last_used_at: new Date().toISOString() }).eq('key_hash', apiKey);

        return new Response(JSON.stringify(products), {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        });
      }
    }
  }
});
