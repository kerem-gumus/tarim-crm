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
    const { aciklama, tutar, kategori } = govde;

    const mevcutKayit = await prisma.odemeKaydi.findUnique({ where: { id } });
    if (!mevcutKayit) {
      return NextResponse.json({ hata: 'Ödeme kaydı bulunamadı' }, { status: 404 });
    }

    const audit = await auditGuncelle();
    const guncellenenKayit = await prisma.odemeKaydi.update({
      where: { id },
      data: {
        ...(aciklama !== undefined && { aciklama }),
        ...(tutar !== undefined && { tutar }),
        ...(kategori !== undefined && { kategori }),
        ...audit,
      },
    });

    logKaydet({
      islemTipi: 'guncelleme',
      modul: 'finans',
      tablo: 'odeme_kayitlari',
      kayitId: id,
      yeniDeger: { aciklama, tutar, kategori },
    }).catch(console.error);

    return NextResponse.json(guncellenenKayit);
  } catch {
    return NextResponse.json({ hata: 'Ödeme kaydı güncellenemedi' }, { status: 500 });
  }
}

export async function DELETE(
  _istek: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const kayit = await prisma.odemeKaydi.findUnique({ where: { id } });
    if (!kayit) {
      return NextResponse.json({ hata: 'Ödeme kaydı bulunamadı' }, { status: 404 });
    }

    if (kayit.odemeDurumu !== 'odeme_bekleniyor') {
      return NextResponse.json(
        { hata: 'Yalnızca ödeme bekleyen kayıtlar silinebilir' },
        { status: 400 }
      );
    }

    const audit = await auditGuncelle();
    await prisma.odemeKaydi.update({ where: { id }, data: { aktif: false, ...audit } });

    logKaydet({
      islemTipi: 'silme',
      modul: 'finans',
      tablo: 'odeme_kayitlari',
      kayitId: id,
    }).catch(console.error);

    return NextResponse.json({ basarili: true });
  } catch {
    return NextResponse.json({ hata: 'Ödeme kaydı silinemedi' }, { status: 500 });
  }
}
