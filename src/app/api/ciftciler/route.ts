export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { logKaydet } from '@/lib/aktiviteLog';
import { auditOlustur } from '@/lib/auditKullanici';

export async function GET() {
  try {
    const ciftciler = await prisma.ciftci.findMany({
      where: { aktif: { not: false } },
      orderBy: { kayitTarihi: 'desc' },
    });
    return NextResponse.json(ciftciler);
  } catch {
    return NextResponse.json({ hata: 'Çiftçiler getirilemedi' }, { status: 500 });
  }
}

export async function POST(istek: Request) {
  try {
    const { adSoyad, tcNo, telefon, telefon2, adres, il, ilce, koy, cayKurNo, bankaIban, vergiNo, durum, notlar } =
      await istek.json();

    if (!adSoyad || !telefon) {
      return NextResponse.json({ hata: 'Ad soyad ve telefon zorunludur' }, { status: 400 });
    }

    const audit = await auditOlustur();
    const yeniCiftci = await prisma.ciftci.create({
      data: { adSoyad, tcNo, telefon, telefon2, adres, il, ilce, koy, cayKurNo, bankaIban, vergiNo, durum, notlar, ...audit },
    });
    logKaydet({ islemTipi: 'olusturma', modul: 'ciftci', tablo: 'ciftciler', kayitId: yeniCiftci.id, yeniDeger: yeniCiftci }).catch(console.error);
    return NextResponse.json(yeniCiftci, { status: 201 });
  } catch {
    return NextResponse.json({ hata: 'Çiftçi oluşturulamadı' }, { status: 500 });
  }
}
