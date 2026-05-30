import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { logKaydet } from '@/lib/aktiviteLog';
import { auditGuncelle } from '@/lib/auditKullanici';

// Ay numarasını Türkçe aya çevirir
const AY_ADLARI = ['', 'Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran',
  'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'];

export async function POST(_istek: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const bugun = new Date();

    const surgun = await prisma.surgun.findUnique({
      where: { id },
      include: {
        hasatDonemi: true,
        hasatGirisleri: {
          where: { aktif: true },
          include: {
            musteri: { select: { id: true, musteriAdi: true, devletMi: true, musteriTipi: true } },
          },
        },
      },
    });

    if (!surgun) {
      return NextResponse.json({ hata: 'Sürgün bulunamadı' }, { status: 404 });
    }

    if (surgun.durum === 'kapali') {
      return NextResponse.json({ hata: 'Sürgün zaten kapalı' }, { status: 400 });
    }

    const audit = await auditGuncelle();

    // --- Toplam kg hesabı ---
    const toplamHasatKg = surgun.hasatGirisleri.reduce(
      (s, g) => s + Number(g.tartimMiktariKg),
      0
    );

    // --- Toplam işçilik (gelir DEĞİL, gider - artık sadece kayıt amaçlı tutulur) ---
    const toplamIscilikTutar = surgun.hasatGirisleri.reduce(
      (s, g) => s + Number(g.iscilikToplamTutar ?? 0),
      0
    );

    // --- Sürgünü kapat ---
    const kapatilmisSurgun = await prisma.surgun.update({
      where: { id },
      data: {
        durum: 'kapali',
        bitisTarihi: bugun,
        toplamHasatKg,
        toplamTutar: toplamIscilikTutar,
        ...audit,
      },
      include: { hasatDonemi: true },
    });

    logKaydet({
      islemTipi: 'guncelleme',
      modul: 'hasat',
      tablo: 'surgunler',
      kayitId: id,
      yeniDeger: { durum: 'kapali', bitisTarihi: bugun, toplamHasatKg },
    }).catch(console.error);

    // --- Alacak kayıtları: müşteri × ay bazında grupla ---
    // Her (musteriId, yil, ay) için ayrı GelirKaydi oluştur.
    // Devlet müşteri: birimFiyat = dönem netFiyat
    // Özel müşteri: birimFiyat = satisKgFiyati (girişten)

    const netFiyat = Number(surgun.hasatDonemi.netFiyat ?? 0);

    type GrupBilgi = {
      musteriId: string;
      musteriAdi: string;
      devletMi: boolean;
      fiyatTuru: 'devlet_fiyati' | 'ozel_fiyat';
      yil: number;
      ay: number;
      toplamSatisKg: number;
      toplamTutar: number;
      // Özel müşteri için ağırlıklı ortalama hesabı
      birimFiyat: number;
    };

    const gruplar = new Map<string, GrupBilgi>();

    for (const giris of surgun.hasatGirisleri) {
      const satisMiktariKg = Number(giris.satisMiktariKg);
      if (satisMiktariKg <= 0) continue;

      const tarih = new Date(giris.tarih);
      const yil = tarih.getFullYear();
      const ay = tarih.getMonth() + 1;
      const anahtar = `${giris.musteriId}_${yil}_${ay}`;

      const devletMi = giris.musteri.devletMi;
      const birimFiyat = devletMi
        ? netFiyat
        : Number(giris.satisKgFiyati ?? 0);
      const tutar = devletMi
        ? satisMiktariKg * birimFiyat
        : Number(giris.satisToplam ?? satisMiktariKg * birimFiyat);

      const mevcut = gruplar.get(anahtar);
      if (mevcut) {
        mevcut.toplamSatisKg += satisMiktariKg;
        mevcut.toplamTutar += tutar;
        // Ağırlıklı ortalama birim fiyat (özel için)
        if (!devletMi) {
          mevcut.birimFiyat = mevcut.toplamSatisKg > 0
            ? mevcut.toplamTutar / mevcut.toplamSatisKg
            : birimFiyat;
        }
      } else {
        gruplar.set(anahtar, {
          musteriId: giris.musteriId,
          musteriAdi: giris.musteri.musteriAdi,
          devletMi,
          fiyatTuru: devletMi ? 'devlet_fiyati' : 'ozel_fiyat',
          yil,
          ay,
          toplamSatisKg: satisMiktariKg,
          toplamTutar: tutar,
          birimFiyat,
        });
      }
    }

    // GelirKaydi'leri oluştur (her grup için)
    for (const grup of gruplar.values()) {
      if (grup.toplamTutar <= 0) continue;

      const birimFiyatFinal = grup.devletMi
        ? grup.birimFiyat
        : (grup.toplamSatisKg > 0 ? grup.toplamTutar / grup.toplamSatisKg : grup.birimFiyat);

      await prisma.gelirKaydi.create({
        data: {
          surgunId: id,
          musteriId: grup.musteriId,
          musteriAdi: grup.musteriAdi,
          fiyatTuru: grup.fiyatTuru,
          ay: grup.ay,
          yil: grup.yil,
          toplamKg: grup.toplamSatisKg,
          birimFiyat: birimFiyatFinal,
          toplamTutar: grup.toplamTutar,
          kalanTutar: grup.toplamTutar,
          odemeDurumu: 'odeme_bekleniyor',
          odenenTutar: 0,
        },
      });
    }

    return NextResponse.json(kapatilmisSurgun);
  } catch {
    return NextResponse.json({ hata: 'Sürgün kapatılamadı' }, { status: 500 });
  }
}
