export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET() {
  try {
    const [
      ciftciler,
      tarlalar,
      isciler,
      ekipler,
      musteriler,
      hasatDonemleri,
      surgunler,
      hasatGirisleri,
      malzemeler,
      stokHareketleri,
      gelirKayitlari,
      odemeKayitlari,
    ] = await Promise.all([
      prisma.ciftci.findMany(),
      prisma.tarla.findMany(),
      prisma.isci.findMany(),
      prisma.isciEkibi.findMany(),
      prisma.musteri.findMany(),
      prisma.hasatDonemi.findMany(),
      prisma.surgun.findMany(),
      prisma.hasatGirisi.findMany(),
      prisma.malzeme.findMany(),
      prisma.stokHareketi.findMany(),
      prisma.gelirKaydi.findMany(),
      prisma.odemeKaydi.findMany(),
    ]);

    const veri = {
      exportTarihi: new Date().toISOString(),
      uygulama: 'TarımCRM',
      versiyon: '1.0',
      tablolar: {
        ciftciler,
        tarlalar,
        isciler,
        ekipler,
        musteriler,
        hasatDonemleri,
        surgunler,
        hasatGirisleri,
        malzemeler,
        stokHareketleri,
        gelirKayitlari,
        odemeKayitlari,
      },
    };

    const tarih = new Date().toISOString().split('T')[0];

    return new Response(JSON.stringify(veri, null, 2), {
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="tarimcrm-yedek-${tarih}.json"`,
      },
    });
  } catch (hata) {
    console.error('JSON export hatası:', hata);
    return NextResponse.json(
      { hata: 'Veri export edilemedi' },
      { status: 500 },
    );
  }
}
