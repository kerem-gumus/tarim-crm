import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { logKaydet } from '@/lib/aktiviteLog';
import { auditOlustur } from '@/lib/auditKullanici';

export async function GET() {
  try {
    const malzemeler = await prisma.malzeme.findMany({
      where: { aktif: { not: false } },
      orderBy: { malzemeAdi: 'asc' },
    });

    const sonuc = malzemeler.map((m) => ({
      ...m,
      mevcutStok: Number(m.mevcutStok),
      minimumStok: Number(m.minimumStok),
      birimFiyat: Number(m.birimFiyat),
      dusukStok: Number(m.mevcutStok) <= Number(m.minimumStok),
    }));

    return NextResponse.json(sonuc);
  } catch {
    return NextResponse.json({ hata: 'Malzemeler getirilemedi' }, { status: 500 });
  }
}

export async function POST(istek: Request) {
  try {
    const {
      malzemeAdi,
      kategori,
      altKategori,
      birim,
      mevcutStok,
      minimumStok,
      birimFiyat,
      depoKonumu,
      durum,
      notlar,
    } = await istek.json();

    if (!malzemeAdi || !kategori || !birim) {
      return NextResponse.json(
        { hata: 'Malzeme adı, kategori ve birim zorunludur' },
        { status: 400 }
      );
    }

    const audit = await auditOlustur();
    const yeniMalzeme = await prisma.malzeme.create({
      data: {
        malzemeAdi,
        kategori,
        altKategori: altKategori || null,
        birim,
        mevcutStok: mevcutStok ?? 0,
        minimumStok: minimumStok ?? 0,
        birimFiyat: birimFiyat ?? 0,
        depoKonumu: depoKonumu || null,
        durum: durum || 'aktif',
        notlar: notlar || null,
        ...audit,
      },
    });

    logKaydet({
      islemTipi: 'olusturma',
      modul: 'envanter',
      tablo: 'malzemeler',
      kayitId: yeniMalzeme.id,
      yeniDeger: yeniMalzeme,
    }).catch(console.error);

    return NextResponse.json(
      {
        ...yeniMalzeme,
        mevcutStok: Number(yeniMalzeme.mevcutStok),
        minimumStok: Number(yeniMalzeme.minimumStok),
        birimFiyat: Number(yeniMalzeme.birimFiyat),
        dusukStok: Number(yeniMalzeme.mevcutStok) <= Number(yeniMalzeme.minimumStok),
      },
      { status: 201 }
    );
  } catch {
    return NextResponse.json({ hata: 'Malzeme oluşturulamadı' }, { status: 500 });
  }
}
