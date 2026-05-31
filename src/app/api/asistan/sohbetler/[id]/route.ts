export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

// GET: sohbet detayı (mesajlarla)
export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const sohbet = await prisma.asistanSohbet.findUnique({
      where: { id },
      include: { mesajlar: { orderBy: { olusturmaTarihi: 'asc' } } },
    })
    if (!sohbet) {
      return NextResponse.json({ hata: 'Sohbet bulunamadı' }, { status: 404 })
    }
    return NextResponse.json(sohbet)
  } catch (hata) {
    const mesaj = hata instanceof Error ? hata.message : 'Bilinmeyen hata'
    return NextResponse.json({ hata: `Sohbet alınamadı: ${mesaj}` }, { status: 500 })
  }
}

// DELETE: sohbeti sil (cascade ile mesajlar + tokenlar da silinir)
export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    await prisma.asistanSohbet.delete({ where: { id } })
    return NextResponse.json({ basarili: true })
  } catch (hata) {
    const mesaj = hata instanceof Error ? hata.message : 'Bilinmeyen hata'
    return NextResponse.json({ hata: `Sohbet silinemedi: ${mesaj}` }, { status: 500 })
  }
}
