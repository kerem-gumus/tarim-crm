export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET(istek: NextRequest) {
  try {
    const { searchParams } = new URL(istek.url)
    const baslangic = searchParams.get('baslangic')
    const bitis = searchParams.get('bitis')
    const ekipmanId = searchParams.get('ekipmanId')

    const tarihAlt = baslangic ? new Date(baslangic) : null
    const tarihUst = bitis ? (() => { const b = new Date(bitis); b.setHours(23, 59, 59, 999); return b })() : null

    const giderWhere: Record<string, unknown> = {}
    const gelirWhere: Record<string, unknown> = {}
    if (tarihAlt || tarihUst) {
      const filtre: Record<string, Date> = {}
      if (tarihAlt) filtre.gte = tarihAlt
      if (tarihUst) filtre.lte = tarihUst
      giderWhere.tarih = filtre
      gelirWhere.tarih = filtre
    }
    if (ekipmanId) { giderWhere.ekipmanId = ekipmanId; gelirWhere.ekipmanId = ekipmanId }

    // Araç kategorisindeki ekipmanlar
    const araclar = await prisma.ekipman.findMany({
      where: { kategori: 'arac', aktif: true },
      include: {
        giderler: {
          where: giderWhere,
          orderBy: { tarih: 'desc' },
        },
        gelirler: {
          where: gelirWhere,
          orderBy: { tarih: 'desc' },
        },
      },
      orderBy: { ekipmanAdi: 'asc' },
    })

    const veri = araclar.map((a) => {
      const giderler = a.giderler.map((g) => ({
        id: g.id,
        tarih: g.tarih,
        giderTipi: g.giderTipi,
        tutar: Number(g.tutar),
        aciklama: g.aciklama,
        belgNo: g.belgNo,
      }))
      const gelirler = a.gelirler.map((g) => ({
        id: g.id,
        tarih: g.tarih,
        gelirTipi: g.gelirTipi,
        tutar: Number(g.tutar),
        aciklama: g.aciklama,
        mesafeKm: g.mesafeKm,
      }))

      const toplamGider = giderler.reduce((s, g) => s + g.tutar, 0)
      const toplamGelir = gelirler.reduce((s, g) => s + g.tutar, 0)

      // Gider tipi dağılımı
      const giderTipiMap = new Map<string, number>()
      for (const g of giderler) {
        giderTipiMap.set(g.giderTipi, (giderTipiMap.get(g.giderTipi) ?? 0) + g.tutar)
      }
      const giderTipiDagilim = Array.from(giderTipiMap.entries())
        .map(([tip, tutar]) => ({ tip, tutar }))
        .sort((a, b) => b.tutar - a.tutar)

      // Gelir tipi dağılımı
      const gelirTipiMap = new Map<string, number>()
      for (const g of gelirler) {
        gelirTipiMap.set(g.gelirTipi, (gelirTipiMap.get(g.gelirTipi) ?? 0) + g.tutar)
      }
      const gelirTipiDagilim = Array.from(gelirTipiMap.entries())
        .map(([tip, tutar]) => ({ tip, tutar }))
        .sort((a, b) => b.tutar - a.tutar)

      // Aylık gider/gelir
      const aylikMap = new Map<string, { gider: number; gelir: number }>()
      for (const g of giderler) {
        const ay = new Date(g.tarih).toISOString().slice(0, 7)
        const mevcut = aylikMap.get(ay) ?? { gider: 0, gelir: 0 }
        mevcut.gider += g.tutar
        aylikMap.set(ay, mevcut)
      }
      for (const g of gelirler) {
        const ay = new Date(g.tarih).toISOString().slice(0, 7)
        const mevcut = aylikMap.get(ay) ?? { gider: 0, gelir: 0 }
        mevcut.gelir += g.tutar
        aylikMap.set(ay, mevcut)
      }
      const aylikDagilim = Array.from(aylikMap.entries())
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([ay, v]) => ({ ay, gider: v.gider, gelir: v.gelir, kar: v.gelir - v.gider }))

      // En sık bozulan parçalar (onarim giderleri)
      const onarimlar = giderler.filter((g) => g.giderTipi === 'onarim')

      return {
        id: a.id,
        ekipmanAdi: a.ekipmanAdi,
        plaka: a.plaka,
        marka: a.marka,
        model: a.model,
        kmSayaci: a.kmSayaci,
        sonBakimTarihi: a.sonBakimTarihi,
        sonrakiBakimTarihi: a.sonrakiBakimTarihi,
        toplamGider,
        toplamGelir,
        netKar: toplamGelir - toplamGider,
        giderler,
        gelirler,
        giderTipiDagilim,
        gelirTipiDagilim,
        aylikDagilim,
        onarimlar,
        yakit: giderTipiMap.get('yakit') ?? 0,
        bakim: giderTipiMap.get('bakim') ?? 0,
        onarim: giderTipiMap.get('onarim') ?? 0,
      }
    })

    // Genel toplam
    const genelGider = veri.reduce((s, a) => s + a.toplamGider, 0)
    const genelGelir = veri.reduce((s, a) => s + a.toplamGelir, 0)

    return NextResponse.json({
      araclar: veri,
      genelGider,
      genelGelir,
      genelKar: genelGelir - genelGider,
      aracSayisi: veri.length,
    })
  } catch (hata) {
    console.error('Araç raporu hatası:', hata)
    return NextResponse.json({ hata: 'Araç raporu alınamadı' }, { status: 500 })
  }
}
