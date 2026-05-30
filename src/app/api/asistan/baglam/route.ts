import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET() {
  try {
    const [
      aktifSurgun,
      toplamCiftci,
      toplamTarla,
      sonHasatlar,
      odenmemisAlacak,
      kritikStoklar,
    ] = await Promise.all([
      prisma.surgun.findFirst({ where: { durum: 'aktif' }, include: { hasatDonemi: true } }),
      prisma.ciftci.count({ where: { durum: 'aktif' } }),
      prisma.tarla.count({ where: { durum: 'aktif' } }),
      prisma.hasatGirisi.findMany({ orderBy: { olusturmaTarihi: 'desc' }, take: 5, include: { tarla: true, surgun: true } }),
      prisma.gelirKaydi.aggregate({ where: { odemeDurumu: { not: 'odendi' } }, _sum: { kalanTutar: true } }),
      prisma.malzeme.findMany({ where: { durum: 'aktif' } }),
    ])

    const kritik = kritikStoklar.filter(m => Number(m.mevcutStok) <= Number(m.minimumStok))

    const ozet = [
      aktifSurgun
        ? `Aktif sürgün: ${aktifSurgun.surgunAdi} (${aktifSurgun.hasatDonemi.donemAdi}), toplam hasat: ${Number(aktifSurgun.toplamHasatKg).toLocaleString('tr-TR')} kg`
        : 'Aktif sürgün yok',
      `Toplam aktif çiftçi: ${toplamCiftci}, tarla: ${toplamTarla}`,
      `Son 5 hasat: ${sonHasatlar.map(h => `${h.tarla?.tarlaAdi ?? 'Kontenjan'} ${Number(h.tartimMiktariKg)}kg`).join(', ')}`,
      `Ödenmemiş alacak: ${Number(odenmemisAlacak._sum.kalanTutar ?? 0).toLocaleString('tr-TR')} TL`,
      kritik.length > 0
        ? `Kritik stok uyarısı: ${kritik.map(m => m.malzemeAdi).join(', ')}`
        : 'Stok durumu normal',
    ].join('\n')

    return NextResponse.json({ ozet })
  } catch {
    return NextResponse.json({ ozet: '' })
  }
}
