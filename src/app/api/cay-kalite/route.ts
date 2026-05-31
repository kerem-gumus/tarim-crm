export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { auditOlustur } from '@/lib/auditKullanici'
import { logKaydet } from '@/lib/aktiviteLog'

export async function GET(istek: NextRequest) {
  try {
    const { searchParams } = new URL(istek.url)
    const tarlaId = searchParams.get('tarlaId')
    const baslangic = searchParams.get('baslangic')
    const bitis = searchParams.get('bitis')

    const kayitlar = await prisma.cayKalite.findMany({
      where: {
        aktif: { not: false },
        ...(tarlaId && { tarlaId }),
        ...(baslangic && bitis && {
          tarih: {
            gte: new Date(baslangic),
            lte: new Date(bitis),
          },
        }),
      },
      include: {
        tarla: {
          select: { id: true, tarlaAdi: true, konumIlce: true },
        },
        hasatGirisi: {
          select: { id: true, tartimMiktariKg: true },
        },
      },
      orderBy: { tarih: 'desc' },
    })
    return NextResponse.json(kayitlar)
  } catch {
    return NextResponse.json({ hata: 'Kalite kayıtları getirilemedi' }, { status: 500 })
  }
}

export async function POST(istek: Request) {
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

    if (!tarih || !agirlikKg || !yaprakNotu || !genelNot) {
      return NextResponse.json(
        { hata: 'Tarih, ağırlık, yaprak notu ve genel not zorunludur' },
        { status: 400 }
      )
    }

    if (yaprakNotu < 1 || yaprakNotu > 5 || genelNot < 1 || genelNot > 5) {
      return NextResponse.json({ hata: 'Notlar 1-5 arasında olmalıdır' }, { status: 400 })
    }

    const audit = await auditOlustur()
    const yeniKayit = await prisma.cayKalite.create({
      data: {
        tarih: new Date(tarih),
        tarlaId: tarlaId || null,
        hasatGirisiId: hasatGirisiId || null,
        toplamaYontemi: toplamaYontemi ?? 'elle',
        agirlikKg,
        yaprakNotu,
        nemOrani: nemOrani ?? null,
        fizikselHata: fizikselHata ?? null,
        renk: renk || null,
        koku: koku || null,
        genelNot,
        havaScaklik: havaScaklik ?? null,
        havaNem: havaNem ?? null,
        notlar: notlar || null,
        ...audit,
      },
      include: {
        tarla: { select: { id: true, tarlaAdi: true, konumIlce: true } },
      },
    })

    logKaydet({
      islemTipi: 'olusturma',
      modul: 'cay-kalite',
      tablo: 'cay_kalite',
      kayitId: yeniKayit.id,
      yeniDeger: yeniKayit,
    }).catch(console.error)

    return NextResponse.json(yeniKayit, { status: 201 })
  } catch {
    return NextResponse.json({ hata: 'Kalite kaydı oluşturulamadı' }, { status: 500 })
  }
}
