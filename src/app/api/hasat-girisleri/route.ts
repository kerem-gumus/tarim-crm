export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { logKaydet } from '@/lib/aktiviteLog';
import { auditOlustur } from '@/lib/auditKullanici';
// kontenjanZinciriGuncelle burada kullanılmıyor ama [id]/route.ts için export edilmişti
// Artık @/lib/kontenjanZinciri'nden import ediliyor

export async function GET(istek: Request) {
  try {
    const { searchParams } = new URL(istek.url);
    const surgunId = searchParams.get('surgunId');

    const girişler = await prisma.hasatGirisi.findMany({
      where: surgunId ? { surgunId, aktif: { not: false } } : { aktif: { not: false } },
      include: {
        tarla: { include: { ciftci: true } },
        isciEkip: true,
        musteri: true,
        cuzdanKullanici: { select: { id: true, ad: true } },
      },
      orderBy: { tarih: 'desc' },
    });

    return NextResponse.json(girişler);
  } catch {
    return NextResponse.json({ hata: 'Hasat girişleri getirilemedi' }, { status: 500 });
  }
}

// =====================================================
// "tarih" string'inden timezone-safe UTC Date oluştur
// "2024-05-27" → 2024-05-27T00:00:00.000Z (her zaman UTC)
// =====================================================
function tarihUTC(tarihStr: string): Date {
  const [yil, ay, gun] = tarihStr.split('-').map(Number);
  return new Date(Date.UTC(yil, ay - 1, gun));
}

export async function POST(istek: Request) {
  try {
    const {
      surgunId,
      tarih,
      tarlaId,
      tartimMiktariKg,
      satisMiktariKg,
      toplanmaTuru,
      isciEkipId,
      odemeTuru,
      tonFiyati,
      yevmiyeFiyati,
      musteriId,
      fiyatTuru,
      satisKgFiyati,
      odemeSekli,
      odemeTarihi,
      aciklama,
      notlar,
      kontenjanId,
      gunlukKontenjanKg,
      // Cüzdan kullandırma alanları
      cuzdanKullaniciId,  // null = "kendim"
      satisBenimMi,       // true=Senaryo1 (ben yaptım), false=Senaryo2 (o yaptı)
    } = await istek.json();

    const kontenjanModu = !!kontenjanId;
    // Senaryo 2: B yaptı → kg sürgüne/işçiliğe işlenmez
    const senaryo2 = !!cuzdanKullaniciId && satisBenimMi === false;

    if (!surgunId || !tarih || !musteriId || !toplanmaTuru) {
      return NextResponse.json(
        { hata: 'Sürgün, tarih, müşteri ve toplanma türü zorunludur' },
        { status: 400 }
      );
    }
    if (!kontenjanModu && !tarlaId) {
      return NextResponse.json({ hata: 'Normal hasat girişinde tarla zorunludur' }, { status: 400 });
    }

    const tartimKg = Number(tartimMiktariKg ?? 0);
    const satisKg = Number(satisMiktariKg ?? tartimKg);

    // Senaryo 2'de işçilik B'ye ait, bize kaydedilmez
    let iscilikToplamTutar: number | null = null;
    if (!senaryo2 && toplanmaTuru === 'isci' && isciEkipId && odemeTuru) {
      if (odemeTuru === 'ton_isi' && tonFiyati) {
        // Ton işi: (kg / 1000) × TL/ton
        iscilikToplamTutar = (tartimKg / 1000) * Number(tonFiyati);
      } else if (odemeTuru === 'yevmiye' && yevmiyeFiyati) {
        // Yevmiye: TL/kg × toplam kg
        iscilikToplamTutar = Number(yevmiyeFiyati) * tartimKg;
      }
    }

    const audit = await auditOlustur();

    const yeniGiris = await prisma.hasatGirisi.create({
      data: {
        surgunId,
        tarih: tarihUTC(tarih),
        tarlaId: tarlaId || null,
        kontenjanId: kontenjanId || null,
        tartimMiktariKg: tartimKg,
        satisMiktariKg: satisKg,
        toplanmaTuru,
        isciEkipId: isciEkipId || null,
        odemeTuru: odemeTuru || null,
        tonFiyati: tonFiyati ? Number(tonFiyati) : null,
        yevmiyeFiyati: yevmiyeFiyati ? Number(yevmiyeFiyati) : null,
        iscilikToplamTutar: iscilikToplamTutar ?? null,
        musteriId,
        fiyatTuru: fiyatTuru || null,
        satisKgFiyati: satisKgFiyati ? parseFloat(satisKgFiyati) : null,
        satisToplam: satisKgFiyati ? satisKg * parseFloat(satisKgFiyati) : null,
        odemeSekli: odemeSekli || null,
        odemeTarihi: odemeTarihi ? tarihUTC(odemeTarihi) : null,
        aciklama: aciklama?.trim() || null,
        notlar: notlar || null,
        cuzdanKullaniciId: cuzdanKullaniciId || null,
        satisBenimMi: cuzdanKullaniciId ? (satisBenimMi === true) : null,
        ...audit,
      },
      include: {
        tarla: { include: { ciftci: true } },
        isciEkip: true,
        musteri: true,
      },
    });

    // İşçilik ödeme kaydı
    if (toplanmaTuru === 'isci' && isciEkipId && iscilikToplamTutar && iscilikToplamTutar > 0) {
      const ekip = await prisma.isciEkibi.findUnique({ where: { id: isciEkipId } });
      const tarihStr = tarihUTC(tarih).toLocaleDateString('tr-TR');
      await prisma.odemeKaydi.create({
        data: {
          kategori: 'iscilik',
          aciklama: `${ekip?.ekipAdi ?? 'Ekip'} - ${tarihStr} işçilik`,
          ilgiliEkipId: isciEkipId,
          hasatGirisId: yeniGiris.id,
          tutar: iscilikToplamTutar,
          odemeDurumu: 'odeme_bekleniyor',
          ...audit,
        },
      });
    }

    // Senaryo 2: kg sürgüne işlenmez (B'nin hasadı, bizim değil)
    if (!senaryo2 && tartimKg > 0) {
      await prisma.surgun.update({
        where: { id: surgunId },
        data: { toplamHasatKg: { increment: tartimKg } },
      });
    }

    // =====================================================
    // Kontenjan günlük takip — her hasat girişi için ayrı kayıt
    // Önceki bakiye: bu kontenjanın en son aktif takip kaydının kalanı
    // Aynı günde birden fazla giriş olabilir → zincir sırayla devam eder
    // =====================================================
    if (kontenjanModu && kontenjanId && gunlukKontenjanKg) {
      const gunlukKg = Number(gunlukKontenjanKg);
      const tarihDate = tarihUTC(tarih);

      // En son aktif takip kaydını bul (tarih + oluşturma sırası)
      const sonTakip = await prisma.kontenjanGunlukTakip.findFirst({
        where: { kontenjanId, aktif: true },
        orderBy: [{ tarih: 'desc' }, { olusturmaTarihi: 'desc' }],
      });
      const oncekiBakiye = sonTakip ? Number(sonTakip.kalanBakiyeKg) : 0;

      const etkili = tartimKg + oncekiBakiye;
      const yeniKalan = etkili - satisKg;

      await prisma.kontenjanGunlukTakip.create({
        data: {
          kontenjanId,
          hasatGirisId: yeniGiris.id,
          tarih: tarihDate,
          tartimKg,
          gunlukKontenjanKg: gunlukKg,
          oncekiBakiyeKg: oncekiBakiye,
          hesaplananSatisKg: satisKg,   // gerçek satış miktarı (0 olabilir)
          kalanBakiyeKg: yeniKalan,
        },
      });
    }

    // Cüzdan kullandırma: cari hareket oluştur
    if (cuzdanKullaniciId) {
      await prisma.cariHareket.create({
        data: {
          cuzdanKullaniciId,
          hasatGirisiId: yeniGiris.id,
          yon: senaryo2 ? 'ben_borcluyum' : 'bana_borclu',
          islemTipi: 'satis_kaynakli',
          miktarKg: tartimKg,
          aciklama: senaryo2
            ? `B yaptı — cüzdan kullandırma (${tartimKg} kg)`
            : `Ben yaptım — ${(await prisma.cuzdanKullanicisi.findUnique({ where: { id: cuzdanKullaniciId }, select: { ad: true } }))?.ad ?? ''} adına (${tartimKg} kg)`,
          tarih: tarihUTC(tarih),
        },
      });
    }

    // Özel/kurumsal müşteri + satış fiyatı girilmişse → alacak kaydını HEMEN oluştur
    // Sürgün kapanmayı beklemiyor. Peşin/vadeli tarihe göre vadeTarihi set edilir.
    const satisToplamSayi = yeniGiris.satisToplam ? Number(yeniGiris.satisToplam) : 0;
    const musteriDevletMi = yeniGiris.musteri?.devletMi ?? false;
    if (!musteriDevletMi && satisToplamSayi > 0 && yeniGiris.satisKgFiyati) {
      await prisma.gelirKaydi.create({
        data: {
          surgunId,
          hasatGirisiId: yeniGiris.id,
          musteriId,
          musteriAdi: yeniGiris.musteri?.musteriAdi ?? null,
          fiyatTuru: fiyatTuru || null,
          toplamKg: satisKg,
          birimFiyat: Number(yeniGiris.satisKgFiyati),
          toplamTutar: satisToplamSayi,
          odemeDurumu: 'odeme_bekleniyor',
          odenenTutar: 0,
          kalanTutar: satisToplamSayi,
          vadeTarihi: odemeTarihi ? tarihUTC(odemeTarihi) : null,
          ...audit,
        },
      });
    }

    logKaydet({
      islemTipi: 'olusturma',
      modul: 'hasat',
      tablo: 'hasat_girisleri',
      kayitId: yeniGiris.id,
      yeniDeger: yeniGiris,
    }).catch(console.error);

    return NextResponse.json(yeniGiris, { status: 201 });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ hata: 'Hasat girişi oluşturulamadı' }, { status: 500 });
  }
}
