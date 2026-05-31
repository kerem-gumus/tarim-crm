import { createBrowserClient } from '@supabase/ssr';

// createBrowserClient cookie tabanlı oturum yönetimi yapar.
// Cookie'ler server-side middleware tarafından okunur.
// Tarayıcı kapatma koruması OturumKorucu component'i üzerinden yapılır.
export const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
);
