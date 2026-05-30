import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

// =====================================================
// Fark hesabı sıfırlama
// Mevcut bakiyeyi karşı hareketle sıfırlar
// POST /api/banka-hesaplari/[id]/sifirla
// Body: { tarih?: string, notlar?: string }
// =====================================================

export async function POST(
  istek: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const hesap = await prisma.bankaHesabi.findUnique({ where: { id } });
    if (!hesap) {
      return NextResponse.json({ hata: 'Hesap bulunamadı' }, { status: 404 });
    }
    if (hesap.tur !== 'fark_hesabi') {
      return NextResponse.json({ hata: 'Bu işlem yalnızca fark hesabı türündeki hesaplara uygulanabilir' }, { status: 400 });
    }

    const bakiye = Number(hesap.bakiye);
    if (bakiye === 0) {
      return NextResponse.json({ hata: 'Hesap bakiyesi zaten sıfır' }, { status: 400 });
    }

    const { tarih, notlar } = await istek.json().catch(() => ({}));
    const tarihStr: string = tarih ?? new Date().toISOString().split('T')[0];
    const [yil, ay, gun] = tarihStr.split('-').map(Number);
    const tarihDate = new Date(Date.UTC(yil, ay - 1, gun));

    const aciklama = notlar
      ? `Fark hesabı sıfırlama — ${notlar}`
      : `Fark hesabı sıfırlama`;

    // Bakiye pozitifse çıkış (para çıkar), negatifse giriş (borç kapanır)
    const tip = bakiye > 0 ? 'cikis' : 'giris';
    const tutar = Math.abs(bakiye);

    await prisma.$transaction([
      prisma.bankaHareketi.create({
        data: {
          bankaHesabiId: id,
          tip,
          tutar,
          aciklama,
          tarih: tarihDate,
          referansTipi: 'sifirla',
        },
      }),
      prisma.bankaHesabi.update({
        where: { id },
        data: { bakiye: 0 },
      }),
    ]);

    return NextResponse.json({ basarili: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ hata: 'Fark hesabı sıfırlanamadı' }, { status: 500 });
  }
}
