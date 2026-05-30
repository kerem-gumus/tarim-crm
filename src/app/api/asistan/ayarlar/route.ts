import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

// GET: tüm ayarları getir (API anahtarları maskelenmiş)
export async function GET() {
  try {
    const ayarlar = await prisma.aiAyar.findMany()
    const maskelenmis = ayarlar.map(a => ({
      ...a,
      apiAnahtari: a.apiAnahtari ? '****' + a.apiAnahtari.slice(-4) : null,
    }))
    return NextResponse.json(maskelenmis)
  } catch (hata) {
    const mesaj = hata instanceof Error ? hata.message : 'Bilinmeyen hata'
    return NextResponse.json({ hata: `Ayarlar alınamadı: ${mesaj}` }, { status: 500 })
  }
}

// PUT: ayar kaydet
export async function PUT(istek: Request) {
  try {
    const { saglayi, apiAnahtari, varsayilanModel, aktif, ayarlar } = await istek.json()

    // Mevcut ayarı al — API anahtarı boş geldiyse mevcut değeri koru
    const mevcutAyar = await prisma.aiAyar.findUnique({ where: { saglayi } })
    const kullanilacakAnahtar =
      apiAnahtari && !apiAnahtari.startsWith('****')
        ? apiAnahtari
        : mevcutAyar?.apiAnahtari ?? null

    const guncellendi = await prisma.aiAyar.upsert({
      where: { saglayi },
      create: { saglayi, apiAnahtari: kullanilacakAnahtar, varsayilanModel, aktif, ayarlar },
      update: { apiAnahtari: kullanilacakAnahtar, varsayilanModel, aktif, ayarlar },
    })

    return NextResponse.json({
      ...guncellendi,
      apiAnahtari: guncellendi.apiAnahtari ? '****' + guncellendi.apiAnahtari.slice(-4) : null,
    })
  } catch (hata) {
    const mesaj = hata instanceof Error ? hata.message : 'Bilinmeyen hata'
    return NextResponse.json({ hata: `Ayar kaydedilemedi: ${mesaj}` }, { status: 500 })
  }
}
