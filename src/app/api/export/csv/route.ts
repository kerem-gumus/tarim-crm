export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

function diziyiCsvYap(basliklar: string[], satirlar: string[][]): string {
  const satirDizisi = [basliklar, ...satirlar];
  return satirDizisi
    .map((satir) =>
      satir.map((hucre) => `"${String(hucre ?? '').replace(/"/g, '""')}"`).join(','),
    )
    .join('\n');
}

function tarihBicimle(tarih: Date | null | undefined): string {
  if (!tarih) return '';
  return new Date(tarih).toLocaleDateString('tr-TR');
}

export async function GET(istek: NextRequest) {
  try {
    const { searchParams } = new URL(istek.url);
    const modul = searchParams.get('modul') ?? 'hasat';
    const tarih = new Date().toISOString().split('T')[0];

    let csvMetni = '';
    const dosyaAdi = `tarimcrm-${modul}-${tarih}.csv`;

    if (modul === 'hasat') {
      const hasatGirisleri = await prisma.hasatGirisi.findMany({
        include: {
          surgun: { include: { hasatDonemi: true } },
          tarla: true,
          musteri: true,
          isciEkip: true,
        },
        orderBy: { tarih: 'desc' },
      });

      const basliklar = [
        'Tarih',
        'Dönem',
        'Sürgün',
        'Tarla',
        'Müşteri',
        'İşçi Ekip',
        'Tartım Miktarı (kg)',
        'Satış Miktarı (kg)',
        'Toplanma Türü',
        'Ödeme Türü',
        'Ton Fiyatı',
        'İşçilik Toplamı',
      ];
      const satirlar = hasatGirisleri.map((h) => [
        tarihBicimle(h.tarih),
        h.surgun.hasatDonemi.donemAdi,
        h.surgun.surgunAdi,
        h.tarla?.tarlaAdi ?? '',
        h.musteri.musteriAdi,
        h.isciEkip?.ekipAdi ?? '',
        String(Number(h.tartimMiktariKg)),
        String(Number(h.satisMiktariKg)),
        h.toplanmaTuru,
        h.odemeTuru ?? '',
        h.tonFiyati ? String(Number(h.tonFiyati)) : '',
        h.iscilikToplamTutar ? String(Number(h.iscilikToplamTutar)) : '',
      ]);
      csvMetni = diziyiCsvYap(basliklar, satirlar);
    } else if (modul === 'finans') {
      const [gelirKayitlari, odemeKayitlari] = await Promise.all([
        prisma.gelirKaydi.findMany({
          include: { surgun: true },
          orderBy: { olusturmaTarihi: 'desc' },
        }),
        prisma.odemeKaydi.findMany({
          orderBy: { olusturmaTarihi: 'desc' },
        }),
      ]);

      const basliklar = [
        'Tür',
        'Tarih',
        'Sürgün / Açıklama',
        'Toplam kg',
        'Birim Fiyat',
        'Tutar',
        'Ödeme Durumu',
        'Kategori',
      ];
      const gelirSatirlari = gelirKayitlari.map((g) => [
        'Gelir',
        tarihBicimle(g.olusturmaTarihi),
        g.surgun.surgunAdi,
        String(Number(g.toplamKg)),
        String(Number(g.birimFiyat)),
        String(Number(g.toplamTutar)),
        g.odemeDurumu,
        '',
      ]);
      const giderSatirlari = odemeKayitlari.map((o) => [
        'Gider',
        tarihBicimle(o.olusturmaTarihi),
        o.aciklama,
        '',
        '',
        String(Number(o.tutar)),
        o.odemeDurumu,
        o.kategori,
      ]);
      csvMetni = diziyiCsvYap(basliklar, [...gelirSatirlari, ...giderSatirlari]);
    } else if (modul === 'envanter') {
      const [malzemeler, stokHareketleri] = await Promise.all([
        prisma.malzeme.findMany({ orderBy: { malzemeAdi: 'asc' } }),
        prisma.stokHareketi.findMany({
          include: { malzeme: true },
          orderBy: { tarih: 'desc' },
        }),
      ]);

      const malzemeBasliklari = [
        'Tür',
        'Malzeme Adı',
        'Kategori',
        'Birim',
        'Mevcut Stok',
        'Minimum Stok',
        'Birim Fiyat',
        'Durum',
        'Depo Konumu',
        'Hareket Tipi',
        'Miktar',
        'Tarih',
        'Tedarikçi',
        'Fatura No',
      ];
      const malzemeSatirlari = malzemeler.map((m) => [
        'Malzeme',
        m.malzemeAdi,
        m.kategori,
        m.birim,
        String(Number(m.mevcutStok)),
        String(Number(m.minimumStok)),
        String(Number(m.birimFiyat)),
        m.durum,
        m.depoKonumu ?? '',
        '',
        '',
        '',
        '',
        '',
      ]);
      const hareketSatirlari = stokHareketleri.map((sh) => [
        'Hareket',
        sh.malzeme.malzemeAdi,
        '',
        '',
        '',
        '',
        '',
        '',
        '',
        sh.hareketTipi,
        String(Number(sh.miktar)),
        tarihBicimle(sh.tarih),
        sh.tedarikci ?? '',
        sh.faturaNo ?? '',
      ]);
      csvMetni = diziyiCsvYap(malzemeBasliklari, [
        ...malzemeSatirlari,
        ...hareketSatirlari,
      ]);
    } else if (modul === 'ciftciler') {
      const ciftciler = await prisma.ciftci.findMany({
        orderBy: { adSoyad: 'asc' },
      });

      const basliklar = [
        'Ad Soyad',
        'TC No',
        'Telefon',
        'Telefon 2',
        'Adres',
        'İl',
        'İlçe',
        'Köy',
        'Çay Kur No',
        'Banka IBAN',
        'Vergi No',
        'Durum',
        'Kayıt Tarihi',
        'Notlar',
      ];
      const satirlar = ciftciler.map((c) => [
        c.adSoyad,
        c.tcNo ?? '',
        c.telefon,
        c.telefon2 ?? '',
        c.adres ?? '',
        c.il ?? '',
        c.ilce ?? '',
        c.koy ?? '',
        c.cayKurNo ?? '',
        c.bankaIban ?? '',
        c.vergiNo ?? '',
        c.durum,
        tarihBicimle(c.kayitTarihi),
        c.notlar ?? '',
      ]);
      csvMetni = diziyiCsvYap(basliklar, satirlar);
    } else {
      return NextResponse.json(
        { hata: 'Geçersiz modül. hasat, finans, envanter veya ciftciler olmalı.' },
        { status: 400 },
      );
    }

    return new Response(csvMetni, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${dosyaAdi}"`,
      },
    });
  } catch (hata) {
    console.error('CSV export hatası:', hata);
    return NextResponse.json(
      { hata: 'CSV export edilemedi' },
      { status: 500 },
    );
  }
}
