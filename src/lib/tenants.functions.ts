import { createServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";

export const getTenants = createServerFn({ method: "GET" })
  .handler(async () => {
    const { data, error } = await supabase
      .from("tenants")
      .select("*")
      .eq("is_active", true);

    if (error) throw error;
    return data;
  });
