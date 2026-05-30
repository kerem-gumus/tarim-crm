import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { auditOlustur } from '@/lib/auditKullanici'

// Bir doneme kayitli ciftcileri getir (tarlalariyla birlikte)
export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const donemCiftciler = await prisma.hasatDonemCiftci.findMany({
      where: { hasatDonemiId: id, aktif: { not: false } },
      include: {
        ciftci: {
          include: {
            tarlalar: { where: { aktif: { not: false }, durum: 'aktif' } },
          },
        },
        budamaBilgisi: true,
      },
      orderBy: { ciftci: { adSoyad: 'asc' } },
    })
    // Her ciftci icin kendi tarlalari + kiraci oldugu tarlalari topla
    const ciftciIdler = donemCiftciler.map((dc) => dc.ciftciId)
    const kiraliTarlalar = await prisma.tarla.findMany({
      where: {
        kiraciCiftciId: { in: ciftciIdler },
        aktif: { not: false },
        durum: 'aktif',
      },
      select: { kiraciCiftciId: true, donum: true },
    })

    return NextResponse.json(donemCiftciler.map((dc) => {
      const kisiselDonum = dc.ciftci.tarlalar.reduce((s, t) => s + Number(t.donum), 0)
      const kiraliDonum = kiraliTarlalar
        .filter((t) => t.kiraciCiftciId === dc.ciftciId)
        .reduce((s, t) => s + Number(t.donum), 0)
      return {
        ...dc,
        toplamDonum: dc.toplamDonum ? Number(dc.toplamDonum) : null,
        ciftciToplamDonum: kisiselDonum + kiraliDonum,
        kisiselDonum,
        kiraliDonum,
      }
    }))
  } catch {
    return NextResponse.json({ hata: 'Çiftçiler getirilemedi' }, { status: 500 })
  }
}

// Doneme ciftci ekle (toplu olarak)
export async function POST(istek: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const { ciftciIdler } = await istek.json() // string[]

    if (!Array.isArray(ciftciIdler) || ciftciIdler.length === 0) {
      return NextResponse.json({ hata: 'En az bir çiftçi seçilmelidir' }, { status: 400 })
    }

    const audit = await auditOlustur()

    // Her ciftci icin tarlalarin donum toplamini hesapla, upsert yap
    const sonuclar = await Promise.all(
      ciftciIdler.map(async (ciftciId: string) => {
        // Kendi tarlalari + kiraci oldugu tarlalar
        const [kisiselTarlalar, kiraliTarlalarList] = await Promise.all([
          prisma.tarla.findMany({
            where: { ciftciId, aktif: { not: false }, durum: 'aktif' },
            select: { donum: true },
          }),
          prisma.tarla.findMany({
            where: { kiraciCiftciId: ciftciId, aktif: { not: false }, durum: 'aktif' },
            select: { donum: true },
          }),
        ])
        const toplamDonum =
          kisiselTarlalar.reduce((s, t) => s + Number(t.donum), 0) +
          kiraliTarlalarList.reduce((s, t) => s + Number(t.donum), 0)

        // Zaten varsa aktif et, yoksa olustur
        const mevcut = await prisma.hasatDonemCiftci.findUnique({
          where: { hasatDonemiId_ciftciId: { hasatDonemiId: id, ciftciId } },
        })
        if (mevcut) {
          return prisma.hasatDonemCiftci.update({
            where: { id: mevcut.id },
            data: { aktif: true, toplamDonum },
          })
        }
        return prisma.hasatDonemCiftci.create({
          data: {
            hasatDonemiId: id,
            ciftciId,
            toplamDonum,
            olusturanId: audit.olusturanId ?? null,
            olusturanAdi: audit.olusturanAdi ?? null,
          },
        })
      })
    )

    return NextResponse.json({ eklenen: sonuclar.length }, { status: 201 })
  } catch {
    return NextResponse.json({ hata: 'Çiftçiler eklenemedi' }, { status: 500 })
  }
}

// Doneme kayitli ciftciyi cikar (soft delete)
export async function DELETE(istek: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const { searchParams } = new URL(istek.url)
    const donemCiftciId = searchParams.get('donemCiftciId')
    if (!donemCiftciId) return NextResponse.json({ hata: 'donemCiftciId gerekli' }, { status: 400 })

    await prisma.hasatDonemCiftci.update({
      where: { id: donemCiftciId },
      data: { aktif: false },
    })
    return NextResponse.json({ basarili: true })
  } catch {
    return NextResponse.json({ hata: 'Çiftçi çıkarılamadı' }, { status: 500 })
  }
}
