import { createServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { z } from "zod";

export const getProfile = createServerFn({ method: "GET" })
  .inputValidator((id: string) => z.string().uuid().parse(id))
  .handler(async ({ data: userId }) => {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single();

    if (error) throw error;
    return data;
  });
