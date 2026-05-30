'use client'
import { useEffect, useState, useCallback } from 'react'

// IndexedDB yerine localStorage kullan (basit, Capacitor Storage uyumlu)
const KUYRUK_ANAHTARI = 'tarimcrm_offline_kuyruk'
const CACHE_ANAHTARI = 'tarimcrm_referans_cache'

export type OfflineTip =
  | 'hasat_girisi'
  | 'stok_hareketi'
  | 'ekipman_gider'
  | 'ekipman_gelir'
  | 'odeme_kaydi'

export interface OfflineGiris {
  id: string          // geçici uuid
  tip: OfflineTip
  ekipmanId?: string  // ekipman_gider / ekipman_gelir için
  veri: Record<string, unknown>
  olusturmaTarihi: string
}

export function useOfflineSenkron() {
  const [cevrimici, setCevrimici] = useState(true)
  const [senkronIsleniyor, setSenkronIsleniyor] = useState(false)
  const [kuyrukSayisi, setKuyrukSayisi] = useState(0)

  useEffect(() => {
    function guncelle() { setCevrimici(navigator.onLine) }
    window.addEventListener('online', guncelle)
    window.addEventListener('offline', guncelle)
    setCevrimici(navigator.onLine)
    return () => { window.removeEventListener('online', guncelle); window.removeEventListener('offline', guncelle) }
  }, [])

  const kuyrukGetir = useCallback((): OfflineGiris[] => {
    try { return JSON.parse(localStorage.getItem(KUYRUK_ANAHTARI) || '[]') } catch { return [] }
  }, [])

  const kuyrukGuncelle = useCallback((kuyruk: OfflineGiris[]) => {
    localStorage.setItem(KUYRUK_ANAHTARI, JSON.stringify(kuyruk))
    setKuyrukSayisi(kuyruk.length)
  }, [])

  useEffect(() => {
    setKuyrukSayisi(kuyrukGetir().length)
  }, [kuyrukGetir])

  const kuyrugaEkle = useCallback((tip: OfflineTip, veri: Record<string, unknown>, ekipmanId?: string) => {
    const kuyruk = kuyrukGetir()
    const yeni: OfflineGiris = {
      id: `offline_${Date.now()}_${Math.random().toString(36).slice(2)}`,
      tip,
      ekipmanId,
      veri,
      olusturmaTarihi: new Date().toISOString(),
    }
    kuyrukGuncelle([...kuyruk, yeni])
    return yeni.id
  }, [kuyrukGetir, kuyrukGuncelle])

  const senkronEt = useCallback(async () => {
    if (!cevrimici || senkronIsleniyor) return
    const kuyruk = kuyrukGetir()
    if (kuyruk.length === 0) return

    setSenkronIsleniyor(true)
    const basarili: string[] = []

    for (const giris of kuyruk) {
      try {
        let url: string
        switch (giris.tip) {
          case 'hasat_girisi':    url = '/api/hasat-girisleri'; break
          case 'stok_hareketi':   url = '/api/stok-hareketleri'; break
          case 'ekipman_gider':   url = `/api/ekipmanlar/${giris.ekipmanId}/giderler`; break
          case 'ekipman_gelir':   url = `/api/ekipmanlar/${giris.ekipmanId}/gelirler`; break
          case 'odeme_kaydi':     url = '/api/odeme-kayitlari'; break
          default:                continue
        }
        const yanit = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(giris.veri),
        })
        if (yanit.ok) basarili.push(giris.id)
      } catch { /* bağlantı hatası, sonra dene */ }
    }

    const kalanKuyruk = kuyruk.filter(g => !basarili.includes(g.id))
    kuyrukGuncelle(kalanKuyruk)
    setSenkronIsleniyor(false)
  }, [cevrimici, senkronIsleniyor, kuyrukGetir, kuyrukGuncelle])

  // Online olunca otomatik senkron
  useEffect(() => {
    if (cevrimici) senkronEt()
  }, [cevrimici, senkronEt])

  // Referans verileri cache
  const referansCacheKaydet = useCallback((anahtar: string, veri: unknown) => {
    try {
      const mevcut = JSON.parse(localStorage.getItem(CACHE_ANAHTARI) || '{}')
      mevcut[anahtar] = { veri, tarih: Date.now() }
      localStorage.setItem(CACHE_ANAHTARI, JSON.stringify(mevcut))
    } catch { /* localStorage dolu olabilir */ }
  }, [])

  const referansCacheGetir = useCallback(<T>(anahtar: string): T | null => {
    try {
      const mevcut = JSON.parse(localStorage.getItem(CACHE_ANAHTARI) || '{}')
      const kayit = mevcut[anahtar]
      if (!kayit) return null
      // 1 saat cache
      if (Date.now() - kayit.tarih > 3600000) return null
      return kayit.veri as T
    } catch { return null }
  }, [])

  return {
    cevrimici,
    kuyrukSayisi,
    senkronIsleniyor,
    kuyrugaEkle,
    senkronEt,
    referansCacheKaydet,
    referansCacheGetir,
  }
}
