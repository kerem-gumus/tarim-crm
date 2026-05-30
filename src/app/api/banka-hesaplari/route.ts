import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET() {
  try {
    const hesaplar = await prisma.bankaHesabi.findMany({
      where: { aktif: true },
      orderBy: { olusturmaTarihi: 'asc' },
    });
    return NextResponse.json(hesaplar);
  } catch {
    return NextResponse.json({ hata: 'Hesaplar getirilemedi' }, { status: 500 });
  }
}

export async function POST(istek: Request) {
  try {
    const { hesapAdi, bankaAdi, hesapNo, iban, tur, kmhLimiti } = await istek.json();
    if (!hesapAdi) {
      return NextResponse.json({ hata: 'Hesap adı zorunludur' }, { status: 400 });
    }
    const hesap = await prisma.bankaHesabi.create({
      data: {
        hesapAdi,
        bankaAdi: bankaAdi || null,
        hesapNo: hesapNo || null,
        iban: iban || null,
        tur: tur || 'banka',
        kmhLimiti: kmhLimiti ?? false,
      },
    });
    return NextResponse.json(hesap, { status: 201 });
  } catch {
    return NextResponse.json({ hata: 'Hesap oluşturulamadı' }, { status: 500 });
  }
}
