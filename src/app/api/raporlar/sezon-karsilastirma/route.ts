export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(istek: NextRequest) {
  try {
    const { searchParams } = new URL(istek.url);
    const buYil = new Date().getFullYear();
    const yil1 = Number(searchParams.get('yil1') ?? buYil - 1);
    const yil2 = Number(searchParams.get('yil2') ?? buYil);

    async function yilVerisiniHesapla(yil: number) {
      // O yılın HasatDonemi'lerini bul (yil alanına göre)
      const donemler = await prisma.hasatDonemi.findMany({
        where: { yil },
        include: { surgunler: true },
      });

      const donemSayisi = donemler.length;
      const tumSurgunler = donemler.flatMap((d) => d.surgunler);
      const surgunSayisi = tumSurgunler.length;

      // toplamHasatKg — tüm sürgünlerin toplamHasatKg toplamı
      const toplamHasatKg = tumSurgunler.reduce(
        (toplam, s) => toplam + Number(s.toplamHasatKg),
        0,
      );

      const yilBaslangici = new Date(yil, 0, 1);
      const yilBitis = new Date(yil + 1, 0, 1);

      // toplamGelir — GelirKaydi olusturmaTarihi o yıla göre
      const gelirKayitlari = await prisma.gelirKaydi.findMany({
        where: {
          olusturmaTarihi: {
            gte: yilBaslangici,
            lt: yilBitis,
          },
        },
      });
      const toplamGelir = gelirKayitlari.reduce(
        (toplam, g) => toplam + Number(g.toplamTutar),
        0,
      );

      // toplamGider — OdemeKaydi olusturmaTarihi o yıla göre
      const odemeKayitlari = await prisma.odemeKaydi.findMany({
        where: {
          aktif: true,
          olusturmaTarihi: {
            gte: yilBaslangici,
            lt: yilBitis,
          },
        },
      });
      const toplamGider = odemeKayitlari.reduce(
        (toplam, o) => toplam + Number(o.tutar),
        0,
      );

      // iscilikMaliyeti — OdemeKaydi where kategori = 'iscilik' o yıla göre
      const iscilikMaliyeti = odemeKayitlari
        .filter((o) => o.kategori === 'iscilik')
        .reduce((toplam, o) => toplam + Number(o.tutar), 0);

      const netKar = toplamGelir - toplamGider;

      return {
        yil,
        toplamHasatKg,
        surgunSayisi,
        toplamGelir,
        toplamGider,
        netKar,
        iscilikMaliyeti,
        donemSayisi,
      };
    }

    const [veri1, veri2] = await Promise.all([
      yilVerisiniHesapla(yil1),
      yilVerisiniHesapla(yil2),
    ]);

    return NextResponse.json({ yil1: veri1, yil2: veri2 });
  } catch (hata) {
    console.error('Sezon karşılaştırma hatası:', hata);
    return NextResponse.json(
      { hata: 'Sezon karşılaştırma verisi alınamadı' },
      { status: 500 },
    );
  }
}
