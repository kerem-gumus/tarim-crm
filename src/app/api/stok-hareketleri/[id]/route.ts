import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { logKaydet } from '@/lib/aktiviteLog';
import { auditGuncelle } from '@/lib/auditKullanici';

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;

    const hareket = await prisma.stokHareketi.findUnique({
      where: { id },
      include: { malzeme: true },
    });

    if (!hareket) {
      return NextResponse.json({ hata: 'Stok hareketi bulunamadı' }, { status: 404 });
    }

    const mevcutStok = Number(hareket.malzeme.mevcutStok);
    const miktar = Number(hareket.miktar);

    // Ters işlem: giriş ise stoktan düş, çıkış/fire ise stoka geri ekle
    let yeniStok: number;
    if (hareket.hareketTipi === 'giris' || hareket.hareketTipi === 'iade') {
      yeniStok = mevcutStok - miktar;
      if (yeniStok < 0) yeniStok = 0;
    } else {
      yeniStok = mevcutStok + miktar;
    }

    const audit = await auditGuncelle();
    await prisma.$transaction([
      prisma.stokHareketi.update({ where: { id }, data: { aktif: false, ...audit } }),
      prisma.malzeme.update({
        where: { id: hareket.malzemeId },
        data: { mevcutStok: yeniStok },
      }),
      // Giriş anında oluşan borç kaydını da pasifleştir
      prisma.odemeKaydi.updateMany({
        where: { stokHareketiId: id, aktif: true },
        data: { aktif: false },
      }),
    ]);

    logKaydet({
      islemTipi: 'silme',
      modul: 'envanter',
      tablo: 'stok_hareketleri',
      kayitId: id,
      eskiDeger: { ...hareket, miktar, yeniStok },
    }).catch(console.error);

    return NextResponse.json({ basarili: true });
  } catch {
    return NextResponse.json({ hata: 'Stok hareketi silinemedi' }, { status: 500 });
  }
}
