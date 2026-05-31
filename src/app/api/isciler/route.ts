export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { logKaydet } from '@/lib/aktiviteLog';
import { auditOlustur } from '@/lib/auditKullanici';

export async function GET(istek: Request) {
  try {
    const { searchParams } = new URL(istek.url);
    const durumParam = searchParams.get('durum');

    const durumFiltre: Record<string, unknown> = {};
    if (durumParam === 'pasif') {
      durumFiltre.durum = 'pasif';
    } else if (durumParam === 'tumu') {
      // filtre yok — tümünü getir
    } else {
      durumFiltre.durum = 'aktif';
    }

    const isciler = await prisma.isci.findMany({
      where: { aktif: { not: false }, ...durumFiltre },
      orderBy: { kayitTarihi: 'desc' },
    });
    return NextResponse.json(isciler);
  } catch {
    return NextResponse.json({ hata: 'İşçiler getirilemedi' }, { status: 500 });
  }
}

export async function POST(istek: Request) {
  try {
    const { adSoyad, tcNo, telefon, adres, bankaIban, acilIletisim, notlar, durum } = await istek.json();

    if (!adSoyad || !telefon) {
      return NextResponse.json({ hata: 'Ad soyad ve telefon zorunludur' }, { status: 400 });
    }

    const audit = await auditOlustur();
    const yeniIsci = await prisma.isci.create({
      data: {
        adSoyad,
        tcNo: tcNo || null,
        telefon,
        adres: adres || null,
        bankaIban: bankaIban || null,
        acilIletisim: acilIletisim || null,
        notlar: notlar || null,
        durum,
        ...audit,
      },
    });
    logKaydet({ islemTipi: 'olusturma', modul: 'isci', tablo: 'isciler', kayitId: yeniIsci.id, yeniDeger: yeniIsci }).catch(console.error);
    return NextResponse.json(yeniIsci, { status: 201 });
  } catch {
    return NextResponse.json({ hata: 'İşçi oluşturulamadı' }, { status: 500 });
  }
}
