import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { auditOlustur } from '@/lib/auditKullanici'

// Dönemin kesintilerini getir
export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const kesintiler = await prisma.hasatDonemKesinti.findMany({
      where: { hasatDonemiId: id, aktif: { not: false } },
      orderBy: { olusturmaTarihi: 'asc' },
    })
    return NextResponse.json(kesintiler.map((k) => ({ ...k, yuzde: Number(k.yuzde) })))
  } catch {
    return NextResponse.json({ hata: 'Kesintiler getirilemedi' }, { status: 500 })
  }
}

// Yeni kesinti ekle
export async function POST(istek: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const { kesintiAdi, yuzde } = await istek.json()

    if (!kesintiAdi || yuzde === undefined || yuzde === null) {
      return NextResponse.json({ hata: 'Kesinti adı ve yüzde zorunludur' }, { status: 400 })
    }

    const audit = await auditOlustur()
    const kesinti = await prisma.hasatDonemKesinti.create({
      data: {
        hasatDonemiId: id,
        kesintiAdi,
        yuzde: parseFloat(yuzde),
        olusturanId: audit.olusturanId ?? null,
        olusturanAdi: audit.olusturanAdi ?? null,
      },
    })

    // Net fiyatı yeniden hesapla
    await netFiyatiGuncelle(id)

    return NextResponse.json({ ...kesinti, yuzde: Number(kesinti.yuzde) }, { status: 201 })
  } catch {
    return NextResponse.json({ hata: 'Kesinti eklenemedi' }, { status: 500 })
  }
}

// Tüm kesintileri toplu güncelle (sıfırla + yeniden ekle)
export async function PUT(istek: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const { kesintiler } = await istek.json() // [{ kesintiAdi, yuzde }]

    if (!Array.isArray(kesintiler)) {
      return NextResponse.json({ hata: 'kesintiler array olmalı' }, { status: 400 })
    }

    const audit = await auditOlustur()

    // Mevcutları sil, yenilerini ekle (transaction)
    await prisma.$transaction([
      prisma.hasatDonemKesinti.updateMany({
        where: { hasatDonemiId: id },
        data: { aktif: false },
      }),
      ...kesintiler
        .filter((k: { kesintiAdi: string; yuzde: string }) => k.kesintiAdi && k.yuzde)
        .map((k: { kesintiAdi: string; yuzde: string }) =>
          prisma.hasatDonemKesinti.create({
            data: {
              hasatDonemiId: id,
              kesintiAdi: k.kesintiAdi,
              yuzde: parseFloat(k.yuzde),
              olusturanId: audit.olusturanId ?? null,
              olusturanAdi: audit.olusturanAdi ?? null,
            },
          })
        ),
    ])

    // Net fiyatı yeniden hesapla
    await netFiyatiGuncelle(id)

    const guncel = await prisma.hasatDonemKesinti.findMany({
      where: { hasatDonemiId: id, aktif: { not: false } },
      orderBy: { olusturmaTarihi: 'asc' },
    })
    return NextResponse.json(guncel.map((k) => ({ ...k, yuzde: Number(k.yuzde) })))
  } catch {
    return NextResponse.json({ hata: 'Kesintiler güncellenemedi' }, { status: 500 })
  }
}

// Brüt fiyat üzerinden net fiyatı yeniden hesapla ve dönemde güncelle
async function netFiyatiGuncelle(hasatDonemiId: string) {
  const donem = await prisma.hasatDonemi.findUnique({
    where: { id: hasatDonemiId },
    select: { brutFiyat: true },
  })
  if (!donem?.brutFiyat) return

  const kesintiler = await prisma.hasatDonemKesinti.findMany({
    where: { hasatDonemiId, aktif: { not: false } },
    select: { yuzde: true },
  })
  const toplamYuzde = kesintiler.reduce((s, k) => s + Number(k.yuzde), 0)
  const netFiyat = Number(donem.brutFiyat) * (1 - toplamYuzde / 100)

  await prisma.hasatDonemi.update({
    where: { id: hasatDonemiId },
    data: { netFiyat },
  })
}
