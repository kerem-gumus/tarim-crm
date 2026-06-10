'use client'
import { useEffect, useState } from 'react'

interface Tarla {
  id: string
  tarlaAdi: string
  konumIlce: string
}

interface CayKalite {
  id: string
  tarih: string
  tarlaId: string | null
  toplamaYontemi: string
  agirlikKg: number | string
  yaprakNotu: number
  nemOrani: number | null
  fizikselHata: number | null
  renk: string | null
  koku: string | null
  genelNot: number
  havaScaklik: number | null
  havaNem: number | null
  notlar: string | null
}

interface Props {
  seciliKayit: CayKalite | null
  onKapat: () => void
  onKaydet: () => void
}

const NOT_ETIKETLERI: Record<number, string> = {
  1: '1 - Çok Kötü',
  2: '2 - Kötü',
  3: '3 - Orta',
  4: '4 - İyi',
  5: '5 - Mükemmel',
}

export default function CayKaliteFormu({ seciliKayit, onKapat, onKaydet }: Props) {
  const [tarlalar, setTarlalar] = useState<Tarla[]>([])
  const [kaydediliyor, setKaydediliyor] = useState(false)
  const [hata, setHata] = useState('')

  // AI foto analizi
  const [fotoAnalizi, setFotoAnalizi] = useState(false)
  const [fotoAciklama, setFotoAciklama] = useState('')

  const [tarih, setTarih] = useState(new Date().toISOString().split('T')[0])
  const [tarlaId, setTarlaId] = useState('')
  const [toplamaYontemi, setToplamaYontemi] = useState('elle')
  const [agirlikKg, setAgirlikKg] = useState('')
  const [yaprakNotu, setYaprakNotu] = useState(3)
  const [nemOrani, setNemOrani] = useState('')
  const [fizikselHata, setFizikselHata] = useState('')
  const [renk, setRenk] = useState('')
  const [koku, setKoku] = useState('')
  const [genelNot, setGenelNot] = useState(3)
  const [havaScaklik, setHavaScaklik] = useState('')
  const [havaNem, setHavaNem] = useState('')
  const [notlar, setNotlar] = useState('')

  useEffect(() => {
    fetch('/api/tarlalar')
      .then((r) => r.json())
      .then((v) => setTarlalar(Array.isArray(v) ? v : []))
  }, [])

  // Bugünün hava durumunu otomatik doldur
  useEffect(() => {
    if (!seciliKayit) {
      fetch('/api/hava-durumu/bugun')
        .then((r) => r.json())
        .then((v) => {
          if (v.sicaklikOrtalama) setHavaScaklik(String(Math.round(v.sicaklikOrtalama * 10) / 10))
          if (v.nemOrani) setHavaNem(String(Math.round(v.nemOrani * 10) / 10))
        })
        .catch(() => {})
    }
  }, [seciliKayit])

  useEffect(() => {
    if (seciliKayit) {
      setTarih(seciliKayit.tarih.split('T')[0])
      setTarlaId(seciliKayit.tarlaId ?? '')
      setToplamaYontemi(seciliKayit.toplamaYontemi)
      setAgirlikKg(String(seciliKayit.agirlikKg))
      setYaprakNotu(seciliKayit.yaprakNotu)
      setNemOrani(seciliKayit.nemOrani != null ? String(seciliKayit.nemOrani) : '')
      setFizikselHata(seciliKayit.fizikselHata != null ? String(seciliKayit.fizikselHata) : '')
      setRenk(seciliKayit.renk ?? '')
      setKoku(seciliKayit.koku ?? '')
      setGenelNot(seciliKayit.genelNot)
      setHavaScaklik(seciliKayit.havaScaklik != null ? String(seciliKayit.havaScaklik) : '')
      setHavaNem(seciliKayit.havaNem != null ? String(seciliKayit.havaNem) : '')
      setNotlar(seciliKayit.notlar ?? '')
    }
  }, [seciliKayit])

  async function fotoAnaliz(e: React.ChangeEvent<HTMLInputElement>) {
    const dosya = e.target.files?.[0]
    if (!dosya) return
    setFotoAnalizi(true)
    setFotoAciklama('')
    setHata('')
    try {
      const fd = new FormData()
      fd.append('foto', dosya)
      const yanit = await fetch('/api/cay-kalite/ai-analiz', { method: 'POST', body: fd })
      const veri = await yanit.json()
      if (!yanit.ok) { setHata(veri.hata ?? 'AI analiz başarısız'); return }
      const { oneri, aciklama } = veri
      if (oneri.yaprakNotu) setYaprakNotu(oneri.yaprakNotu)
      if (oneri.genelNot) setGenelNot(oneri.genelNot)
      if (oneri.renk) setRenk(oneri.renk)
      if (oneri.koku) setKoku(oneri.koku)
      if (oneri.fizikselHata != null) setFizikselHata(String(oneri.fizikselHata))
      if (oneri.nemOrani != null) setNemOrani(String(oneri.nemOrani))
      setFotoAciklama(aciklama ?? '')
    } catch { setHata('Fotoğraf analiz hatası') }
    finally { setFotoAnalizi(false) }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setHata('')
    setKaydediliyor(true)
    try {
      const url = seciliKayit ? `/api/cay-kalite/${seciliKayit.id}` : '/api/cay-kalite'
      const method = seciliKayit ? 'PUT' : 'POST'
      const yanit = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tarih,
          tarlaId: tarlaId || null,
          toplamaYontemi,
          agirlikKg: parseFloat(agirlikKg),
          yaprakNotu,
          nemOrani: nemOrani ? parseFloat(nemOrani) : null,
          fizikselHata: fizikselHata ? parseFloat(fizikselHata) : null,
          renk: renk || null,
          koku: koku || null,
          genelNot,
          havaScaklik: havaScaklik ? parseFloat(havaScaklik) : null,
          havaNem: havaNem ? parseFloat(havaNem) : null,
          notlar: notlar || null,
        }),
      })
      const veri = await yanit.json()
      if (!yanit.ok) { setHata(veri.hata); return }
      onKaydet()
    } catch {
      setHata('Bir hata oluştu')
    } finally {
      setKaydediliyor(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b px-6 py-4">
          <h2 className="text-base font-semibold text-gray-800">
            {seciliKayit ? 'Kalite Kaydını Düzenle' : 'Yeni Kalite Kaydı'}
          </h2>
          <button onClick={onKapat} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {hata && (
            <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-2 text-sm text-red-700">{hata}</div>
          )}

          {/* AI Fotoğraf Analizi */}
          {!seciliKayit && (
            <div className="rounded-xl border border-green-200 bg-green-50 p-4 space-y-2">
              <p className="text-xs font-semibold text-green-800 uppercase tracking-wide">
                🤖 AI Fotoğraf Analizi (Opsiyonel)
              </p>
              <p className="text-xs text-green-700">
                Çay yaprağı fotoğrafı yükleyin — AI formu otomatik doldurmaya çalışır.
              </p>
              <div className="flex items-center gap-3">
                <label className="relative cursor-pointer">
                  <input
                    type="file"
                    accept="image/*"
                    capture="environment"
                    className="absolute inset-0 opacity-0 w-full cursor-pointer"
                    onChange={fotoAnaliz}
                    disabled={fotoAnalizi}
                  />
                  <span className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium border ${fotoAnalizi ? 'bg-gray-100 text-gray-400 border-gray-200' : 'bg-white text-green-700 border-green-300 hover:bg-green-50'}`}>
                    {fotoAnalizi ? '⏳ Analiz ediliyor...' : '📷 Fotoğraf Seç / Çek'}
                  </span>
                </label>
                {fotoAciklama && (
                  <p className="text-xs text-green-700 flex-1">{fotoAciklama}</p>
                )}
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Tarih *</label>
              <input
                type="date"
                value={tarih}
                onChange={(e) => setTarih(e.target.value)}
                required
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Tarla</label>
              <select
                value={tarlaId}
                onChange={(e) => setTarlaId(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                <option value="">— Tarla seçin —</option>
                {tarlalar.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.tarlaAdi} ({t.konumIlce})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Toplama Yöntemi</label>
              <select
                value={toplamaYontemi}
                onChange={(e) => setToplamaYontemi(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                <option value="elle">Elle toplama</option>
                <option value="makine">Makine</option>
                <option value="karma">Karma</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Ağırlık (kg) *</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={agirlikKg}
                onChange={(e) => setAgirlikKg(e.target.value)}
                required
                placeholder="Örn: 250.50"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
          </div>

          {/* Notlar */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Yaprak Notu (1-5) *</label>
              <select
                value={yaprakNotu}
                onChange={(e) => setYaprakNotu(Number(e.target.value))}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                {[1, 2, 3, 4, 5].map((n) => (
                  <option key={n} value={n}>{NOT_ETIKETLERI[n]}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Genel Not (1-5) *</label>
              <select
                value={genelNot}
                onChange={(e) => setGenelNot(Number(e.target.value))}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                {[1, 2, 3, 4, 5].map((n) => (
                  <option key={n} value={n}>{NOT_ETIKETLERI[n]}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Nem Oranı (%)</label>
              <input
                type="number"
                step="0.1"
                min="0"
                max="100"
                value={nemOrani}
                onChange={(e) => setNemOrani(e.target.value)}
                placeholder="Örn: 75.5"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Fiziksel Hata (%)</label>
              <input
                type="number"
                step="0.1"
                min="0"
                max="100"
                value={fizikselHata}
                onChange={(e) => setFizikselHata(e.target.value)}
                placeholder="Örn: 3.2"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Renk Değerlendirmesi</label>
              <input
                type="text"
                value={renk}
                onChange={(e) => setRenk(e.target.value)}
                placeholder="Örn: Parlak yeşil, soluk"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Koku Değerlendirmesi</label>
              <input
                type="text"
                value={koku}
                onChange={(e) => setKoku(e.target.value)}
                placeholder="Örn: Taze, aromatik"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
          </div>

          {/* Hava bilgisi */}
          <div className="rounded-lg bg-blue-50 border border-blue-100 p-3">
            <p className="text-xs font-semibold text-blue-700 mb-2">Hava Durumu (Otomatik dolduruldu)</p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Sıcaklık (°C)</label>
                <input
                  type="number"
                  step="0.1"
                  value={havaScaklik}
                  onChange={(e) => setHavaScaklik(e.target.value)}
                  placeholder="Örn: 18.5"
                  className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Hava Nem (%)</label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  max="100"
                  value={havaNem}
                  onChange={(e) => setHavaNem(e.target.value)}
                  placeholder="Örn: 82.0"
                  className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Notlar</label>
            <textarea
              value={notlar}
              onChange={(e) => setNotlar(e.target.value)}
              rows={3}
              placeholder="Gözlem notları..."
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 resize-none"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onKapat}
              className="flex-1 rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              İptal
            </button>
            <button
              type="submit"
              disabled={kaydediliyor}
              className="flex-1 rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-60"
            >
              {kaydediliyor ? 'Kaydediliyor...' : seciliKayit ? 'Güncelle' : 'Kaydet'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
