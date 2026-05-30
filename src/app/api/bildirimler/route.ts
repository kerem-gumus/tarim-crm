import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET() {
  try {
    const bildirimler = await prisma.bildirim.findMany({
      orderBy: [{ okundu: 'asc' }, { olusturmaTarihi: 'desc' }],
      take: 50,
    })
    const okunmamisSayisi = await prisma.bildirim.count({ where: { okundu: false } })
    return NextResponse.json({ bildirimler, okunmamisSayisi })
  } catch {
    return NextResponse.json({ hata: 'Bildirimler getirilemedi' }, { status: 500 })
  }
}

export async function POST(istek: Request) {
  try {
    const { tip, baslik, mesaj, oncelik, ilgiliModul, ilgiliKayitId } = await istek.json()
    const bildirim = await prisma.bildirim.create({
      data: { tip, baslik, mesaj, oncelik, ilgiliModul, ilgiliKayitId },
    })
    return NextResponse.json(bildirim, { status: 201 })
  } catch {
    return NextResponse.json({ hata: 'Bildirim oluşturulamadı' }, { status: 500 })
  }
}
