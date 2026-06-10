export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { logKaydet } from '@/lib/aktiviteLog';
import { auditOlustur } from '@/lib/auditKullanici';

// POST /api/cari-hesap/odesme
// Karşı tarafa çay satarak cari borcu kapat
// Body: { cuzdanKullaniciId, miktarKg, yon, aciklama, tarih }
export async function POST(istek: Request) {
  try {
    const { cuzdanKullaniciId, miktarKg, yon, aciklama, tarih } = await istek.json();

    if (!cuzdanKullaniciId || !miktarKg || !yon) {
      return NextResponse.json(
        { hata: 'cuzdanKullaniciId, miktarKg ve yon zorunludur' },
        { status: 400 }
      );
    }

    const kg = Number(miktarKg);
    if (isNaN(kg) || kg <= 0) {
      return NextResponse.json({ hata: 'Geçerli bir kg miktarı giriniz' }, { status: 400 });
    }

    const kullanici = await prisma.cuzdanKullanicisi.findUnique({
      where: { id: cuzdanKullaniciId },
    });
    if (!kullanici) {
      return NextResponse.json({ hata: 'Cüzdan kullanıcısı bulunamadı' }, { status: 404 });
    }

    const audit = await auditOlustur();
    const odesme = await prisma.cariHareket.create({
      data: {
        cuzdanKullaniciId,
        yon,
        islemTipi: 'odesme',
        miktarKg: kg,
        aciklama: aciklama?.trim() || `${kullanici.ad} ile çay ödeşmesi`,
        tarih: tarih ? new Date(tarih) : new Date(),
      },
    });

    logKaydet({
      islemTipi: 'olusturma',
      modul: 'cari-hesap',
      tablo: 'cari_hareketler',
      kayitId: odesme.id,
      yeniDeger: odesme,
    }).catch(console.error);

    // Güncel net bakiye
    const tumHareketler = await prisma.cariHareket.findMany({
      where: { cuzdanKullaniciId, aktif: true },
      select: { yon: true, miktarKg: true },
    });
    const netKg = tumHareketler.reduce((s, h) => {
      return h.yon === 'bana_borclu' ? s + Number(h.miktarKg) : s - Number(h.miktarKg);
    }, 0);

    return NextResponse.json({ odesme, netKg }, { status: 201 });
  } catch (err) {
    console.error('[cari-hesap odesme POST]', err);
    return NextResponse.json({ hata: 'Ödeşme kaydedilemedi' }, { status: 500 });
  }
}
