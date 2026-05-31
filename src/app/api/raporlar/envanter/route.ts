export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET(istek: NextRequest) {
  try {
    const { searchParams } = new URL(istek.url)
    const kategori = searchParams.get('kategori')
    const baslangic = searchParams.get('baslangic')
    const bitis = searchParams.get('bitis')

    const where: Record<string, unknown> = {}
    if (kategori) where.kategori = kategori

    const malzemeler = await prisma.malzeme.findMany({
      where,
      include: {
        stokHareketleri: {
          orderBy: { tarih: 'desc' },
          select: {
            id: true, hareketTipi: true, miktar: true, tarih: true,
            birimFiyat: true, toplamTutar: true,
            olusturmaTarihi: true,
          },
        },
      },
      orderBy: { malzemeAdi: 'asc' },
    })

    const tarihAlt = baslangic ? new Date(baslangic) : null
    const tarihUst = bitis ? (() => { const b = new Date(bitis); b.setHours(23, 59, 59, 999); return b })() : null

    const veri = malzemeler.map((m) => {
      const hareketler = m.stokHareketleri.filter((h) => {
        if (tarihAlt && new Date(h.tarih) < tarihAlt) return false
        if (tarihUst && new Date(h.tarih) > tarihUst) return false
        return true
      })

      // Periyot içi kullanım
      const donemCikis = hareketler.filter((h) => h.hareketTipi === 'cikis')
        .reduce((s, h) => s + Number(h.miktar), 0)
      const donemGiris = hareketler.filter((h) => h.hareketTipi === 'giris')
        .reduce((s, h) => s + Number(h.miktar), 0)
      const donemHarcama = hareketler.filter((h) => h.hareketTipi === 'cikis')
        .reduce((s, h) => s + Number(h.toplamTutar ?? 0), 0)

      // Aylık kullanım dağılımı (cikis hareketleri)
      const aylikMap = new Map<string, number>()
      for (const h of m.stokHareketleri.filter((h) => h.hareketTipi === 'cikis')) {
        const ay = new Date(h.tarih).toISOString().slice(0, 7) // YYYY-MM
        aylikMap.set(ay, (aylikMap.get(ay) ?? 0) + Number(h.miktar))
      }
      const aylikKullanim = Array.from(aylikMap.entries())
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([ay, miktar]) => ({ ay, miktar }))

      return {
        id: m.id,
        malzemeAdi: m.malzemeAdi,
        kategori: m.kategori,
        birim: m.birim,
        mevcutStok: Number(m.mevcutStok),
        minimumStok: Number(m.minimumStok),
        birimFiyat: Number(m.birimFiyat),
        kritikMi: Number(m.mevcutStok) <= Number(m.minimumStok),
        durum: m.durum,
        donemCikis,
        donemGiris,
        donemHarcama,
        aylikKullanim,
        sonHareketler: m.stokHareketleri.slice(0, 5).map((h) => ({
          id: h.id,
          hareketTipi: h.hareketTipi,
          miktar: Number(h.miktar),
          tarih: h.tarih,
          olusturmaTarihi: h.olusturmaTarihi,
        })),
      }
    })

    // Kategori özeti
    const kategoriMap = new Map<string, { toplamHarcama: number; toplamCikis: number; malzemeSayisi: number }>()
    for (const m of veri) {
      const mevcut = kategoriMap.get(m.kategori)
      if (mevcut) {
        mevcut.toplamHarcama += m.donemHarcama
        mevcut.toplamCikis += m.donemCikis
        mevcut.malzemeSayisi++
      } else {
        kategoriMap.set(m.kategori, { toplamHarcama: m.donemHarcama, toplamCikis: m.donemCikis, malzemeSayisi: 1 })
      }
    }
    const kategoriOzeti = Array.from(kategoriMap.entries())
      .map(([kategori, ozet]) => ({ kategori, ...ozet }))
      .sort((a, b) => b.toplamHarcama - a.toplamHarcama)

    const kritikMalzemeler = veri.filter((m) => m.kritikMi)

    return NextResponse.json({
      malzemeler: veri,
      kategoriOzeti,
      kritikMalzemeler,
      toplamHarcama: veri.reduce((s, m) => s + m.donemHarcama, 0),
      kritikSayisi: kritikMalzemeler.length,
      toplam: veri.length,
    })
  } catch (hata) {
    console.error('Envanter raporu hatası:', hata)
    return NextResponse.json({ hata: 'Envanter raporu alınamadı' }, { status: 500 })
  }
}
