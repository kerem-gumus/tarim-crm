'use client'

import { useEffect, useState } from 'react'

type Rol = 'admin' | 'muhasebeci' | 'tarimci' | 'izleyici'
type Durum = 'aktif' | 'pasif'

interface Kullanici {
  id: string
  supabaseId: string
  adSoyad: string
  eposta: string
  telefon?: string | null
  rol: Rol
  durum: Durum
  sonGiris?: string | null
  olusturmaTarihi: string
}

const rolRenkler: Record<Rol, string> = {
  admin: 'bg-red-100 text-red-700',
  muhasebeci: 'bg-blue-100 text-blue-700',
  tarimci: 'bg-green-100 text-green-700',
  izleyici: 'bg-gray-100 text-gray-700',
}

const rolEtiketler: Record<Rol, string> = {
  admin: 'Admin',
  muhasebeci: 'Muhasebeci',
  tarimci: 'Tarımcı',
  izleyici: 'İzleyici',
}

export default function KullanicilarSayfasi() {
  const [kullanicilar, setKullanicilar] = useState<Kullanici[]>([])
  const [yukleniyor, setYukleniyor] = useState(true)
  const [hata, setHata] = useState('')
  const [yeniFormAcik, setYeniFormAcik] = useState(false)
  const [geciciSifre, setGeciciSifre] = useState('')
  const [kopyalandi, setKopyalandi] = useState(false)

  // Yeni kullanıcı form state'leri
  const [yeniAdSoyad, setYeniAdSoyad] = useState('')
  const [yeniEposta, setYeniEposta] = useState('')
  const [yeniRol, setYeniRol] = useState<Rol>('izleyici')
  const [yeniTelefon, setYeniTelefon] = useState('')
  const [formYukleniyor, setFormYukleniyor] = useState(false)
  const [formHata, setFormHata] = useState('')

  async function kullanicilariGetir() {
    setYukleniyor(true)
    try {
      const yanit = await fetch('/api/kullanicilar')
      if (!yanit.ok) {
        const veri = await yanit.json()
        setHata(veri.hata ?? 'Kullanıcılar yüklenemedi')
        return
      }
      const veri = await yanit.json()
      setKullanicilar(veri)
    } catch {
      setHata('Bağlantı hatası')
    } finally {
      setYukleniyor(false)
    }
  }

  useEffect(() => {
    kullanicilariGetir()
  }, [])

  async function rolGuncelle(id: string, rol: Rol) {
    try {
      await fetch(`/api/kullanicilar/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rol }),
      })
      setKullanicilar((prev) =>
        prev.map((k) => (k.id === id ? { ...k, rol } : k))
      )
    } catch {
      alert('Rol güncellenemedi')
    }
  }

  async function durumToggle(id: string, mevcutDurum: Durum) {
    const yeniDurum: Durum = mevcutDurum === 'aktif' ? 'pasif' : 'aktif'
    try {
      await fetch(`/api/kullanicilar/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ durum: yeniDurum }),
      })
      setKullanicilar((prev) =>
        prev.map((k) => (k.id === id ? { ...k, durum: yeniDurum } : k))
      )
    } catch {
      alert('Durum güncellenemedi')
    }
  }

  async function kullanicisil(id: string, adSoyad: string) {
    if (!confirm(`"${adSoyad}" kullanıcısını silmek istediğinize emin misiniz?`)) return
    try {
      const yanit = await fetch(`/api/kullanicilar/${id}`, { method: 'DELETE' })
      if (!yanit.ok) {
        const veri = await yanit.json()
        alert(veri.hata ?? 'Kullanıcı silinemedi')
        return
      }
      setKullanicilar((prev) => prev.filter((k) => k.id !== id))
    } catch {
      alert('Silme işlemi başarısız')
    }
  }

  async function yeniKullaniciEkle(e: React.FormEvent) {
    e.preventDefault()
    setFormHata('')
    setFormYukleniyor(true)
    try {
      const yanit = await fetch('/api/kullanicilar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eposta: yeniEposta,
          adSoyad: yeniAdSoyad,
          rol: yeniRol,
          telefon: yeniTelefon || null,
        }),
      })
      const veri = await yanit.json()
      if (!yanit.ok) {
        setFormHata(veri.hata ?? 'Kullanıcı oluşturulamadı')
        return
      }
      setGeciciSifre(veri.geciciSifre)
      setKullanicilar((prev) => [veri.kullanici, ...prev])
      setYeniAdSoyad('')
      setYeniEposta('')
      setYeniRol('izleyici')
      setYeniTelefon('')
    } catch {
      setFormHata('Bağlantı hatası')
    } finally {
      setFormYukleniyor(false)
    }
  }

  function sifreKopyala() {
    navigator.clipboard.writeText(geciciSifre)
    setKopyalandi(true)
    setTimeout(() => setKopyalandi(false), 2000)
  }

  function formKapat() {
    setYeniFormAcik(false)
    setGeciciSifre('')
    setFormHata('')
    setYeniAdSoyad('')
    setYeniEposta('')
    setYeniRol('izleyici')
    setYeniTelefon('')
  }

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-800">Kullanıcı Yönetimi</h2>
          <p className="mt-1 text-sm text-gray-500">Sisteme erişim yetkisi olan kullanıcıları yönetin</p>
        </div>
        <button
          onClick={() => setYeniFormAcik(true)}
          className="rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700 transition"
        >
          + Yeni Kullanıcı
        </button>
      </div>

      {hata && (
        <div className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">
          {hata}
        </div>
      )}

      {yukleniyor ? (
        <div className="flex items-center justify-center py-12 text-gray-400">
          <span>Yükleniyor...</span>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="px-4 py-3 text-left font-semibold text-gray-600">Ad Soyad</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600">E-posta</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600">Rol</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600">Durum</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600">Son Giriş</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600">İşlemler</th>
              </tr>
            </thead>
            <tbody>
              {kullanicilar.map((k, i) => (
                <tr
                  key={k.id}
                  className={`border-b border-gray-50 ${i % 2 === 0 ? 'bg-white' : 'bg-gray-50/30'}`}
                >
                  <td className="px-4 py-3 font-medium text-gray-800">{k.adSoyad}</td>
                  <td className="px-4 py-3 text-gray-600">{k.eposta}</td>
                  <td className="px-4 py-3">
                    <select
                      value={k.rol}
                      onChange={(e) => rolGuncelle(k.id, e.target.value as Rol)}
                      className={`rounded-full px-2 py-0.5 text-xs font-semibold border-0 cursor-pointer ${rolRenkler[k.rol]}`}
                    >
                      <option value="admin">Admin</option>
                      <option value="muhasebeci">Muhasebeci</option>
                      <option value="tarimci">Tarımcı</option>
                      <option value="izleyici">İzleyici</option>
                    </select>
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => durumToggle(k.id, k.durum)}
                      className={`rounded-full px-2 py-0.5 text-xs font-semibold transition ${
                        k.durum === 'aktif'
                          ? 'bg-green-100 text-green-700 hover:bg-green-200'
                          : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                      }`}
                    >
                      {k.durum === 'aktif' ? 'Aktif' : 'Pasif'}
                    </button>
                  </td>
                  <td className="px-4 py-3 text-gray-500">
                    {k.sonGiris
                      ? new Date(k.sonGiris).toLocaleDateString('tr-TR', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })
                      : '—'}
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => kullanicisil(k.id, k.adSoyad)}
                      className="rounded px-2 py-1 text-xs text-red-500 hover:bg-red-50 hover:text-red-700 transition"
                    >
                      Sil
                    </button>
                  </td>
                </tr>
              ))}
              {kullanicilar.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-gray-400">
                    Henüz kullanıcı eklenmemiş
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal: Yeni Kullanıcı */}
      {yeniFormAcik && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-bold text-gray-800">Yeni Kullanıcı Ekle</h3>
              <button
                onClick={formKapat}
                className="text-gray-400 hover:text-gray-600 text-xl leading-none"
              >
                &times;
              </button>
            </div>

            {/* Geçici Şifre Uyarısı */}
            {geciciSifre && (
              <div className="mb-4 rounded-lg bg-yellow-50 border border-yellow-200 px-4 py-3">
                <p className="text-sm font-semibold text-yellow-800 mb-1">
                  Geçici Şifre: <span className="font-mono">{geciciSifre}</span>
                </p>
                <p className="text-xs text-yellow-700 mb-2">
                  Bu şifreyi kullanıcıya iletin. Giriş yaptıktan sonra şifresini değiştirmesini söyleyin.
                </p>
                <button
                  onClick={sifreKopyala}
                  className="rounded px-3 py-1 text-xs font-semibold bg-yellow-200 text-yellow-800 hover:bg-yellow-300 transition"
                >
                  {kopyalandi ? 'Kopyalandı!' : 'Kopyala'}
                </button>
              </div>
            )}

            {!geciciSifre && (
              <form onSubmit={yeniKullaniciEkle} className="space-y-4">
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">Ad Soyad</label>
                  <input
                    type="text"
                    required
                    value={yeniAdSoyad}
                    onChange={(e) => setYeniAdSoyad(e.target.value)}
                    placeholder="Ahmet Yılmaz"
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-green-500 focus:ring-2 focus:ring-green-100"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">E-posta</label>
                  <input
                    type="email"
                    required
                    value={yeniEposta}
                    onChange={(e) => setYeniEposta(e.target.value)}
                    placeholder="ornek@tarimcrm.com"
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-green-500 focus:ring-2 focus:ring-green-100"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">Rol</label>
                  <select
                    value={yeniRol}
                    onChange={(e) => setYeniRol(e.target.value as Rol)}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-green-500 focus:ring-2 focus:ring-green-100"
                  >
                    <option value="izleyici">İzleyici</option>
                    <option value="tarimci">Tarımcı</option>
                    <option value="muhasebeci">Muhasebeci</option>
                    <option value="admin">Admin</option>
                  </select>
                  <p className="mt-1 text-xs text-gray-400">
                    {yeniRol === 'admin' && 'Tam yetki — dikkatli kullanın'}
                    {yeniRol === 'muhasebeci' && 'Finans, raporlar, müşteriler'}
                    {yeniRol === 'tarimci' && 'Hasat ve tarla yönetimi'}
                    {yeniRol === 'izleyici' && 'Sadece okuma yetkisi'}
                  </p>
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    Telefon <span className="text-gray-400 font-normal">(opsiyonel)</span>
                  </label>
                  <input
                    type="tel"
                    value={yeniTelefon}
                    onChange={(e) => setYeniTelefon(e.target.value)}
                    placeholder="0532 000 00 00"
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-green-500 focus:ring-2 focus:ring-green-100"
                  />
                </div>

                {formHata && (
                  <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{formHata}</p>
                )}

                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={formKapat}
                    className="flex-1 rounded-lg border border-gray-300 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 transition"
                  >
                    İptal
                  </button>
                  <button
                    type="submit"
                    disabled={formYukleniyor}
                    className="flex-1 rounded-lg bg-green-600 py-2 text-sm font-semibold text-white hover:bg-green-700 disabled:opacity-60 transition"
                  >
                    {formYukleniyor ? 'Oluşturuluyor...' : 'Kullanıcı Oluştur'}
                  </button>
                </div>
              </form>
            )}

            {geciciSifre && (
              <div className="flex justify-end pt-2">
                <button
                  onClick={formKapat}
                  className="rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700 transition"
                >
                  Tamam
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
