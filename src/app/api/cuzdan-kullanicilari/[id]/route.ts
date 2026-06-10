export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { logKaydet } from '@/lib/aktiviteLog';

export async function PUT(istek: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { ad, telefon, durum, ciftciId, notlar } = await istek.json();

    if (!ad?.trim()) {
      return NextResponse.json({ hata: 'Ad zorunludur' }, { status: 400 });
    }

    const guncellendi = await prisma.cuzdanKullanicisi.update({
      where: { id },
      data: {
        ad: ad.trim(),
        telefon: telefon?.trim() || null,
        durum: durum ?? 'aktif',
        ciftciId: ciftciId || null,
        notlar: notlar?.trim() || null,
        guncellemeTarihi: new Date(),
      },
    });

    logKaydet({
      islemTipi: 'guncelleme',
      modul: 'cuzdan-kullanicilari',
      tablo: 'cuzdan_kullanicilari',
      kayitId: id,
      yeniDeger: guncellendi,
    }).catch(console.error);

    return NextResponse.json(guncellendi);
  } catch (err) {
    console.error('[cuzdan-kullanicilari PUT]', err);
    return NextResponse.json({ hata: 'Güncellenemedi' }, { status: 500 });
  }
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;

    // Açık cari bakiyesi varsa silme
    const hareketSayisi = await prisma.cariHareket.count({
      where: { cuzdanKullaniciId: id, aktif: true },
    });

    if (hareketSayisi > 0) {
      return NextResponse.json(
        { hata: 'Açık cari hareketi olan kullanıcı silinemez. Önce hareketleri kapatın.' },
        { status: 400 }
      );
    }

    await prisma.cuzdanKullanicisi.update({
      where: { id },
      data: { aktif: false, guncellemeTarihi: new Date() },
    });

    logKaydet({
      islemTipi: 'silme',
      modul: 'cuzdan-kullanicilari',
      tablo: 'cuzdan_kullanicilari',
      kayitId: id,
    }).catch(console.error);

    return NextResponse.json({ basarili: true });
  } catch (err) {
    console.error('[cuzdan-kullanicilari DELETE]', err);
    return NextResponse.json({ hata: 'Silinemedi' }, { status: 500 });
  }
}
