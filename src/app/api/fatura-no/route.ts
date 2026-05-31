export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

// =====================================================
// Otomatik fatura/belge no üretici
// GET /api/fatura-no?prefix=EKP
// Response: { belgNo: "EKP-2026-00042" }
// =====================================================

export async function GET(istek: Request) {
  try {
    const { searchParams } = new URL(istek.url);
    const prefix = (searchParams.get('prefix') ?? 'BLG').toUpperCase();
    const yil = new Date().getFullYear();

    // Bu yıl prefix ile başlayan kaç kayıt var
    const [giderSayisi, gelirSayisi] = await Promise.all([
      prisma.ekipmanGider.count({
        where: { belgNo: { startsWith: `${prefix}-${yil}-` } },
      }),
      prisma.ekipmanGelir.count({
        where: { belgNo: { startsWith: `${prefix}-${yil}-` } },
      }),
    ]);

    const sira = giderSayisi + gelirSayisi + 1;
    const belgNo = `${prefix}-${yil}-${String(sira).padStart(5, '0')}`;

    return NextResponse.json({ belgNo });
  } catch {
    return NextResponse.json({ hata: 'Fatura no üretilemedi' }, { status: 500 });
  }
}
