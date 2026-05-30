import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET(istek: NextRequest) {
  try {
    const { searchParams } = new URL(istek.url)
    const baslangic = searchParams.get('baslangic')
    const bitis = searchParams.get('bitis')
    const hasatDonemiId = searchParams.get('hasatDonemiId')
    const surgunId = searchParams.get('surgunId')

    const tarihFiltresi: Record<string, Date> = {}
    if (baslangic) tarihFiltresi.gte = new Date(baslangic)
    if (bitis) {
      const bitisTarihi = new Date(bitis)
      bitisTarihi.setHours(23, 59, 59, 999)
      tarihFiltresi.lte = bitisTarihi
    }

    const where: Record<string, unknown> = { aktif: { not: false } }
    if (Object.keys(tarihFiltresi).length > 0) where.tarih = tarihFiltresi
    if (surgunId) where.surgunId = surgunId
    else if (hasatDonemiId) where.surgun = { hasatDonemiId }

    const hasatGirisleri = await prisma.hasatGirisi.findMany({
      where,
      include: {
        surgun: {
          select: {
            surgunAdi: true,
            surgunNo: true,
            hasatDonemiId: true,
            hasatDonemi: { select: { donemAdi: true, yil: true, netFiyat: true, brutFiyat: true } },
          },
        },
        tarla: {
          select: {
            tarlaAdi: true,
            donum: true,
            ciftci: { select: { adSoyad: true } },
          },
        },
        isciEkip: { select: { ekipAdi: true } },
        musteri: { select: { musteriAdi: true } },
      },
      orderBy: { tarih: 'asc' },
    })

    const veri = hasatGirisleri.map((g) => ({
      id: g.id,
      tarih: g.tarih,
      surgunAdi: g.surgun.surgunAdi,
      surgunNo: g.surgun.surgunNo,
      donemAdi: g.surgun.hasatDonemi.donemAdi,
      donemYil: g.surgun.hasatDonemi.yil,
      tarlaAdi: g.tarla?.tarlaAdi ?? null,
      tarlaDonum: Number(g.tarla?.donum ?? 0),
      ciftciAdSoyad: g.tarla?.ciftci?.adSoyad ?? null,
      ekipAdi: g.isciEkip?.ekipAdi ?? null,
      musteriAdi: g.musteri.musteriAdi,
      tartimMiktariKg: Number(g.tartimMiktariKg),
      satisMiktariKg: Number(g.satisMiktariKg),
      toplanmaTuru: g.toplanmaTuru,
    }))

    // Tarla bazlı özet
    const tarlaOzetMap = new Map<string, {
      tarlaAdi: string; ciftciAdSoyad: string; tarlaDonum: number;
      toplamKg: number; toplamSatisKg: number; girisAdedi: number;
    }>()
    for (const g of veri) {
      const key = g.tarlaAdi ?? 'Kontenjan'
      const mevcut = tarlaOzetMap.get(key)
      if (mevcut) {
        mevcut.toplamKg += g.tartimMiktariKg
        mevcut.toplamSatisKg += g.satisMiktariKg
        mevcut.girisAdedi++
      } else {
        tarlaOzetMap.set(key, {
          tarlaAdi: g.tarlaAdi ?? 'Kontenjan',
          ciftciAdSoyad: g.ciftciAdSoyad ?? '',
          tarlaDonum: g.tarlaDonum,
          toplamKg: g.tartimMiktariKg,
          toplamSatisKg: g.satisMiktariKg,
          girisAdedi: 1,
        })
      }
    }
    const tarlaOzeti = Array.from(tarlaOzetMap.values())
      .sort((a, b) => b.toplamKg - a.toplamKg)
      .map((t) => ({
        ...t,
        kgPerDonum: t.tarlaDonum > 0 ? t.toplamKg / t.tarlaDonum : null,
      }))

    // Günlük dağılım (tarih → kg)
    const gunlukMap = new Map<string, number>()
    for (const g of veri) {
      const tarihStr = new Date(g.tarih).toISOString().slice(0, 10)
      gunlukMap.set(tarihStr, (gunlukMap.get(tarihStr) ?? 0) + g.tartimMiktariKg)
    }
    const gunlukDagilim = Array.from(gunlukMap.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([tarih, kg]) => ({ tarih, kg }))

    // Ekip bazlı özet
    const ekipMap = new Map<string, { ekipAdi: string; toplamKg: number; girisAdedi: number }>()
    for (const g of veri) {
      const key = g.ekipAdi ?? 'Ekipsiz'
      const mevcut = ekipMap.get(key)
      if (mevcut) { mevcut.toplamKg += g.tartimMiktariKg; mevcut.girisAdedi++ }
      else ekipMap.set(key, { ekipAdi: key, toplamKg: g.tartimMiktariKg, girisAdedi: 1 })
    }
    const ekipOzeti = Array.from(ekipMap.values()).sort((a, b) => b.toplamKg - a.toplamKg)

    return NextResponse.json({
      hasatGirisleri: veri,
      tarlaOzeti,
      gunlukDagilim,
      ekipOzeti,
      toplamKg: veri.reduce((s, g) => s + g.tartimMiktariKg, 0),
      toplamSatisKg: veri.reduce((s, g) => s + g.satisMiktariKg, 0),
      toplam: veri.length,
    })
  } catch (hata) {
    console.error('Hasat raporu hatası:', hata)
    return NextResponse.json({ hata: 'Hasat raporu alınamadı' }, { status: 500 })
  }
}
