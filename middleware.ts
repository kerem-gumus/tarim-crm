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
          yanit = NextResponse.next({ request: istek });

          cerezlerAyarlanacak.forEach(({ name, value, options }) => {
            // maxAge ve expires kaldır → session cookie olur
            // Session cookie tarayıcı kapanınca otomatik silinir
            const { maxAge: _m, expires: _e, ...sessionOptions } = options ?? {};
            yanit.cookies.set(name, value, sessionOptions);
          });
        },
      },
    },
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Anonim ve e-postasız kullanıcıları reddet
  const gercekKullanici = user && !user.is_anonymous && !!user.email ? user : null;

  const yol = istek.nextUrl.pathname;

  if (yol === '/login' && gercekKullanici) {
    return NextResponse.redirect(new URL('/dashboard', istek.url));
  }

  if (yol !== '/login' && !gercekKullanici) {
    return NextResponse.redirect(new URL('/login', istek.url));
  }

  return yanit;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|api).*)'],
};
