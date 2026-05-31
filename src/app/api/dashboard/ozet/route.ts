export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET() {
  try {
    const bugun = new Date()
    bugun.setHours(0, 0, 0, 0)
    const yarin = new Date(bugun)
    yarin.setDate(yarin.getDate() + 1)

    const otuzGunOnce = new Date(bugun)
    otuzGunOnce.setDate(otuzGunOnce.getDate() - 30)

    const [
      aktifSurgunSayisi,
      bugunHasatAggregate,
      toplamHasatBuSezon,
      toplamGelir,
      toplamGider,
      sonOtuzGunHasatRaw,
      _kritikStokPlaceholder,
      aktifKontenjanSayisi,
      odenmemisAlacakRaw,
      odenmemisBorcRaw,
    ] = await Promise.all([
      // Aktif sürgün sayısı
      prisma.surgun.count({
        where: { durum: 'aktif' },
      }),

      // Bugün hasat kg ve giriş sayısı (tarih = gerçek hasat tarihi)
      prisma.hasatGirisi.aggregate({
        where: {
          aktif: { not: false },
          tarih: {
            gte: bugun,
            lt: yarin,
          },
        },
        _sum: { tartimMiktariKg: true },
        _count: { id: true },
      }),

      // Bu sezon (tüm aktif dönemlerdeki sürgünlerin) toplam hasat kg
      prisma.surgun.aggregate({
        where: {
          hasatDonemi: { durum: 'aktif' },
        },
        _sum: { toplamHasatKg: true },
      }),

      // Toplam gelir (sadece aktif kayıtlar)
      prisma.gelirKaydi.aggregate({
        where: { aktif: true },
        _sum: { toplamTutar: true },
      }),

      // Toplam gider
      prisma.odemeKaydi.aggregate({
        where: { aktif: true },
        _sum: { tutar: true },
      }),

      // Son 30 günün günlük hasat girişleri (gerçek hasat tarihi)
      prisma.hasatGirisi.findMany({
        where: {
          aktif: { not: false },
          tarih: { gte: otuzGunOnce },
        },
        select: {
          tarih: true,
          tartimMiktariKg: true,
        },
        orderBy: { tarih: 'asc' },
      }),

      // Kritik stoklar (raw query ile alan karşılaştırması)
      Promise.resolve(null),

      // Aktif kontenjan sayısı
      prisma.kontenjan.count({
        where: { durum: 'aktif', aktif: true },
      }),

      // Ödenmemiş alacak
      prisma.gelirKaydi.aggregate({
        where: {
          odemeDurumu: { in: ['odeme_bekleniyor', 'kismi_odendi'] },
        },
        _sum: {
          toplamTutar: true,
          odenenTutar: true,
        },
      }),

      // Ödenmemiş borç
      prisma.odemeKaydi.aggregate({
        where: {
          aktif: true,
          odemeDurumu: { in: ['odeme_bekleniyor', 'kismi_odendi'] },
        },
        _sum: {
          tutar: true,
          odenenTutar: true,
        },
      }),
    ])

    // Kritik stokları manuel filtrele (Prisma field karşılaştırması için)
    const kritikStokManuel = await prisma.$queryRaw<
      {
        id: string
        malzeme_adi: string
        mevcut_stok: number
        minimum_stok: number
        birim: string
      }[]
    >`
      SELECT id, malzeme_adi, mevcut_stok, minimum_stok, birim
      FROM malzemeler
      WHERE mevcut_stok <= minimum_stok
      ORDER BY mevcut_stok ASC
      LIMIT 10
    `

    // Son 30 gün hasat — günlük gruplama
    const gunlukMap = new Map<string, number>()
    for (const giris of sonOtuzGunHasatRaw) {
      const tarih = giris.tarih.toISOString().split('T')[0]
      const mevcut = gunlukMap.get(tarih) ?? 0
      gunlukMap.set(tarih, mevcut + Number(giris.tartimMiktariKg))
    }
    const sonOtuzGunHasat = Array.from(gunlukMap.entries()).map(
      ([tarih, toplamKg]) => ({ tarih, toplamKg }),
    )

    const bugunHasatKg = Number(bugunHasatAggregate._sum.tartimMiktariKg ?? 0)
    const bugunHasatGiris = bugunHasatAggregate._count.id
    const toplamHasatKgBuSezon = Number(
      toplamHasatBuSezon._sum.toplamHasatKg ?? 0,
    )
    const netKar =
      Number(toplamGelir._sum.toplamTutar ?? 0) -
      Number(toplamGider._sum.tutar ?? 0)

    const odenmemisAlacakToplamTutar = Number(
      odenmemisAlacakRaw._sum.toplamTutar ?? 0,
    )
    const odenmemisAlacakOdenen = Number(
      odenmemisAlacakRaw._sum.odenenTutar ?? 0,
    )
    const odenmemisAlacak = odenmemisAlacakToplamTutar - odenmemisAlacakOdenen

    const odenmemisBorcToplamTutar = Number(
      odenmemisBorcRaw._sum.tutar ?? 0,
    )
    const odenmemisBorcOdenen = Number(odenmemisBorcRaw._sum.odenenTutar ?? 0)
    const odenmemisBorc = odenmemisBorcToplamTutar - odenmemisBorcOdenen

    const kritikStoklarFormatli = kritikStokManuel.map((m) => ({
      id: m.id,
      ad: m.malzeme_adi,
      mevcutStok: Number(m.mevcut_stok),
      minimumStok: Number(m.minimum_stok),
      birim: m.birim,
    }))

    return NextResponse.json({
      aktifSurgunSayisi,
      bugunHasatKg,
      bugunHasatGiris,
      toplamHasatKgBuSezon,
      netKar,
      sonOtuzGunHasat,
      kritikStoklar: kritikStoklarFormatli,
      aktifKontenjanSayisi,
      odenmemisAlacak,
      odenmemisBorc,
    })
  } catch (hata) {
    console.error('Dashboard özet hatası:', hata)
    return NextResponse.json(
      { hata: 'Veriler alınamadı' },
      { status: 500 },
    )
  }
}
