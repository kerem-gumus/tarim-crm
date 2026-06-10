import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { logKaydet } from '@/lib/aktiviteLog';
import { auditGuncelle } from '@/lib/auditKullanici';

export async function POST(_istek: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const bugun = new Date();

    const donem = await prisma.hasatDonemi.findUnique({
      where: { id },
      include: {
        // Tüm sürgünler (aktif + kapali) — bazı sürgünler dönem kapanmadan manuel kapatılmış olabilir
        surgunler: {
          where: { aktif: { not: false } },
          select: { id: true, durum: true, toplamHasatKg: true },
        },
      },
    });

    if (!donem) {
      return NextResponse.json({ hata: 'Dönem bulunamadı' }, { status: 404 });
    }

    if (donem.durum === 'kapali') {
      return NextResponse.json({ hata: 'Dönem zaten kapalı' }, { status: 400 });
    }

    // Tüm sürgünlerin toplamHasatKg'ını topla (aktif + zaten kapali)
    // toplamHasatKg alanı her hasat girişinde anlık olarak increment edilir — güvenilir kaynak.
    const toplamHasatKg = donem.surgunler.reduce(
      (s, surgun) => s + Number(surgun.toplamHasatKg ?? 0),
      0
    );

    // Destekleme alacağını hesapla (sadece desteklemeMiktari girildiyse)
    const desteklemeMiktari = donem.desteklemeMiktari ? Number(donem.desteklemeMiktari) : null;
    const desteklemeAlacakTutar =
      desteklemeMiktari && toplamHasatKg > 0
        ? toplamHasatKg * desteklemeMiktari
        : null;

    // Sadece hâlâ aktif olan sürgünleri kapat
    const aktifSurgunIds = donem.surgunler
      .filter((s) => s.durum === 'aktif')
      .map((s) => s.id);

    const audit = await auditGuncelle();

    await prisma.$transaction([
      ...(aktifSurgunIds.length > 0
        ? [
            prisma.surgun.updateMany({
              where: { id: { in: aktifSurgunIds } },
              data: { durum: 'kapali', bitisTarihi: bugun, ...audit },
            }),
          ]
        : []),
      prisma.hasatDonemi.update({
        where: { id },
        data: {
          durum: 'kapali',
          bitisTarihi: bugun,
          toplamHasatKg,
          ...(desteklemeAlacakTutar !== null && {
            desteklemeAlacakTutar,
            desteklemeKalanTutar: desteklemeAlacakTutar,
            desteklemeOdemeDurumu: 'odeme_bekleniyor',
          }),
          ...audit,
        },
      }),
    ]);

    const kapatilmisDonem = await prisma.hasatDonemi.findUnique({
      where: { id },
      include: {
        surgunler: true,
        kesintiler: { where: { aktif: { not: false } } },
        desteklemeOdemeler: { where: { aktif: { not: false } } },
      },
    });

    logKaydet({
      islemTipi: 'guncelleme',
      modul: 'hasat',
      tablo: 'hasat_donemleri',
      kayitId: id,
      yeniDeger: { durum: 'kapali', bitisTarihi: bugun, toplamHasatKg, desteklemeAlacakTutar },
    }).catch(console.error);

    return NextResponse.json(kapatilmisDonem);
  } catch (err) {
    console.error('[donem kapat]', err);
    return NextResponse.json({ hata: 'Dönem kapatılamadı' }, { status: 500 });
  }
}
