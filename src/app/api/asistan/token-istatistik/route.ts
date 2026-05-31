export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET() {
  try {
    const [toplamKullanim, saglayiciBazli, sonYediGun, toplamMaliyet] = await Promise.all([
      prisma.tokenKullanim.aggregate({
        _sum: { girilenToken: true, cikanToken: true, toplamToken: true },
      }),
      prisma.tokenKullanim.groupBy({
        by: ['saglayi', 'model'],
        _sum: { toplamToken: true, tahminiMaliyet: true },
      }),
      prisma.tokenKullanim.groupBy({
        by: ['tarih'],
        _sum: { toplamToken: true },
        orderBy: { tarih: 'desc' },
        take: 7,
      }),
      prisma.tokenKullanim.aggregate({
        _sum: { tahminiMaliyet: true },
      }),
    ])

    return NextResponse.json({
      toplamKullanim: toplamKullanim._sum,
      saglayiciBazli,
      sonYediGun,
      toplamMaliyetUsd: Number(toplamMaliyet._sum.tahminiMaliyet ?? 0),
    })
  } catch (hata) {
    const mesaj = hata instanceof Error ? hata.message : 'Bilinmeyen hata'
    return NextResponse.json({ hata: `İstatistikler alınamadı: ${mesaj}` }, { status: 500 })
  }
}
