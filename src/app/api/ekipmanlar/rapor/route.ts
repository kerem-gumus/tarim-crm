import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET() {
  try {
    const ekipmanlar = await prisma.ekipman.findMany({
      where: { aktif: { not: false } },
      include: {
        giderler: { where: { aktif: { not: false } } },
        gelirler: { where: { aktif: { not: false } } },
      },
      orderBy: { ekipmanAdi: 'asc' },
    })

    const rapor = ekipmanlar.map((e) => {
      const toplamGider = e.giderler.reduce((s, g) => s + Number(g.tutar), 0)
      const toplamGelir = e.gelirler.reduce((s, g) => s + Number(g.tutar), 0)
      const netKar = toplamGelir - toplamGider

      // Gider tipi kırılımı
      const giderKirilim: Record<string, number> = {}
      for (const g of e.giderler) {
        giderKirilim[g.giderTipi] = (giderKirilim[g.giderTipi] ?? 0) + Number(g.tutar)
      }

      // Gelir tipi kırılımı
      const gelirKirilim: Record<string, number> = {}
      for (const g of e.gelirler) {
        gelirKirilim[g.gelirTipi] = (gelirKirilim[g.gelirTipi] ?? 0) + Number(g.tutar)
      }

      // Toplam km (nakliye)
      const toplamMesafe = e.gelirler.reduce((s, g) => s + (g.mesafeKm ?? 0), 0)

      // Toplam yakıt litre
      const toplamYakit = e.giderler
        .filter((g) => g.giderTipi === 'yakit')
        .reduce((s, g) => s + Number(g.litre ?? 0), 0)

      return {
        id: e.id,
        ekipmanAdi: e.ekipmanAdi,
        kategori: e.kategori,
        plaka: e.plaka,
        marka: e.marka,
        model: e.model,
        durum: e.durum,
        toplamGider,
        toplamGelir,
        netKar,
        giderKirilim,
        gelirKirilim,
        toplamMesafe,
        toplamYakit,
        giderSayisi: e.giderler.length,
        gelirSayisi: e.gelirler.length,
      }
    })

    return NextResponse.json(rapor)
  } catch {
    return NextResponse.json({ hata: 'Rapor alınamadı' }, { status: 500 })
  }
}
