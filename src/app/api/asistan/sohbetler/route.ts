export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

// GET: sohbet listesi
export async function GET() {
  try {
    const sohbetler = await prisma.asistanSohbet.findMany({
      orderBy: { guncellenmeTarihi: 'desc' },
      take: 20,
      include: {
        _count: { select: { mesajlar: true } },
      },
    })
    return NextResponse.json(sohbetler)
  } catch (hata) {
    const mesaj = hata instanceof Error ? hata.message : 'Bilinmeyen hata'
    return NextResponse.json({ hata: `Sohbetler alınamadı: ${mesaj}` }, { status: 500 })
  }
}
