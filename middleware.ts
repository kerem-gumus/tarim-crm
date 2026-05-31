import { NextResponse, type NextRequest } from 'next/server';

// Supabase proje referansı (URL'den alınır)
const PROJE_REF = 'klfyjxkeobgpofcofois';
const AUTH_COOKIE = `sb-${PROJE_REF}-auth-token`;

/**
 * JWT payload'ını decode eder (imza doğrulama olmadan — sadece içerik okuma).
 * Middleware'de Supabase client kullanmıyoruz çünkü client otomatik token
 * yenileme yaparak geçersiz/süresi dolmuş oturumları uzatıyor.
 */
function jwtPayloadOku(token: string): { exp?: number; email?: string; sub?: string } | null {
  try {
    const parca = token.split('.');
    if (parca.length !== 3) return null;
    const payload = JSON.parse(Buffer.from(parca[1], 'base64url').toString('utf-8'));
    return payload;
  } catch {
    return null;
  }
}

function oturumGecerliMi(istek: NextRequest): boolean {
  // Cookie değerini oku
  const hammCerez = istek.cookies.get(AUTH_COOKIE)?.value;
  if (!hammCerez) return false;

  // Supabase cookie'si JSON string içerebilir: [accessToken, refreshToken]
  let accessToken: string | null = null;
  try {
    const parsed = JSON.parse(hammCerez);
    // Dizi formatı: ["access_token", "refresh_token"]
    if (Array.isArray(parsed)) {
      accessToken = parsed[0];
    } else if (typeof parsed === 'object' && parsed.access_token) {
      accessToken = parsed.access_token;
    }
  } catch {
    // Direkt JWT string
    accessToken = hammCerez;
  }

  if (!accessToken) return false;

  const payload = jwtPayloadOku(accessToken);
  if (!payload) return false;

  // Sona erme kontrolü
  const simdi = Math.floor(Date.now() / 1000);
  if (!payload.exp || payload.exp <= simdi) return false;

  // Kullanıcı kimliği olmalı
  if (!payload.sub) return false;

  return true;
}

export async function middleware(istek: NextRequest) {
  const yol = istek.nextUrl.pathname;
  const gecerli = oturumGecerliMi(istek);

  // Oturum açmış kullanıcı login sayfasına gelirse dashboard'a yönlendir
  if (yol === '/login' && gecerli) {
    return NextResponse.redirect(new URL('/dashboard', istek.url));
  }

  // Oturum yoksa login dışındaki her sayfa için login'e yönlendir
  if (yol !== '/login' && !gecerli) {
    const loginUrl = new URL('/login', istek.url);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|api|uploads).*)'],
};
