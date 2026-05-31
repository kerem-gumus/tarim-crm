export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { createSupabaseServerClient } from '@/lib/supabase-server'

export async function GET() {
  try {
    const ayarlar = await prisma.sistemAyar.findMany({
      orderBy: { anahtar: 'asc' },
    })
    const ayarMap = Object.fromEntries(ayarlar.map((a) => [a.anahtar, a.deger]))
    return NextResponse.json(ayarMap)
  } catch {
    return NextResponse.json({ hata: 'Ayarlar alınamadı' }, { status: 500 })
  }
}

export async function POST(istek: Request) {
  try {
    const supabase = await createSupabaseServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ hata: 'Oturum yok' }, { status: 401 })

    const kullanici = await prisma.kullanici.findUnique({ where: { supabaseId: user.id } })
    if (kullanici?.rol !== 'admin') {
      return NextResponse.json({ hata: 'Sadece admin ayar değiştirebilir' }, { status: 403 })
    }

    const body = await istek.json() as Record<string, string>

    for (const [anahtar, deger] of Object.entries(body)) {
      await prisma.sistemAyar.upsert({
        where: { anahtar },
        update: { deger, guncellemeTarihi: new Date() },
        create: { anahtar, deger },
      })
    }

    return NextResponse.json({ basarili: true })
  } catch {
    return NextResponse.json({ hata: 'Ayarlar kaydedilemedi' }, { status: 500 })
  }
}
