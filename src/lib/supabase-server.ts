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
            cerezlerAyarlanacak.forEach(({ name, value, options }) =>
              cookieStosu.set(name, value, options),
            );
          } catch {
            // Server Component içinden çağrıldığında setAll çalışmaz — bu beklenen davranıştır.
          }
        },
      },
    },
  );
}
