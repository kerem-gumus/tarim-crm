export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { logKaydet } from '@/lib/aktiviteLog'

// PUT /api/cari-hesap/[hareketId] — güncelle
// Body: { tutarTl, yon, aciklama, tarih, vadeTarihi }
export async function PUT(
  istek: Request,
  { params }: { params: Promise<{ hareketId: string }> }
) {
  try {
    const { hareketId } = await params
    const { tutarTl, yon, aciklama, tarih, vadeTarihi } = await istek.json()

    const mevcut = await prisma.cariHareket.findUnique({ where: { id: hareketId } })
    if (!mevcut) return NextResponse.json({ hata: 'Hareket bulunamadı' }, { status: 404 })

    const guncellendi = await prisma.cariHareket.update({
      where: { id: hareketId },
      data: {
        ...(tutarTl !== undefined ? { tutarTl: Number(tutarTl) } : {}),
        ...(yon ? { yon } : {}),
        ...(aciklama !== undefined ? { aciklama: aciklama?.trim() || null } : {}),
        ...(tarih ? { tarih: new Date(tarih) } : {}),
        ...(vadeTarihi !== undefined ? { vadeTarihi: vadeTarihi ? new Date(vadeTarihi) : null } : {}),
      },
    })

    logKaydet({
      islemTipi: 'guncelleme', modul: 'cari-hesap', tablo: 'cari_hareketler',
      kayitId: hareketId, yeniDeger: { tutarTl, yon },
    }).catch(console.error)

    return NextResponse.json(guncellendi)
  } catch (err) {
    console.error('[cari hareket PUT]', err)
    return NextResponse.json({ hata: 'Güncellenemedi' }, { status: 500 })
  }
}

// DELETE /api/cari-hesap/[hareketId] — sil
// Eğer hareketin bankaHesabiId'si varsa banka hareketi de silinir ve bakiye geri alınır
export async function DELETE(
  _: Request,
  { params }: { params: Promise<{ hareketId: string }> }
) {
  try {
    const { hareketId } = await params

    const hareket = await prisma.cariHareket.findUnique({ where: { id: hareketId } })
    if (!hareket) return NextResponse.json({ hata: 'Hareket bulunamadı' }, { status: 404 })

    await prisma.$transaction(async (tx) => {
      // 1. CariHareket'i pasifleştir
      await tx.cariHareket.update({ where: { id: hareketId }, data: { aktif: false } })

      // 2. Bağlı banka hareketi varsa pasifleştir + bakiyeyi geri al
      if (hareket.bankaHesabiId) {
        const bankaHareketi = await tx.bankaHareketi.findFirst({
          where: { referansTipi: 'cari_para_tahsilat', referansId: hareketId, aktif: true },
        })
        if (bankaHareketi) {
          await tx.bankaHareketi.update({
            where: { id: bankaHareketi.id },
            data: { aktif: false, referansTipi: 'iptal_edildi' },
          })
          // Bakiyeyi tersine çevir
          const tutarSayi = Number(hareket.tutarTl ?? 0)
          if (tutarSayi > 0) {
            const bankaTersinYon = bankaHareketi.tip === 'giris' ? -1 : 1
            await tx.bankaHesabi.update({
              where: { id: hareket.bankaHesabiId },
              data: { bakiye: { increment: bankaTersinYon * tutarSayi } },
            })
          }
        }
      }
    })

    logKaydet({
      islemTipi: 'silme', modul: 'cari-hesap', tablo: 'cari_hareketler', kayitId: hareketId,
    }).catch(console.error)

    return NextResponse.json({ basarili: true })
  } catch (err) {
    console.error('[cari hareket DELETE]', err)
    return NextResponse.json({ hata: 'Silinemedi' }, { status: 500 })
  }
}
