export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET() {
  try {
    const [gelirKayitlari, odemeKayitlari] = await Promise.all([
      prisma.gelirKaydi.findMany({
        where: { aktif: true },   // ← sadece aktif kayıtlar
        include: {
          surgun: { include: { hasatDonemi: true } },
        },
        orderBy: { olusturmaTarihi: 'desc' },
      }),
      prisma.odemeKaydi.findMany({
        where: { aktif: true },
        orderBy: { olusturmaTarihi: 'desc' },
      }),
    ]);

    const odenmemisGelirler = gelirKayitlari.filter((k) => k.odemeDurumu !== 'odendi');

    const toplamAlacak = odenmemisGelirler.reduce(
      (toplam, k) => toplam + Number(k.kalanTutar),
      0
    );

    const odenmeBekleniyor = gelirKayitlari
      .filter((k) => k.odemeDurumu === 'odeme_bekleniyor')
      .reduce((toplam, k) => toplam + Number(k.kalanTutar), 0);

    const kismiOdenenAlacak = gelirKayitlari
      .filter((k) => k.odemeDurumu === 'kismi_odendi')
      .reduce((toplam, k) => toplam + Number(k.kalanTutar), 0);

    const odenmemisOdemeler = odemeKayitlari.filter((k) => k.odemeDurumu !== 'odendi');

    const toplamBorc = odenmemisOdemeler.reduce(
      (toplam, k) => toplam + Number(k.tutar) - Number(k.odenenTutar),
      0
    );

    const iscilikBorc = odenmemisOdemeler
      .filter((k) => k.kategori === 'iscilik')
      .reduce((toplam, k) => toplam + Number(k.tutar) - Number(k.odenenTutar), 0);

    const malzemeBorc = odenmemisOdemeler
      .filter((k) => k.kategori === 'malzeme')
      .reduce((toplam, k) => toplam + Number(k.tutar) - Number(k.odenenTutar), 0);

    const digerBorc = odenmemisOdemeler
      .filter((k) => k.kategori !== 'iscilik' && k.kategori !== 'malzeme')
      .reduce((toplam, k) => toplam + Number(k.tutar) - Number(k.odenenTutar), 0);

    const netDurum = toplamAlacak - toplamBorc;

    const sonGelirler = gelirKayitlari.slice(0, 5);
    const sonBorclar = odemeKayitlari.slice(0, 5);

    return NextResponse.json({
      toplamAlacak,
      odenmeBekleniyor,
      kismiOdenenAlacak,
      toplamBorc,
      iscilikBorc,
      malzemeBorc,
      digerBorc,
      netDurum,
      sonGelirler,
      sonBorclar,
    });
  } catch {
    return NextResponse.json({ hata: 'Finans özeti alınamadı' }, { status: 500 });
  }
}
