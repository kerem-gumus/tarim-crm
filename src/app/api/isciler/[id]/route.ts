import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { logKaydet } from '@/lib/aktiviteLog';
import { auditGuncelle } from '@/lib/auditKullanici';

export async function PUT(istek: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { adSoyad, tcNo, telefon, adres, bankaIban, acilIletisim, notlar, durum } = await istek.json();

    if (!adSoyad || !telefon) {
      return NextResponse.json({ hata: 'Ad soyad ve telefon zorunludur' }, { status: 400 });
    }

    const audit = await auditGuncelle();
    const eskiIsci = await prisma.isci.findUnique({ where: { id } });
    const guncellendi = await prisma.isci.update({
      where: { id },
      data: {
        adSoyad,
        tcNo: tcNo || null,
        telefon,
        adres: adres || null,
        bankaIban: bankaIban || null,
        acilIletisim: acilIletisim || null,
        notlar: notlar || null,
        durum,
        ...audit,
      },
    });
    logKaydet({ islemTipi: 'guncelleme', modul: 'isci', tablo: 'isciler', kayitId: id, eskiDeger: eskiIsci, yeniDeger: guncellendi }).catch(console.error);
    return NextResponse.json(guncellendi);
  } catch {
    return NextResponse.json({ hata: 'İşçi güncellenemedi' }, { status: 500 });
  }
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const audit = await auditGuncelle();
    const eskiIsci = await prisma.isci.findUnique({ where: { id } });
    await prisma.isci.update({
      where: { id },
      data: { aktif: false, ...audit },
    });
    logKaydet({ islemTipi: 'silme', modul: 'isci', tablo: 'isciler', kayitId: id, eskiDeger: eskiIsci }).catch(console.error);
    return NextResponse.json({ basarili: true });
  } catch {
    return NextResponse.json({ hata: 'İşçi silinemedi' }, { status: 500 });
  }
}
