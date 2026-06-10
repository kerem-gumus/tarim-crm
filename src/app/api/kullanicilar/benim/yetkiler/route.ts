export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { mevcutKullaniciyiGetir, TUM_YETKILER } from '@/lib/yetki'

// GET /api/kullanicilar/benim/yetkiler
// Oturumdaki kullanıcının tüm yetki anahtarlarını döner (UI cache için)
export async function GET() {
  try {
    const kullanici = await mevcutKullaniciyiGetir()
    if (!kullanici) return NextResponse.json({ yetkiler: [] })

    // Admin: tüm yetkiler + wildcard
    if (kullanici.rol === 'admin') {
      return NextResponse.json({ yetkiler: ['*'] })
    }

    // RBAC özel rolü varsa onun yetkilerini döndür
    if (kullanici.rbacRol) {
      const anahtarlar = kullanici.rbacRol.yetkiler.map((ry) => ry.yetki.anahtar)
      return NextResponse.json({ yetkiler: anahtarlar })
    }

    // Varsayılan rol yetkilerini döndür
    const VARSAYILAN: Record<string, string[]> = {
      muhasebeci: [
        'sayfa.finans', 'sayfa.banka-kasa', 'sayfa.raporlar', 'sayfa.envanter',
        'sayfa.dashboard', 'finans.goruntule', 'banka.goruntule', 'banka.hareket.goruntule',
      ],
      tarimci: [
        'sayfa.hasat', 'sayfa.tarlalar', 'sayfa.ciftciler', 'sayfa.iscilik',
        'sayfa.envanter', 'sayfa.dashboard', 'sayfa.musteriler', 'sayfa.kontenjanlar',
        'hasat.ekle', 'tarla.ekle', 'tarla.guncelle', 'ciftci.ekle',
        'sayfa.cuzdan-kullanicilari', 'sayfa.cari-hesap',
      ],
      izleyici: [
        'sayfa.hasat', 'sayfa.tarlalar', 'sayfa.dashboard',
      ],
    }

    const yetkiler = VARSAYILAN[kullanici.rol] ?? []
    return NextResponse.json({ yetkiler })
  } catch (err) {
    console.error('[benim/yetkiler]', err)
    return NextResponse.json({ yetkiler: [] })
  }
}
