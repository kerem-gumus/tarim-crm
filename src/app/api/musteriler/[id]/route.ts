import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { logKaydet } from '@/lib/aktiviteLog';
import { auditGuncelle } from '@/lib/auditKullanici';

export async function PUT(istek: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const {
      musteriAdi,
      musteriTipi,
      devletMi,
      kurumAdi,
      yetkiliKisi,
      telefon,
      email,
      adres,
      vergiDairesi,
      vergiNo,
      odemeVadeGun,
      kontenjanVarMi,
      durum,
      notlar,
    } = await istek.json();

    if (!musteriAdi || !telefon) {
      return NextResponse.json({ hata: 'Müşteri adı ve telefon zorunludur' }, { status: 400 });
    }

    if (!musteriTipi || !['kurumsal', 'pesincu'].includes(musteriTipi)) {
      return NextResponse.json({ hata: 'Geçerli bir müşteri tipi seçiniz' }, { status: 400 });
    }

    const kurumsalMi = musteriTipi === 'kurumsal';

    const audit = await auditGuncelle();
    const eskiMusteri = await prisma.musteri.findUnique({ where: { id } });
    const guncellendi = await prisma.musteri.update({
      where: { id },
      data: {
        musteriAdi,
        musteriTipi,
        kurumsalMi,
        devletMi: devletMi ?? false,
        kurumAdi: kurumsalMi ? (kurumAdi || null) : null,
        yetkiliKisi: kurumsalMi ? (yetkiliKisi || null) : null,
        telefon,
        email: email || null,
        adres: adres || null,
        vergiDairesi: kurumsalMi ? (vergiDairesi || null) : null,
        vergiNo: kurumsalMi ? (vergiNo || null) : null,
        odemeVadeGun: odemeVadeGun ?? 0,
        kontenjanVarMi: kontenjanVarMi ?? false,
        durum: durum ?? 'aktif',
        notlar: notlar || null,
        ...audit,
      },
    });
    logKaydet({ islemTipi: 'guncelleme', modul: 'musteri', tablo: 'musteriler', kayitId: id, eskiDeger: eskiMusteri, yeniDeger: guncellendi }).catch(console.error);
    return NextResponse.json(guncellendi);
  } catch {
    return NextResponse.json({ hata: 'Müşteri güncellenemedi' }, { status: 500 });
  }
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const audit = await auditGuncelle();
    const eskiMusteri = await prisma.musteri.findUnique({ where: { id } });
    await prisma.musteri.update({
      where: { id },
      data: { aktif: false, ...audit },
    });
    logKaydet({ islemTipi: 'silme', modul: 'musteri', tablo: 'musteriler', kayitId: id, eskiDeger: eskiMusteri }).catch(console.error);
    return NextResponse.json({ basarili: true });
  } catch {
    return NextResponse.json({ hata: 'Müşteri silinemedi' }, { status: 500 });
  }
}
