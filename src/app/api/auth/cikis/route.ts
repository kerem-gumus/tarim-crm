import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function POST(istek: Request) {
  const cookieStosu = await cookies();

  // Önce redirect response'u oluştur
  const yanit = NextResponse.redirect(new URL('/login', istek.url), { status: 302 });

  // Supabase client'ı bu response'a cookie yazacak şekilde kur
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStosu.getAll();
        },
        setAll(cerezler) {
          // Cookie değişikliklerini doğrudan yanıt objesine yaz
          cerezler.forEach(({ name, value, options }) => {
            yanit.cookies.set(name, value, options);
          });
        },
      },
    },
  );

  // Oturumu kapat — Supabase setAll callback'iyle cookie'leri yanıta yazar
  await supabase.auth.signOut();

  // Güvence: sb- ile başlayan tüm Supabase cookie'lerini elle de sil
  cookieStosu.getAll()
    .filter((c) => c.name.startsWith('sb-'))
    .forEach((c) => {
      yanit.cookies.set(c.name, '', { maxAge: 0, path: '/' });
    });

  return yanit;
}
