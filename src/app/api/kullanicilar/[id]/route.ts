import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import { createClient } from '@supabase/supabase-js'

function supabaseAdminGetir() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}

// PUT: rol/durum/adSoyad/telefon güncelle
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const supabase = await createSupabaseServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ hata: 'Oturum yok' }, { status: 401 })

    const mevcutKullanici = await prisma.kullanici.findUnique({ where: { supabaseId: user.id } })
    if (!mevcutKullanici || mevcutKullanici.rol !== 'admin') {
      return NextResponse.json({ hata: 'Yetersiz yetki' }, { status: 403 })
    }

    const { rol, durum, adSoyad, telefon } = await req.json()

    const guncellenen = await prisma.kullanici.update({
      where: { id },
      data: {
        ...(rol !== undefined && { rol }),
        ...(durum !== undefined && { durum }),
        ...(adSoyad !== undefined && { adSoyad }),
        ...(telefon !== undefined && { telefon }),
      }
    })

    return NextResponse.json(guncellenen)
  } catch {
    return NextResponse.json({ hata: 'Kullanıcı güncellenemedi' }, { status: 500 })
  }
}

// DELETE: Supabase'den de sil (admin API)
export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const supabase = await createSupabaseServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ hata: 'Oturum yok' }, { status: 401 })

    const mevcutKullanici = await prisma.kullanici.findUnique({ where: { supabaseId: user.id } })
    if (!mevcutKullanici || mevcutKullanici.rol !== 'admin') {
      return NextResponse.json({ hata: 'Yetersiz yetki' }, { status: 403 })
    }

    const kullanici = await prisma.kullanici.findUnique({ where: { id } })
    if (!kullanici) return NextResponse.json({ hata: 'Kullanıcı bulunamadı' }, { status: 404 })

    // Kendini silemesin
    if (kullanici.supabaseId === user.id) {
      return NextResponse.json({ hata: 'Kendi hesabınızı silemezsiniz' }, { status: 400 })
    }

    const supabaseAdmin = supabaseAdminGetir()
    await supabaseAdmin.auth.admin.deleteUser(kullanici.supabaseId)
    await prisma.kullanici.delete({ where: { id } })

    return NextResponse.json({ basarili: true })
  } catch {
    return NextResponse.json({ hata: 'Kullanıcı silinemedi' }, { status: 500 })
  }
}
