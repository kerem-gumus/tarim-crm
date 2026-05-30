import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { logKaydet } from '@/lib/aktiviteLog';
import { auditGuncelle } from '@/lib/auditKullanici';

export async function POST(
  _istek: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const mevcutKontenjan = await prisma.kontenjan.findUnique({ where: { id } });
    if (!mevcutKontenjan) {
      return NextResponse.json({ hata: 'Kontenjan bulunamadı' }, { status: 404 });
    }

    if (mevcutKontenjan.durum === 'kapali') {
      return NextResponse.json({ hata: 'Kontenjan zaten kapalı' }, { status: 400 });
    }

    const bugun = new Date();
    bugun.setHours(0, 0, 0, 0);

    const audit = await auditGuncelle();

    const guncelKontenjan = await prisma.kontenjan.update({
      where: { id },
      data: {
        durum: 'kapali',
        bitisTarihi: bugun,
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
    return NextResponse.json({ hata: 'Kontenjan kapatılamadı' }, { status: 500 });
  }
}
