export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { logKaydet } from '@/lib/aktiviteLog'
import { auditGuncelle } from '@/lib/auditKullanici'

// POST /api/hasat-girisleri/toplu-sil
// Body: { girisIdleri: string[] }
export async function POST(istek: Request) {
  try {
    const { girisIdleri } = await istek.json()

    if (!Array.isArray(girisIdleri) || girisIdleri.length === 0) {
      return NextResponse.json({ hata: 'En az bir giriş ID gerekli' }, { status: 400 })
    }

    const girişler = await prisma.hasatGirisi.findMany({
      where: { id: { in: girisIdleri }, aktif: { not: false } },
    })

    if (girişler.length === 0) {
      return NextResponse.json({ hata: 'Silinecek giriş bulunamadı' }, { status: 404 })
    }

    const audit = await auditGuncelle()

    // Sürgün bazında kg düşümü hesapla
    const surgunKgMap = new Map<string, number>()
    for (const g of girişler) {
      // Senaryo 2 girişleri (satisBenimMi=false) sürgüne işlenmemişti
      if (g.satisBenimMi !== false && Number(g.tartimMiktariKg) > 0) {
        const mevcut = surgunKgMap.get(g.surgunId) ?? 0
        surgunKgMap.set(g.surgunId, mevcut + Number(g.tartimMiktariKg))
      }
    }

    await prisma.$transaction(async (tx) => {
      // Tüm bağlı kayıtları pasifleştir
      await tx.odemeKaydi.updateMany({ where: { hasatGirisId: { in: girisIdleri } }, data: { aktif: false, ...audit } })
      await tx.cariHareket.updateMany({ where: { hasatGirisiId: { in: girisIdleri }, aktif: true }, data: { aktif: false } })
      await tx.gelirKaydi.updateMany({ where: { hasatGirisiId: { in: girisIdleri }, aktif: true }, data: { aktif: false } })
      await tx.hasatGirisi.updateMany({ where: { id: { in: girisIdleri } }, data: { aktif: false, ...audit } })

      // Sürgün toplamlarını toplu güncelle
      for (const [surgunId, kg] of surgunKgMap) {
        await tx.surgun.update({
          where: { id: surgunId },
          data: { toplamHasatKg: { decrement: kg } },
        })
      }
    })

    logKaydet({
      islemTipi: 'silme', modul: 'hasat', tablo: 'hasat_girisleri',
      kayitId: 'toplu', yeniDeger: { silinen: girisIdleri.length },
    }).catch(console.error)

    return NextResponse.json({ silinen: girişler.length })
  } catch (err) {
    console.error('[toplu-sil]', err)
    return NextResponse.json({ hata: 'Toplu silme başarısız' }, { status: 500 })
  }
}
