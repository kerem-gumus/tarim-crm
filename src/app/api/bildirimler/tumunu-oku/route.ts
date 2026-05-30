import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function PATCH() {
  try {
    await prisma.bildirim.updateMany({ where: { okundu: false }, data: { okundu: true } })
    return NextResponse.json({ basarili: true })
  } catch {
    return NextResponse.json({ hata: 'Bildirimler güncellenemedi' }, { status: 500 })
  }
}
