export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const hareketler = await prisma.bankaHareketi.findMany({
      where: { bankaHesabiId: id },
      orderBy: { tarih: 'desc' },
    });
    return NextResponse.json(hareketler);
  } catch {
    return NextResponse.json({ hata: 'Hareketler getirilemedi' }, { status: 500 });
  }
}

export async function POST(istek: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { tip, tutar, aciklama, tarih, referansTipi, referansId } = await istek.json();
    if (!tip || !tutar || !aciklama || !tarih) {
      return NextResponse.json({ hata: 'tip, tutar, aciklama, tarih zorunludur' }, { status: 400 });
    }
    const hareket = await prisma.$transaction(async (tx) => {
      const h = await tx.bankaHareketi.create({
        data: {
          bankaHesabiId: id,
          tip,
          tutar,
          aciklama,
          tarih: new Date(tarih),
          referansTipi: referansTipi || null,
          referansId: referansId || null,
        },
      });
      // Bakiyeyi güncelle
      await tx.bankaHesabi.update({
        where: { id },
        data: {
          bakiye: { increment: tip === 'giris' ? tutar : -tutar },
        },
      });
      return h;
    });
    return NextResponse.json(hareket, { status: 201 });
  } catch {
    return NextResponse.json({ hata: 'Hareket kaydedilemedi' }, { status: 500 });
  }
}
