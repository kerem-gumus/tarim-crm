import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { createSupabaseServerClient } from '@/lib/supabase-server'

export async function GET() {
  try {
    const supabase = await createSupabaseServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ hata: 'Oturum yok' }, { status: 401 })

    let kullanici = await prisma.kullanici.findUnique({ where: { supabaseId: user.id } })

    // İlk girişte otomatik kayıt oluştur
    if (!kullanici) {
      kullanici = await prisma.kullanici.create({
        data: {
          supabaseId: user.id,
          eposta: user.email!,
          adSoyad: user.user_metadata?.ad_soyad ?? user.email!.split('@')[0],
          rol: 'admin', // ilk kullanıcı admin olsun
          sonGiris: new Date(),
        }
      })
    } else {
      // son girişi güncelle
      await prisma.kullanici.update({
        where: { id: kullanici.id },
        data: { sonGiris: new Date() }
      })
    }

    return NextResponse.json(kullanici)
  } catch {
    return NextResponse.json({ hata: 'Kullanıcı bilgisi alınamadı' }, { status: 500 })
  }
}

export async function PUT(istek: Request) {
  try {
    const supabase = await createSupabaseServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ hata: 'Oturum yok' }, { status: 401 })

    const { adSoyad, telefon, profilFotoUrl } = await istek.json()

    const guncellendi = await prisma.kullanici.update({
      where: { supabaseId: user.id },
      data: {
        ...(adSoyad && { adSoyad }),
        ...(telefon !== undefined && { telefon }),
        ...(profilFotoUrl !== undefined && { profilFotoUrl }),
        guncellemeTarihi: new Date(),
      }
    })

    return NextResponse.json(guncellendi)
  } catch {
    return NextResponse.json({ hata: 'Profil güncellenemedi' }, { status: 500 })
  }
}
