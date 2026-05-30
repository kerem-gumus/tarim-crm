import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { auditOlustur } from '@/lib/auditKullanici'

// Destekleme ödemesi kaydet
export async function POST(istek: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: hasatDonemiId } = await params
    const { tutar, tarih, aciklama } = await istek.json()

    if (!tutar || !tarih) {
      return NextResponse.json({ hata: 'Tutar ve tarih zorunludur' }, { status: 400 })
    }

    const tutarSayi = parseFloat(tutar)
    if (tutarSayi <= 0) {
      return NextResponse.json({ hata: 'Tutar 0\'dan büyük olmalıdır' }, { status: 400 })
    }

    const donem = await prisma.hasatDonemi.findUnique({
      where: { id: hasatDonemiId },
      select: {
        desteklemeAlacakTutar: true,
        desteklemeKalanTutar: true,
        desteklemeOdenenTutar: true,
      },
    })

    if (!donem?.desteklemeAlacakTutar) {
      return NextResponse.json({ hata: 'Bu döneme ait destekleme alacağı bulunmuyor' }, { status: 400 })
    }

    const kalanTutar = Number(donem.desteklemeKalanTutar ?? donem.desteklemeAlacakTutar)
    if (tutarSayi > kalanTutar + 0.001) {
      return NextResponse.json(
        { hata: `Ödeme tutarı kalan tutarı (₺${kalanTutar.toFixed(2)}) aşamaz` },
        { status: 400 }
      )
    }

    const yeniOdenenTutar = Number(donem.desteklemeOdenenTutar) + tutarSayi
    const yeniKalanTutar = Number(donem.desteklemeAlacakTutar) - yeniOdenenTutar
    const yeniDurum =
      yeniKalanTutar <= 0.001 ? 'odendi' : 'kismi_odendi'

    const audit = await auditOlustur()

    await prisma.$transaction([
      prisma.desteklemeOdeme.create({
        data: {
          hasatDonemiId,
          tutar: tutarSayi,
          tarih: new Date(tarih),
          aciklama: aciklama || null,
          olusturanId: audit.olusturanId ?? null,
          olusturanAdi: audit.olusturanAdi ?? null,
        },
      }),
      prisma.hasatDonemi.update({
        where: { id: hasatDonemiId },
        data: {
          desteklemeOdenenTutar: yeniOdenenTutar,
          desteklemeKalanTutar: yeniKalanTutar,
          desteklemeOdemeDurumu: yeniDurum,
        },
      }),
    ])

    return NextResponse.json({ basarili: true, yeniKalanTutar, yeniDurum }, { status: 201 })
  } catch {
    return NextResponse.json({ hata: 'Ödeme kaydedilemedi' }, { status: 500 })
  }
}
