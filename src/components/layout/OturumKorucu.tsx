'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

const BAYRAK = 'tarimcrm_tarayici_aktif'
const SON_AKTIVITE = 'tarimcrm_son_aktivite'
const HAREKETSIZLIK_MS = 8 * 60 * 60 * 1000 // 8 saat

export default function OturumKorucu({ children }: { children: React.ReactNode }) {
  const yonlendirici = useRouter()
  // Başta null → kontrol bitmedi, false → geçmedi, true → geçti
  const [oturumGecerli, setOturumGecerli] = useState<boolean | null>(null)

  useEffect(() => {
    let temizlendi = false

    async function kontrol() {
      try {
        // 1) Supabase oturumu var mı?
        const { data: { session } } = await supabase.auth.getSession()

        if (!session || !session.user?.email) {
          // Oturum yok — middleware yönlendirmiş olmalı, yine de login'e at
          if (!temizlendi) {
            yonlendirici.replace('/login')
          }
          return
        }

        // 2) Tarayıcı kapatılıp açılmış mı? (sessionStorage yoksa)
        const bayrakVar = sessionStorage.getItem(BAYRAK)
        if (!bayrakVar) {
          await supabase.auth.signOut()
          localStorage.removeItem(SON_AKTIVITE)
          if (!temizlendi) {
            yonlendirici.replace('/login')
          }
          return
        }

        // 3) Hareketsizlik kontrolü
        const sonAktivite = localStorage.getItem(SON_AKTIVITE)
        if (sonAktivite && Date.now() - parseInt(sonAktivite) >= HAREKETSIZLIK_MS) {
          await supabase.auth.signOut()
          sessionStorage.removeItem(BAYRAK)
          localStorage.removeItem(SON_AKTIVITE)
          if (!temizlendi) {
            yonlendirici.replace('/login?sebep=oturum_suresi_doldu')
          }
          return
        }

        // Tüm kontroller geçti → içeriği göster
        localStorage.setItem(SON_AKTIVITE, Date.now().toString())
        if (!temizlendi) setOturumGecerli(true)

      } catch {
        // Hata durumunda login'e yönlendir
        if (!temizlendi) yonlendirici.replace('/login')
      }
    }

    kontrol()
    return () => { temizlendi = true }
  }, [yonlendirici])

  useEffect(() => {
    if (!oturumGecerli) return

    // Bayrak güncelle
    sessionStorage.setItem(BAYRAK, '1')

    // Aktivite takibi
    const aktiviteKaydet = () => localStorage.setItem(SON_AKTIVITE, Date.now().toString())
    const OLAYLAR = ['mousedown', 'keydown', 'touchstart', 'scroll']
    OLAYLAR.forEach((o) => window.addEventListener(o, aktiviteKaydet, { passive: true }))

    // Token yenileme (55 dakikada bir)
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
  }, [oturumGecerli])

  // Kontrol devam ediyor → boş beyaz ekran (dashboard yerine)
  if (oturumGecerli === null) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-3 border-green-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-gray-400">Oturum doğrulanıyor...</p>
        </div>
      </div>
    )
  }

  // Kontrol başarısız → hiçbir şey render etme (redirect zaten tetiklendi)
  if (!oturumGecerli) return null

  return <>{children}</>
}
