import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { logKaydet } from '@/lib/aktiviteLog';
import { auditOlustur } from '@/lib/auditKullanici';

export async function GET(istek: Request) {
  try {
    const { searchParams } = new URL(istek.url);
    const surgunId = searchParams.get('surgunId');

    const kontenjanlar = await prisma.kontenjan.findMany({
      where: surgunId ? { surgunId, aktif: { not: false } } : { aktif: { not: false } },
      include: {
        surgun: true,
        musteri: true,
        gunlukTakip: {
          where: { aktif: true },
          orderBy: [{ tarih: 'desc' }, { olusturmaTarihi: 'desc' }],
          take: 1,
        },
      },
      orderBy: { baslangicTarihi: 'desc' },
    });

    return NextResponse.json(kontenjanlar);
  } catch {
    return NextResponse.json({ hata: 'Kontenjanlar getirilemedi' }, { status: 500 });
  }
}

export async function POST(istek: Request) {
  try {
    const { surgunId, musteriId, baslangicTarihi, bitisTarihi, gunlukKontenjanKg } =
      await istek.json();

    if (!surgunId || !musteriId || !baslangicTarihi || !gunlukKontenjanKg) {
      return NextResponse.json(
        { hata: 'Sürgün, müşteri, başlangıç tarihi ve günlük kontenjan zorunludur' },
        { status: 400 }
      );
    }

    const audit = await auditOlustur();

    const yeniKontenjan = await prisma.kontenjan.create({
      data: {
        surgunId,
        musteriId,
        baslangicTarihi: new Date(baslangicTarihi),
        bitisTarihi: bitisTarihi ? new Date(bitisTarihi) : null,
        gunlukKontenjanKg: Number(gunlukKontenjanKg),
        durum: 'aktif',
        ...audit,
      },
      include: {
        surgun: true,
        musteri: true,
      },
    });

    logKaydet({
      islemTipi: 'olusturma',
      modul: 'kontenjan',
      tablo: 'kontenjanlar',
      kayitId: yeniKontenjan.id,
      yeniDeger: yeniKontenjan,
    }).catch(console.error);

    return NextResponse.json(yeniKontenjan, { status: 201 });
  } catch {
    return NextResponse.json({ hata: 'Kontenjan oluşturulamadı' }, { status: 500 });
  }
}
