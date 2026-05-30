import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

// =====================================================
// Aktif kontenjanları getirir
// Opsiyonel filtreler: surgunId, musteriId, tarih
// Hasat girişi formunda belirli bir tarih+surgun+musteri
// kombinasyonu için tek kontenjan sorgulamak üzere kullanılır
// =====================================================

export async function GET(istek: NextRequest) {
  try {
    const { searchParams } = new URL(istek.url)
    const musteriId = searchParams.get('musteriId')
    const surgunId = searchParams.get('surgunId')
    const tarihParam = searchParams.get('tarih')
    const tekKayit = searchParams.get('tek') === '1'  // Tek sonuç döndür mü?

    const tarihDate = tarihParam ? new Date(tarihParam) : new Date()
    tarihDate.setHours(0, 0, 0, 0)

    const where = {
      durum: 'aktif' as const,
      aktif: { not: false },
      baslangicTarihi: { lte: tarihDate },
      OR: [
        { bitisTarihi: null },
        { bitisTarihi: { gte: tarihDate } },
      ] as [Record<string, unknown>, Record<string, unknown>],
      ...(musteriId ? { musteriId } : {}),
      ...(surgunId ? { surgunId } : {}),
    }

    if (tekKayit) {
      // Tek kontenjan getir (form otomatik algılama için)
      const kontenjan = await prisma.kontenjan.findFirst({
        where,
        include: {
          surgun: { select: { id: true, surgunAdi: true } },
          musteri: { select: { id: true, musteriAdi: true, devletMi: true } },
          gunlukTakip: {
            where: { aktif: true },
            orderBy: [{ tarih: 'desc' }, { olusturmaTarihi: 'desc' }],
            take: 1,
          },
        },
      })

      if (!kontenjan) return NextResponse.json(null)

      const sonTakip = kontenjan.gunlukTakip[0] ?? null
      const oncekiBakiyeKg = sonTakip ? Number(sonTakip.kalanBakiyeKg) : 0
      const gunlukKontenjanKg = Number(kontenjan.gunlukKontenjanKg)

      return NextResponse.json({
        id: kontenjan.id,
        surgunId: kontenjan.surgunId,
        musteriId: kontenjan.musteriId,
        musteriAdi: kontenjan.musteri.musteriAdi,
        musteriDevletMi: kontenjan.musteri.devletMi,
        gunlukKontenjanKg,
        baslangicTarihi: kontenjan.baslangicTarihi,
        bitisTarihi: kontenjan.bitisTarihi,
        oncekiBakiyeKg,
        sonTakipTarih: sonTakip?.tarih ?? null,
      })
    }

    // Tüm kontenjanlar listesi
    const kontenjanlar = await prisma.kontenjan.findMany({
      where,
      include: {
        surgun: true,
        musteri: true,
        gunlukTakip: {
          orderBy: { tarih: 'desc' },
          take: 1,
        },
      },
    })

    const sonuc = kontenjanlar.map((k) => {
      const sonTakip = k.gunlukTakip[0] ?? null
      const oncekiBakiyeKg = sonTakip ? Number(sonTakip.kalanBakiyeKg) : 0
      const gunlukKontenjanKg = Number(k.gunlukKontenjanKg)

      return {
        kontenjanId: k.id,
        surgun: k.surgun,
        musteri: k.musteri,
        gunlukKontenjanKg,
        oncekiBakiyeKg,
        sonTakipTarih: sonTakip?.tarih ?? null,
      }
    })

    return NextResponse.json(sonuc)
  } catch {
    return NextResponse.json({ hata: 'Aktif kontenjanlar getirilemedi' }, { status: 500 })
  }
}
