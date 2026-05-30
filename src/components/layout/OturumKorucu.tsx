'use client'

import { useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

// sessionStorage anahtarı — tarayıcı kapanınca otomatik silinir
const TARAYICI_OTURUM_ANAHTARI = 'tarimcrm_tarayici_aktif'
const SON_AKTIVITE_ANAHTARI = 'tarimcrm_son_aktivite'
const HAREKETSIZLIK_MS = 8 * 60 * 60 * 1000 // 8 saat

export default function OturumKorucu({ children }: { children: React.ReactNode }) {
  const yonlendirici = useRouter()
  const zamanlayici = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    async function oturumKontrol() {
      const { data: { session } } = await supabase.auth.getSession()

      // Oturum yoksa zaten middleware login'e yönlendirdi, bir şey yapma
      if (!session) return

      // Tarayıcı oturum flag'i var mı?
      const tarayiciAktif = sessionStorage.getItem(TARAYICI_OTURUM_ANAHTARI)

      if (!tarayiciAktif) {
        // Tarayıcı kapatılıp yeniden açılmış — Supabase oturumu kalıcı kalmış
        // Güvenlik gereği çıkış yap
        await supabase.auth.signOut()
        sessionStorage.removeItem(TARAYICI_OTURUM_ANAHTARI)
        localStorage.removeItem(SON_AKTIVITE_ANAHTARI)
        yonlendirici.replace('/login')
        return
      }

      // Hareketsizlik kontrolü
      const sonAktivite = localStorage.getItem(SON_AKTIVITE_ANAHTARI)
      if (sonAktivite) {
        const gecenSure = Date.now() - parseInt(sonAktivite)
        if (gecenSure >= HAREKETSIZLIK_MS) {
          await supabase.auth.signOut()
          sessionStorage.removeItem(TARAYICI_OTURUM_ANAHTARI)
          localStorage.removeItem(SON_AKTIVITE_ANAHTARI)
          yonlendirici.replace('/login?sebep=oturum_suresi_doldu')
          return
        }
      }

      // Her şey yolunda — aktivite zamanını güncelle
      localStorage.setItem(SON_AKTIVITE_ANAHTARI, Date.now().toString())
    }

    oturumKontrol()
  }, [yonlendirici])

  useEffect(() => {
    // Tarayıcı oturum flag'ini kur (tarayıcı kapanınca silinir)
    sessionStorage.setItem(TARAYICI_OTURUM_ANAHTARI, '1')

    // Kullanıcı aktivitesini takip et
    const aktiviteKaydet = () => {
      localStorage.setItem(SON_AKTIVITE_ANAHTARI, Date.now().toString())
    }

    const OLAYLAR = ['mousedown', 'keydown', 'touchstart', 'scroll']
    OLAYLAR.forEach((o) => window.addEventListener(o, aktiviteKaydet, { passive: true }))

    // Hareketsizlik zamanlayıcısı
    function zamanlayiciKur() {
      if (zamanlayici.current) clearTimeout(zamanlayici.current)
      zamanlayici.current = setTimeout(async () => {
        await supabase.auth.signOut()
        sessionStorage.removeItem(TARAYICI_OTURUM_ANAHTARI)
        localStorage.removeItem(SON_AKTIVITE_ANAHTARI)
        yonlendirici.replace('/login?sebep=oturum_suresi_doldu')
      }, HAREKETSIZLIK_MS)
    }

    zamanlayiciKur()
    window.addEventListener('mousedown', zamanlayiciKur, { passive: true })
    window.addEventListener('keydown', zamanlayiciKur, { passive: true })
    window.addEventListener('touchstart', zamanlayiciKur, { passive: true })

    // Token yenileme (55 dakikada bir)
    const tokenYenileme = setInterval(async () => {
      const { error } = await supabase.auth.refreshSession()
      if (error) {
        sessionStorage.removeItem(TARAYICI_OTURUM_ANAHTARI)
        await supabase.auth.signOut()
        yonlendirici.replace('/login')
      }
    }, 55 * 60 * 1000)

    return () => {
      if (zamanlayici.current) clearTimeout(zamanlayici.current)
      clearInterval(tokenYenileme)
      OLAYLAR.forEach((o) => window.removeEventListener(o, aktiviteKaydet))
      window.removeEventListener('mousedown', zamanlayiciKur)
      window.removeEventListener('keydown', zamanlayiciKur)
      window.removeEventListener('touchstart', zamanlayiciKur)
    }
  }, [yonlendirici])

  return <>{children}</>
}
