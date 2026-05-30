import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { logKaydet } from '@/lib/aktiviteLog';
import { auditGuncelle } from '@/lib/auditKullanici';

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const malzeme = await prisma.malzeme.findUnique({
      where: { id },
      include: {
        stokHareketleri: {
          orderBy: { olusturmaTarihi: 'desc' },
          take: 20,
        },
      },
    });

    if (!malzeme) {
      return NextResponse.json({ hata: 'Malzeme bulunamadı' }, { status: 404 });
    }

    return NextResponse.json({
      ...malzeme,
      mevcutStok: Number(malzeme.mevcutStok),
      minimumStok: Number(malzeme.minimumStok),
      birimFiyat: Number(malzeme.birimFiyat),
      dusukStok: Number(malzeme.mevcutStok) <= Number(malzeme.minimumStok),
      stokHareketleri: malzeme.stokHareketleri.map((h) => ({
        ...h,
        miktar: Number(h.miktar),
        birimFiyat: h.birimFiyat !== null ? Number(h.birimFiyat) : null,
        toplamTutar: h.toplamTutar !== null ? Number(h.toplamTutar) : null,
      })),
    });
  } catch {
    return NextResponse.json({ hata: 'Malzeme getirilemedi' }, { status: 500 });
  }
}

export async function PUT(istek: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const {
      malzemeAdi,
      kategori,
      altKategori,
      birim,
      minimumStok,
      birimFiyat,
      depoKonumu,
      durum,
      notlar,
    } = await istek.json();

    if (!malzemeAdi || !kategori || !birim) {
      return NextResponse.json(
        { hata: 'Malzeme adı, kategori ve birim zorunludur' },
        { status: 400 }
      );
    }

    const eskiMalzeme = await prisma.malzeme.findUnique({ where: { id } });
    if (!eskiMalzeme) {
      return NextResponse.json({ hata: 'Malzeme bulunamadı' }, { status: 404 });
    }

    const audit = await auditGuncelle();
    const guncellendi = await prisma.malzeme.update({
      where: { id },
      data: {
        malzemeAdi,
        kategori,
        altKategori: altKategori || null,
        birim,
        minimumStok: minimumStok ?? eskiMalzeme.minimumStok,
        birimFiyat: birimFiyat ?? eskiMalzeme.birimFiyat,
        depoKonumu: depoKonumu || null,
        durum: durum || eskiMalzeme.durum,
        notlar: notlar || null,
        ...audit,
      },
    });

    logKaydet({
      islemTipi: 'guncelleme',
      modul: 'envanter',
      tablo: 'malzemeler',
      kayitId: id,
      eskiDeger: eskiMalzeme,
      yeniDeger: guncellendi,
    }).catch(console.error);

    return NextResponse.json({
      ...guncellendi,
      mevcutStok: Number(guncellendi.mevcutStok),
      minimumStok: Number(guncellendi.minimumStok),
      birimFiyat: Number(guncellendi.birimFiyat),
      dusukStok: Number(guncellendi.mevcutStok) <= Number(guncellendi.minimumStok),
    });
  } catch {
    return NextResponse.json({ hata: 'Malzeme güncellenemedi' }, { status: 500 });
  }
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;

    const stokHareketiSayisi = await prisma.stokHareketi.count({
      where: { malzemeId: id },
    });

    if (stokHareketiSayisi > 0) {
      return NextResponse.json(
        { hata: 'Bu malzemeye ait stok hareketleri olduğu için silinemez' },
        { status: 400 }
      );
    }

    const eskiMalzeme = await prisma.malzeme.findUnique({ where: { id } });
    const audit = await auditGuncelle();
    await prisma.malzeme.update({ where: { id }, data: { aktif: false, ...audit } });

    logKaydet({
      islemTipi: 'silme',
      modul: 'envanter',
      tablo: 'malzemeler',
      kayitId: id,
      eskiDeger: eskiMalzeme,
    }).catch(console.error);

    return NextResponse.json({ basarili: true });
  } catch {
    return NextResponse.json({ hata: 'Malzeme silinemedi' }, { status: 500 });
  }
}
