export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET(
  _istek: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const hesap = await prisma.bankaHesabi.findUnique({ where: { id } });
    if (!hesap) return NextResponse.json({ hata: 'Hesap bulunamadı' }, { status: 404 });
    return NextResponse.json(hesap);
  } catch {
    return NextResponse.json({ hata: 'Hesap getirilemedi' }, { status: 500 });
  }
}

export async function PUT(
  istek: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const { hesapAdi, bankaAdi, hesapNo, iban, aktif, kmhLimiti, alarmDurumu } = await istek.json();
    if (!hesapAdi) {
      return NextResponse.json({ hata: 'Hesap adı zorunludur' }, { status: 400 });
    }
    const hesap = await prisma.bankaHesabi.update({
      where: { id },
      data: {
        hesapAdi,
        bankaAdi: bankaAdi || null,
        hesapNo: hesapNo || null,
        iban: iban || null,
        ...(aktif !== undefined ? { aktif } : {}),
        ...(kmhLimiti !== undefined ? { kmhLimiti } : {}),
        ...(alarmDurumu !== undefined ? { alarmDurumu } : {}),
      },
    });
    return NextResponse.json(hesap);
  } catch {
    return NextResponse.json({ hata: 'Hesap güncellenemedi' }, { status: 500 });
  }
}

export async function DELETE(
  _istek: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    // Soft delete — aktif = false
    const hesap = await prisma.bankaHesabi.update({
      where: { id },
      data: { aktif: false },
    });
    return NextResponse.json(hesap);
  } catch {
    return NextResponse.json({ hata: 'Hesap silinemedi' }, { status: 500 });
  }
}
