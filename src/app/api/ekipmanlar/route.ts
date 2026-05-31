export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { logKaydet } from '@/lib/aktiviteLog';
import { auditOlustur } from '@/lib/auditKullanici';

export async function GET() {
  try {
    const ekipmanlar = await prisma.ekipman.findMany({
      where: { aktif: { not: false } },
      orderBy: { ekipmanAdi: 'asc' },
    });

    const bugun = new Date();
    const yediGunSonra = new Date(bugun.getTime() + 7 * 24 * 60 * 60 * 1000);

    const sonuc = ekipmanlar.map((e) => ({
      ...e,
      satinAlmaFiyati: e.satinAlmaFiyati !== null ? Number(e.satinAlmaFiyati) : null,
      calismaSaati: e.calismaSaati !== null ? Number(e.calismaSaati) : null,
      bakimYaklasan:
        e.sonrakiBakimTarihi !== null &&
        new Date(e.sonrakiBakimTarihi) <= yediGunSonra,
    }));

    return NextResponse.json(sonuc);
  } catch {
    return NextResponse.json({ hata: 'Ekipmanlar getirilemedi' }, { status: 500 });
  }
}

export async function POST(istek: Request) {
  try {
    const {
      ekipmanAdi,
      kategori,
      marka,
      model,
      seriNo,
      plaka,
      kmSayaci,
      satinAlmaTarihi,
      satinAlmaFiyati,
      garantiBitis,
      sonBakimTarihi,
      sonrakiBakimTarihi,
      durum,
      calismaSaati,
      notlar,
    } = await istek.json();

    if (!ekipmanAdi || !kategori) {
      return NextResponse.json(
        { hata: 'Ekipman adı ve kategori zorunludur' },
        { status: 400 }
      );
    }

    const audit = await auditOlustur();
    const yeniEkipman = await prisma.ekipman.create({
      data: {
        ekipmanAdi,
        kategori,
        marka: marka || null,
        model: model || null,
        seriNo: seriNo || null,
        plaka: plaka || null,
        kmSayaci: kmSayaci ? parseInt(kmSayaci) : null,
        satinAlmaTarihi: satinAlmaTarihi ? new Date(satinAlmaTarihi) : null,
        satinAlmaFiyati: satinAlmaFiyati || null,
        garantiBitis: garantiBitis ? new Date(garantiBitis) : null,
        sonBakimTarihi: sonBakimTarihi ? new Date(sonBakimTarihi) : null,
        sonrakiBakimTarihi: sonrakiBakimTarihi ? new Date(sonrakiBakimTarihi) : null,
        durum: durum || 'aktif',
        calismaSaati: calismaSaati || null,
        notlar: notlar || null,
        ...audit,
      },
    });

    logKaydet({
      islemTipi: 'olusturma',
      modul: 'envanter',
      tablo: 'ekipmanlar',
      kayitId: yeniEkipman.id,
      yeniDeger: yeniEkipman,
    }).catch(console.error);

    const bugun = new Date();
    const yediGunSonra = new Date(bugun.getTime() + 7 * 24 * 60 * 60 * 1000);

    return NextResponse.json(
      {
        ...yeniEkipman,
        satinAlmaFiyati: yeniEkipman.satinAlmaFiyati !== null ? Number(yeniEkipman.satinAlmaFiyati) : null,
        calismaSaati: yeniEkipman.calismaSaati !== null ? Number(yeniEkipman.calismaSaati) : null,
        bakimYaklasan:
          yeniEkipman.sonrakiBakimTarihi !== null &&
          new Date(yeniEkipman.sonrakiBakimTarihi) <= yediGunSonra,
      },
      { status: 201 }
    );
  } catch {
    return NextResponse.json({ hata: 'Ekipman oluşturulamadı' }, { status: 500 });
  }
}
