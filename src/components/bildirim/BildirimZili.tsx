'use client'

import { useState, useEffect, useRef } from 'react'

type Bildirim = {
  id: string
  tip: string
  baslik: string
  mesaj: string
  oncelik: 'yuksek' | 'orta' | 'bilgi'
  okundu: boolean
  ilgiliModul: string | null
  ilgiliKayitId: string | null
  olusturmaTarihi: string
}

function zamanOnce(tarih: Date): string {
  const fark = Date.now() - new Date(tarih).getTime()
  const dakika = Math.floor(fark / 60000)
  if (dakika < 1) return 'az önce'
  if (dakika < 60) return `${dakika} dakika önce`
  const saat = Math.floor(dakika / 60)
  if (saat < 24) return `${saat} saat önce`
  return `${Math.floor(saat / 24)} gün önce`
}

const oncelikRenk: Record<string, string> = {
  yuksek: 'bg-red-100 text-red-700',
  orta: 'bg-yellow-100 text-yellow-700',
  bilgi: 'bg-green-100 text-green-700',
}

const oncelikEtiket: Record<string, string> = {
  yuksek: 'Yüksek',
  orta: 'Orta',
  bilgi: 'Bilgi',
}

export default function BildirimZili() {
  const [bildirimler, setBildirimler] = useState<Bildirim[]>([])
  const [okunmamisSayisi, setOkunmamisSayisi] = useState(0)
  const [acik, setAcik] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  async function bildirimleriGetir() {
    try {
      const yanit = await fetch('/api/bildirimler')
      const veri = await yanit.json()
      setBildirimler(veri.bildirimler ?? [])
      setOkunmamisSayisi(veri.okunmamisSayisi ?? 0)
    } catch {
      // sessiz hata
    }
  }

  useEffect(() => {
    bildirimleriGetir()
    const aralik = setInterval(bildirimleriGetir, 60000)
    return () => clearInterval(aralik)
  }, [])

  useEffect(() => {
    function disaraTikla(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setAcik(false)
      }
    }
    if (acik) document.addEventListener('mousedown', disaraTikla)
    return () => document.removeEventListener('mousedown', disaraTikla)
  }, [acik])

  async function tumunuOku() {
    try {
      await fetch('/api/bildirimler/tumunu-oku', { method: 'PATCH' })
      await bildirimleriGetir()
    } catch {
      // sessiz hata
    }
  }

  async function okunduIsaretle(id: string) {
    try {
      await fetch(`/api/bildirimler/${id}/oku`, { method: 'PATCH' })
      await bildirimleriGetir()
    } catch {
      // sessiz hata
    }
  }

  const goruntulenecek = bildirimler.slice(0, 10)

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setAcik((v) => !v)}
        className="relative flex h-9 w-9 items-center justify-center rounded-full text-gray-500 transition hover:bg-gray-100"
        title="Bildirimler"
      >
        <span className="text-lg">🔔</span>
        {okunmamisSayisi > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
            {okunmamisSayisi > 9 ? '9+' : okunmamisSayisi}
          </span>
        )}
      </button>

      {acik && (
        <div className="absolute right-0 top-11 z-50 w-80 rounded-xl border border-gray-200 bg-white shadow-lg">
          <div className="flex items-center justify-between border-b px-4 py-3">
            <span className="text-sm font-semibold text-gray-700">
              Bildirimler
              {okunmamisSayisi > 0 && (
                <span className="ml-1.5 rounded-full bg-red-100 px-1.5 py-0.5 text-xs text-red-600">
                  {okunmamisSayisi}
                </span>
              )}
            </span>
            {okunmamisSayisi > 0 && (
              <button
                onClick={tumunuOku}
                className="text-xs text-blue-600 hover:text-blue-800"
              >
                Tümünü Okundu İşaretle
              </button>
            )}
          </div>

          <div className="max-h-96 overflow-y-auto">
            {goruntulenecek.length === 0 ? (
              <div className="py-8 text-center text-sm text-gray-400">Bildirim yok</div>
            ) : (
              goruntulenecek.map((b) => (
                <div
                  key={b.id}
                  className={`border-b px-4 py-3 transition-colors ${b.okundu ? 'bg-white' : 'bg-blue-50'}`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span
                          className={`inline-flex rounded-full px-1.5 py-0.5 text-[10px] font-semibold ${oncelikRenk[b.oncelik]}`}
                        >
                          {oncelikEtiket[b.oncelik]}
                        </span>
                      </div>
                      <p className="text-xs font-semibold text-gray-700 truncate">{b.baslik}</p>
                      <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{b.mesaj}</p>
                      <p className="text-[10px] text-gray-400 mt-1">
                        {zamanOnce(new Date(b.olusturmaTarihi))}
                      </p>
                    </div>
                    {!b.okundu && (
                      <button
                        onClick={() => okunduIsaretle(b.id)}
                        className="shrink-0 rounded px-1.5 py-1 text-[10px] text-blue-600 hover:bg-blue-100"
                        title="Okundu işaretle"
                      >
                        ✓
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>

          {bildirimler.length > 10 && (
            <div className="border-t px-4 py-2 text-center">
              <a href="/bildirimler" className="text-xs text-blue-600 hover:underline">
                Tümünü gör ({bildirimler.length})
              </a>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
