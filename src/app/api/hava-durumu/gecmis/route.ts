import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET() {
  try {
    const kayitlar = await prisma.havaVerisi.findMany({
      orderBy: { tarih: 'desc' },
      take: 30,
    });

    const sonuc = kayitlar.map((k) => ({
      id: k.id,
      tarih: k.tarih.toISOString().split('T')[0],
      il: k.il,
      ilce: k.ilce,
      sicaklikMin: k.sicaklikMin ? Number(k.sicaklikMin) : null,
      sicaklikMax: k.sicaklikMax ? Number(k.sicaklikMax) : null,
      nemOrani: k.nemOrani ? Number(k.nemOrani) : null,
      yagisMm: k.yagisMm ? Number(k.yagisMm) : null,
      ruzgarHizi: k.ruzgarHizi ? Number(k.ruzgarHizi) : null,
      havaDurumu: k.havaDurumu,
      olusturmaTarihi: k.olusturmaTarihi,
    }));

    return NextResponse.json(sonuc);
  } catch (hata) {
    console.error('Hava durumu geçmiş API hatası:', hata);
    return NextResponse.json({ hata: 'Geçmiş kayıtlar yüklenemedi' }, { status: 500 });
  }
}
