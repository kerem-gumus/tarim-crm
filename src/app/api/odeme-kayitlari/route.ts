import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { logKaydet } from '@/lib/aktiviteLog';
import { auditOlustur } from '@/lib/auditKullanici';

export async function GET(istek: Request) {
  try {
    const { searchParams } = new URL(istek.url);
    const kategori = searchParams.get('kategori');
    const durum = searchParams.get('durum');

    const kayitlar = await prisma.odemeKaydi.findMany({
      where: {
        aktif: { not: false },
        ...(kategori && { kategori: kategori as never }),
        ...(durum && { odemeDurumu: durum as never }),
      },
      orderBy: { olusturmaTarihi: 'desc' },
    });

    return NextResponse.json(kayitlar);
  } catch {
    return NextResponse.json({ hata: 'Ödeme kayıtları alınamadı' }, { status: 500 });
  }
}

export async function POST(istek: Request) {
  try {
    const govde = await istek.json();
    const { kategori, aciklama, tutar, ilgiliEkipId, ilgiliIsciId, odemeTarihi } = govde;

    if (!kategori || !aciklama || tutar === undefined) {
      return NextResponse.json(
        { hata: 'Kategori, açıklama ve tutar zorunludur' },
        { status: 400 }
      );
    }

    const audit = await auditOlustur();
    const kayit = await prisma.odemeKaydi.create({
      data: {
        kategori,
        aciklama,
        tutar,
        ilgiliEkipId: ilgiliEkipId ?? null,
        ilgiliIsciId: ilgiliIsciId ?? null,
        odemeDurumu: 'odeme_bekleniyor',
        odenenTutar: 0,
        odemeTarihi: odemeTarihi ? new Date(odemeTarihi) : null,
        ...audit,
      },
    });

    logKaydet({
      islemTipi: 'olusturma',
      modul: 'finans',
      tablo: 'odeme_kayitlari',
      kayitId: kayit.id,
      yeniDeger: { kategori, aciklama, tutar },
    }).catch(console.error);

    return NextResponse.json(kayit, { status: 201 });
  } catch {
    return NextResponse.json({ hata: 'Ödeme kaydı oluşturulamadı' }, { status: 500 });
  }
}
