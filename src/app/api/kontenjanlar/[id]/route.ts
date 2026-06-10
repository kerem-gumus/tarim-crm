import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { logKaydet } from '@/lib/aktiviteLog';
import { auditGuncelle } from '@/lib/auditKullanici';

export async function PUT(
  istek: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { gunlukKontenjanKg, baslangicTarihi, bitisTarihi } = await istek.json();

    const mevcutKontenjan = await prisma.kontenjan.findUnique({ where: { id } });
    if (!mevcutKontenjan) {
      return NextResponse.json({ hata: 'Kontenjan bulunamadı' }, { status: 404 });
    }

    const audit = await auditGuncelle();

    const guncelKontenjan = await prisma.kontenjan.update({
      where: { id },
      data: {
        gunlukKontenjanKg: gunlukKontenjanKg !== undefined ? Number(gunlukKontenjanKg) : undefined,
        baslangicTarihi: baslangicTarihi ? new Date(baslangicTarihi) : undefined,
        bitisTarihi: bitisTarihi !== undefined ? (bitisTarihi ? new Date(bitisTarihi) : null) : undefined,
        ...audit,
      },
      include: {
        surgun: true,
        musteri: true,
      },
    });

    logKaydet({
      islemTipi: 'guncelleme',
      modul: 'kontenjan',
      tablo: 'kontenjanlar',
      kayitId: id,
      eskiDeger: mevcutKontenjan,
      yeniDeger: guncelKontenjan,
    }).catch(console.error);

    return NextResponse.json(guncelKontenjan);
  } catch {
    return NextResponse.json({ hata: 'Kontenjan güncellenemedi' }, { status: 500 });
  }
}

export async function DELETE(
  _istek: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const mevcutKontenjan = await prisma.kontenjan.findUnique({
      where: { id },
      include: { gunlukTakip: { where: { aktif: true } } },
    });

    if (!mevcutKontenjan) {
      return NextResponse.json({ hata: 'Kontenjan bulunamadı' }, { status: 404 });
    }

    if (mevcutKontenjan.gunlukTakip.length > 0) {
      return NextResponse.json(
        { hata: 'Takip kaydı olan kontenjan silinemez' },
        { status: 400 }
      );
    }

    const deleteAudit = await auditGuncelle();
    await prisma.kontenjan.update({ where: { id }, data: { aktif: false, ...deleteAudit } });

    logKaydet({
      islemTipi: 'silme',
      modul: 'kontenjan',
      tablo: 'kontenjanlar',
      kayitId: id,
      eskiDeger: mevcutKontenjan,
    }).catch(console.error);

    return NextResponse.json({ basarili: true });
  } catch {
    return NextResponse.json({ hata: 'Kontenjan silinemedi' }, { status: 500 });
  }
}
