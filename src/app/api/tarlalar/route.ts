export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { logKaydet } from '@/lib/aktiviteLog';
import { auditOlustur } from '@/lib/auditKullanici';

export async function GET(istek: Request) {
  try {
    const { searchParams } = new URL(istek.url);
    const tumunu = searchParams.get('tumunu') === 'true';

    const tarlalar = await prisma.tarla.findMany({
      where: {
        aktif: { not: false },
        ...(tumunu ? {} : { durum: 'aktif' }),
      },
      include: {
        ciftci: {
          select: { id: true, adSoyad: true },
        },
      },
      orderBy: { tarlaAdi: 'asc' },
    });
    return NextResponse.json(tarlalar);
  } catch {
    return NextResponse.json({ hata: 'Tarlalar getirilemedi' }, { status: 500 });
  }
}

export async function POST(istek: Request) {
  try {
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

    const audit = await auditOlustur();
    const yeniTarla = await prisma.tarla.create({
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
    logKaydet({ islemTipi: 'olusturma', modul: 'tarla', tablo: 'tarlalar', kayitId: yeniTarla.id, yeniDeger: yeniTarla }).catch(console.error);
    return NextResponse.json(yeniTarla, { status: 201 });
  } catch {
    return NextResponse.json({ hata: 'Tarla oluşturulamadı' }, { status: 500 });
  }
}
