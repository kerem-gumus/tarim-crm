export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { auditOlustur } from '@/lib/auditKullanici'

// Budama odemelerini getir
export async function GET(_: NextRequest, { params }: { params: Promise<{ budamaId: string }> }) {
  try {
    const { budamaId } = await params
    const odemeler = await prisma.budamaOdeme.findMany({
      where: { budamaBilgisiId: budamaId, aktif: { not: false } },
      orderBy: { tarih: 'desc' },
    })
    return NextResponse.json(odemeler.map((o) => ({ ...o, tutar: Number(o.tutar) })))
  } catch {
    return NextResponse.json({ hata: 'Ödemeler getirilemedi' }, { status: 500 })
  }
}

// Yeni budama odemesi ekle
export async function POST(
  istek: NextRequest,
  { params }: { params: Promise<{ id: string; budamaId: string }> }
) {
  try {
    const { budamaId } = await params
    const { tutar, tarih, aciklama, bankaHesabiId } = await istek.json()

    if (!tutar || !tarih) {
      return NextResponse.json({ hata: 'Tutar ve tarih zorunludur' }, { status: 400 })
    }

    const budama = await prisma.budamaBilgisi.findUnique({ where: { id: budamaId } })
    if (!budama) return NextResponse.json({ hata: 'Budama kaydı bulunamadı' }, { status: 404 })

    const odenenMevcut = Number(budama.odenenTutar)
    const kalanMevcut = Number(budama.kalanTutar)
    const yeniTutar = parseFloat(tutar)

    if (yeniTutar > kalanMevcut + 0.001) {
      return NextResponse.json(
        { hata: `Ödeme tutarı kalan borçtan (₺${kalanMevcut.toFixed(2)}) fazla olamaz` },
        { status: 400 }
      )
    }

    const yeniOdenen = odenenMevcut + yeniTutar
    const yeniKalan = Number(budama.hesaplananTutar) - yeniOdenen
    const yeniDurum =
      yeniKalan <= 0.001 ? 'odendi' : yeniOdenen > 0 ? 'kismi_odendi' : 'odeme_bekleniyor'

    const audit = await auditOlustur()
    const tarihDate = new Date(tarih)

    const odeme = await prisma.$transaction(async (tx) => {
      const yeniOdeme = await tx.budamaOdeme.create({
        data: {
          budamaBilgisiId: budamaId,
          tutar: yeniTutar,
          tarih: tarihDate,
          aciklama: aciklama || null,
          olusturanId: audit.olusturanId ?? null,
          olusturanAdi: audit.olusturanAdi ?? null,
        },
      })

      await tx.budamaBilgisi.update({
        where: { id: budamaId },
        data: {
          odenenTutar: yeniOdenen,
          kalanTutar: Math.max(0, yeniKalan),
          odemeDurumu: yeniDurum as 'odendi' | 'kismi_odendi' | 'odeme_bekleniyor',
          ...audit,
        },
      })

      // Banka hesabına hareketi yansıt
      if (bankaHesabiId) {
        await tx.bankaHareketi.create({
          data: {
            bankaHesabiId,
            tip: 'giris',
            tutar: yeniTutar,
            aciklama: aciklama || `Budama ödemesi`,
            tarih: tarihDate,
            referansTipi: 'budama_odeme',
            referansId: yeniOdeme.id,
            olusturanId: audit.olusturanId ?? null,
            olusturanAdi: audit.olusturanAdi ?? null,
          },
        })

        await tx.bankaHesabi.update({
          where: { id: bankaHesabiId },
          data: { bakiye: { increment: yeniTutar } },
        })
      }

      return yeniOdeme
    })

    return NextResponse.json({ ...odeme, tutar: Number(odeme.tutar) }, { status: 201 })
  } catch {
    return NextResponse.json({ hata: 'Ödeme kaydedilemedi' }, { status: 500 })
  }
}

// Odemeyi sil (soft delete) - budama tutarlarini geri al
export async function DELETE(
  istek: NextRequest,
  { params }: { params: Promise<{ budamaId: string }> }
) {
  try {
    const { budamaId } = await params
    const { searchParams } = new URL(istek.url)
    const odemeId = searchParams.get('odemeId')
    if (!odemeId) return NextResponse.json({ hata: 'odemeId gerekli' }, { status: 400 })

    const odeme = await prisma.budamaOdeme.findUnique({ where: { id: odemeId } })
    if (!odeme) return NextResponse.json({ hata: 'Ödeme bulunamadı' }, { status: 404 })

    const budama = await prisma.budamaBilgisi.findUnique({ where: { id: budamaId } })
    if (!budama) return NextResponse.json({ hata: 'Budama kaydı bulunamadı' }, { status: 404 })

    const geriAlinanTutar = Number(odeme.tutar)
    const yeniOdenen = Math.max(0, Number(budama.odenenTutar) - geriAlinanTutar)
    const yeniKalan = Number(budama.hesaplananTutar) - yeniOdenen
    const yeniDurum =
      yeniOdenen <= 0 ? 'odeme_bekleniyor' : yeniKalan > 0.001 ? 'kismi_odendi' : 'odendi'

    await prisma.$transaction([
      prisma.budamaOdeme.update({ where: { id: odemeId }, data: { aktif: false } }),
      prisma.budamaBilgisi.update({
        where: { id: budamaId },
        data: {
          odenenTutar: yeniOdenen,
          kalanTutar: yeniKalan,
          odemeDurumu: yeniDurum as 'odendi' | 'kismi_odendi' | 'odeme_bekleniyor',
        },
      }),
    ])
    return NextResponse.json({ basarili: true })
  } catch {
    return NextResponse.json({ hata: 'Ödeme silinemedi' }, { status: 500 })
  }
}
