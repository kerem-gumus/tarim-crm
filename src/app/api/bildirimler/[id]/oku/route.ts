import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function PATCH(_: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    await prisma.bildirim.update({ where: { id }, data: { okundu: true } })
    return NextResponse.json({ basarili: true })
  } catch {
    return NextResponse.json({ hata: 'Bildirim güncellenemedi' }, { status: 500 })
  }
}
