import { createClient } from "@supabase/supabase-js";

const supabaseUrl =
  import.meta.env.VITE_SUPABASE_URL || "https://laumagcozoqkszxzxcsh.supabase.co";

const supabaseAnonKey =
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxhdW1hZ2Nvem9xa3N6eHp4Y3NoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTI2OTI4MDYsImV4cCI6MjEwODI2ODgwNn0.2EnX9Sf9V3qWTkT8N3YIS7TptTxHY7kIHcE1QDiHiq4";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
