export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

// GET /api/cari-hesap?cuzdanKullaniciId=X
// Belirli bir cüzdan kullanıcısının cari hesap ekstresini döner
export async function GET(istek: Request) {
  try {
    const { searchParams } = new URL(istek.url);
    const cuzdanKullaniciId = searchParams.get('cuzdanKullaniciId');

    if (!cuzdanKullaniciId) {
      // Tüm kullanıcıların net bakiye özeti
      const kullanicilar = await prisma.cuzdanKullanicisi.findMany({
        where: { aktif: true },
        include: {
          cariHareketler: {
            where: { aktif: true },
            orderBy: { tarih: 'asc' },
          },
        },
        orderBy: { ad: 'asc' },
      });

      const ozet = kullanicilar.map((k) => {
        const banaBorc = k.cariHareketler
          .filter((h) => h.yon === 'bana_borclu')
          .reduce((s, h) => s + Number(h.miktarKg), 0);
        const benBorc = k.cariHareketler
          .filter((h) => h.yon === 'ben_borcluyum')
          .reduce((s, h) => s + Number(h.miktarKg), 0);

        return {
          cuzdanKullaniciId: k.id,
          ad: k.ad,
          telefon: k.telefon,
          durum: k.durum,
          banaBorc,   // bu kişi bana borçlu (alacağım)
          benBorc,    // ben bu kişiye borçluyum
          netKg: banaBorc - benBorc, // pozitif = bana borçlu, negatif = ben borçluyum
        };
      });

      return NextResponse.json({ kullanicilar: ozet });
    }

    // Tek kullanıcı ekstresi
    const kullanici = await prisma.cuzdanKullanicisi.findUnique({
      where: { id: cuzdanKullaniciId },
    });
    if (!kullanici) {
      return NextResponse.json({ hata: 'Kullanıcı bulunamadı' }, { status: 404 });
    }

    const hareketler = await prisma.cariHareket.findMany({
      where: { cuzdanKullaniciId, aktif: true },
      include: {
        hasatGirisi: {
          select: { id: true, tarih: true, satisMiktariKg: true, surgunId: true },
        },
      },
      orderBy: { tarih: 'asc' },
    });

    // Kümülatif bakiye hesapla
    let kumBakiye = 0;
    const ekstre = hareketler.map((h) => {
      const kg = Number(h.miktarKg);
      if (h.yon === 'bana_borclu') {
        kumBakiye += kg;
      } else {
        kumBakiye -= kg;
      }
      return {
        id: h.id,
        tarih: h.tarih,
        islemTipi: h.islemTipi,
        yon: h.yon,
        miktarKg: kg,
        kumBakiyeKg: kumBakiye,
        aciklama: h.aciklama,
        hasatGirisi: h.hasatGirisi,
      };
    });

    return NextResponse.json({
      kullanici: {
        id: kullanici.id,
        ad: kullanici.ad,
        telefon: kullanici.telefon,
        durum: kullanici.durum,
      },
      hareketler: ekstre,
      netKg: kumBakiye, // pozitif = bana borçlu, negatif = ben borçluyum
      ozet: {
        // Net bakiyenin Türkçe açıklaması
        aciklama:
          kumBakiye > 0
            ? `${kullanici.ad} sana ${kumBakiye.toFixed(2)} kg borçlu`
            : kumBakiye < 0
              ? `Sen ${kullanici.ad}'a ${Math.abs(kumBakiye).toFixed(2)} kg borçlusun`
              : `${kullanici.ad} ile hesap sıfır`,
      },
    });
  } catch (err) {
    console.error('[cari-hesap GET]', err);
    return NextResponse.json({ hata: 'Cari hesap getirilemedi' }, { status: 500 });
  }
}
