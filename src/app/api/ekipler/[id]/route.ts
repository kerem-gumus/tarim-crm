import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { auditGuncelle } from '@/lib/auditKullanici';

export async function PUT(istek: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { ekipAdi, ekipBasiId, durum } = await istek.json();

    if (!ekipAdi) {
      return NextResponse.json({ hata: 'Ekip adı zorunludur' }, { status: 400 });
    }

    const audit = await auditGuncelle();
    const guncellendi = await prisma.isciEkibi.update({
      where: { id },
      data: {
        ekipAdi,
        ekipBasiId: ekipBasiId || null,
        durum,
        ...audit,
      },
    });
    return NextResponse.json(guncellendi);
  } catch {
    return NextResponse.json({ hata: 'Ekip güncellenemedi' }, { status: 500 });
  }
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const audit = await auditGuncelle();
    await prisma.isciEkibi.update({
      where: { id },
      data: { aktif: false, ...audit },
    });
    return NextResponse.json({ basarili: true });
  } catch {
    return NextResponse.json({ hata: 'Ekip silinemedi' }, { status: 500 });
  }
}
