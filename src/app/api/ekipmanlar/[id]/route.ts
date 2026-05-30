import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { logKaydet } from '@/lib/aktiviteLog';
import { auditGuncelle } from '@/lib/auditKullanici';

export async function PUT(istek: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
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

    const eskiEkipman = await prisma.ekipman.findUnique({ where: { id } });
    if (!eskiEkipman) {
      return NextResponse.json({ hata: 'Ekipman bulunamadı' }, { status: 404 });
    }

    const audit = await auditGuncelle();
    const guncellendi = await prisma.ekipman.update({
      where: { id },
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
        durum: durum || eskiEkipman.durum,
        calismaSaati: calismaSaati || null,
        notlar: notlar || null,
        ...audit,
      },
    });

    logKaydet({
      islemTipi: 'guncelleme',
      modul: 'envanter',
      tablo: 'ekipmanlar',
      kayitId: id,
      eskiDeger: eskiEkipman,
      yeniDeger: guncellendi,
    }).catch(console.error);

    const bugun = new Date();
    const yediGunSonra = new Date(bugun.getTime() + 7 * 24 * 60 * 60 * 1000);

    return NextResponse.json({
      ...guncellendi,
      satinAlmaFiyati: guncellendi.satinAlmaFiyati !== null ? Number(guncellendi.satinAlmaFiyati) : null,
      calismaSaati: guncellendi.calismaSaati !== null ? Number(guncellendi.calismaSaati) : null,
      bakimYaklasan:
        guncellendi.sonrakiBakimTarihi !== null &&
        new Date(guncellendi.sonrakiBakimTarihi) <= yediGunSonra,
    });
  } catch {
    return NextResponse.json({ hata: 'Ekipman güncellenemedi' }, { status: 500 });
  }
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;

    const eskiEkipman = await prisma.ekipman.findUnique({ where: { id } });
    if (!eskiEkipman) {
      return NextResponse.json({ hata: 'Ekipman bulunamadı' }, { status: 404 });
    }

    const audit = await auditGuncelle();
    await prisma.ekipman.update({ where: { id }, data: { aktif: false, ...audit } });

    logKaydet({
      islemTipi: 'silme',
      modul: 'envanter',
      tablo: 'ekipmanlar',
      kayitId: id,
      eskiDeger: eskiEkipman,
    }).catch(console.error);

    return NextResponse.json({ basarili: true });
  } catch {
    return NextResponse.json({ hata: 'Ekipman silinemedi' }, { status: 500 });
  }
}
