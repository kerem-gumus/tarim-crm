import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { logKaydet } from '@/lib/aktiviteLog';
import { auditGuncelle } from '@/lib/auditKullanici';

export async function PUT(istek: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { adSoyad, tcNo, telefon, telefon2, adres, il, ilce, koy, cayKurNo, bankaIban, vergiNo, durum, notlar } =
      await istek.json();

    if (!adSoyad || !telefon) {
      return NextResponse.json({ hata: 'Ad soyad ve telefon zorunludur' }, { status: 400 });
    }

    const audit = await auditGuncelle();
    const eskiCiftci = await prisma.ciftci.findUnique({ where: { id } });
    const guncellendi = await prisma.ciftci.update({
      where: { id },
      data: { adSoyad, tcNo, telefon, telefon2, adres, il, ilce, koy, cayKurNo, bankaIban, vergiNo, durum, notlar, ...audit },
    });
    logKaydet({ islemTipi: 'guncelleme', modul: 'ciftci', tablo: 'ciftciler', kayitId: id, eskiDeger: eskiCiftci, yeniDeger: guncellendi }).catch(console.error);
    return NextResponse.json(guncellendi);
  } catch {
    return NextResponse.json({ hata: 'Çiftçi güncellenemedi' }, { status: 500 });
  }
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const audit = await auditGuncelle();
    const eskiCiftci = await prisma.ciftci.findUnique({ where: { id } });
    await prisma.ciftci.update({
      where: { id },
      data: { aktif: false, ...audit },
    });
    logKaydet({ islemTipi: 'silme', modul: 'ciftci', tablo: 'ciftciler', kayitId: id, eskiDeger: eskiCiftci }).catch(console.error);
    return NextResponse.json({ basarili: true });
  } catch {
    return NextResponse.json({ hata: 'Çiftçi silinemedi' }, { status: 500 });
  }
}
