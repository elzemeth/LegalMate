// TR: VEKTÖR VERİTABANI İŞLEMLERİ İÇİN SUPABASE İSTEMCİ YAPILANDIRILMASI
// EN: DATABASE CLIENT SETUP FOR LEGAL DOCUMENT STORAGE AND RETRIEVAL
import { createClient } from "@supabase/supabase-js";

// Public client for search operations (uses anon key)
export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// Admin client for admin operations (uses service role key)
export const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

// TR: YÖNETİCİ İŞLEMLERİ İÇİN GÜVENLİ İSTEMCİ OLUŞTURMA
// EN: CREATE SECURE CLIENT FOR ADMIN OPERATIONS
export function createAdminClient() {
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY environment variable is required for admin operations');
  }
  
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    }
  );
}
