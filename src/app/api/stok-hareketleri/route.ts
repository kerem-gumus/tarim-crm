export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { logKaydet } from '@/lib/aktiviteLog';
import { auditOlustur } from '@/lib/auditKullanici';

export async function GET(istek: Request) {
  try {
    const { searchParams } = new URL(istek.url);
    const malzemeId = searchParams.get('malzemeId');

    const hareketler = await prisma.stokHareketi.findMany({
      where: {
        aktif: { not: false },
        ...(malzemeId && { malzemeId }),
      },
      include: { malzeme: true },
      orderBy: { olusturmaTarihi: 'desc' },
    });

    const sonuc = hareketler.map((h) => ({
      ...h,
      miktar: Number(h.miktar),
      birimFiyat: h.birimFiyat !== null ? Number(h.birimFiyat) : null,
      toplamTutar: h.toplamTutar !== null ? Number(h.toplamTutar) : null,
      malzeme: {
        ...h.malzeme,
        mevcutStok: Number(h.malzeme.mevcutStok),
        minimumStok: Number(h.malzeme.minimumStok),
        birimFiyat: Number(h.malzeme.birimFiyat),
      },
    }));

    return NextResponse.json(sonuc);
  } catch {
    return NextResponse.json({ hata: 'Stok hareketleri getirilemedi' }, { status: 500 });
  }
}

export async function POST(istek: Request) {
  try {
    const {
      malzemeId,
      hareketTipi,
      miktar,
      birimFiyat,
      toplamTutar,
      tarlaId,
      tedarikci,
      faturaNo,
      tarih,
      bankaHesabiId, // giriş ve iade için banka seçimi
      notlar,
    } = await istek.json();

    if (!malzemeId || !hareketTipi || !miktar || !tarih) {
      return NextResponse.json(
        { hata: 'Malzeme, hareket tipi, miktar ve tarih zorunludur' },
        { status: 400 }
      );
    }

    const malzeme = await prisma.malzeme.findUnique({ where: { id: malzemeId } });
    if (!malzeme) {
      return NextResponse.json({ hata: 'Malzeme bulunamadı' }, { status: 404 });
    }

    const mevcutStok = Number(malzeme.mevcutStok);
    const miktarSayi = Number(miktar);
    const tutarSayi = toplamTutar ? Number(toplamTutar) : null;
    const birimFiyatSayi = birimFiyat ? Number(birimFiyat) : null;
    const tarihDate = new Date(tarih);

    // Stok hesaplama
    let yeniStok: number;
    if (hareketTipi === 'giris' || hareketTipi === 'iade') {
      yeniStok = mevcutStok + miktarSayi;
    } else {
      if (mevcutStok < miktarSayi) {
        return NextResponse.json(
          { hata: `Mevcut stok yetersiz (${mevcutStok} ${malzeme.birim})` },
          { status: 400 }
        );
      }
      yeniStok = mevcutStok - miktarSayi;
    }

    // Banka hesabı doğrula
    if (bankaHesabiId) {
      const bankaHesabi = await prisma.bankaHesabi.findUnique({ where: { id: bankaHesabiId } });
      if (!bankaHesabi) {
        return NextResponse.json({ hata: 'Banka hesabı bulunamadı' }, { status: 404 });
      }
    }

    const audit = await auditOlustur();

    const yeniHareket = await prisma.$transaction(async (tx) => {
      const hareket = await tx.stokHareketi.create({
        data: {
          malzemeId,
          hareketTipi,
          miktar,
          birimFiyat: birimFiyatSayi,
          toplamTutar: tutarSayi,
          tarlaId: tarlaId || null,
          tedarikci: tedarikci || null,
          faturaNo: faturaNo || null,
          tarih: tarihDate,
          notlar: notlar || null,
          ...audit,
        },
        include: { malzeme: true },
      });

      // Malzeme stoğunu güncelle
      await tx.malzeme.update({
        where: { id: malzemeId },
        data: {
          mevcutStok: yeniStok,
          // Giriş kaydında birim fiyat güncel olarak saklanır
          ...(hareketTipi === 'giris' && birimFiyatSayi && birimFiyatSayi > 0
            ? { birimFiyat: birimFiyatSayi }
            : {}),
        },
      });

      // Giriş = yeni alım → borç oluştur (depodan çıkış zaten ödenmiş mal, borç yok)
      if (hareketTipi === 'giris' && tutarSayi && tutarSayi > 0) {
        const tarihStr = tarihDate.toLocaleDateString('tr-TR');
        await tx.odemeKaydi.create({
          data: {
            kategori: 'malzeme',
            aciklama: `${malzeme.malzemeAdi} alımı — ${tarihStr}`,
            stokHareketiId: hareket.id,
            tutar: tutarSayi,
            odemeDurumu: 'odeme_bekleniyor',
            odenenTutar: 0,
          },
        });
      }
      // Çıkış = depodan kullanım → borç oluşmaz (giriş anında zaten borç oluşmuştu)

      // Banka hareketi — giriş: para çıkışı / iade: para girişi
      if (bankaHesabiId && tutarSayi && tutarSayi > 0) {
        const bankaTip = hareketTipi === 'iade' ? 'giris' : 'cikis';
        const bankaAciklama =
          hareketTipi === 'iade'
            ? `${malzeme.malzemeAdi} iade geliri`
            : `${malzeme.malzemeAdi} alımı`;

        const bankaYon = hareketTipi === 'iade' ? 1 : -1;

        await tx.bankaHareketi.create({
          data: {
            bankaHesabiId,
            tip: bankaTip,
            tutar: tutarSayi,
            aciklama: bankaAciklama,
            tarih: tarihDate,
            referansTipi: `stok_${hareketTipi}`,
            referansId: hareket.id,
            ...audit,
          },
        });

        await tx.bankaHesabi.update({
          where: { id: bankaHesabiId },
          data: { bakiye: { increment: bankaYon * tutarSayi } },
        });
      }

      return hareket;
    });

    logKaydet({
      islemTipi: 'olusturma',
      modul: 'envanter',
      tablo: 'stok_hareketleri',
      kayitId: yeniHareket.id,
      yeniDeger: { malzemeId, hareketTipi, miktar, yeniStok },
    }).catch(console.error);

    const minimumStok = Number(malzeme.minimumStok);
    const uyariVar = yeniStok <= minimumStok;

    const yanit: Record<string, unknown> = {
      ...yeniHareket,
      miktar: Number(yeniHareket.miktar),
      birimFiyat: yeniHareket.birimFiyat !== null ? Number(yeniHareket.birimFiyat) : null,
      toplamTutar: yeniHareket.toplamTutar !== null ? Number(yeniHareket.toplamTutar) : null,
      malzeme: {
        ...yeniHareket.malzeme,
        mevcutStok: yeniStok,
        minimumStok: Number(yeniHareket.malzeme.minimumStok),
        birimFiyat: Number(yeniHareket.malzeme.birimFiyat),
      },
    };

    if (uyariVar) yanit.uyari = 'Minimum stok seviyesine ulaşıldı';

    return NextResponse.json(yanit, { status: 201 });
  } catch (err) {
    console.error('[stok-hareketleri POST]', err);
    return NextResponse.json({ hata: 'Stok hareketi kaydedilemedi' }, { status: 500 });
  }
}
