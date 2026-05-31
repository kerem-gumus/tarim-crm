import { createBrowserClient } from '@supabase/ssr';

// Supabase browser client — sessionStorage kullanır
// sessionStorage tarayıcı kapanınca otomatik silinir,
// bu sayede tarayıcı kapatılınca oturum da kapanır.
function sessionStorageAdapter() {
  if (typeof window === 'undefined') return undefined;
  return {
    getItem: (key: string) => sessionStorage.getItem(key),
    setItem: (key: string, value: string) => sessionStorage.setItem(key, value),
    removeItem: (key: string) => sessionStorage.removeItem(key),
  };
}

export const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  {
    auth: {
      storage: sessionStorageAdapter(),
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  }
);
