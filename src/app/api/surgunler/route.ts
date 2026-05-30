import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { logKaydet } from '@/lib/aktiviteLog';
import { auditOlustur } from '@/lib/auditKullanici';

export async function GET() {
  try {
    const surgunler = await prisma.surgun.findMany({
      where: { aktif: { not: false } },
      include: { hasatDonemi: true },
      orderBy: { surgunNo: 'asc' },
    });
    return NextResponse.json(surgunler);
  } catch {
    return NextResponse.json({ hata: 'Sürgünler getirilemedi' }, { status: 500 });
  }
}

export async function POST(istek: Request) {
  try {
    const { hasatDonemiId, baslangicTarihi } = await istek.json();

    if (!hasatDonemiId || !baslangicTarihi) {
      return NextResponse.json({ hata: 'Dönem ID ve başlangıç tarihi zorunludur' }, { status: 400 });
    }

    const aktifSurgun = await prisma.surgun.findFirst({
      where: { hasatDonemiId, durum: 'aktif' },
    });

    if (aktifSurgun) {
      return NextResponse.json(
        { hata: 'Açık sürgün varken yeni sürgün açılamaz' },
        { status: 400 }
      );
    }

    const maxSurgun = await prisma.surgun.findFirst({
      where: { hasatDonemiId },
      orderBy: { surgunNo: 'desc' },
    });

    const yeniSurgunNo = maxSurgun ? maxSurgun.surgunNo + 1 : 1;
    const surgunAdi = `${yeniSurgunNo}. Sürgün`;

    const audit = await auditOlustur();

    const yeniSurgun = await prisma.surgun.create({
      data: {
        hasatDonemiId,
        surgunNo: yeniSurgunNo,
        surgunAdi,
        baslangicTarihi: new Date(baslangicTarihi),
        durum: 'aktif',
        ...audit,
      },
      include: { hasatDonemi: true },
    });

    logKaydet({
      islemTipi: 'olusturma',
      modul: 'hasat',
      tablo: 'surgunler',
      kayitId: yeniSurgun.id,
      yeniDeger: yeniSurgun,
    }).catch(console.error);

    return NextResponse.json(yeniSurgun, { status: 201 });
  } catch {
    return NextResponse.json({ hata: 'Sürgün oluşturulamadı' }, { status: 500 });
  }
}
