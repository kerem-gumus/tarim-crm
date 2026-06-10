import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function middleware(istek: NextRequest) {
  let yanit = NextResponse.next({ request: istek });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return istek.cookies.getAll();
        },
        setAll(cerezler) {
          // İstek cookie'lerini güncelle (sonraki Server Component'ler okusun)
          cerezler.forEach(({ name, value }) => istek.cookies.set(name, value));
          // Yeni response oluştur — güncellenen cookie'leri taşısın
          yanit = NextResponse.next({ request: istek });
          cerezler.forEach(({ name, value, options }) =>
            yanit.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // getUser() access token'ı doğrular ve gerekirse refresh token ile yeniler.
  // Sonuç response cookie'lerine yazılır → kullanıcı oturumu düşmez.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const yol = istek.nextUrl.pathname;

  // Oturum açmış kullanıcı login'e gelirse dashboard'a yönlendir
  if (yol === '/login' && user) {
    return NextResponse.redirect(new URL('/dashboard', istek.url));
  }

  // Oturum yoksa korunan sayfalarda login'e yönlendir
  if (yol !== '/login' && !user) {
    return NextResponse.redirect(new URL('/login', istek.url));
  }

  return yanit;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|api|uploads).*)'],
};
