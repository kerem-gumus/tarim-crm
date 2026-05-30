import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { auditOlustur } from '@/lib/auditKullanici';

// Hesaplar arası transfer veya tek hesaba manuel giriş/çıkış
export async function POST(istek: Request) {
  try {
    const {
      tip,            // 'transfer' | 'giris' | 'cikis'
      kaynakId,       // transfer için zorunlu
      hedefId,        // transfer için zorunlu
      hesapId,        // giris/cikis için zorunlu
      tutar,
      aciklama,
      tarih,
    } = await istek.json();

    if (!tutar || tutar <= 0) {
      return NextResponse.json({ hata: 'Geçerli bir tutar giriniz' }, { status: 400 });
    }
    if (!aciklama?.trim()) {
      return NextResponse.json({ hata: 'Açıklama zorunludur' }, { status: 400 });
    }

    const tarihDate = tarih ? new Date(tarih) : new Date();
    const audit = await auditOlustur();

    if (tip === 'transfer') {
      if (!kaynakId || !hedefId) {
        return NextResponse.json({ hata: 'Kaynak ve hedef hesap zorunludur' }, { status: 400 });
      }
      if (kaynakId === hedefId) {
        return NextResponse.json({ hata: 'Kaynak ve hedef hesap aynı olamaz' }, { status: 400 });
      }

      const sonuc = await prisma.$transaction(async (tx) => {
        // Kaynaktan çıkış
        const cikis = await tx.bankaHareketi.create({
          data: {
            bankaHesabiId: kaynakId,
            tip: 'cikis',
            tutar,
            aciklama: `Transfer → Hedef hesap: ${aciklama}`,
            tarih: tarihDate,
            referansTipi: 'transfer',
            referansId: hedefId,
            olusturanId: audit.olusturanId ?? null,
            olusturanAdi: audit.olusturanAdi ?? null,
          },
        });
        await tx.bankaHesabi.update({ where: { id: kaynakId }, data: { bakiye: { decrement: tutar } } });

        // Hedefe giriş
        const giris = await tx.bankaHareketi.create({
          data: {
            bankaHesabiId: hedefId,
            tip: 'giris',
            tutar,
            aciklama: `Transfer ← Kaynak hesap: ${aciklama}`,
            tarih: tarihDate,
            referansTipi: 'transfer',
            referansId: kaynakId,
            olusturanId: audit.olusturanId ?? null,
            olusturanAdi: audit.olusturanAdi ?? null,
          },
        });
        await tx.bankaHesabi.update({ where: { id: hedefId }, data: { bakiye: { increment: tutar } } });

        return { cikis, giris };
      });

      return NextResponse.json(sonuc, { status: 201 });
    }

    // Tek hesap — manuel giriş veya çıkış
    if (!hesapId || !['giris', 'cikis'].includes(tip)) {
      return NextResponse.json({ hata: 'hesapId ve tip (giris/cikis) zorunludur' }, { status: 400 });
    }

    const hareket = await prisma.$transaction(async (tx) => {
      const h = await tx.bankaHareketi.create({
        data: {
          bankaHesabiId: hesapId,
          tip,
          tutar,
          aciklama: aciklama.trim(),
          tarih: tarihDate,
          referansTipi: 'manuel',
          olusturanId: audit.olusturanId ?? null,
          olusturanAdi: audit.olusturanAdi ?? null,
        },
      });
      await tx.bankaHesabi.update({
        where: { id: hesapId },
        data: { bakiye: { increment: tip === 'giris' ? tutar : -tutar } },
      });
      return h;
    });

    return NextResponse.json(hareket, { status: 201 });
  } catch {
    return NextResponse.json({ hata: 'İşlem gerçekleştirilemedi' }, { status: 500 });
  }
}
