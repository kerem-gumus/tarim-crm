import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function POST() {
  try {
    let olusturulan = 0

    // 1. Kritik Stok Kontrolü
    const kritikStoklar = await prisma.malzeme.findMany({
      where: { durum: 'aktif' },
    })

    for (const m of kritikStoklar) {
      if (Number(m.mevcutStok) <= Number(m.minimumStok)) {
        const bugun = new Date()
        bugun.setHours(0, 0, 0, 0)
        const varMi = await prisma.bildirim.findFirst({
          where: {
            tip: 'stok_uyarisi',
            ilgiliKayitId: m.id,
            olusturmaTarihi: { gte: bugun },
          },
        })
        if (!varMi) {
          await prisma.bildirim.create({
            data: {
              tip: 'stok_uyarisi',
              baslik: `Kritik Stok: ${m.malzemeAdi}`,
              mesaj: `${m.malzemeAdi} stoğu kritik seviyede. Mevcut: ${Number(m.mevcutStok)} ${m.birim}, Minimum: ${Number(m.minimumStok)}`,
              oncelik: 'yuksek',
              ilgiliModul: 'envanter',
              ilgiliKayitId: m.id,
            },
          })
          olusturulan++
        }
      }
    }

    // 2. Ödeme Vadesi Kontrolü (3 gün)
    const ucGunSonra = new Date()
    ucGunSonra.setDate(ucGunSonra.getDate() + 3)
    const yaklasanOdemeler = await prisma.gelirKaydi.findMany({
      where: {
        vadeTarihi: { lte: ucGunSonra },
        odemeDurumu: { not: 'odendi' },
      },
    })

    for (const o of yaklasanOdemeler) {
      const bugun = new Date()
      bugun.setHours(0, 0, 0, 0)
      const varMi = await prisma.bildirim.findFirst({
        where: {
          tip: 'odeme_vadesi',
          ilgiliKayitId: o.id,
          olusturmaTarihi: { gte: bugun },
        },
      })
      if (!varMi) {
        await prisma.bildirim.create({
          data: {
            tip: 'odeme_vadesi',
            baslik: `Ödeme Vadesi Yaklaşıyor`,
            mesaj: `${Number(o.toplamTutar)} TL tutarındaki ödemenin vadesi ${o.vadeTarihi ? new Date(o.vadeTarihi).toLocaleDateString('tr-TR') : 'yakında'} tarihinde dolacak.`,
            oncelik: 'yuksek',
            ilgiliModul: 'finans',
            ilgiliKayitId: o.id,
          },
        })
        olusturulan++
      }
    }

    // 3. Ekipman Bakım Kontrolü (30 gün)
    const otuzGunSonra = new Date()
    otuzGunSonra.setDate(otuzGunSonra.getDate() + 30)
    const bakimGereken = await prisma.ekipman.findMany({
      where: {
        sonrakiBakimTarihi: { lte: otuzGunSonra },
        durum: { not: 'hurda' },
      },
    })

    for (const e of bakimGereken) {
      const bugun = new Date()
      bugun.setHours(0, 0, 0, 0)
      const varMi = await prisma.bildirim.findFirst({
        where: {
          tip: 'bakim_hatirlatma',
          ilgiliKayitId: e.id,
          olusturmaTarihi: { gte: bugun },
        },
      })
      if (!varMi) {
        await prisma.bildirim.create({
          data: {
            tip: 'bakim_hatirlatma',
            baslik: `Ekipman Bakımı: ${e.ekipmanAdi}`,
            mesaj: `${e.ekipmanAdi} için bakım tarihi ${e.sonrakiBakimTarihi ? new Date(e.sonrakiBakimTarihi).toLocaleDateString('tr-TR') : 'yakında'} tarihinde.`,
            oncelik: 'orta',
            ilgiliModul: 'envanter',
            ilgiliKayitId: e.id,
          },
        })
        olusturulan++
      }
    }

    return NextResponse.json({ olusturulan })
  } catch {
    return NextResponse.json({ hata: 'Kontrol sırasında hata oluştu' }, { status: 500 })
  }
}
