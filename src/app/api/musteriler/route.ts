import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { logKaydet } from '@/lib/aktiviteLog';
import { auditOlustur } from '@/lib/auditKullanici';

export async function GET() {
  try {
    const musteriler = await prisma.musteri.findMany({
      where: { aktif: { not: false }, durum: 'aktif' },
      orderBy: { musteriAdi: 'asc' },
    });
    return NextResponse.json(musteriler);
  } catch {
    return NextResponse.json({ hata: 'Müşteriler getirilemedi' }, { status: 500 });
  }
}

export async function POST(istek: Request) {
  try {
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

    const audit = await auditOlustur();
    const yeniMusteri = await prisma.musteri.create({
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
    logKaydet({ islemTipi: 'olusturma', modul: 'musteri', tablo: 'musteriler', kayitId: yeniMusteri.id, yeniDeger: yeniMusteri }).catch(console.error);
    return NextResponse.json(yeniMusteri, { status: 201 });
  } catch {
    return NextResponse.json({ hata: 'Müşteri oluşturulamadı' }, { status: 500 });
  }
}
