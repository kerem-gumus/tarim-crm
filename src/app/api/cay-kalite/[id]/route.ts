import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { auditGuncelle } from '@/lib/auditKullanici'
import { logKaydet } from '@/lib/aktiviteLog'

export async function PUT(istek: NextRequest, { params }: { params: { id: string } }) {
  try {
    const {
      tarih,
      tarlaId,
      hasatGirisiId,
      toplamaYontemi,
      agirlikKg,
      yaprakNotu,
      nemOrani,
      fizikselHata,
      renk,
      koku,
      genelNot,
      havaScaklik,
      havaNem,
      notlar,
    } = await istek.json()

    if (yaprakNotu && (yaprakNotu < 1 || yaprakNotu > 5)) {
      return NextResponse.json({ hata: 'Yaprak notu 1-5 arasında olmalıdır' }, { status: 400 })
    }

    const audit = await auditGuncelle()
    const guncellendi = await prisma.cayKalite.update({
      where: { id: params.id },
      data: {
        ...(tarih && { tarih: new Date(tarih) }),
        ...(tarlaId !== undefined && { tarlaId: tarlaId || null }),
        ...(hasatGirisiId !== undefined && { hasatGirisiId: hasatGirisiId || null }),
        ...(toplamaYontemi && { toplamaYontemi }),
        ...(agirlikKg !== undefined && { agirlikKg }),
        ...(yaprakNotu !== undefined && { yaprakNotu }),
        ...(nemOrani !== undefined && { nemOrani }),
        ...(fizikselHata !== undefined && { fizikselHata }),
        ...(renk !== undefined && { renk }),
        ...(koku !== undefined && { koku }),
        ...(genelNot !== undefined && { genelNot }),
        ...(havaScaklik !== undefined && { havaScaklik }),
        ...(havaNem !== undefined && { havaNem }),
        ...(notlar !== undefined && { notlar }),
        ...audit,
      },
      include: {
        tarla: { select: { id: true, tarlaAdi: true, konumIlce: true } },
      },
    })

    logKaydet({
      islemTipi: 'guncelleme',
      modul: 'cay-kalite',
      tablo: 'cay_kalite',
      kayitId: guncellendi.id,
      yeniDeger: guncellendi,
    }).catch(console.error)

    return NextResponse.json(guncellendi)
  } catch {
    return NextResponse.json({ hata: 'Kalite kaydı güncellenemedi' }, { status: 500 })
  }
}

export async function DELETE(_: NextRequest, { params }: { params: { id: string } }) {
  try {
    const audit = await auditGuncelle()
    await prisma.cayKalite.update({
      where: { id: params.id },
      data: { aktif: false, ...audit },
    })

    logKaydet({
      islemTipi: 'silme',
      modul: 'cay-kalite',
      tablo: 'cay_kalite',
      kayitId: params.id,
    }).catch(console.error)

    return NextResponse.json({ basarili: true })
  } catch {
    return NextResponse.json({ hata: 'Kalite kaydı silinemedi' }, { status: 500 })
  }
}
