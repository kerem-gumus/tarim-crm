import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

// =====================================================
// Çoklu borç kaydı için toplu ödeme
// =====================================================

export async function POST(istek: NextRequest) {
  try {
    const govde = await istek.json()
    const { kayitIds, odemeYontemi, odemeTarihi, bankaHesabiId, gercekTutar, tamOdeme, kmhOnayi } = govde

    if (!Array.isArray(kayitIds) || kayitIds.length === 0) {
      return NextResponse.json({ hata: 'En az bir kayıt seçilmelidir' }, { status: 400 })
    }

    // Tüm seçili kayıtları getir
    const kayitlar = await prisma.odemeKaydi.findMany({
      where: { id: { in: kayitIds }, aktif: { not: false }, odemeDurumu: { not: 'odendi' } },
    })

    if (kayitlar.length === 0) {
      return NextResponse.json({ hata: 'Ödenecek kayıt bulunamadı' }, { status: 400 })
    }

    // Toplam hesaplanan (kalan) tutar
    const toplamHesaplanan = kayitlar.reduce((s, k) => {
      const kalan = Number(k.tutar) - Number(k.odenenTutar)
      return s + kalan
    }, 0)

    // Gerçek ödeme tutarı (girilmediyse hesaplanan kullanılır)
    const gercekSayi = gercekTutar ? Number(gercekTutar) : toplamHesaplanan
    if (gercekSayi <= 0) {
      return NextResponse.json({ hata: 'Geçerli bir ödeme tutarı giriniz' }, { status: 400 })
    }

    // Fark: biz ödemelerinde hesaplanan > gerçek → fark_hesabı giris (borcumuz kaldı)
    //                                hesaplanan < gerçek → fark_hesabı cikis (fazla ödedik)
    const farkTutar = toplamHesaplanan - gercekSayi

    const odemeTarihiDate = odemeTarihi ? new Date(odemeTarihi) : new Date()

    // Banka hesabı seçildiyse bakiye kontrolü
    if (odemeYontemi === 'banka' && bankaHesabiId) {
      const hesap = await prisma.bankaHesabi.findUnique({ where: { id: bankaHesabiId } })
      if (!hesap) {
        return NextResponse.json({ hata: 'Banka hesabı bulunamadı' }, { status: 404 })
      }
      // Bakiye sınırı yok — kullanıcı istediği kadar eksiye inebilir
    }

    // Transaction: tüm kayıtları öde
    await prisma.$transaction(async (tx) => {
      for (const kayit of kayitlar) {
        const kalanTutar = Number(kayit.tutar) - Number(kayit.odenenTutar)
        let yeniOdenen: number
        let yeniDurum: string

        if (tamOdeme) {
          // Tam ödendi olarak işaretle — gerçek ödenen = toplam tutar
          yeniOdenen = Number(kayit.tutar)
          yeniDurum = 'odendi'
        } else {
          // Gerçek tutarı kayıtlara orantısal dağıt
          // Basit yaklaşım: her kaydın kalanına orantısal pay ver
          const oran = toplamHesaplanan > 0 ? kalanTutar / toplamHesaplanan : 0
          const buKayitGercek = gercekSayi * oran
          yeniOdenen = Number(kayit.odenenTutar) + buKayitGercek
          yeniDurum = yeniOdenen >= Number(kayit.tutar) - 0.01 ? 'odendi' : yeniOdenen > 0 ? 'kismi_odendi' : 'odeme_bekleniyor'
        }

        await tx.odemeKaydi.update({
          where: { id: kayit.id },
          data: {
            odenenTutar: yeniOdenen,
            odemeDurumu: yeniDurum as 'odendi' | 'kismi_odendi' | 'odeme_bekleniyor',
            odemeTarihi: odemeTarihiDate,
            odemeYontemi: odemeYontemi === 'nakit' ? 'nakit' : odemeYontemi === 'banka' ? 'banka' : 'eft',
          },
        })
      }

      // Banka hareketini tek kalemde kaydet (gerçek tutar üzerinden)
      if (odemeYontemi === 'banka' && bankaHesabiId) {
        await tx.bankaHareketi.create({
          data: {
            bankaHesabiId,
            tip: 'cikis',
            tutar: gercekSayi,
            aciklama: `Toplu borç ödemesi — ${kayitlar.length} kalem`,
            tarih: odemeTarihiDate,
            referansTipi: 'toplu_odeme',
          },
        })

        await tx.bankaHesabi.update({
          where: { id: bankaHesabiId },
          data: {
            bakiye: { decrement: gercekSayi },
          },
        })

        // Bakiye eksiye giderse alarm aç
        const hesapSonDurum = await tx.bankaHesabi.findUnique({
          where: { id: bankaHesabiId },
          select: { bakiye: true, kmhLimiti: true },
        })
        if (hesapSonDurum && Number(hesapSonDurum.bakiye) < 0) {
          await tx.bankaHesabi.update({
            where: { id: bankaHesabiId },
            data: { alarmDurumu: true },
          })
        }

        // Fark varsa fark_hesabına yaz
        if (Math.abs(farkTutar) >= 0.01) {
          const farkHesabi = await tx.bankaHesabi.findFirst({
            where: { tur: 'fark_hesabi', aktif: true },
          })
          if (farkHesabi) {
            // Borç ödemelerinde: hesaplanan > gerçek (az ödedik) → fark_hesabı giris
            //                   hesaplanan < gerçek (fazla ödedik) → fark_hesabı cikis
            const farkTip = farkTutar > 0 ? 'giris' : 'cikis'
            await tx.bankaHareketi.create({
              data: {
                bankaHesabiId: farkHesabi.id,
                tip: farkTip,
                tutar: Math.abs(farkTutar),
                aciklama: `Toplu ödeme farkı — ${kayitlar.length} kalem (hesaplanan: ${toplamHesaplanan.toFixed(2)} ₺, gerçek: ${gercekSayi.toFixed(2)} ₺)`,
                tarih: odemeTarihiDate,
                referansTipi: 'toplu_odeme',
              },
            })
            await tx.bankaHesabi.update({
              where: { id: farkHesabi.id },
              data: { bakiye: { increment: farkTip === 'giris' ? Math.abs(farkTutar) : -Math.abs(farkTutar) } },
            })
          }
        }
      }
    })

    return NextResponse.json({
      basarili: true,
      odenenKayitSayisi: kayitlar.length,
      toplamHesaplanan,
      gercekOdeme: gercekSayi,
      farkTutar,
    })
  } catch (hata) {
    console.error('Toplu ödeme hatası:', hata)
    return NextResponse.json({ hata: 'Toplu ödeme yapılamadı' }, { status: 500 })
  }
}
