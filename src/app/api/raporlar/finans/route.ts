export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET(istek: NextRequest) {
  try {
    const { searchParams } = new URL(istek.url)
    const baslangic = searchParams.get('baslangic')
    const bitis = searchParams.get('bitis')

    const tarihFiltresi: Record<string, Date> = {}
    if (baslangic) tarihFiltresi.gte = new Date(baslangic)
    if (bitis) {
      const b = new Date(bitis); b.setHours(23, 59, 59, 999); tarihFiltresi.lte = b
    }
    const tarihWhere = Object.keys(tarihFiltresi).length > 0 ? { olusturmaTarihi: tarihFiltresi } : {}

    const [gelirKayitlari, odemeKayitlari, toplamGelirAgg, toplamGiderAgg] = await Promise.all([
      prisma.gelirKaydi.findMany({
        where: tarihWhere,
        include: { surgun: { select: { surgunAdi: true } } },
        orderBy: { olusturmaTarihi: 'desc' },
      }),
      prisma.odemeKaydi.findMany({
        where: { ...tarihWhere, aktif: true },
        orderBy: { olusturmaTarihi: 'desc' },
      }),
      prisma.gelirKaydi.aggregate({ where: tarihWhere, _sum: { toplamTutar: true } }),
      prisma.odemeKaydi.aggregate({ where: tarihWhere, _sum: { tutar: true } }),
    ])

    const gelirler = gelirKayitlari.map((g) => ({
      id: g.id,
      surgunAdi: g.surgun.surgunAdi,
      musteriAdi: g.musteriAdi,
      toplamKg: Number(g.toplamKg),
      birimFiyat: Number(g.birimFiyat),
      toplamTutar: Number(g.toplamTutar),
      odenenTutar: Number(g.odenenTutar),
      kalanTutar: Number(g.kalanTutar),
      odemeDurumu: g.odemeDurumu,
      kayitTarihi: g.olusturmaTarihi,
    }))

    const odemeler = odemeKayitlari.map((o) => ({
      id: o.id,
      kategori: o.kategori,
      aciklama: o.aciklama,
      tutar: Number(o.tutar),
      odenenTutar: Number(o.odenenTutar),
      odemeDurumu: o.odemeDurumu,
      kayitTarihi: o.olusturmaTarihi,
    }))

    const toplamGelir = Number(toplamGelirAgg._sum.toplamTutar ?? 0)
    const toplamGider = Number(toplamGiderAgg._sum.tutar ?? 0)

    // Aylık gelir/gider dağılımı
    const aylikMap = new Map<string, { gelir: number; gider: number }>()
    for (const g of gelirler) {
      const ay = new Date(g.kayitTarihi).toISOString().slice(0, 7)
      const mevcut = aylikMap.get(ay) ?? { gelir: 0, gider: 0 }
      mevcut.gelir += g.toplamTutar
      aylikMap.set(ay, mevcut)
    }
    for (const o of odemeler) {
      const ay = new Date(o.kayitTarihi).toISOString().slice(0, 7)
      const mevcut = aylikMap.get(ay) ?? { gelir: 0, gider: 0 }
      mevcut.gider += o.tutar
      aylikMap.set(ay, mevcut)
    }
    const aylikDagilim = Array.from(aylikMap.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([ay, v]) => ({ ay, gelir: v.gelir, gider: v.gider, kar: v.gelir - v.gider }))

    // Gider kategori dağılımı
    const kategoriMap = new Map<string, number>()
    for (const o of odemeler) {
      kategoriMap.set(o.kategori, (kategoriMap.get(o.kategori) ?? 0) + o.tutar)
    }
    const giderKategoriDagilim = Array.from(kategoriMap.entries())
      .map(([kategori, tutar]) => ({ kategori, tutar }))
      .sort((a, b) => b.tutar - a.tutar)

    // Ödeme durumu özeti (gelirler)
    const odemeDurumuOzet = {
      odendi: gelirler.filter((g) => g.odemeDurumu === 'odendi').reduce((s, g) => s + g.toplamTutar, 0),
      kismiOdendi: gelirler.filter((g) => g.odemeDurumu === 'kismi_odendi').reduce((s, g) => s + g.toplamTutar, 0),
      bekliyor: gelirler.filter((g) => g.odemeDurumu === 'odeme_bekleniyor').reduce((s, g) => s + g.toplamTutar, 0),
    }

    return NextResponse.json({
      gelirler,
      odemeler,
      toplamGelir,
      toplamGider,
      netKar: toplamGelir - toplamGider,
      aylikDagilim,
      giderKategoriDagilim,
      odemeDurumuOzet,
    })
  } catch (hata) {
    console.error('Finans raporu hatası:', hata)
    return NextResponse.json({ hata: 'Finans raporu alınamadı' }, { status: 500 })
  }
}
