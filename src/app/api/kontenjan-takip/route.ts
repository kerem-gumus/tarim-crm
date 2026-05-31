export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { logKaydet } from '@/lib/aktiviteLog';
import { auditOlustur } from '@/lib/auditKullanici';

export async function GET(istek: Request) {
  try {
    const { searchParams } = new URL(istek.url);
    const kontenjanId = searchParams.get('kontenjanId');

    if (!kontenjanId) {
      return NextResponse.json({ hata: 'kontenjanId parametresi zorunludur' }, { status: 400 });
    }

    // Kontenjanın başlangıç tarihinden itibaren getir — sınırsız değil, dönem bazlı
    const kontenjan = await prisma.kontenjan.findUnique({
      where: { id: kontenjanId },
      select: { baslangicTarihi: true },
    });

    const takipKayitlari = await prisma.kontenjanGunlukTakip.findMany({
      where: {
        kontenjanId,
        aktif: { not: false },
        ...(kontenjan ? { tarih: { gte: kontenjan.baslangicTarihi } } : {}),
      },
      orderBy: { tarih: 'desc' },
    });

    return NextResponse.json(takipKayitlari);
  } catch {
    return NextResponse.json({ hata: 'Takip kayıtları getirilemedi' }, { status: 500 });
  }
}

export async function POST(istek: Request) {
  try {
    const { kontenjanId, tarih, tartimKg } = await istek.json();

    if (!kontenjanId || !tarih || tartimKg === undefined) {
      return NextResponse.json(
        { hata: 'Kontenjan ID, tarih ve tartım miktarı zorunludur' },
        { status: 400 }
      );
    }

    // 1. Kontenjanı getir
    const kontenjan = await prisma.kontenjan.findUnique({ where: { id: kontenjanId } });
    if (!kontenjan) {
      return NextResponse.json({ hata: 'Kontenjan bulunamadı' }, { status: 404 });
    }

    // 2. Önceki bakiyeyi bul
    const sonTakip = await prisma.kontenjanGunlukTakip.findFirst({
      where: { kontenjanId },
      orderBy: { tarih: 'desc' },
    });
    const oncekiBakiyeKg = sonTakip ? Number(sonTakip.kalanBakiyeKg) : 0;

    // 3. Hesapla
    // Pozitif bakiye = alıcıda fazla = satıştan düş
    // Negatif bakiye = biz borçluyuz = satışa ekle
    // Formül: hesaplananSatis = gunlukKontenjan - oncekiBakiye
    const gunlukKontenjanKg = Number(kontenjan.gunlukKontenjanKg);
    const hesaplananSatisKg = gunlukKontenjanKg - oncekiBakiyeKg;
    const kalanBakiyeKg = Number(tartimKg) - hesaplananSatisKg;

    // 4. Kaydet
    const audit = await auditOlustur();
    const yeniTakip = await prisma.kontenjanGunlukTakip.create({
      data: {
        kontenjanId,
        tarih: new Date(tarih),
        tartimKg: Number(tartimKg),
        gunlukKontenjanKg,
        oncekiBakiyeKg,
        hesaplananSatisKg,
        kalanBakiyeKg,
        ...audit,
      },
    });

    logKaydet({
      islemTipi: 'olusturma',
      modul: 'kontenjan',
      tablo: 'kontenjan_gunluk_takip',
      kayitId: yeniTakip.id,
      yeniDeger: yeniTakip,
    }).catch(console.error);

    return NextResponse.json(
      {
        ...yeniTakip,
        hesaplananSatisKg,
        kalanBakiyeKg,
      },
      { status: 201 }
    );
  } catch {
    return NextResponse.json({ hata: 'Takip kaydı oluşturulamadı' }, { status: 500 });
  }
}
