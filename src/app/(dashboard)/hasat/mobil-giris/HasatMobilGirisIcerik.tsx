'use client'
import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useOfflineSenkron } from '@/hooks/useOfflineSenkron'

interface Tarla { id: string; tarlaAdi: string; konumKoy: string }
interface Surgun { id: string; surgunAdi: string; hasatDonemiId: string }
interface IsciEkibi { id: string; ekipAdi: string }
interface Musteri { id: string; musteriAdi: string }

export default function HasatMobilGirisIcerik() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { cevrimici, kuyrugaEkle, referansCacheKaydet, referansCacheGetir } = useOfflineSenkron()

  const [tarlalar, setTarlalar] = useState<Tarla[]>([])
  const [surgunler, setSurgunler] = useState<Surgun[]>([])
  const [ekipler, setEkipler] = useState<IsciEkibi[]>([])
  const [musteriler, setMusteriler] = useState<Musteri[]>([])

  const [tarlaId, setTarlaId] = useState(searchParams.get('tarla_id') || '')
  const [surgunId, setSurgunId] = useState('')
  const [tartimMiktariKg, setTartimMiktariKg] = useState('')
  const [musteriId, setMusteriId] = useState('')
  const [toplanmaTuru, setToplanmaTuru] = useState<'tarla_sahibi' | 'isci'>('tarla_sahibi')
  const [isciEkipId, setIsciEkipId] = useState('')
  const [odemeTuru, setOdemeTuru] = useState<'yevmiye' | 'ton_isi'>('yevmiye')
  const [fiyat, setFiyat] = useState('')
  const [gonderiyor, setGonderiyor] = useState(false)

  useEffect(() => {
    async function veriYukle() {
      // Tarlalar
      const cachedTarlalar = referansCacheGetir<Tarla[]>('tarlalar')
      if (cachedTarlalar) {
        setTarlalar(cachedTarlalar)
      } else {
        try {
          const yanit = await fetch('/api/tarlalar')
          if (yanit.ok) {
            const veri = await yanit.json()
            setTarlalar(veri)
            referansCacheKaydet('tarlalar', veri)
          }
        } catch { /* çevrimdışı, cache yok */ }
      }

      // Sürgünler
      const cachedSurgunler = referansCacheGetir<Surgun[]>('surgunler')
      if (cachedSurgunler) {
        setSurgunler(cachedSurgunler)
      } else {
        try {
          const yanit = await fetch('/api/surgunler')
          if (yanit.ok) {
            const veri = await yanit.json()
            setSurgunler(veri)
            referansCacheKaydet('surgunler', veri)
          }
        } catch { /* çevrimdışı, cache yok */ }
      }

      // İşçi ekipleri
      const cachedEkipler = referansCacheGetir<IsciEkibi[]>('isci-ekipleri')
      if (cachedEkipler) {
        setEkipler(cachedEkipler)
      } else {
        try {
          const yanit = await fetch('/api/isci-ekipleri')
          if (yanit.ok) {
            const veri = await yanit.json()
            setEkipler(veri)
            referansCacheKaydet('isci-ekipleri', veri)
          }
        } catch { /* çevrimdışı, cache yok */ }
      }

      // Müşteriler
      const cachedMusteriler = referansCacheGetir<Musteri[]>('musteriler')
      if (cachedMusteriler) {
        setMusteriler(cachedMusteriler)
      } else {
        try {
          const yanit = await fetch('/api/musteriler')
          if (yanit.ok) {
            const veri = await yanit.json()
            setMusteriler(veri)
            referansCacheKaydet('musteriler', veri)
          }
        } catch { /* çevrimdışı, cache yok */ }
      }
    }

    veriYukle()
  }, [referansCacheGetir, referansCacheKaydet])

  function formuTemizle() {
    setTarlaId('')
    setSurgunId('')
    setTartimMiktariKg('')
    setMusteriId('')
    setToplanmaTuru('tarla_sahibi')
    setIsciEkipId('')
    setOdemeTuru('yevmiye')
    setFiyat('')
  }

  async function gonder() {
    if (!tarlaId || !surgunId || !tartimMiktariKg) {
      alert('Lütfen tarla, sürgün ve tartım miktarını girin.')
      return
    }

    const veri: Record<string, unknown> = {
      surgunId,
      tarlaId,
      tartimMiktariKg: parseFloat(tartimMiktariKg),
      satisMiktariKg: parseFloat(tartimMiktariKg),
      musteriId: musteriId || undefined,
      toplanmaTuru,
      ...(toplanmaTuru === 'isci' && {
        isciEkipId: isciEkipId || undefined,
        odemeTuru,
        fiyat: fiyat ? parseFloat(fiyat) : undefined,
      }),
    }

    setGonderiyor(true)
    try {
      if (cevrimici) {
        const yanit = await fetch('/api/hasat-girisleri', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(veri),
        })
        if (yanit.ok) {
          alert('Kaydedildi!')
          router.push('/hasat')
        } else {
          alert('Hata! Çevrimdışı kuyruğuna eklendi')
          kuyrugaEkle('hasat_girisi', veri)
          formuTemizle()
        }
      } else {
        kuyrugaEkle('hasat_girisi', veri)
        alert('Çevrimdışı. Bağlantı kurulunca otomatik gönderilecek.')
        formuTemizle()
      }
    } catch {
      kuyrugaEkle('hasat_girisi', veri)
      alert('Bağlantı hatası. Çevrimdışı kuyruğuna eklendi.')
      formuTemizle()
    } finally {
      setGonderiyor(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-28">
      {/* Başlık */}
      <div className="bg-green-600 px-4 py-4 text-white flex items-center gap-2">
        <button
          onClick={() => router.back()}
          className="text-white text-xl font-bold px-1"
          aria-label="Geri"
        >
          ←
        </button>
        <h1 className="text-lg font-semibold">Hasat Girişi</h1>
        {!cevrimici && (
          <span className="ml-auto text-xs bg-red-500 rounded px-2 py-0.5">Çevrimdışı</span>
        )}
      </div>

      <div className="p-4 space-y-4">
        {/* Tarla */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Tarla *</label>
          <select
            value={tarlaId}
            onChange={e => setTarlaId(e.target.value)}
            className="text-base p-3 rounded-xl border-2 border-gray-300 w-full focus:border-green-500 focus:outline-none bg-white"
          >
            <option value="">Tarla Seçin</option>
            {tarlalar.map(t => (
              <option key={t.id} value={t.id}>
                {t.tarlaAdi} — {t.konumKoy}
              </option>
            ))}
          </select>
        </div>

        {/* Sürgün */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Sürgün *</label>
          <select
            value={surgunId}
            onChange={e => setSurgunId(e.target.value)}
            className="text-base p-3 rounded-xl border-2 border-gray-300 w-full focus:border-green-500 focus:outline-none bg-white"
          >
            <option value="">Sürgün Seçin</option>
            {surgunler.map(s => (
              <option key={s.id} value={s.id}>
                {s.surgunAdi}
              </option>
            ))}
          </select>
        </div>

        {/* Tartım Miktarı */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Tartım Miktarı (kg) *</label>
          <input
            type="number"
            inputMode="decimal"
            step="0.01"
            min="0"
            value={tartimMiktariKg}
            onChange={e => setTartimMiktariKg(e.target.value)}
            placeholder="0.00"
            className="text-base p-3 rounded-xl border-2 border-gray-300 w-full focus:border-green-500 focus:outline-none"
          />
        </div>

        {/* Müşteri */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Müşteri</label>
          <select
            value={musteriId}
            onChange={e => setMusteriId(e.target.value)}
            className="text-base p-3 rounded-xl border-2 border-gray-300 w-full focus:border-green-500 focus:outline-none bg-white"
          >
            <option value="">Müşteri Seçin (opsiyonel)</option>
            {musteriler.map(m => (
              <option key={m.id} value={m.id}>
                {m.musteriAdi}
              </option>
            ))}
          </select>
        </div>

        {/* Toplanma Türü */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Toplanma Türü *</label>
          <div className="flex gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                value="tarla_sahibi"
                checked={toplanmaTuru === 'tarla_sahibi'}
                onChange={() => setToplanmaTuru('tarla_sahibi')}
                className="w-5 h-5 accent-green-600"
              />
              <span className="text-base">Tarla Sahibi</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                value="isci"
                checked={toplanmaTuru === 'isci'}
                onChange={() => setToplanmaTuru('isci')}
                className="w-5 h-5 accent-green-600"
              />
              <span className="text-base">İşçi</span>
            </label>
          </div>
        </div>

        {/* İşçi Detayları */}
        {toplanmaTuru === 'isci' && (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">İşçi Ekibi</label>
              <select
                value={isciEkipId}
                onChange={e => setIsciEkipId(e.target.value)}
                className="text-base p-3 rounded-xl border-2 border-gray-300 w-full focus:border-green-500 focus:outline-none bg-white"
              >
                <option value="">Ekip Seçin</option>
                {ekipler.map(e => (
                  <option key={e.id} value={e.id}>
                    {e.ekipAdi}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Ödeme Türü</label>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    value="yevmiye"
                    checked={odemeTuru === 'yevmiye'}
                    onChange={() => setOdemeTuru('yevmiye')}
                    className="w-5 h-5 accent-green-600"
                  />
                  <span className="text-base">Yevmiye</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    value="ton_isi"
                    checked={odemeTuru === 'ton_isi'}
                    onChange={() => setOdemeTuru('ton_isi')}
                    className="w-5 h-5 accent-green-600"
                  />
                  <span className="text-base">Ton İşi</span>
                </label>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Fiyat ({odemeTuru === 'yevmiye' ? '₺/gün' : '₺/ton'})
              </label>
              <input
                type="number"
                inputMode="decimal"
                step="0.01"
                min="0"
                value={fiyat}
                onChange={e => setFiyat(e.target.value)}
                placeholder="0.00"
                className="text-base p-3 rounded-xl border-2 border-gray-300 w-full focus:border-green-500 focus:outline-none"
              />
            </div>
          </>
        )}
      </div>

      {/* Gönder Butonu — fixed bottom */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t shadow-lg">
        <button
          onClick={gonder}
          disabled={gonderiyor}
          className="w-full bg-green-600 text-white py-4 rounded-2xl text-lg font-bold disabled:opacity-60 active:bg-green-700 transition-colors"
        >
          {gonderiyor
            ? 'Kaydediliyor...'
            : cevrimici
              ? 'Kaydet'
              : '📥 Kuyruğa Ekle'}
        </button>
      </div>
    </div>
  )
}
