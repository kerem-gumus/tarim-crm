export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { logKaydet } from '@/lib/aktiviteLog';
import { auditOlustur } from '@/lib/auditKullanici';

export async function GET() {
  try {
    const donemler = await prisma.hasatDonemi.findMany({
      where: { aktif: { not: false } },
      include: {
        surgunler: { where: { aktif: { not: false } } },
        kesintiler: { where: { aktif: { not: false } }, orderBy: { olusturmaTarihi: 'asc' } },
        desteklemeOdemeler: { where: { aktif: { not: false } }, orderBy: { tarih: 'desc' } },
      },
      orderBy: { yil: 'desc' },
    });
    return NextResponse.json(donemler);
  } catch {
    return NextResponse.json({ hata: 'Hasat dönemleri getirilemedi' }, { status: 500 });
  }
}

export async function POST(istek: Request) {
  try {
    const { donemAdi, yil, baslangicTarihi, brutFiyat, netFiyat, desteklemeMiktari, kesintiler } = await istek.json();

    if (!donemAdi || !yil || !baslangicTarihi) {
      return NextResponse.json({ hata: 'Dönem adı, yıl ve başlangıç tarihi zorunludur' }, { status: 400 });
    }

    const aktifDonem = await prisma.hasatDonemi.findFirst({
      where: { durum: 'aktif' },
    });

    if (aktifDonem) {
      return NextResponse.json(
        { hata: 'Açık hasat dönemi varken yeni dönem başlatılamaz' },
        { status: 400 }
      );
    }

    const audit = await auditOlustur();

    // netFiyat yoksa kesintilerden otomatik hesapla
    let hesaplananNet = netFiyat ? parseFloat(netFiyat) : null;
    const kesintilerData: { kesintiAdi: string; yuzde: number }[] = Array.isArray(kesintiler)
      ? kesintiler.filter((k: { kesintiAdi: string; yuzde: string }) => k.kesintiAdi && k.yuzde)
      : [];
    if (!hesaplananNet && brutFiyat && kesintilerData.length > 0) {
      const toplamYuzde = kesintilerData.reduce((s, k) => s + Number(k.yuzde), 0);
      hesaplananNet = parseFloat(brutFiyat) * (1 - toplamYuzde / 100);
    }

    const yeniDonem = await prisma.hasatDonemi.create({
      data: {
        donemAdi,
        yil: Number(yil),
        baslangicTarihi: new Date(baslangicTarihi),
        durum: 'aktif',
        brutFiyat: brutFiyat ? parseFloat(brutFiyat) : null,
        netFiyat: hesaplananNet,
        desteklemeMiktari: desteklemeMiktari ? parseFloat(desteklemeMiktari) : null,
        kesintiler: kesintilerData.length > 0 ? {
          create: kesintilerData.map((k) => ({
            kesintiAdi: k.kesintiAdi,
            yuzde: Number(k.yuzde),
            olusturanId: audit.olusturanId ?? null,
            olusturanAdi: audit.olusturanAdi ?? null,
          })),
        } : undefined,
        ...audit,
      },
      include: {
        surgunler: true,
        kesintiler: { where: { aktif: { not: false } } },
      },
    });

    logKaydet({
      islemTipi: 'olusturma',
      modul: 'hasat',
      tablo: 'hasat_donemleri',
      kayitId: yeniDonem.id,
      yeniDeger: yeniDonem,
    }).catch(console.error);

    return NextResponse.json(yeniDonem, { status: 201 });
  } catch {
    return NextResponse.json({ hata: 'Hasat dönemi oluşturulamadı' }, { status: 500 });
  }
}
