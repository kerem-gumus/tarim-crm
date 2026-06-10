export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { mevcutKullaniciyiGetir } from '@/lib/yetki'
import { TUM_YETKILER } from '@/lib/yetki'
import { logKaydet } from '@/lib/aktiviteLog'

// PUT /api/rbac/roller/[id] — rol güncelle (ad + yetki listesi)
export async function PUT(istek: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const kullanici = await mevcutKullaniciyiGetir()
    if (!kullanici || kullanici.rol !== 'admin') {
      return NextResponse.json({ hata: 'Yetkisiz' }, { status: 403 })
    }

    const { id } = await params
    const { ad, aciklama, yetkiAnahtarlari } = await istek.json()

    // Mevcut yetkileri temizle
    await prisma.rbacRolYetki.deleteMany({ where: { rolId: id } })

    // Yeni yetkiler
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

    const guncellendi = await prisma.rbacRol.update({
      where: { id },
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
      islemTipi: 'guncelleme', modul: 'rbac', tablo: 'rbac_roller',
      kayitId: id, yeniDeger: { ad: guncellendi.ad },
    }).catch(console.error)

    return NextResponse.json(guncellendi)
  } catch (err) {
    console.error('[rbac/roller PUT]', err)
    return NextResponse.json({ hata: 'Güncellenemedi' }, { status: 500 })
  }
}

// DELETE /api/rbac/roller/[id]
export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const kullanici = await mevcutKullaniciyiGetir()
    if (!kullanici || kullanici.rol !== 'admin') {
      return NextResponse.json({ hata: 'Yetkisiz' }, { status: 403 })
    }

    const { id } = await params

    // Bu role atanmış kullanıcı var mı?
    const kullanicilari = await prisma.kullanici.count({ where: { rolId: id } })
    if (kullanicilari > 0) {
      return NextResponse.json(
        { hata: 'Bu role atanmış kullanıcı var. Önce kullanıcıların rolünü değiştirin.' },
        { status: 400 }
      )
    }

    await prisma.rbacRol.update({ where: { id }, data: { aktif: false } })

    logKaydet({
      islemTipi: 'silme', modul: 'rbac', tablo: 'rbac_roller', kayitId: id,
    }).catch(console.error)

    return NextResponse.json({ basarili: true })
  } catch (err) {
    console.error('[rbac/roller DELETE]', err)
    return NextResponse.json({ hata: 'Silinemedi' }, { status: 500 })
  }
}
