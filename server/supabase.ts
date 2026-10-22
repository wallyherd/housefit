import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.SUPABASE_URL || "https://laumagcozoqkszxzxcsh.supabase.co";
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || "";

export const supabaseServer = createClient(supabaseUrl, supabaseAnonKey);
