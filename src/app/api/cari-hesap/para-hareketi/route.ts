export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { logKaydet } from '@/lib/aktiviteLog'

// POST /api/cari-hesap/para-hareketi
// Cari hesaba para tahsilatı kaydı — banka üzerinden
// Body: { cuzdanKullaniciId, yon, tutarTl, aciklama, tarih, vadeTarihi?, bankaHesabiId? }
export async function POST(istek: Request) {
  try {
    const {
      cuzdanKullaniciId,
      yon,           // 'bana_borclu' = o bana para borçlu  |  'ben_borcluyum' = ben ona para borçluyum
      tutarTl,
      aciklama,
      tarih,
      vadeTarihi,
      bankaHesabiId,
    } = await istek.json()

    if (!cuzdanKullaniciId || !tutarTl || !yon) {
      return NextResponse.json(
        { hata: 'cuzdanKullaniciId, tutarTl ve yon zorunludur' },
        { status: 400 }
      )
    }

    const tutarSayi = Number(tutarTl)
    if (isNaN(tutarSayi) || tutarSayi <= 0) {
      return NextResponse.json({ hata: 'Geçerli bir tutar giriniz' }, { status: 400 })
    }

    const kullanici = await prisma.cuzdanKullanicisi.findUnique({
      where: { id: cuzdanKullaniciId },
    })
    if (!kullanici) {
      return NextResponse.json({ hata: 'Cüzdan kullanıcısı bulunamadı' }, { status: 404 })
    }

    const hareket = await prisma.$transaction(async (tx) => {
      // 1. CariHareket oluştur — tutarTl bazlı, miktarKg=0
      const yeniHareket = await tx.cariHareket.create({
        data: {
          cuzdanKullaniciId,
          yon,
          islemTipi: 'para_tahsilat',
          miktarKg: 0,
          tutarTl: tutarSayi,
          bankaHesabiId: bankaHesabiId || null,
          vadeTarihi: vadeTarihi ? new Date(vadeTarihi) : null,
          aciklama: aciklama?.trim() || `${kullanici.ad} — para tahsilatı`,
          tarih: tarih ? new Date(tarih) : new Date(),
        },
      })

      // 2. Banka hareketi oluştur (seçildiyse)
      if (bankaHesabiId) {
        const bankaTip = yon === 'bana_borclu' ? 'giris' : 'cikis'
        const bankaYon = bankaTip === 'giris' ? 1 : -1

        await tx.bankaHareketi.create({
          data: {
            bankaHesabiId,
            tip: bankaTip,
            tutar: tutarSayi,
            aciklama: aciklama?.trim() || `Cari para tahsilatı — ${kullanici.ad}`,
            tarih: tarih ? new Date(tarih) : new Date(),
            referansTipi: 'cari_para_tahsilat',
            referansId: yeniHareket.id,
          },
        })

        await tx.bankaHesabi.update({
          where: { id: bankaHesabiId },
          data: { bakiye: { increment: bankaYon * tutarSayi } },
        })
      }

      return yeniHareket
    })

    logKaydet({
      islemTipi: 'olusturma',
      modul: 'cari-hesap',
      tablo: 'cari_hareketler',
      kayitId: hareket.id,
      yeniDeger: { cuzdanKullaniciId, tutarTl: tutarSayi, yon },
    }).catch(console.error)

    return NextResponse.json(hareket, { status: 201 })
  } catch (err) {
    console.error('[cari para-hareketi POST]', err)
    return NextResponse.json({ hata: 'Para hareketi kaydedilemedi' }, { status: 500 })
  }
}
