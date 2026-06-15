export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { logKaydet } from '@/lib/aktiviteLog'

// POST /api/cari-hesap/para-hareketi
// Sadece kayıt amaçlı — banka hareketi OLUŞTURMAZ
// Body: { cuzdanKullaniciId, yon, tutarTl, aciklama, tarih, vadeTarihi? }
export async function POST(istek: Request) {
  try {
    const { cuzdanKullaniciId, yon, tutarTl, aciklama, tarih, vadeTarihi } = await istek.json()

    if (!cuzdanKullaniciId || !tutarTl || !yon) {
      return NextResponse.json({ hata: 'cuzdanKullaniciId, tutarTl ve yon zorunludur' }, { status: 400 })
    }

    const tutarSayi = Number(tutarTl)
    if (isNaN(tutarSayi) || tutarSayi <= 0) {
      return NextResponse.json({ hata: 'Geçerli bir tutar giriniz' }, { status: 400 })
    }

    const kullanici = await prisma.cuzdanKullanicisi.findUnique({ where: { id: cuzdanKullaniciId } })
    if (!kullanici) return NextResponse.json({ hata: 'Cüzdan kullanıcısı bulunamadı' }, { status: 404 })

    const hareket = await prisma.cariHareket.create({
      data: {
        cuzdanKullaniciId,
        yon,
        islemTipi: 'para_tahsilat',
        miktarKg: 0,
        tutarTl: tutarSayi,
        bankaHesabiId: null,   // banka entegrasyonu yok
        vadeTarihi: vadeTarihi ? new Date(vadeTarihi) : null,
        aciklama: aciklama?.trim() || `${kullanici.ad} — para hareketi`,
        tarih: tarih ? new Date(tarih) : new Date(),
      },
    })

    logKaydet({
      islemTipi: 'olusturma', modul: 'cari-hesap', tablo: 'cari_hareketler',
      kayitId: hareket.id, yeniDeger: { cuzdanKullaniciId, tutarTl: tutarSayi, yon },
    }).catch(console.error)

    return NextResponse.json(hareket, { status: 201 })
  } catch (err) {
    console.error('[cari para-hareketi POST]', err)
    return NextResponse.json({ hata: 'Para hareketi kaydedilemedi' }, { status: 500 })
  }
}
