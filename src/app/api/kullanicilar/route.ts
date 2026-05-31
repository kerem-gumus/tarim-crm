export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import { createClient } from '@supabase/supabase-js'

// Admin istemcisi — sadece ihtiyaç olunca oluştur
function supabaseAdminGetir() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}

// Mevcut kullanıcıyı DB'den getir, yoksa otomatik admin olarak oluştur
async function mevcutKullaniciyiGetirVeyaOlustur(supabaseUserId: string, email: string) {
  let kullanici = await prisma.kullanici.findUnique({ where: { supabaseId: supabaseUserId } })
  if (!kullanici) {
    // DB'de hiç kullanıcı yoksa ilk kullanıcı admin olsun
    const toplamKullanici = await prisma.kullanici.count()
    kullanici = await prisma.kullanici.create({
      data: {
        supabaseId: supabaseUserId,
        eposta: email,
        adSoyad: email.split('@')[0],
        rol: toplamKullanici === 0 ? 'admin' : 'izleyici',
        sonGiris: new Date(),
      }
    })
  }
  return kullanici
}

// GET: tüm kullanıcıları listele
export async function GET() {
  try {
    const supabase = await createSupabaseServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ hata: 'Oturum yok' }, { status: 401 })

    const mevcutKullanici = await mevcutKullaniciyiGetirVeyaOlustur(user.id, user.email!)
    if (mevcutKullanici.rol !== 'admin') {
      return NextResponse.json({ hata: 'Yetersiz yetki' }, { status: 403 })
    }

    const kullanicilar = await prisma.kullanici.findMany({
      orderBy: { olusturmaTarihi: 'desc' }
    })

    return NextResponse.json(kullanicilar)
  } catch {
    return NextResponse.json({ hata: 'Kullanıcılar listelenemedi' }, { status: 500 })
  }
}

// POST: yeni kullanıcı davet et (admin)
export async function POST(req: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ hata: 'Oturum yok' }, { status: 401 })

    const mevcutKullanici = await mevcutKullaniciyiGetirVeyaOlustur(user.id, user.email!)
    if (mevcutKullanici.rol !== 'admin') {
      return NextResponse.json({ hata: 'Yetersiz yetki' }, { status: 403 })
    }

    const { eposta, adSoyad, rol, telefon } = await req.json()

    if (!eposta || !adSoyad || !rol) {
      return NextResponse.json({ hata: 'Eposta, adSoyad ve rol zorunludur' }, { status: 400 })
    }

    // Geçici şifre oluştur
    const geciciSifre = Math.random().toString(36).slice(-10) + 'Aa1!'

    // Supabase'de kullanıcı oluştur
    const supabaseAdmin = supabaseAdminGetir()
    const { data: yeniAuthUser, error: authHata } = await supabaseAdmin.auth.admin.createUser({
      email: eposta,
      password: geciciSifre,
      email_confirm: true,
      user_metadata: { ad_soyad: adSoyad },
    })

    if (authHata) return NextResponse.json({ hata: authHata.message }, { status: 400 })

    // DB'ye kaydet
    const kullanici = await prisma.kullanici.create({
      data: {
        supabaseId: yeniAuthUser.user.id,
        eposta,
        adSoyad,
        rol,
        telefon: telefon ?? null,
      }
    })

    return NextResponse.json({ kullanici, geciciSifre }, { status: 201 })
  } catch {
    return NextResponse.json({ hata: 'Kullanıcı oluşturulamadı' }, { status: 500 })
  }
}
