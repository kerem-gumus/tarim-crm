import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { auditOlustur } from '@/lib/auditKullanici'

export async function GET(_: NextRequest, { params }: { params: { id: string } }) {
  try {
    const giderler = await prisma.ekipmanGider.findMany({
      where: { ekipmanId: params.id, aktif: { not: false } },
      include: { bankaHesabi: { select: { id: true, hesapAdi: true } } },
      orderBy: { tarih: 'desc' },
    })
    return NextResponse.json(giderler.map((g) => ({
      ...g,
      tutar: Number(g.tutar),
      litre: g.litre ? Number(g.litre) : null,
      hesapAdi: g.bankaHesabi?.hesapAdi ?? null,
    })))
  } catch {
    return NextResponse.json({ hata: 'Giderler getirilemedi' }, { status: 500 })
  }
}

export async function POST(istek: NextRequest, { params }: { params: { id: string } }) {
  try {
    const {
      tarih, giderTipi, tutar, aciklama, belgNo, kilometre, litre,
      bankaHesabiId, kullanilanMalzemeler,
    } = await istek.json()

    if (!tarih || !giderTipi || !tutar) {
      return NextResponse.json({ hata: 'Tarih, gider tipi ve tutar zorunludur' }, { status: 400 })
    }

    const tutarSayi = parseFloat(tutar)
    const audit = await auditOlustur()

    const kayit = await prisma.$transaction(async (tx) => {
      const yeniGider = await tx.ekipmanGider.create({
        data: {
          ekipmanId: params.id,
          tarih: new Date(tarih),
          giderTipi,
          tutar: tutarSayi,
          aciklama: aciklama || null,
          belgNo: belgNo || null,
          kilometre: kilometre || null,
          litre: litre || null,
          bankaHesabiId: bankaHesabiId || null,
          kullanilanMalzemeler: kullanilanMalzemeler ?? null,
          ...audit,
        },
      })

      // Banka hareketini kaydet
      if (bankaHesabiId) {
        await tx.bankaHareketi.create({
          data: {
            bankaHesabiId,
            tip: 'cikis',
            tutar: tutarSayi,
            aciklama: aciklama || `Ekipman gideri — ${giderTipi}`,
            tarih: new Date(tarih),
            referansTipi: 'ekipman_gider',
            referansId: yeniGider.id,
            dekontUrl: null,
            olusturanId: audit.olusturanId ?? null,
            olusturanAdi: audit.olusturanAdi ?? null,
          },
        })
        await tx.bankaHesabi.update({
          where: { id: bankaHesabiId },
          data: { bakiye: { decrement: tutarSayi } },
        })
      }

      // Kullanılan malzemelerin stoktan düşürülmesi
      if (Array.isArray(kullanilanMalzemeler) && kullanilanMalzemeler.length > 0) {
        for (const satir of kullanilanMalzemeler) {
          const malzeme = await tx.malzeme.findUnique({ where: { id: satir.malzemeId } })
          if (!malzeme) continue
          const yeniStok = Number(malzeme.mevcutStok) - Number(satir.miktar)
          await tx.malzeme.update({
            where: { id: satir.malzemeId },
            data: { mevcutStok: Math.max(0, yeniStok) },
          })
          // Stok hareketi kaydı
          await tx.stokHareketi.create({
            data: {
              malzemeId: satir.malzemeId,
              hareketTipi: 'cikis',
              miktar: Number(satir.miktar),
              notlar: `Ekipman bakımı — ${belgNo ?? yeniGider.id}`,
              tarih: new Date(tarih),
              olusturanId: audit.olusturanId ?? null,
              olusturanAdi: audit.olusturanAdi ?? null,
            },
          })
        }
      }

      return yeniGider
    })

    return NextResponse.json({ ...kayit, tutar: Number(kayit.tutar) }, { status: 201 })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ hata: 'Gider oluşturulamadı' }, { status: 500 })
  }
}

export async function DELETE(istek: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { searchParams } = new URL(istek.url)
    const giderId = searchParams.get('giderId')
    if (!giderId) return NextResponse.json({ hata: 'giderId gerekli' }, { status: 400 })
    await prisma.ekipmanGider.update({
      where: { id: giderId },
      data: { aktif: false },
    })
    return NextResponse.json({ basarili: true })
  } catch {
    return NextResponse.json({ hata: 'Gider silinemedi' }, { status: 500 })
  }
}
