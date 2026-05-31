import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function createSupabaseServerClient() {
  const cookieStosu = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStosu.getAll();
        },
        setAll(cerezlerAyarlanacak) {
          try {
            cerezlerAyarlanacak.forEach(({ name, value, options }) => {
              // maxAge ve expires kaldır → session cookie (tarayıcı kapanınca silinen)
              const { maxAge: _m, expires: _e, ...sessionOptions } = options ?? {};
              cookieStosu.set(name, value, sessionOptions);
            });
          } catch {
            // Server Component içinden çağrıldığında setAll çalışmaz — beklenen davranış
          }
        },
      },
    },
  );
}
