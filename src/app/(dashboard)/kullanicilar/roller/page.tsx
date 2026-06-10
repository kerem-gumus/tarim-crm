'use client'

import { useCallback, useEffect, useState } from 'react'

interface YetkiTanim {
  readonly anahtar: string
  readonly aciklama: string
  readonly kategori: string
}

interface RbacRol {
  id: string
  ad: string
  aciklama: string | null
  aktif: boolean
  yetkiAnahtarlari: string[]
}

const KATEGORI_ETIKET: Record<string, string> = {
  sayfa: 'Sayfa Görüntüleme',
  islem: 'İşlem Yetkileri',
  banka: 'Banka/Finans',
  ozel: 'Özel Yetkiler',
}

function RolFormu({
  mevcut,
  tumYetkiler,
  onKaydet,
  onKapat,
}: {
  mevcut?: RbacRol
  tumYetkiler: YetkiTanim[]
  onKaydet: () => void
  onKapat: () => void
}) {
  const [ad, setAd] = useState(mevcut?.ad ?? '')
  const [aciklama, setAciklama] = useState(mevcut?.aciklama ?? '')
  const [seciliYetkiler, setSeciliYetkiler] = useState<Set<string>>(
    new Set(mevcut?.yetkiAnahtarlari ?? [])
  )
  const [kaydediliyor, setKaydediliyor] = useState(false)
  const [hata, setHata] = useState('')

  function yetkiToggle(anahtar: string) {
    setSeciliYetkiler((prev) => {
      const yeni = new Set(prev)
      if (yeni.has(anahtar)) yeni.delete(anahtar)
      else yeni.add(anahtar)
      return yeni
    })
  }

  function kategoriToggle(kategori: string, checked: boolean) {
    const kategoriYetkileri = tumYetkiler.filter((y) => y.kategori === kategori).map((y) => y.anahtar)
    setSeciliYetkiler((prev) => {
      const yeni = new Set(prev)
      if (checked) kategoriYetkileri.forEach((a) => yeni.add(a))
      else kategoriYetkileri.forEach((a) => yeni.delete(a))
      return yeni
    })
  }

  async function kaydet() {
    if (!ad.trim()) { setHata('Rol adı zorunludur'); return }
    setKaydediliyor(true); setHata('')
    try {
      const url = mevcut ? `/api/rbac/roller/${mevcut.id}` : '/api/rbac/roller'
      const method = mevcut ? 'PUT' : 'POST'
      const yanit = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ad: ad.trim(), aciklama: aciklama.trim() || null, yetkiAnahtarlari: [...seciliYetkiler] }),
      })
      if (!yanit.ok) { const v = await yanit.json(); setHata(v.hata ?? 'Hata'); return }
      onKaydet()
    } catch { setHata('Bağlantı hatası') } finally { setKaydediliyor(false) }
  }

  const kategoriler = [...new Set(tumYetkiler.map((y) => y.kategori))]

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-xl bg-white p-6 shadow-xl space-y-4">
        <h3 className="text-base font-semibold text-gray-800">{mevcut ? 'Rol Düzenle' : 'Yeni Rol'}</h3>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Rol Adı *</label>
            <input value={ad} onChange={(e) => setAd(e.target.value)} placeholder="Muhasebeci, Tarla Sorumlusu..."
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Açıklama</label>
            <input value={aciklama} onChange={(e) => setAciklama(e.target.value)} placeholder="Kısa açıklama..."
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
        </div>

        <div className="border rounded-xl overflow-hidden">
          <div className="bg-gray-50 px-4 py-2 border-b">
            <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
              Yetkiler ({seciliYetkiler.size} seçili)
            </p>
          </div>
          <div className="divide-y">
            {kategoriler.map((kat) => {
              const katYetkiler = tumYetkiler.filter((y) => y.kategori === kat)
              const hepsiSecili = katYetkiler.every((y) => seciliYetkiler.has(y.anahtar))
              const hicbiriSecilmemis = katYetkiler.every((y) => !seciliYetkiler.has(y.anahtar))

              return (
                <div key={kat} className="p-3">
                  <label className="flex items-center gap-2 cursor-pointer mb-2">
                    <input
                      type="checkbox"
                      checked={hepsiSecili}
                      ref={(el) => { if (el) el.indeterminate = !hepsiSecili && !hicbiriSecilmemis }}
                      onChange={(e) => kategoriToggle(kat, e.target.checked)}
                      className="accent-blue-600"
                    />
                    <span className="text-sm font-medium text-gray-700">
                      {KATEGORI_ETIKET[kat] ?? kat}
                    </span>
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 ml-5">
                    {katYetkiler.map((y) => (
                      <label key={y.anahtar} className="flex items-center gap-1.5 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={seciliYetkiler.has(y.anahtar)}
                          onChange={() => yetkiToggle(y.anahtar)}
                          className="accent-blue-600"
                        />
                        <span className="text-xs text-gray-600">{y.aciklama}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {hata && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{hata}</p>}

        <div className="flex gap-3 pt-1">
          <button onClick={onKapat} className="flex-1 rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">İptal</button>
          <button onClick={kaydet} disabled={kaydediliyor}
            className="flex-1 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50">
            {kaydediliyor ? 'Kaydediliyor...' : 'Kaydet'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function RollerSayfasi() {
  const [roller, setRoller] = useState<RbacRol[]>([])
  const [tumYetkiler, setTumYetkiler] = useState<YetkiTanim[]>([])
  const [yukleniyor, setYukleniyor] = useState(true)
  const [formAcik, setFormAcik] = useState(false)
  const [duzenlenecek, setDuzenlenecek] = useState<RbacRol | undefined>()

  const getir = useCallback(async () => {
    setYukleniyor(true)
    try {
      const yanit = await fetch('/api/rbac/roller')
      const veri = await yanit.json()
      if (veri.roller) setRoller(veri.roller)
      if (veri.tumYetkiler) setTumYetkiler(veri.tumYetkiler as YetkiTanim[])
    } finally { setYukleniyor(false) }
  }, [])

  useEffect(() => { getir() }, [getir])

  async function sil(id: string, ad: string) {
    if (!confirm(`"${ad}" rolünü silmek istediğinizden emin misiniz?`)) return
    const yanit = await fetch(`/api/rbac/roller/${id}`, { method: 'DELETE' })
    if (!yanit.ok) { const v = await yanit.json(); alert(v.hata ?? 'Silinemedi'); return }
    getir()
  }

  return (
    <div className="min-h-full bg-gray-50">
      <div className="flex items-center justify-between px-4 pt-4 pb-2">
        <div>
          <div className="flex items-center gap-2">
            <a href="/kullanicilar" className="text-sm text-blue-600 hover:underline">← Kullanıcılar</a>
            <h1 className="text-lg font-bold text-gray-800">Rol Yönetimi (RBAC)</h1>
          </div>
          <p className="text-xs text-gray-500">Özel roller oluşturun ve yetki matrisini yönetin</p>
        </div>
        <button onClick={() => { setDuzenlenecek(undefined); setFormAcik(true) }}
          className="rounded-lg bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700">
          + Yeni Rol
        </button>
      </div>

      <div className="px-4 py-4">
        {yukleniyor ? (
          <p className="text-center text-gray-400 py-12">Yükleniyor...</p>
        ) : roller.length === 0 ? (
          <div className="rounded-2xl border border-gray-100 bg-white p-12 text-center text-sm text-gray-400">
            Henüz özel rol yok. Yeni Rol ile başlayın.
          </div>
        ) : (
          <div className="space-y-3">
            {roller.map((r) => (
              <div key={r.id} className="rounded-xl border border-gray-200 bg-white p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-semibold text-gray-800">{r.ad}</p>
                    {r.aciklama && <p className="text-xs text-gray-500 mt-0.5">{r.aciklama}</p>}
                    <p className="text-xs text-gray-400 mt-1">
                      {r.yetkiAnahtarlari.length} yetki
                    </p>
                    <div className="flex flex-wrap gap-1 mt-2">
                      {r.yetkiAnahtarlari.slice(0, 6).map((a) => (
                        <span key={a} className="inline-flex rounded px-1.5 py-0.5 text-xs bg-blue-50 text-blue-700">{a}</span>
                      ))}
                      {r.yetkiAnahtarlari.length > 6 && (
                        <span className="text-xs text-gray-400">+{r.yetkiAnahtarlari.length - 6} daha</span>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <button onClick={() => { setDuzenlenecek(r); setFormAcik(true) }}
                      className="rounded-lg border border-gray-300 px-2 py-1 text-xs text-gray-600 hover:bg-gray-50">
                      Düzenle
                    </button>
                    <button onClick={() => sil(r.id, r.ad)}
                      className="rounded-lg border border-red-200 px-2 py-1 text-xs text-red-600 hover:bg-red-50">
                      Sil
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {formAcik && (
        <RolFormu
          mevcut={duzenlenecek}
          tumYetkiler={tumYetkiler}
          onKaydet={() => { setFormAcik(false); setDuzenlenecek(undefined); getir() }}
          onKapat={() => { setFormAcik(false); setDuzenlenecek(undefined) }}
        />
      )}
    </div>
  )
}
