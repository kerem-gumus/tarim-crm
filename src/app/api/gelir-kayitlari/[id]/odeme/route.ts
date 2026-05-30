import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { logKaydet } from '@/lib/aktiviteLog';
import { auditGuncelle } from '@/lib/auditKullanici';

export async function POST(
  istek: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const govde = await istek.json();
    const {
      hesaplananTutar, // Bizim hesapladığımız tutar (form'dan gelen kalan tutar)
      gercekTutar,     // Fabrikanın gerçekte yatırdığı tutar
      odemeTarihi,
      aciklama,
      dekontUrl,
      bankaHesabiId,   // Hangi hesaba yattı
      tamOdeme,        // true ise kalanı sıfırla (tüm gelir alındı kabul)
    } = govde;

    if (!gercekTutar || gercekTutar <= 0) {
      return NextResponse.json({ hata: 'Geçerli bir gerçek ödeme tutarı giriniz' }, { status: 400 });
    }

    const kayit = await prisma.gelirKaydi.findUnique({ where: { id } });
    if (!kayit) {
      return NextResponse.json({ hata: 'Gelir kaydı bulunamadı' }, { status: 404 });
    }

    if (kayit.odemeDurumu === 'odendi') {
      return NextResponse.json({ hata: 'Bu kayıt zaten ödenmiş' }, { status: 400 });
    }

    const hesaplananSayi = Number(hesaplananTutar ?? gercekTutar);
    const gercekSayi = Number(gercekTutar);
    const farkTutar = hesaplananSayi - gercekSayi; // + ise eksik yattı, - ise fazla yattı

    const yeniOdenen = Number(kayit.odenenTutar) + gercekSayi;
    const yeniKalan = tamOdeme ? 0 : Math.max(0, Number(kayit.toplamTutar) - yeniOdenen);
    const yeniDurum =
      yeniKalan <= 0.01 || tamOdeme ? 'odendi' : yeniOdenen > 0 ? 'kismi_odendi' : 'odeme_bekleniyor';

    const audit = await auditGuncelle();
    const tarihDate = odemeTarihi ? new Date(odemeTarihi) : new Date();

    const sonuc = await prisma.$transaction(async (tx) => {
      // 1. GelirKaydi güncelle
      const guncellenenKayit = await tx.gelirKaydi.update({
        where: { id },
        data: {
          odenenTutar: yeniOdenen,
          kalanTutar: yeniKalan,
          odemeDurumu: yeniDurum,
          ...audit,
        },
        include: { surgun: { include: { hasatDonemi: true } } },
      });

      // 2. GelirOdemesi kaydı oluştur
      await tx.gelirOdemesi.create({
        data: {
          gelirKaydiId: id,
          bankaHesabiId: bankaHesabiId || null,
          hesaplananTutar: hesaplananSayi,
          gercekTutar: gercekSayi,
          farkTutar,
          odemeTarihi: tarihDate,
          aciklama: aciklama || null,
          dekontUrl: dekontUrl || null,
          olusturanId: audit.guncelleyenId ?? null,
          olusturanAdi: audit.guncelleyenAdi ?? null,
        },
      });

      // 3. Banka hesabına hareketi yansıt (seçildiyse)
      if (bankaHesabiId) {
        await tx.bankaHareketi.create({
          data: {
            bankaHesabiId,
            tip: 'giris',
            tutar: gercekSayi,
            aciklama: aciklama || `Gelir tahsilatı — ${guncellenenKayit.musteriAdi ?? ''} ${guncellenenKayit.ay ?? ''}/${guncellenenKayit.yil ?? ''}`,
            tarih: tarihDate,
            referansTipi: 'gelir_kaydi',
            referansId: id,
            dekontUrl: dekontUrl || null,
            olusturanId: audit.guncelleyenId ?? null,
            olusturanAdi: audit.guncelleyenAdi ?? null,
          },
        });

        // Bakiyeyi güncelle
        await tx.bankaHesabi.update({
          where: { id: bankaHesabiId },
          data: { bakiye: { increment: gercekSayi } },
        });

        // Fark varsa fark_hesabi'na yaz
        if (Math.abs(farkTutar) >= 0.01) {
          const farkHesabi = await tx.bankaHesabi.findFirst({
            where: { tur: 'fark_hesabi', aktif: true },
          });
          if (farkHesabi) {
            const farkTip = farkTutar > 0 ? 'cikis' : 'giris'; // Eksik geldi → kasa eksilir; fazla geldi → kasa artar
            await tx.bankaHareketi.create({
              data: {
                bankaHesabiId: farkHesabi.id,
                tip: farkTip,
                tutar: Math.abs(farkTutar),
                aciklama: `Ödeme farkı — ${guncellenenKayit.musteriAdi ?? ''} (hesaplanan: ${hesaplananSayi.toFixed(2)} ₺, gerçek: ${gercekSayi.toFixed(2)} ₺)`,
                tarih: tarihDate,
                referansTipi: 'gelir_kaydi',
                referansId: id,
                olusturanId: audit.guncelleyenId ?? null,
                olusturanAdi: audit.guncelleyenAdi ?? null,
              },
            });
            await tx.bankaHesabi.update({
              where: { id: farkHesabi.id },
              data: { bakiye: { increment: farkTip === 'giris' ? Math.abs(farkTutar) : -Math.abs(farkTutar) } },
            });
          }
        }
      }

      return guncellenenKayit;
    });

    logKaydet({
      islemTipi: 'guncelleme',
      modul: 'finans',
      tablo: 'gelir_kayitlari',
      kayitId: id,
      yeniDeger: { gercekTutar, hesaplananTutar, farkTutar, yeniOdenen, yeniDurum },
    }).catch(console.error);

    return NextResponse.json(sonuc);
  } catch {
    return NextResponse.json({ hata: 'Ödeme kaydedilemedi' }, { status: 500 });
  }
}
