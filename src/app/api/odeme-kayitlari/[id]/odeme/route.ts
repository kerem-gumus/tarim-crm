import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { logKaydet } from '@/lib/aktiviteLog';
import { auditGuncelle, auditOlustur } from '@/lib/auditKullanici';

export async function POST(
  istek: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const govde = await istek.json();
    const {
      gercekOdeme,   // Gerçek yatırılan / ödenen tutar (bankadan düşülecek)
      tamOdeme,      // true → borcu sıfırla, farkı fark hesabına at
      odemeYontemi,
      odemeTarihi,
      bankaHesabiId,
      kmhOnayi,
    } = govde;

    if (!gercekOdeme || gercekOdeme <= 0) {
      return NextResponse.json({ hata: 'Geçerli bir ödeme miktarı giriniz' }, { status: 400 });
    }
    if (!odemeYontemi) {
      return NextResponse.json({ hata: 'Ödeme yöntemi zorunludur' }, { status: 400 });
    }

    const kayit = await prisma.odemeKaydi.findUnique({ where: { id } });
    if (!kayit) {
      return NextResponse.json({ hata: 'Ödeme kaydı bulunamadı' }, { status: 404 });
    }
    if (kayit.odemeDurumu === 'odendi') {
      return NextResponse.json({ hata: 'Bu kayıt zaten ödenmiş' }, { status: 400 });
    }

    const kalanTutar = Number(kayit.tutar) - Number(kayit.odenenTutar);
    const tarihDate = odemeTarihi ? new Date(odemeTarihi) : new Date();

    // Tam ödeme modunda: borcu kalan kadar işaretle, farkı fark hesabına at
    const sayilanOdeme = tamOdeme ? kalanTutar : Number(gercekOdeme);
    const farkTutar = kalanTutar - Number(gercekOdeme); // > 0: az ödedik (elimizde kaldı), < 0: fazla ödedik

    const yeniOdenen = Number(kayit.odenenTutar) + sayilanOdeme;
    const yeniKalan = Number(kayit.tutar) - yeniOdenen;
    const yeniDurum = yeniKalan <= 0.005 ? 'odendi' : yeniOdenen > 0 ? 'kismi_odendi' : 'odeme_bekleniyor';

    const audit = await auditGuncelle();
    const auditOlusturma = await auditOlustur();

    // ─── Banka üzerinden ödeme ────────────────────────────────────────────
    if (odemeYontemi === 'banka' && bankaHesabiId) {
      const hesap = await prisma.bankaHesabi.findUnique({ where: { id: bankaHesabiId } });
      if (!hesap) {
        return NextResponse.json({ hata: 'Seçilen banka hesabı bulunamadı' }, { status: 404 });
      }

      const yeniBakiye = Number(hesap.bakiye) - Number(gercekOdeme); // bankadan düşülen gerçek tutar
      const bakiyeYetersiz = yeniBakiye < 0;

      if (bakiyeYetersiz && !hesap.kmhLimiti && !kmhOnayi) {
        return NextResponse.json({
          hata: 'yetersiz_bakiye',
          mesaj: `Hesapta yeterli bakiye yok. Mevcut bakiye: ${Number(hesap.bakiye).toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺`,
          bakiye: Number(hesap.bakiye),
          kmhLimiti: false,
        }, { status: 409 });
      }

      if (bakiyeYetersiz && !kmhOnayi) {
        return NextResponse.json({
          hata: 'yetersiz_bakiye',
          mesaj: 'Hesap bakiyesi yetersiz. KMH devreye girecek, faiz işleyecektir.',
          bakiye: Number(hesap.bakiye),
          kmhLimiti: true,
        }, { status: 409 });
      }

      // Fark hesabını bul (sadece tamOdeme ve fark varsa gerekli)
      const hasFark = tamOdeme && Math.abs(farkTutar) > 0.005;
      let farkHesap = null;
      if (hasFark) {
        farkHesap = await prisma.bankaHesabi.findFirst({ where: { tur: 'fark_hesabi', aktif: true } });
      }

      const sonuc = await prisma.$transaction(async (tx) => {
        // 1. Ödeme kaydını güncelle
        const guncellenenKayit = await tx.odemeKaydi.update({
          where: { id },
          data: {
            odenenTutar: yeniOdenen,
            odemeDurumu: yeniDurum,
            odemeYontemi,
            odemeTarihi: tarihDate,
            ...audit,
          },
        });

        // 2. Bankadan gerçek ödeme miktarını düş
        await tx.bankaHareketi.create({
          data: {
            bankaHesabiId,
            tip: 'cikis',
            tutar: gercekOdeme,
            aciklama: `Borç ödemesi — ${kayit.kategori ?? ''}${tamOdeme && hasFark ? ` (Tam ödeme, fark: ${Math.abs(farkTutar).toFixed(2)} ₺)` : ''}`,
            tarih: tarihDate,
            referansTipi: 'odeme_kaydi',
            referansId: id,
            olusturanId: auditOlusturma.olusturanId ?? null,
            olusturanAdi: auditOlusturma.olusturanAdi ?? null,
          },
        });
        await tx.bankaHesabi.update({
          where: { id: bankaHesabiId },
          data: {
            bakiye: { decrement: gercekOdeme },
            ...(bakiyeYetersiz ? { alarmDurumu: true } : {}),
          },
        });

        // 3. Fark varsa fark hesabına yansıt
        if (hasFark && farkHesap) {
          if (farkTutar > 0.005) {
            // Az ödedik → fark elimizde kaldı → fark hesabına GİRİŞ
            await tx.bankaHareketi.create({
              data: {
                bankaHesabiId: farkHesap.id,
                tip: 'giris',
                tutar: farkTutar,
                aciklama: `Borç farkı (az ödeme) — ${kayit.kategori ?? ''}`,
                tarih: tarihDate,
                referansTipi: 'odeme_kaydi',
                referansId: id,
                olusturanId: auditOlusturma.olusturanId ?? null,
                olusturanAdi: auditOlusturma.olusturanAdi ?? null,
              },
            });
            await tx.bankaHesabi.update({
              where: { id: farkHesap.id },
              data: { bakiye: { increment: farkTutar } },
            });
          } else if (farkTutar < -0.005) {
            // Fazla ödedik → fark hesabından ÇIKIŞ
            const fazla = Math.abs(farkTutar);
            await tx.bankaHareketi.create({
              data: {
                bankaHesabiId: farkHesap.id,
                tip: 'cikis',
                tutar: fazla,
                aciklama: `Borç farkı (fazla ödeme) — ${kayit.kategori ?? ''}`,
                tarih: tarihDate,
                referansTipi: 'odeme_kaydi',
                referansId: id,
                olusturanId: auditOlusturma.olusturanId ?? null,
                olusturanAdi: auditOlusturma.olusturanAdi ?? null,
              },
            });
            await tx.bankaHesabi.update({
              where: { id: farkHesap.id },
              data: { bakiye: { decrement: fazla } },
            });
          }
        }

        return guncellenenKayit;
      });

      logKaydet({
        islemTipi: 'guncelleme',
        modul: 'finans',
        tablo: 'odeme_kayitlari',
        kayitId: id,
        yeniDeger: { gercekOdeme, sayilanOdeme, farkTutar, tamOdeme, yeniDurum, odemeYontemi, bankaHesabiId },
      }).catch(console.error);

      return NextResponse.json(sonuc);
    }

    // ─── Nakit / EFT ─────────────────────────────────────────────────────
    // Fark hesabını bul (sadece tamOdeme ve fark varsa gerekli)
    const hasFark = tamOdeme && Math.abs(farkTutar) > 0.005;
    let farkHesap = null;
    if (hasFark) {
      farkHesap = await prisma.bankaHesabi.findFirst({ where: { tur: 'fark_hesabi', aktif: true } });
    }

    const guncellenenKayit = await prisma.$transaction(async (tx) => {
      const kayitGuncellendi = await tx.odemeKaydi.update({
        where: { id },
        data: {
          odenenTutar: yeniOdenen,
          odemeDurumu: yeniDurum,
          odemeYontemi,
          odemeTarihi: tarihDate,
          ...audit,
        },
      });

      if (hasFark && farkHesap) {
        if (farkTutar > 0.005) {
          await tx.bankaHareketi.create({
            data: {
              bankaHesabiId: farkHesap.id,
              tip: 'giris',
              tutar: farkTutar,
              aciklama: `Borç farkı (az ödeme, ${odemeYontemi}) — ${kayit.kategori ?? ''}`,
              tarih: tarihDate,
              referansTipi: 'odeme_kaydi',
              referansId: id,
              olusturanId: auditOlusturma.olusturanId ?? null,
              olusturanAdi: auditOlusturma.olusturanAdi ?? null,
            },
          });
          await tx.bankaHesabi.update({ where: { id: farkHesap.id }, data: { bakiye: { increment: farkTutar } } });
        } else if (farkTutar < -0.005) {
          const fazla = Math.abs(farkTutar);
          await tx.bankaHareketi.create({
            data: {
              bankaHesabiId: farkHesap.id,
              tip: 'cikis',
              tutar: fazla,
              aciklama: `Borç farkı (fazla ödeme, ${odemeYontemi}) — ${kayit.kategori ?? ''}`,
              tarih: tarihDate,
              referansTipi: 'odeme_kaydi',
              referansId: id,
              olusturanId: auditOlusturma.olusturanId ?? null,
              olusturanAdi: auditOlusturma.olusturanAdi ?? null,
            },
          });
          await tx.bankaHesabi.update({ where: { id: farkHesap.id }, data: { bakiye: { decrement: fazla } } });
        }
      }

      return kayitGuncellendi;
    });

    logKaydet({
      islemTipi: 'guncelleme',
      modul: 'finans',
      tablo: 'odeme_kayitlari',
      kayitId: id,
      yeniDeger: { gercekOdeme, sayilanOdeme, farkTutar, tamOdeme, yeniDurum, odemeYontemi },
    }).catch(console.error);

    return NextResponse.json(guncellenenKayit);
  } catch {
    return NextResponse.json({ hata: 'Ödeme kaydedilemedi' }, { status: 500 });
  }
}
