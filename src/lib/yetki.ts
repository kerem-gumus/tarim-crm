import { createSupabaseServerClient } from '@/lib/supabase-server'
import { prisma } from '@/lib/db'

export type KullaniciRolEnum = 'admin' | 'muhasebeci' | 'tarimci' | 'izleyici'

export async function mevcutKullaniciyiGetir() {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  return prisma.kullanici.findUnique({
    where: { supabaseId: user.id },
    include: { rbacRol: { include: { yetkiler: { include: { yetki: true } } } } },
  })
}

// ─── KullaniciRol (enum) tabanlı kontrol — eski sistem, geriye dönük uyumlu ───
export async function rolKontrol(gerekenRoller: KullaniciRolEnum[]): Promise<boolean> {
  const kullanici = await mevcutKullaniciyiGetir()
  if (!kullanici) return false
  if (kullanici.rol === 'admin') return true // admin her şeye erişir
  return gerekenRoller.includes(kullanici.rol as KullaniciRolEnum)
}

// ─── RBAC yetki kontrolü (yeni sistem) ───────────────────────────────────────
// "ciftci.ekle", "sayfa.finans", "banka.goruntule" gibi anahtar kontrol eder.
// admin her zaman true döner.
export async function yetkiKontrol(anahtar: string): Promise<boolean> {
  const kullanici = await mevcutKullaniciyiGetir()
  if (!kullanici) return false
  if (kullanici.rol === 'admin') return true

  // Özel RBAC rolü yoksa KullaniciRol enum'una göre varsayılan yetkileri dön
  if (!kullanici.rbacRol) {
    return varsayilanRolYetkiVar(kullanici.rol as KullaniciRolEnum, anahtar)
  }

  // RBAC rolündeki yetkiler listesinden kontrol
  const yetkiler = kullanici.rbacRol.yetkiler.map((ry) => ry.yetki.anahtar)
  return yetkiler.includes(anahtar)
}

// Varsayılan rol→yetki eşleşmesi (RBAC rol atanmamış kullanıcılar için)
function varsayilanRolYetkiVar(rol: KullaniciRolEnum, anahtar: string): boolean {
  const VARSAYILAN: Record<KullaniciRolEnum, string[]> = {
    admin: ['*'],
    muhasebeci: [
      'sayfa.finans', 'sayfa.banka-kasa', 'sayfa.raporlar', 'sayfa.envanter',
      'finans.goruntule', 'banka.goruntule', 'banka.hareket.goruntule',
    ],
    tarimci: [
      'sayfa.hasat', 'sayfa.tarlalar', 'sayfa.ciftciler', 'sayfa.iscilik',
      'sayfa.envanter', 'hasat.ekle', 'tarla.ekle', 'tarla.guncelle',
    ],
    izleyici: [
      'sayfa.hasat', 'sayfa.tarlalar', 'sayfa.dashboard',
    ],
  }

  const izinler = VARSAYILAN[rol] ?? []
  if (izinler.includes('*')) return true

  // Tam eşleşme veya wildcard: "ciftci.*" → "ciftci.ekle" eşleşir
  return izinler.some((izin) => {
    if (izin === anahtar) return true
    if (izin.endsWith('.*')) {
      const prefix = izin.slice(0, -2)
      return anahtar.startsWith(prefix + '.')
    }
    return false
  })
}

// Sayfa erişim kuralları (middleware için)
export const SAYFA_ROLLERI: Record<string, KullaniciRolEnum[]> = {
  '/kullanicilar': ['admin'],
  '/finans': ['admin', 'muhasebeci'],
  '/raporlar': ['admin', 'muhasebeci'],
  '/hasat': ['admin', 'tarimci'],
  '/tarlalar': ['admin', 'tarimci'],
  '/envanter': ['admin', 'tarimci', 'muhasebeci'],
}

// Tüm tanımlı yetki anahtarları (rol yönetimi sayfasında checkbox grid için)
export const TUM_YETKILER = [
  // Sayfa görüntüleme
  { anahtar: 'sayfa.dashboard',          aciklama: 'Dashboard',           kategori: 'sayfa' },
  { anahtar: 'sayfa.hasat',              aciklama: 'Hasat modülü',        kategori: 'sayfa' },
  { anahtar: 'sayfa.tarlalar',           aciklama: 'Tarlalar',            kategori: 'sayfa' },
  { anahtar: 'sayfa.ciftciler',          aciklama: 'Çiftçiler',           kategori: 'sayfa' },
  { anahtar: 'sayfa.iscilik',            aciklama: 'İşçilik',             kategori: 'sayfa' },
  { anahtar: 'sayfa.musteriler',         aciklama: 'Müşteriler',          kategori: 'sayfa' },
  { anahtar: 'sayfa.kontenjanlar',       aciklama: 'Kontenjanlar',        kategori: 'sayfa' },
  { anahtar: 'sayfa.finans',             aciklama: 'Finans',              kategori: 'sayfa' },
  { anahtar: 'sayfa.banka-kasa',         aciklama: 'Banka/Kasa',         kategori: 'sayfa' },
  { anahtar: 'sayfa.envanter',           aciklama: 'Envanter',            kategori: 'sayfa' },
  { anahtar: 'sayfa.raporlar',           aciklama: 'Raporlar',            kategori: 'sayfa' },
  { anahtar: 'sayfa.kullanicilar',       aciklama: 'Kullanıcılar',       kategori: 'sayfa' },
  { anahtar: 'sayfa.cuzdan-kullanicilari', aciklama: 'Cüzdan Kull.',     kategori: 'sayfa' },
  { anahtar: 'sayfa.cari-hesap',         aciklama: 'Cari Hesap',          kategori: 'sayfa' },
  // İşlem yetkileri
  { anahtar: 'hasat.ekle',              aciklama: 'Hasat girişi ekle',    kategori: 'islem' },
  { anahtar: 'hasat.sil',               aciklama: 'Hasat girişi sil',     kategori: 'islem' },
  { anahtar: 'hasat.pasif-aktif-et',    aciklama: 'Pasif hasat aktifleştir', kategori: 'ozel' },
  { anahtar: 'surgun.kapali-ac',        aciklama: 'Kapalı sürgün aç',    kategori: 'ozel' },
  { anahtar: 'surgun.kayit-guncelle',   aciklama: 'Sürgün kaydı güncelle', kategori: 'ozel' },
  { anahtar: 'tarla.ekle',              aciklama: 'Tarla ekle',           kategori: 'islem' },
  { anahtar: 'tarla.guncelle',          aciklama: 'Tarla güncelle',       kategori: 'islem' },
  { anahtar: 'tarla.sil',               aciklama: 'Tarla sil',            kategori: 'islem' },
  { anahtar: 'ciftci.ekle',             aciklama: 'Çiftçi ekle',         kategori: 'islem' },
  { anahtar: 'ciftci.sil',              aciklama: 'Çiftçi sil',          kategori: 'islem' },
  // Banka yetkileri
  { anahtar: 'banka.goruntule',         aciklama: 'Banka hesapları gör', kategori: 'banka' },
  { anahtar: 'banka.hareket.goruntule', aciklama: 'Banka hareketleri gör', kategori: 'banka' },
  { anahtar: 'banka.hareket.sil',       aciklama: 'Banka hareketi sil',  kategori: 'banka' },
  { anahtar: 'finans.goruntule',        aciklama: 'Finans görüntüle',    kategori: 'banka' },
] as const
