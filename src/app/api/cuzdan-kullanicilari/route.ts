export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { logKaydet } from '@/lib/aktiviteLog';
import { auditOlustur } from '@/lib/auditKullanici';

// GET /api/cuzdan-kullanicilari?aktifSadece=true
export async function GET(istek: Request) {
  try {
    const { searchParams } = new URL(istek.url);
    const aktifSadece = searchParams.get('aktifSadece') !== 'false';

    const kullanicilar = await prisma.cuzdanKullanicisi.findMany({
      where: { aktif: true, ...(aktifSadece ? { durum: 'aktif' } : {}) },
      include: {
        cariHareketler: {
          where: { aktif: true },
          select: { id: true, yon: true, miktarKg: true, islemTipi: true },
        },
      },
      orderBy: { ad: 'asc' },
    });

    // Net kg bakiyesini hesapla
    const veri = kullanicilar.map((k) => {
      const banaBorc = k.cariHareketler
        .filter((h) => h.yon === 'bana_borclu')
        .reduce((s, h) => s + Number(h.miktarKg), 0);
      const benBorc = k.cariHareketler
        .filter((h) => h.yon === 'ben_borcluyum')
        .reduce((s, h) => s + Number(h.miktarKg), 0);
      const netKg = banaBorc - benBorc; // pozitif = bana borçlu, negatif = ben borçluyum

      return {
        id: k.id,
        ad: k.ad,
        telefon: k.telefon,
        durum: k.durum,
        ciftciId: k.ciftciId,
        notlar: k.notlar,
        netKg,
        olusturulmaTarihi: k.olusturulmaTarihi,
      };
    });

    return NextResponse.json(veri);
  } catch (err) {
    console.error('[cuzdan-kullanicilari GET]', err);
    return NextResponse.json({ hata: 'Cüzdan kullanıcıları getirilemedi' }, { status: 500 });
  }
}

// POST /api/cuzdan-kullanicilari
export async function POST(istek: Request) {
  try {
    const { ad, telefon, ciftciId, notlar } = await istek.json();

    if (!ad?.trim()) {
      return NextResponse.json({ hata: 'Ad zorunludur' }, { status: 400 });
    }

    const yeni = await prisma.cuzdanKullanicisi.create({
      data: {
        ad: ad.trim(),
        telefon: telefon?.trim() || null,
        ciftciId: ciftciId || null,
        notlar: notlar?.trim() || null,
      },
    });

    logKaydet({
      islemTipi: 'olusturma',
      modul: 'cuzdan-kullanicilari',
      tablo: 'cuzdan_kullanicilari',
      kayitId: yeni.id,
      yeniDeger: yeni,
    }).catch(console.error);

    return NextResponse.json(yeni, { status: 201 });
  } catch (err) {
    console.error('[cuzdan-kullanicilari POST]', err);
    return NextResponse.json({ hata: 'Kaydedilemedi' }, { status: 500 });
  }
}
