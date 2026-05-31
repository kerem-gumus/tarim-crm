'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

const BAYRAK = 'tarimcrm_tarayici_aktif'
const SON_AKTIVITE = 'tarimcrm_son_aktivite'
const HAREKETSIZLIK_MS = 8 * 60 * 60 * 1000 // 8 saat

export default function OturumKorucu({ children }: { children: React.ReactNode }) {
  const yonlendirici = useRouter()

  useEffect(() => {
    let temizlendi = false

    async function kontrol() {
      const bayrakVar = sessionStorage.getItem(BAYRAK)

      if (!bayrakVar) {
        // Tarayıcı kapatılıp açılmış — session temizlenmeli
        // Önce sign-out yap, SONRA flag set et (flag buraya kadar set edilmez)
        const { data: { session } } = await supabase.auth.getSession()
        if (session) {
          await supabase.auth.signOut()
        }
        if (!temizlendi) {
          localStorage.removeItem(SON_AKTIVITE)
          yonlendirici.replace('/login')
        }
        return // Flag set etme — login sayfası set edecek
      }

      // Hareketsizlik kontrolü
      const sonAktivite = localStorage.getItem(SON_AKTIVITE)
      if (sonAktivite) {
        const gecen = Date.now() - parseInt(sonAktivite)
        if (gecen >= HAREKETSIZLIK_MS) {
          await supabase.auth.signOut()
          sessionStorage.removeItem(BAYRAK)
          localStorage.removeItem(SON_AKTIVITE)
          if (!temizlendi) yonlendirici.replace('/login?sebep=oturum_suresi_doldu')
          return
        }
      }

      // Kontrol geçti — aktiviteyi güncelle
      localStorage.setItem(SON_AKTIVITE, Date.now().toString())
    }

    kontrol()

    return () => { temizlendi = true }
  }, [yonlendirici])

  useEffect(() => {
    // Bayrak zaten varsa yenile, yoksa KOYMA (kontrol useEffect bunu yönetir)
    if (sessionStorage.getItem(BAYRAK)) {
      sessionStorage.setItem(BAYRAK, '1')
    }

    // Aktivite takibi
    const aktiviteKaydet = () => localStorage.setItem(SON_AKTIVITE, Date.now().toString())
    const OLAYLAR = ['mousedown', 'keydown', 'touchstart', 'scroll']
    OLAYLAR.forEach((o) => window.addEventListener(o, aktiviteKaydet, { passive: true }))

    // Token yenileme
    const tokenInterval = setInterval(async () => {
      const { error } = await supabase.auth.refreshSession()
      if (error) {
        sessionStorage.removeItem(BAYRAK)
        await supabase.auth.signOut()
        window.location.href = '/login'
      }
    }, 55 * 60 * 1000)

    return () => {
      clearInterval(tokenInterval)
      OLAYLAR.forEach((o) => window.removeEventListener(o, aktiviteKaydet))
    }
  }, [])

  return <>{children}</>
}
