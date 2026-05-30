import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { logKaydet } from '@/lib/aktiviteLog';
import { auditOlustur } from '@/lib/auditKullanici';

export async function GET() {
  try {
    const kayitlar = await prisma.gelirKaydi.findMany({
      where: { aktif: { not: false } },
      include: {
        surgun: {
          include: {
            hasatDonemi: true,
          },
        },
      },
      orderBy: { olusturmaTarihi: 'desc' },
    });

    return NextResponse.json(kayitlar);
  } catch {
    return NextResponse.json({ hata: 'Gelir kayıtları alınamadı' }, { status: 500 });
  }
}

export async function POST(istek: Request) {
  try {
    const govde = await istek.json();
    const { surgunId, toplamKg, birimFiyat, toplamTutar, vadeTarihi, musteriId } = govde;

    if (!surgunId || toplamTutar === undefined) {
      return NextResponse.json({ hata: 'Sürgün ID ve toplam tutar zorunludur' }, { status: 400 });
    }

    const audit = await auditOlustur();
    const kayit = await prisma.gelirKaydi.create({
      data: {
        surgunId,
        musteriId: musteriId ?? null,
        toplamKg: toplamKg ?? 0,
        birimFiyat: birimFiyat ?? 0,
        toplamTutar,
        odemeDurumu: 'odeme_bekleniyor',
        odenenTutar: 0,
        kalanTutar: toplamTutar,
        vadeTarihi: vadeTarihi ? new Date(vadeTarihi) : null,
        ...audit,
      },
      include: {
        surgun: { include: { hasatDonemi: true } },
      },
    });

    logKaydet({
      islemTipi: 'olusturma',
      modul: 'finans',
      tablo: 'gelir_kayitlari',
      kayitId: kayit.id,
      yeniDeger: { surgunId, toplamTutar },
    }).catch(console.error);

    return NextResponse.json(kayit, { status: 201 });
  } catch {
    return NextResponse.json({ hata: 'Gelir kaydı oluşturulamadı' }, { status: 500 });
  }
}
