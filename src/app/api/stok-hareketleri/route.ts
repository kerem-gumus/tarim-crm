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

    // Stok hesaplama
    let yeniStok: number;
    if (hareketTipi === 'giris' || hareketTipi === 'iade') {
      yeniStok = mevcutStok + miktarSayi;
    } else {
      // cikis veya fire
      if (mevcutStok < miktarSayi) {
        return NextResponse.json(
          { hata: 'Mevcut stok miktarı yetersiz' },
          { status: 400 }
        );
      }
      yeniStok = mevcutStok - miktarSayi;
    }

    const audit = await auditOlustur();

    // Atomik transaction
    const [yeniHareket] = await prisma.$transaction(async (tx) => {
      const hareket = await tx.stokHareketi.create({
        data: {
          malzemeId,
          hareketTipi,
          miktar,
          birimFiyat: birimFiyat || null,
          toplamTutar: toplamTutar || null,
          tarlaId: tarlaId || null,
          tedarikci: tedarikci || null,
          faturaNo: faturaNo || null,
          tarih: new Date(tarih),
          notlar: notlar || null,
          ...audit,
        },
        include: { malzeme: true },
      });

      await tx.malzeme.update({
        where: { id: malzemeId },
        data: { mevcutStok: yeniStok },
      });

      // Çıkış + tutar varsa ödeme kaydı oluştur
      if (hareketTipi === 'cikis' && toplamTutar && Number(toplamTutar) > 0) {
        const tarihStr = new Date(tarih).toLocaleDateString('tr-TR');
        await tx.odemeKaydi.create({
          data: {
            kategori: 'malzeme',
            aciklama: `${malzeme.malzemeAdi} - ${tarihStr} kullanımı`,
            tutar: toplamTutar,
            odemeDurumu: 'odeme_bekleniyor',
            odenenTutar: 0,
          },
        });
      }

      return [hareket];
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

    if (uyariVar) {
      yanit.uyari = 'Minimum stok seviyesine ulaşıldı';
    }

    return NextResponse.json(yanit, { status: 201 });
  } catch {
    return NextResponse.json({ hata: 'Stok hareketi kaydedilemedi' }, { status: 500 });
  }
}
