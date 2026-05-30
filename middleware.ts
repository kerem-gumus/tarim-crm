import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function middleware(istek: NextRequest) {
  let yanit = NextResponse.next({
    request: istek,
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return istek.cookies.getAll();
        },
        setAll(cerezlerAyarlanacak) {
          cerezlerAyarlanacak.forEach(({ name, value }) =>
            istek.cookies.set(name, value),
          );
          yanit = NextResponse.next({
            request: istek,
          });
          cerezlerAyarlanacak.forEach(({ name, value, options }) =>
            yanit.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  // Kullanıcı oturumunu kontrol et (getUser ile)
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Anonim kullanıcıları ve e-postasız oturumları reddet
  // Supabase "Anonymous Sign-in" açıksa is_anonymous=true gelir — bunlar geçersiz sayılır
  const gercekKullanici = user && !user.is_anonymous && !!user.email ? user : null;

  const yol = istek.nextUrl.pathname;

  // Login sayfasına giden oturum açmış kullanıcıyı ana sayfaya yönlendir
  if (yol === '/login' && gercekKullanici) {
    return NextResponse.redirect(new URL('/dashboard', istek.url));
  }

  // Login dışındaki korumalı sayfalara oturumsuz erişimi engelle
  if (yol !== '/login' && !gercekKullanici) {
    return NextResponse.redirect(new URL('/login', istek.url));
  }

  return yanit;
}

export const config = {
  matcher: [
    /*
     * API rotaları, static dosyalar ve favicon hariç tüm rotalar eşleşir.
     * Server-to-server API çağrıları için API rotaları korumasız bırakılır.
     */
    '/((?!_next/static|_next/image|favicon.ico|api).*)',
  ],
};
