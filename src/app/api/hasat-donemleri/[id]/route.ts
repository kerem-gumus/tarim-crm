import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { logKaydet } from '@/lib/aktiviteLog';
import { auditGuncelle } from '@/lib/auditKullanici';

export async function PUT(istek: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { donemAdi, baslangicTarihi, brutFiyat, netFiyat, desteklemeMiktari } = await istek.json();

    const audit = await auditGuncelle();

    const guncellenenDonem = await prisma.hasatDonemi.update({
      where: { id },
      data: {
        ...(donemAdi !== undefined && { donemAdi }),
        ...(baslangicTarihi !== undefined && { baslangicTarihi: new Date(baslangicTarihi) }),
        ...(brutFiyat !== undefined && { brutFiyat: brutFiyat ? parseFloat(brutFiyat) : null }),
        ...(netFiyat !== undefined && { netFiyat: netFiyat ? parseFloat(netFiyat) : null }),
        ...(desteklemeMiktari !== undefined && { desteklemeMiktari: desteklemeMiktari ? parseFloat(desteklemeMiktari) : null }),
        ...audit,
      },
      include: { surgunler: true },
    });

    logKaydet({
      islemTipi: 'guncelleme',
      modul: 'hasat',
      tablo: 'hasat_donemleri',
      kayitId: id,
      yeniDeger: guncellenenDonem,
    }).catch(console.error);

    return NextResponse.json(guncellenenDonem);
  } catch {
    return NextResponse.json({ hata: 'Hasat dönemi güncellenemedi' }, { status: 500 });
  }
}

export async function DELETE(_istek: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;

    const donem = await prisma.hasatDonemi.findUnique({
      where: { id },
      include: { surgunler: true },
    });

    if (!donem) {
      return NextResponse.json({ hata: 'Dönem bulunamadı' }, { status: 404 });
    }

    if (donem.surgunler.length > 0) {
      return NextResponse.json(
        { hata: 'Sürgünü olan dönem silinemez' },
        { status: 400 }
      );
    }

    const audit = await auditGuncelle();
    await prisma.hasatDonemi.update({ where: { id }, data: { aktif: false, ...audit } });

    logKaydet({
      islemTipi: 'silme',
      modul: 'hasat',
      tablo: 'hasat_donemleri',
      kayitId: id,
    }).catch(console.error);

    return NextResponse.json({ basarili: true });
  } catch {
    return NextResponse.json({ hata: 'Hasat dönemi silinemedi' }, { status: 500 });
  }
}
