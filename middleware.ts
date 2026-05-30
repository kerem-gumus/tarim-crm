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

  const yol = istek.nextUrl.pathname;

  // Login sayfasına giden oturum açmış kullanıcıyı ana sayfaya yönlendir
  if (yol === '/login' && user) {
    return NextResponse.redirect(new URL('/ciftciler', istek.url));
  }

  // Login dışındaki korumalı sayfalara oturumsuz erişimi engelle
  if (yol !== '/login' && !user) {
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
