import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

const PROJE_REF = 'klfyjxkeobgpofcofois';

export async function POST(istek: Request) {
  const cookieStosu = await cookies();
  const yanit = NextResponse.redirect(new URL('/login', istek.url), { status: 302 });

  // 1) Supabase server-side signOut (refresh token'ı sunucuda iptal eder)
  try {
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll: () => cookieStosu.getAll(),
          setAll: (cerezler) => {
            cerezler.forEach(({ name, value, options }) =>
              yanit.cookies.set(name, value, { ...options, maxAge: 0 })
            );
          },
        },
      },
    );
    await supabase.auth.signOut({ scope: 'global' }); // Tüm cihazlardan çıkış
  } catch { /* signOut hatası önemli değil, cookie silme devam eder */ }

  // 2) Tüm Supabase cookie'lerini maxAge:0 ile sil (her iki format için)
  const silincekler = [
    `sb-${PROJE_REF}-auth-token`,
    `sb-${PROJE_REF}-auth-token-code-verifier`,
    `sb-${PROJE_REF}-refresh-token`,
    `sb-access-token`,
    `sb-refresh-token`,
  ];

  // Mevcut request cookie'lerindeki sb- ile başlayan HEPSİNİ de sil
  cookieStosu.getAll().forEach((c) => {
    if (c.name.startsWith('sb-')) {
      silincekler.push(c.name);
    }
  });

  // Tekrar eden isimleri temizle
  [...new Set(silincekler)].forEach((isim) => {
    yanit.cookies.set(isim, '', {
      maxAge: 0,
      path: '/',
      httpOnly: false,
      sameSite: 'lax',
    });
    // httpOnly varyantı için de sil
    yanit.cookies.set(isim, '', {
      maxAge: 0,
      path: '/',
      httpOnly: true,
      sameSite: 'lax',
    });
  });

  return yanit;
}
