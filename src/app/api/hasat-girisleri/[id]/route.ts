import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { logKaydet } from '@/lib/aktiviteLog';
import { auditGuncelle } from '@/lib/auditKullanici';
import { kontenjanZinciriGuncelle } from '@/lib/kontenjanZinciri';

export async function DELETE(_istek: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;

    const giris = await prisma.hasatGirisi.findUnique({ where: { id } });
    if (!giris) {
      return NextResponse.json({ hata: 'Hasat girişi bulunamadı' }, { status: 404 });
    }

    const audit = await auditGuncelle();

    await prisma.odemeKaydi.updateMany({ where: { hasatGirisId: id }, data: { aktif: false, ...audit } });
    // Cüzdan cari hareketini de pasifleştir — silinen giriş hesaba katılmamalı
    await prisma.cariHareket.updateMany({ where: { hasatGirisiId: id, aktif: true }, data: { aktif: false } });
    await prisma.hasatGirisi.update({ where: { id }, data: { aktif: false, ...audit } });

    // Sürgün toplam hasat güncelle
    // Senaryo 2 (satisBenimMi === false = "B yaptı") girişlerinde kg zaten
    // sürgüne eklenmemişti — silince de düşülmemeli, yoksa negatife gider.
    const kgSurguneEklenmisti = giris.satisBenimMi !== false;
    if (kgSurguneEklenmisti && Number(giris.tartimMiktariKg) > 0) {
      await prisma.surgun.update({
        where: { id: giris.surgunId },
        data: { toplamHasatKg: { decrement: Number(giris.tartimMiktariKg) } },
      });
    }

    // Kontenjan takip zincirini güncelle
    if (giris.kontenjanId) {
      // Bu girişe ait takip kaydını bul
      const takip = await prisma.kontenjanGunlukTakip.findFirst({
        where: { hasatGirisId: id, aktif: true },
      });

      if (takip) {
        // Bu takip kaydından bir öncekinin kalanını bul
        const oncekiTakip = await prisma.kontenjanGunlukTakip.findFirst({
          where: {
            kontenjanId: giris.kontenjanId,
            aktif: true,
            OR: [
              { tarih: { lt: takip.tarih } },
              {
                tarih: takip.tarih,
                olusturmaTarihi: { lt: takip.olusturmaTarihi },
              },
            ],
          },
          orderBy: [{ tarih: 'desc' }, { olusturmaTarihi: 'desc' }],
        });

        // Bu takip kaydını kapat
        await prisma.kontenjanGunlukTakip.update({
          where: { id: takip.id },
          data: { aktif: false, ...audit },
        });

        // Eğer bu takipten sonra kayıtlar varsa, önceki kalanı kullanarak yeniden hesapla
        const oncekiKalan = oncekiTakip ? Number(oncekiTakip.kalanBakiyeKg) : 0;

        // Sonraki kayıtları bul ve önceki kalanıyla yeniden hesapla
        const sonrakiler = await prisma.kontenjanGunlukTakip.findMany({
          where: {
            kontenjanId: giris.kontenjanId,
            aktif: true,
            OR: [
              { tarih: { gt: takip.tarih } },
              {
                tarih: takip.tarih,
                olusturmaTarihi: { gt: takip.olusturmaTarihi },
              },
            ],
          },
          orderBy: [{ tarih: 'asc' }, { olusturmaTarihi: 'asc' }],
        });

        let devamKalan = oncekiKalan;
        for (const t of sonrakiler) {
          const etkili = Number(t.tartimKg) + devamKalan;
          const yeniKalan = etkili - Number(t.hesaplananSatisKg);
          await prisma.kontenjanGunlukTakip.update({
            where: { id: t.id },
            data: { oncekiBakiyeKg: devamKalan, kalanBakiyeKg: yeniKalan },
          });
          devamKalan = yeniKalan;
        }
      }
    }

    logKaydet({
      islemTipi: 'silme',
      modul: 'hasat',
      tablo: 'hasat_girisleri',
      kayitId: id,
    }).catch(console.error);

    return NextResponse.json({ basarili: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ hata: 'Hasat girişi silinemedi' }, { status: 500 });
  }
}
