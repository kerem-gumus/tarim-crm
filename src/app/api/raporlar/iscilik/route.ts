import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET(istek: NextRequest) {
  try {
    const { searchParams } = new URL(istek.url)
    const baslangic = searchParams.get('baslangic')
    const bitis = searchParams.get('bitis')
    const ekipId = searchParams.get('ekipId')
    const surgunId = searchParams.get('surgunId')

    const tarihFiltresi: Record<string, Date> = {}
    if (baslangic) tarihFiltresi.gte = new Date(baslangic)
    if (bitis) {
      const b = new Date(bitis); b.setHours(23, 59, 59, 999)
      tarihFiltresi.lte = b
    }

    const odemeWhere: Record<string, unknown> = { kategori: 'iscilik', aktif: true }
    if (Object.keys(tarihFiltresi).length > 0) odemeWhere.olusturmaTarihi = tarihFiltresi
    if (ekipId) odemeWhere.ilgiliEkipId = ekipId

    const iscilikOdemeleri = await prisma.odemeKaydi.findMany({
      where: odemeWhere,
      orderBy: { olusturmaTarihi: 'desc' },
    })

    // Ekip ve işçi adlarını ayrı çek
    const ekipIdler = [...new Set(iscilikOdemeleri.map((o) => o.ilgiliEkipId).filter(Boolean))] as string[]
    const isciIdler = [...new Set(iscilikOdemeleri.map((o) => o.ilgiliIsciId).filter(Boolean))] as string[]
    const [ekipler, isciler] = await Promise.all([
      ekipIdler.length > 0 ? prisma.isciEkibi.findMany({ where: { id: { in: ekipIdler } }, select: { id: true, ekipAdi: true } }) : [],
      isciIdler.length > 0 ? prisma.isci.findMany({ where: { id: { in: isciIdler } }, select: { id: true, adSoyad: true } }) : [],
    ])
    const ekipMap = new Map(ekipler.map((e) => [e.id, e.ekipAdi]))
    const isciMap = new Map(isciler.map((i) => [i.id, i.adSoyad]))

    // Hasat girişleri — ekip + tarih bazlı günlük kg
    const hasatWhere: Record<string, unknown> = { aktif: { not: false } }
    if (Object.keys(tarihFiltresi).length > 0) hasatWhere.tarih = tarihFiltresi
    if (ekipId) hasatWhere.isciEkipId = ekipId
    if (surgunId) hasatWhere.surgunId = surgunId

    const hasatGirisleri = await prisma.hasatGirisi.findMany({
      where: hasatWhere,
      include: { isciEkip: { select: { ekipAdi: true } } },
      orderBy: { tarih: 'asc' },
    })

    const veriOdemeler = iscilikOdemeleri.map((o) => ({
      id: o.id,
      aciklama: o.aciklama,
      tutar: Number(o.tutar),
      odenenTutar: Number(o.odenenTutar),
      odemeDurumu: o.odemeDurumu,
      odemeTarihi: o.odemeTarihi,
      kayitTarihi: o.olusturmaTarihi,
      ekipAdi: o.ilgiliEkipId ? (ekipMap.get(o.ilgiliEkipId) ?? null) : null,
      isciAdi: o.ilgiliIsciId ? (isciMap.get(o.ilgiliIsciId) ?? null) : null,
      ilgiliEkipId: o.ilgiliEkipId,
      ilgiliIsciId: o.ilgiliIsciId,
    }))

    // Ekip bazlı özet
    const ekipOzetMap = new Map<string, { ekipAdi: string; toplamTutar: number; odenenTutar: number; kayitSayisi: number; toplamKg: number }>()
    for (const o of veriOdemeler) {
      const key = o.ekipAdi ?? 'Ekipsiz'
      const mevcut = ekipOzetMap.get(key)
      if (mevcut) { mevcut.toplamTutar += o.tutar; mevcut.odenenTutar += o.odenenTutar; mevcut.kayitSayisi++ }
      else ekipOzetMap.set(key, { ekipAdi: key, toplamTutar: o.tutar, odenenTutar: o.odenenTutar, kayitSayisi: 1, toplamKg: 0 })
    }
    for (const g of hasatGirisleri) {
      const key = g.isciEkip?.ekipAdi ?? 'Ekipsiz'
      const mevcut = ekipOzetMap.get(key)
      if (mevcut) mevcut.toplamKg += Number(g.tartimMiktariKg)
    }
    const ekipOzeti = Array.from(ekipOzetMap.values())
      .sort((a, b) => b.toplamTutar - a.toplamTutar)
      .map((e) => ({ ...e, maliyetPerKg: e.toplamKg > 0 ? e.toplamTutar / e.toplamKg : null }))

    // Ekip bazlı günlük hasat karşılaştırma
    const gunlukEkipMap = new Map<string, Map<string, number>>()
    for (const g of hasatGirisleri) {
      const ekip = g.isciEkip?.ekipAdi ?? 'Ekipsiz'
      const tarih = new Date(g.tarih).toISOString().slice(0, 10)
      if (!gunlukEkipMap.has(ekip)) gunlukEkipMap.set(ekip, new Map())
      const ekipGunler = gunlukEkipMap.get(ekip)!
      ekipGunler.set(tarih, (ekipGunler.get(tarih) ?? 0) + Number(g.tartimMiktariKg))
    }
    const ekiplerListesi = Array.from(gunlukEkipMap.keys())
    const tumTarihler = new Set<string>()
    for (const [, gunler] of gunlukEkipMap) for (const t of gunler.keys()) tumTarihler.add(t)
    const gunlukKarsilastirma = Array.from(tumTarihler).sort().map((tarih) => {
      const satir: Record<string, number | string> = { tarih }
      for (const ekip of ekiplerListesi) satir[ekip] = gunlukEkipMap.get(ekip)?.get(tarih) ?? 0
      return satir
    })

    return NextResponse.json({
      iscilikOdemeleri: veriOdemeler,
      ekipOzeti,
      gunlukKarsilastirma,
      ekipler: ekiplerListesi,
      toplamTutar: veriOdemeler.reduce((s, o) => s + o.tutar, 0),
      toplamOdenen: veriOdemeler.reduce((s, o) => s + o.odenenTutar, 0),
      toplam: veriOdemeler.length,
    })
  } catch (hata) {
    console.error('İşçilik raporu hatası:', hata)
    return NextResponse.json({ hata: 'İşçilik raporu alınamadı' }, { status: 500 })
  }
}
