import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || "https://laumagcozoqkszxzxcsh.supabase.co";
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || "";

if (!supabaseAnonKey) {
  console.warn("[Supabase] VITE_SUPABASE_ANON_KEY não foi configurada nas variáveis de ambiente.");
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
