import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

// =====================================================
// Finans Alacaklar — Dönem bazlı tüm alacak kalemleri
// HasatDonemi > Budama + Sürgünler(Müşteri>Ay) + Destekleme
// =====================================================

export async function GET() {
  try {
    const [hasatDonemleri, gelirKayitlari, budamaBilgileri] = await Promise.all([
      prisma.hasatDonemi.findMany({
        where: { aktif: { not: false } },
        include: {
          surgunler: {
            where: { aktif: { not: false } },
            orderBy: { surgunNo: 'asc' },
          },
        },
        orderBy: [{ yil: 'desc' }, { olusturmaTarihi: 'desc' }],
      }),
      prisma.gelirKaydi.findMany({
        where: { aktif: { not: false } },
        orderBy: [{ yil: 'asc' }, { ay: 'asc' }],
      }),
      prisma.budamaBilgisi.findMany({
        where: { aktif: { not: false } },
        include: {
          ciftci: { select: { id: true, adSoyad: true, cayKurNo: true } },
          odemeler: { where: { aktif: { not: false } }, orderBy: { tarih: 'desc' } },
        },
      }),
    ])

    // GelirKaydi -> surgunId bazında grupla
    const gelirBySurgun = new Map<string, typeof gelirKayitlari>()
    for (const g of gelirKayitlari) {
      const mevcut = gelirBySurgun.get(g.surgunId) ?? []
      mevcut.push(g)
      gelirBySurgun.set(g.surgunId, mevcut)
    }

    // BudamaBilgisi -> hasatDonemiId bazında grupla
    const budamaByDonem = new Map<string, typeof budamaBilgileri>()
    for (const b of budamaBilgileri) {
      const mevcut = budamaByDonem.get(b.hasatDonemiId) ?? []
      mevcut.push(b)
      budamaByDonem.set(b.hasatDonemiId, mevcut)
    }

    const donemler = hasatDonemleri.map((donem) => {
      // Dönemin budama kayıtları
      const donemBudamalar = budamaByDonem.get(donem.id) ?? []
      const budamaKalemleri = donemBudamalar.map((b) => ({
        id: b.id,
        hasatDonemiId: b.hasatDonemiId,
        ciftciId: b.ciftciId,
        ciftciAdi: b.ciftci.adSoyad,
        cayKurNo: b.ciftci.cayKurNo,
        toplamDonum: Number(b.toplamDonum),
        budananDonum: Number(b.budananDonum),
        budananM2: Number(b.budananM2),
        brutFiyat: Number(b.brutFiyat),
        hesaplananTutar: Number(b.hesaplananTutar),
        odenenTutar: Number(b.odenenTutar),
        kalanTutar: Number(b.kalanTutar),
        odemeDurumu: b.odemeDurumu,
        odemeler: b.odemeler.map((o) => ({
          id: o.id,
          tutar: Number(o.tutar),
          tarih: o.tarih,
          aciklama: o.aciklama,
        })),
      }))

      const budamaToplamAlacak = budamaKalemleri.reduce((s, b) => s + b.hesaplananTutar, 0)
      const budamaToplamOdenen = budamaKalemleri.reduce((s, b) => s + b.odenenTutar, 0)
      const budamaToplamKalan = budamaKalemleri.reduce((s, b) => s + b.kalanTutar, 0)

      // Sürgün gelir kayıtları
      const surgunler = donem.surgunler.map((surgun) => {
        const surgunGelirler = gelirBySurgun.get(surgun.id) ?? []

        // Müşteri bazında grupla
        const musteriMap = new Map<string, {
          musteriId: string | null
          musteriAdi: string
          fiyatTuru: string | null
          aylar: Array<{
            id: string
            ay: number | null
            yil: number | null
            toplamKg: number
            birimFiyat: number
            toplamTutar: number
            odenenTutar: number
            kalanTutar: number
            odemeDurumu: string
          }>
        }>()

        for (const g of surgunGelirler) {
          const mKey = g.musteriId ?? g.musteriAdi ?? 'bilinmiyor'
          const mg = musteriMap.get(mKey)
          const ayKayit = {
            id: g.id,
            ay: g.ay,
            yil: g.yil,
            toplamKg: Number(g.toplamKg),
            birimFiyat: Number(g.birimFiyat),
            toplamTutar: Number(g.toplamTutar),
            odenenTutar: Number(g.odenenTutar),
            kalanTutar: Number(g.kalanTutar),
            odemeDurumu: g.odemeDurumu,
          }
          if (mg) {
            mg.aylar.push(ayKayit)
          } else {
            musteriMap.set(mKey, {
              musteriId: g.musteriId ?? null,
              musteriAdi: g.musteriAdi ?? '—',
              fiyatTuru: g.fiyatTuru ?? null,
              aylar: [ayKayit],
            })
          }
        }

        const musteriler = Array.from(musteriMap.values()).map((m) => ({
          ...m,
          toplamTutar: m.aylar.reduce((s, a) => s + a.toplamTutar, 0),
          odenenTutar: m.aylar.reduce((s, a) => s + a.odenenTutar, 0),
          kalanTutar: m.aylar.reduce((s, a) => s + a.kalanTutar, 0),
          odemeDurumu: m.aylar.every((a) => a.odemeDurumu === 'odendi')
            ? 'odendi'
            : m.aylar.some((a) => a.odenenTutar > 0)
            ? 'kismi_odendi'
            : 'odeme_bekleniyor',
        }))

        const surgunToplamAlacak = musteriler.reduce((s, m) => s + m.toplamTutar, 0)
        const surgunOdenen = musteriler.reduce((s, m) => s + m.odenenTutar, 0)
        const surgunKalan = musteriler.reduce((s, m) => s + m.kalanTutar, 0)

        return {
          id: surgun.id,
          surgunNo: surgun.surgunNo,
          surgunAdi: surgun.surgunAdi,
          durum: surgun.durum,
          musteriler,
          toplamAlacak: surgunToplamAlacak,
          odenenTutar: surgunOdenen,
          kalanTutar: surgunKalan,
          odemeDurumu:
            surgunKalan <= 0.001 && surgunToplamAlacak > 0
              ? 'odendi'
              : surgunOdenen > 0
              ? 'kismi_odendi'
              : 'odeme_bekleniyor',
        }
      })

      // Destekleme
      const destekleme = donem.desteklemeAlacakTutar
        ? {
            alacakTutar: Number(donem.desteklemeAlacakTutar),
            odenenTutar: Number(donem.desteklemeOdenenTutar),
            kalanTutar: Number(donem.desteklemeKalanTutar ?? donem.desteklemeAlacakTutar),
            odemeDurumu: donem.desteklemeOdemeDurumu ?? 'odeme_bekleniyor',
          }
        : null

      // Dönem toplam
      const surgunToplamAlacak = surgunler.reduce((s, sg) => s + sg.toplamAlacak, 0)
      const surgunToplamOdenen = surgunler.reduce((s, sg) => s + sg.odenenTutar, 0)
      const surgunToplamKalan = surgunler.reduce((s, sg) => s + sg.kalanTutar, 0)
      const desteklemeAlacak = destekleme?.alacakTutar ?? 0
      const desteklemeOdenen = destekleme?.odenenTutar ?? 0
      const desteklemeKalan = destekleme?.kalanTutar ?? 0

      const donemToplamAlacak = budamaToplamAlacak + surgunToplamAlacak + desteklemeAlacak
      const donemToplamOdenen = budamaToplamOdenen + surgunToplamOdenen + desteklemeOdenen
      const donemToplamKalan = budamaToplamKalan + surgunToplamKalan + desteklemeKalan

      const donemOdemeDurumu =
        donemToplamAlacak > 0 && donemToplamKalan <= 0.001
          ? 'odendi'
          : donemToplamOdenen > 0
          ? 'kismi_odendi'
          : 'odeme_bekleniyor'

      return {
        id: donem.id,
        donemAdi: donem.donemAdi,
        yil: donem.yil,
        durum: donem.durum,
        odemeDurumu: donemOdemeDurumu,
        toplamAlacak: donemToplamAlacak,
        odenenTutar: donemToplamOdenen,
        kalanTutar: donemToplamKalan,
        budamaKalemleri,
        budamaToplamAlacak,
        budamaToplamKalan,
        surgunler,
        destekleme,
      }
    })

    return NextResponse.json(donemler)
  } catch (hata) {
    console.error('Alacaklar alınamadı:', hata)
    return NextResponse.json({ hata: 'Alacaklar alınamadı' }, { status: 500 })
  }
}
