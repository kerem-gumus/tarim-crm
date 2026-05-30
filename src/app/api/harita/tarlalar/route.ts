import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET() {
  try {
    const tarlalar = await prisma.tarla.findMany({
      where: { durum: 'aktif' },
      include: {
        ciftci: { select: { adSoyad: true } },
        hasatGirisleri: {
          select: { tartimMiktariKg: true, olusturmaTarihi: true },
          orderBy: { olusturmaTarihi: 'desc' },
          take: 10,
        },
      },
    });

    const sonuc = tarlalar.map((tarla) => {
      const hasatlar = tarla.hasatGirisleri;
      let verimRengi: 'yesil' | 'sari' | 'kirmizi' | 'gri' = 'gri';
      let sonHasatKg = 0;

      if (hasatlar.length > 0) {
        sonHasatKg = Number(hasatlar[0].tartimMiktariKg);

        const son5 = hasatlar.slice(0, 5);
        const onceki5 = hasatlar.slice(5, 10);

        const son5Ortalama =
          son5.reduce((t, h) => t + Number(h.tartimMiktariKg), 0) / son5.length;

        if (onceki5.length > 0) {
          const onceki5Ortalama =
            onceki5.reduce((t, h) => t + Number(h.tartimMiktariKg), 0) / onceki5.length;

          const farkOrani = (son5Ortalama - onceki5Ortalama) / onceki5Ortalama;

          if (farkOrani > 0.1) {
            verimRengi = 'yesil';
          } else if (farkOrani < -0.1) {
            verimRengi = 'kirmizi';
          } else {
            verimRengi = 'sari';
          }
        } else {
          // Sadece son 5 var, yeterli karşılaştırma verisi yok
          verimRengi = 'sari';
        }
      }

      return {
        id: tarla.id,
        tarlaAdi: tarla.tarlaAdi,
        ciftciAdi: tarla.ciftci?.adSoyad ?? 'Bilinmiyor',
        koordinatLat: tarla.koordinatLat ? Number(tarla.koordinatLat) : null,
        koordinatLng: tarla.koordinatLng ? Number(tarla.koordinatLng) : null,
        donum: Number(tarla.donum),
        verimRengi,
        sonHasatKg,
        hasatGirisAdet: hasatlar.length,
      };
    });

    return NextResponse.json(sonuc);
  } catch (hata) {
    console.error('Harita tarlalar API hatası:', hata);
    return NextResponse.json({ hata: 'Tarlalar yüklenemedi' }, { status: 500 });
  }
}
