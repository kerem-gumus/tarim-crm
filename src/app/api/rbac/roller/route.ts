export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { mevcutKullaniciyiGetir } from '@/lib/yetki'
import { TUM_YETKILER } from '@/lib/yetki'
import { logKaydet } from '@/lib/aktiviteLog'

// GET /api/rbac/roller — tüm roller + yetkiler
export async function GET() {
  try {
    const kullanici = await mevcutKullaniciyiGetir()
    if (!kullanici || kullanici.rol !== 'admin') {
      return NextResponse.json({ hata: 'Yetkisiz' }, { status: 403 })
    }

    const roller = await prisma.rbacRol.findMany({
      where: { aktif: true },
      include: { yetkiler: { include: { yetki: true } } },
      orderBy: { ad: 'asc' },
    })

    return NextResponse.json({
      roller: roller.map((r) => ({
        id: r.id,
        ad: r.ad,
        aciklama: r.aciklama,
        aktif: r.aktif,
        yetkiAnahtarlari: r.yetkiler.map((ry) => ry.yetki.anahtar),
      })),
      tumYetkiler: TUM_YETKILER,
    })
  } catch (err) {
    console.error('[rbac/roller GET]', err)
    return NextResponse.json({ hata: 'Roller getirilemedi' }, { status: 500 })
  }
}

// POST /api/rbac/roller — yeni rol oluştur
export async function POST(istek: Request) {
  try {
    const kullanici = await mevcutKullaniciyiGetir()
    if (!kullanici || kullanici.rol !== 'admin') {
      return NextResponse.json({ hata: 'Yetkisiz' }, { status: 403 })
    }

    const { ad, aciklama, yetkiAnahtarlari } = await istek.json()
    if (!ad?.trim()) return NextResponse.json({ hata: 'Rol adı zorunludur' }, { status: 400 })

    // Yetki kayıtlarını bul/oluştur
    const yetkiKayitlari = await Promise.all(
      (yetkiAnahtarlari ?? []).map(async (anahtar: string) => {
        const tanim = TUM_YETKILER.find((y) => y.anahtar === anahtar)
        return prisma.rbacYetki.upsert({
          where: { anahtar },
          update: {},
          create: {
            anahtar,
            aciklama: tanim?.aciklama ?? anahtar,
            kategori: tanim?.kategori ?? 'islem',
          },
        })
      })
    )

    const yeniRol = await prisma.rbacRol.create({
      data: {
        ad: ad.trim(),
        aciklama: aciklama?.trim() || null,
        yetkiler: {
          create: yetkiKayitlari.map((y) => ({ yetkiId: y.id })),
        },
      },
      include: { yetkiler: { include: { yetki: true } } },
    })

    logKaydet({
      islemTipi: 'olusturma', modul: 'rbac', tablo: 'rbac_roller',
      kayitId: yeniRol.id, yeniDeger: { ad: yeniRol.ad },
    }).catch(console.error)

    return NextResponse.json(yeniRol, { status: 201 })
  } catch (err) {
    console.error('[rbac/roller POST]', err)
    return NextResponse.json({ hata: 'Rol oluşturulamadı' }, { status: 500 })
  }
}
