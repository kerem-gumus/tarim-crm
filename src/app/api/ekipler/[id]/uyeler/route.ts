import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function POST(istek: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: ekipId } = await params;
    const { isciId, katilmaTarihi } = await istek.json();

    if (!isciId) {
      return NextResponse.json({ hata: 'İşçi seçimi zorunludur' }, { status: 400 });
    }

    // Daha önce ayrılmış kaydı kontrol et - ayrılmamış aktif üyelik var mı?
    const mevcutUyelik = await prisma.ekipIsciIliskisi.findUnique({
      where: { ekipId_isciId: { ekipId, isciId } },
    });

    if (mevcutUyelik && mevcutUyelik.ayrilmaTarihi === null) {
      return NextResponse.json({ hata: 'Bu işçi zaten ekipte aktif üye' }, { status: 400 });
    }

    // Daha önce ayrılmış kaydı güncelle ya da yeni kayıt oluştur
    let uyelik;
    if (mevcutUyelik) {
      uyelik = await prisma.ekipIsciIliskisi.update({
        where: { ekipId_isciId: { ekipId, isciId } },
        data: {
          katilmaTarihi: katilmaTarihi ? new Date(katilmaTarihi) : new Date(),
          ayrilmaTarihi: null,
        },
      });
    } else {
      uyelik = await prisma.ekipIsciIliskisi.create({
        data: {
          ekipId,
          isciId,
          katilmaTarihi: katilmaTarihi ? new Date(katilmaTarihi) : new Date(),
        },
      });
    }

    return NextResponse.json(uyelik, { status: 201 });
  } catch {
    return NextResponse.json({ hata: 'Üye eklenemedi' }, { status: 500 });
  }
}

export async function DELETE(istek: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: ekipId } = await params;
    const { isciId } = await istek.json();

    if (!isciId) {
      return NextResponse.json({ hata: 'İşçi kimliği zorunludur' }, { status: 400 });
    }

    // Silme yerine ayrilmaTarihi bugün olarak set et
    const guncellendi = await prisma.ekipIsciIliskisi.update({
      where: { ekipId_isciId: { ekipId, isciId } },
      data: { ayrilmaTarihi: new Date() },
    });

    return NextResponse.json(guncellendi);
  } catch {
    return NextResponse.json({ hata: 'Üye çıkarılamadı' }, { status: 500 });
  }
}
