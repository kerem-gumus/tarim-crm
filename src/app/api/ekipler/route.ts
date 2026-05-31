export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
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

    const ekipler = await prisma.isciEkibi.findMany({
      where: { aktif: { not: false }, ...durumFiltre },
      include: {
        uyeler: {
          include: {
            isci: {
              select: { id: true, adSoyad: true },
            },
          },
          where: { ayrilmaTarihi: null },
        },
      },
      orderBy: { ekipAdi: 'asc' },
    });
    return NextResponse.json(ekipler);
  } catch {
    return NextResponse.json({ hata: 'Ekipler getirilemedi' }, { status: 500 });
  }
}

export async function POST(istek: Request) {
  try {
    const { ekipAdi, ekipBasiId, durum } = await istek.json();

    if (!ekipAdi) {
      return NextResponse.json({ hata: 'Ekip adı zorunludur' }, { status: 400 });
    }

    const audit = await auditOlustur();
    const yeniEkip = await prisma.isciEkibi.create({
      data: {
        ekipAdi,
        ekipBasiId: ekipBasiId || null,
        durum,
        ...audit,
      },
    });
    return NextResponse.json(yeniEkip, { status: 201 });
  } catch {
    return NextResponse.json({ hata: 'Ekip oluşturulamadı' }, { status: 500 });
  }
}
