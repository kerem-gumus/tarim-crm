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
    const govde = await istek.json();
    const { birimFiyat, toplamTutar, vadeTarihi, musteriId } = govde;

    const mevcutKayit = await prisma.gelirKaydi.findUnique({ where: { id } });
    if (!mevcutKayit) {
      return NextResponse.json({ hata: 'Gelir kaydı bulunamadı' }, { status: 404 });
    }

    const audit = await auditGuncelle();
    const guncellenenKayit = await prisma.gelirKaydi.update({
      where: { id },
      data: {
        ...(birimFiyat !== undefined && { birimFiyat }),
        ...(toplamTutar !== undefined && {
          toplamTutar,
          kalanTutar: toplamTutar - Number(mevcutKayit.odenenTutar),
        }),
        ...(vadeTarihi !== undefined && {
          vadeTarihi: vadeTarihi ? new Date(vadeTarihi) : null,
        }),
        ...(musteriId !== undefined && { musteriId }),
        ...audit,
      },
      include: {
        surgun: { include: { hasatDonemi: true } },
      },
    });

    logKaydet({
      islemTipi: 'guncelleme',
      modul: 'finans',
      tablo: 'gelir_kayitlari',
      kayitId: id,
      yeniDeger: { birimFiyat, toplamTutar, vadeTarihi, musteriId },
    }).catch(console.error);

    return NextResponse.json(guncellenenKayit);
  } catch {
    return NextResponse.json({ hata: 'Gelir kaydı güncellenemedi' }, { status: 500 });
  }
}

export async function DELETE(
  _istek: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const kayit = await prisma.gelirKaydi.findUnique({ where: { id } });
    if (!kayit) {
      return NextResponse.json({ hata: 'Gelir kaydı bulunamadı' }, { status: 404 });
    }

    if (kayit.odemeDurumu !== 'odeme_bekleniyor') {
      return NextResponse.json(
        { hata: 'Yalnızca ödeme bekleyen kayıtlar silinebilir' },
        { status: 400 }
      );
    }

    const audit = await auditGuncelle();
    await prisma.gelirKaydi.update({ where: { id }, data: { aktif: false, ...audit } });

    logKaydet({
      islemTipi: 'silme',
      modul: 'finans',
      tablo: 'gelir_kayitlari',
      kayitId: id,
    }).catch(console.error);

    return NextResponse.json({ basarili: true });
  } catch {
    return NextResponse.json({ hata: 'Gelir kaydı silinemedi' }, { status: 500 });
  }
}
