import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function DELETE(
  _: NextRequest,
  { params }: { params: Promise<{ id: string; kesintiId: string }> }
) {
  try {
    const { id, kesintiId } = await params
    await prisma.hasatDonemKesinti.update({
      where: { id: kesintiId },
      data: { aktif: false },
    })
    // Net fiyatı yeniden hesapla
    const donem = await prisma.hasatDonemi.findUnique({
      where: { id },
      select: { brutFiyat: true },
    })
    if (donem?.brutFiyat) {
      const kalan = await prisma.hasatDonemKesinti.findMany({
        where: { hasatDonemiId: id, aktif: { not: false } },
        select: { yuzde: true },
      })
      const toplamYuzde = kalan.reduce((s, k) => s + Number(k.yuzde), 0)
      const netFiyat = Number(donem.brutFiyat) * (1 - toplamYuzde / 100)
      await prisma.hasatDonemi.update({ where: { id }, data: { netFiyat } })
    }
    return NextResponse.json({ basarili: true })
  } catch {
    return NextResponse.json({ hata: 'Kesinti silinemedi' }, { status: 500 })
  }
}
