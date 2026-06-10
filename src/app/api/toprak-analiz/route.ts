export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { randomUUID } from 'crypto'

// GET /api/toprak-analiz?tarlaId=X&yil=2024
export async function GET(istek: Request) {
  try {
    const { searchParams } = new URL(istek.url)
    const tarlaId = searchParams.get('tarlaId')
    const yil = searchParams.get('yil') ? Number(searchParams.get('yil')) : undefined

    const numuneler = await prisma.toprakNumune.findMany({
      where: {
        aktif: true,
        ...(tarlaId ? { tarlaId } : {}),
        ...(yil ? { yil } : {}),
      },
      include: {
        tarla: { select: { id: true, tarlaAdi: true, konumIl: true, konumIlce: true } },
        sonuc: true,
      },
      orderBy: [{ yil: 'desc' }, { alinmaTarihi: 'desc' }, { numuneNo: 'asc' }],
    })

    return NextResponse.json(numuneler)
  } catch (err) {
    console.error('[toprak-analiz GET]', err)
    return NextResponse.json({ hata: 'Numuneler getirilemedi' }, { status: 500 })
  }
}

// POST /api/toprak-analiz — Tarlaya 3 numune kaydı oluştur
// Body: { tarlaId, yil, alinmaTarihi }
export async function POST(istek: Request) {
  try {
    const { tarlaId, yil, alinmaTarihi } = await istek.json()

    if (!tarlaId || !yil || !alinmaTarihi) {
      return NextResponse.json({ hata: 'tarlaId, yil ve alinmaTarihi zorunludur' }, { status: 400 })
    }

    // Bu tarla+yıl için zaten numune var mı?
    const mevcutSayisi = await prisma.toprakNumune.count({
      where: { tarlaId, yil: Number(yil), aktif: true },
    })
    if (mevcutSayisi > 0) {
      return NextResponse.json(
        { hata: `${yil} yılı için bu tarlada zaten ${mevcutSayisi} numune var.` },
        { status: 400 }
      )
    }

    const tarla = await prisma.tarla.findUnique({ where: { id: tarlaId }, select: { tarlaAdi: true } })
    const tarlaKisa = (tarla?.tarlaAdi ?? 'T').slice(0, 4).toUpperCase().replace(/\s/g, '')

    // 3 numune oluştur
    const numuneler = await Promise.all(
      [1, 2, 3].map((numuneNo) =>
        prisma.toprakNumune.create({
          data: {
            tarlaId,
            yil: Number(yil),
            numuneNo,
            barkod: `${tarlaKisa}-${yil}-N${numuneNo}-${randomUUID().slice(0, 6).toUpperCase()}`,
            alinmaTarihi: new Date(alinmaTarihi),
          },
          include: { tarla: { select: { id: true, tarlaAdi: true } } },
        })
      )
    )

    return NextResponse.json(numuneler, { status: 201 })
  } catch (err) {
    console.error('[toprak-analiz POST]', err)
    return NextResponse.json({ hata: 'Numune kaydedilemedi' }, { status: 500 })
  }
}
