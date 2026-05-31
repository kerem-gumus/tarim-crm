export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { auditOlustur } from '@/lib/auditKullanici'

// Bir doneme ait tum budama bilgilerini getir
export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const budamalar = await prisma.budamaBilgisi.findMany({
      where: { hasatDonemiId: id, aktif: { not: false } },
      include: {
        ciftci: { select: { id: true, adSoyad: true, cayKurNo: true } },
        odemeler: { where: { aktif: { not: false } }, orderBy: { tarih: 'desc' } },
      },
      orderBy: { ciftci: { adSoyad: 'asc' } },
    })

    return NextResponse.json(budamalar.map((b) => ({
      ...b,
      toplamDonum: Number(b.toplamDonum),
      budananDonum: Number(b.budananDonum),
      budananM2: Number(b.budananM2),
      brutFiyat: Number(b.brutFiyat),
      hesaplananTutar: Number(b.hesaplananTutar),
      odenenTutar: Number(b.odenenTutar),
      kalanTutar: Number(b.kalanTutar),
      odemeler: b.odemeler.map((o) => ({ ...o, tutar: Number(o.tutar) })),
    })))
  } catch {
    return NextResponse.json({ hata: 'Budama bilgileri getirilemedi' }, { status: 500 })
  }
}

// Yeni budama bilgisi olustur
// Formul: budananM2 = budananDonum * 1000, hesaplananTutar = budananM2 * brutFiyat
export async function POST(istek: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: hasatDonemiId } = await params
    const { donemCiftciId, budananDonum, notlar } = await istek.json()

    if (!donemCiftciId || !budananDonum) {
      return NextResponse.json(
        { hata: 'Dönem çiftçi ve budanan dönüm zorunludur' },
        { status: 400 }
      )
    }

    // HasatDonemCiftci kaydini getir
    const donemCiftci = await prisma.hasatDonemCiftci.findUnique({
      where: { id: donemCiftciId },
    })
    if (!donemCiftci) {
      return NextResponse.json({ hata: 'Dönem çiftçi kaydı bulunamadı' }, { status: 404 })
    }

    // HasatDonemi'nden brut fiyati al
    const donem = await prisma.hasatDonemi.findUnique({
      where: { id: hasatDonemiId },
      select: { brutFiyat: true },
    })
    if (!donem?.brutFiyat) {
      return NextResponse.json(
        { hata: 'Hasat dönemine brüt fiyat girilmemiş. Önce dönemi düzenleyip brüt fiyat girin.' },
        { status: 400 }
      )
    }

    const toplamDonum = Number(donemCiftci.toplamDonum ?? 0)
    const budananDonumSayi = parseFloat(budananDonum)
    const budananM2 = budananDonumSayi * 1000
    const brutFiyatSayi = Number(donem.brutFiyat)
    const hesaplananTutar = budananM2 * brutFiyatSayi

    const audit = await auditOlustur()
    const kayit = await prisma.budamaBilgisi.create({
      data: {
        hasatDonemiId,
        donemCiftciId,
        ciftciId: donemCiftci.ciftciId,
        toplamDonum,
        budananDonum: budananDonumSayi,
        budananM2,
        brutFiyat: brutFiyatSayi,
        hesaplananTutar,
        kalanTutar: hesaplananTutar,
        notlar: notlar || null,
        ...audit,
      },
    })

    return NextResponse.json({
      ...kayit,
      toplamDonum: Number(kayit.toplamDonum),
      budananDonum: Number(kayit.budananDonum),
      budananM2: Number(kayit.budananM2),
      brutFiyat: Number(kayit.brutFiyat),
      hesaplananTutar: Number(kayit.hesaplananTutar),
      kalanTutar: Number(kayit.kalanTutar),
    }, { status: 201 })
  } catch {
    return NextResponse.json({ hata: 'Budama bilgisi oluşturulamadı' }, { status: 500 })
  }
}
