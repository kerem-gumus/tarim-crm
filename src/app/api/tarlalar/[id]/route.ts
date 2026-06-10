import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { logKaydet } from '@/lib/aktiviteLog';
import { auditGuncelle } from '@/lib/auditKullanici';

export async function PUT(istek: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const {
      tarlaAdi,
      konumIl,
      konumIlce,
      konumKoy,
      adaNo,
      parselNo,
      donum,
      metrekare,
      rakim,
      cayCesidi,
      dikimYili,
      topraktipi,
      sulamaDurumu,
      ciftciId,
      mulkiyetDurumu,
      kiraciCiftciId,
      koordinatLat,
      koordinatLng,
      durum,
      notlar,
    } = await istek.json();

    if (!tarlaAdi || !donum) {
      return NextResponse.json({ hata: 'Tarla adı ve dönüm zorunludur' }, { status: 400 });
    }

    const audit = await auditGuncelle();
    const eskiTarla = await prisma.tarla.findUnique({ where: { id } });
    const guncellendi = await prisma.tarla.update({
      where: { id },
      data: {
        tarlaAdi,
        konumIl: konumIl || '',
        konumIlce: konumIlce || '',
        konumKoy: konumKoy || '',
        adaNo: adaNo || null,
        parselNo: parselNo || null,
        donum,
        metrekare: metrekare || null,
        rakim: rakim ? Number(rakim) : null,
        cayCesidi: cayCesidi || null,
        dikimYili: dikimYili ? Number(dikimYili) : null,
        topraktipi: topraktipi || null,
        sulamaDurumu,
        ciftciId: ciftciId || null,
        mulkiyetDurumu: mulkiyetDurumu || 'sahip',
        kiraciCiftciId: mulkiyetDurumu === 'kiralik' ? (kiraciCiftciId || null) : null,
        koordinatLat: koordinatLat || null,
        koordinatLng: koordinatLng || null,
        durum,
        notlar: notlar || null,
        ...audit,
      },
      include: {
        ciftci: { select: { id: true, adSoyad: true } },
      },
    });
    logKaydet({ islemTipi: 'guncelleme', modul: 'tarla', tablo: 'tarlalar', kayitId: id, eskiDeger: eskiTarla, yeniDeger: guncellendi }).catch(console.error);
    return NextResponse.json(guncellendi);
  } catch (err) {
    console.error('[tarla PUT]', err);
    return NextResponse.json({ hata: 'Tarla güncellenemedi' }, { status: 500 });
  }
}

// Kısmi güncelleme — sadece belirtilen alanları değiştirir (örn. ciftciId: null)
export async function PATCH(istek: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const govde = await istek.json();
    const audit = await auditGuncelle();
    const guncellendi = await prisma.tarla.update({
      where: { id },
      data: { ...govde, ...audit },
      include: { ciftci: { select: { id: true, adSoyad: true } } },
    });
    return NextResponse.json(guncellendi);
  } catch {
    return NextResponse.json({ hata: 'Tarla güncellenemedi' }, { status: 500 });
  }
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const audit = await auditGuncelle();
    const eskiTarla = await prisma.tarla.findUnique({ where: { id } });
    await prisma.tarla.update({
      where: { id },
      data: { aktif: false, ...audit },
    });
    logKaydet({ islemTipi: 'silme', modul: 'tarla', tablo: 'tarlalar', kayitId: id, eskiDeger: eskiTarla }).catch(console.error);
    return NextResponse.json({ basarili: true });
  } catch {
    return NextResponse.json({ hata: 'Tarla silinemedi' }, { status: 500 });
  }
}
