import { createBrowserClient } from '@supabase/ssr';

// createBrowserClient oturumu cookie'ye yazar → sunucu tarafı API route'ları okuyabilir
export const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
);
