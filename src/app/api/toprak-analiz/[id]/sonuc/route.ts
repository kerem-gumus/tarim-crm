export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

// POST /api/toprak-analiz/[id]/sonuc — Lab sonucu gir
// Body: { ph, organikMadde, azot, fosfor, potasyum, kalsiyum, magnezyum, sonucTarihi, birlesik? }
// birlesik=true ise aynı tarla+yıl gruptaki tüm numunelere aynı sonucu yaz
export async function POST(istek: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const { ph, organikMadde, azot, fosfor, potasyum, kalsiyum, magnezyum, sonucTarihi, birlesik } = await istek.json()

    if (!sonucTarihi) {
      return NextResponse.json({ hata: 'sonucTarihi zorunludur' }, { status: 400 })
    }

    const numune = await prisma.toprakNumune.findUnique({ where: { id } })
    if (!numune) return NextResponse.json({ hata: 'Numune bulunamadı' }, { status: 404 })

    const analizData = {
      ph: ph != null ? Number(ph) : null,
      organikMadde: organikMadde != null ? Number(organikMadde) : null,
      azot: azot != null ? Number(azot) : null,
      fosfor: fosfor != null ? Number(fosfor) : null,
      potasyum: potasyum != null ? Number(potasyum) : null,
      kalsiyum: kalsiyum != null ? Number(kalsiyum) : null,
      magnezyum: magnezyum != null ? Number(magnezyum) : null,
      sonucTarihi: new Date(sonucTarihi),
    }

    // Birleşik mod: aynı tarla+yıl gruptaki tüm numunelere yaz
    if (birlesik) {
      const gruptakiler = await prisma.toprakNumune.findMany({
        where: { tarlaId: numune.tarlaId, yil: numune.yil, aktif: true },
        select: { id: true },
      })

      await Promise.all(
        gruptakiler.map(async (n) => {
          await prisma.toprakAnaliz.upsert({
            where: { numuneId: n.id },
            update: analizData,
            create: { numuneId: n.id, ...analizData },
          })
          await prisma.toprakNumune.update({
            where: { id: n.id },
            data: { durum: 'sonuclandi' },
          })
        })
      )
    } else {
      await prisma.toprakAnaliz.upsert({
        where: { numuneId: id },
        update: analizData,
        create: { numuneId: id, ...analizData },
      })
      await prisma.toprakNumune.update({
        where: { id },
        data: { durum: 'sonuclandi' },
      })
    }

    const guncellenmis = await prisma.toprakNumune.findUnique({
      where: { id },
      include: { sonuc: true },
    })

    return NextResponse.json(guncellenmis)
  } catch (err) {
    console.error('[toprak sonuc POST]', err)
    return NextResponse.json({ hata: 'Sonuç kaydedilemedi' }, { status: 500 })
  }
}
