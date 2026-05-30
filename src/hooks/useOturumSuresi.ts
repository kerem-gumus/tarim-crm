'use client'

import { useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

// Hareketsizlik süresi (ms) — varsayılan 8 saat
const HAREKETSIZLIK_SURESI_MS = 8 * 60 * 60 * 1000 // 8 saat
// Uyarı ne kadar önce gösterilsin (ms)
const UYARI_ONCESI_MS = 5 * 60 * 1000 // 5 dakika önce

const AKTIVITE_OLAYLARI = ['mousedown', 'keydown', 'touchstart', 'scroll', 'click']
const SON_AKTIVITE_ANAHTARI = 'tarimcrm_son_aktivite'

export function useOturumSuresi() {
  const yonlendirici = useRouter()
  const zamanlayici = useRef<ReturnType<typeof setTimeout> | null>(null)
  const uyariZamanlayici = useRef<ReturnType<typeof setTimeout> | null>(null)

  const temizle = useCallback(() => {
    if (zamanlayici.current) clearTimeout(zamanlayici.current)
    if (uyariZamanlayici.current) clearTimeout(uyariZamanlayici.current)
  }, [])

  const otomatikCikis = useCallback(async () => {
    temizle()
    await supabase.auth.signOut()
    localStorage.removeItem(SON_AKTIVITE_ANAHTARI)
    yonlendirici.push('/login?sebep=oturum_suresi_doldu')
  }, [temizle, yonlendirici])

  const zamanlayiciKur = useCallback(() => {
    temizle()

    // Hareketsizlik sonrası otomatik çıkış
    zamanlayici.current = setTimeout(() => {
      otomatikCikis()
    }, HAREKETSIZLIK_SURESI_MS)

    // Uyarı (5 dk önce)
    if (HAREKETSIZLIK_SURESI_MS > UYARI_ONCESI_MS) {
      uyariZamanlayici.current = setTimeout(() => {
        // Küçük bir bildirim göster (console'a da yaz)
        if (typeof window !== 'undefined') {
          const devam = window.confirm(
            'Oturumunuz 5 dakika içinde kapanacak. Devam etmek istiyor musunuz?'
          )
          if (!devam) otomatikCikis()
          else {
            // Kullanıcı "Evet" dedi — zamanlayıcıyı sıfırla
            localStorage.setItem(SON_AKTIVITE_ANAHTARI, Date.now().toString())
            zamanlayiciKur()
          }
        }
      }, HAREKETSIZLIK_SURESI_MS - UYARI_ONCESI_MS)
    }
  }, [temizle, otomatikCikis])

  const aktiviteKaydet = useCallback(() => {
    localStorage.setItem(SON_AKTIVITE_ANAHTARI, Date.now().toString())
    zamanlayiciKur()
  }, [zamanlayiciKur])

  useEffect(() => {
    // Sayfa yüklendiğinde önceki aktivite zamanını kontrol et
    const sonAktivite = localStorage.getItem(SON_AKTIVITE_ANAHTARI)
    if (sonAktivite) {
      const gecenSure = Date.now() - parseInt(sonAktivite)
      if (gecenSure >= HAREKETSIZLIK_SURESI_MS) {
        // Daha önce oturum açılmış ama çok uzun süre geçmiş — çıkış yap
        otomatikCikis()
        return
      }
    }

    // İlk aktiviteyi kaydet
    localStorage.setItem(SON_AKTIVITE_ANAHTARI, Date.now().toString())
    zamanlayiciKur()

    // Kullanıcı aktivitelerini dinle
    AKTIVITE_OLAYLARI.forEach((olay) => {
      window.addEventListener(olay, aktiviteKaydet, { passive: true })
    })

    // Supabase token yenileme — her 55 dakikada bir (1 saatlik JWT için)
    const tokenYenileme = setInterval(async () => {
      const { error } = await supabase.auth.refreshSession()
      if (error) {
        // Token yenilenemedi — oturumu sonlandır
        otomatikCikis()
      }
    }, 55 * 60 * 1000)

    return () => {
      temizle()
      clearInterval(tokenYenileme)
      AKTIVITE_OLAYLARI.forEach((olay) => {
        window.removeEventListener(olay, aktiviteKaydet)
      })
    }
  }, [zamanlayiciKur, aktiviteKaydet, temizle, otomatikCikis])
}
