'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

export interface MevcutKullanici {
  id: string
  supabaseId: string
  eposta: string
  adSoyad: string
  telefon?: string | null
  rol: 'admin' | 'muhasebeci' | 'tarimci' | 'izleyici'
  durum: string
  profilFotoUrl?: string | null
  sonGiris?: string | null
}

const AUTH_KANAL = 'tarim_crm_auth';

export function useKullanici() {
  const [kullanici, setKullanici] = useState<MevcutKullanici | null>(null)
  const [yukleniyor, setYukleniyor] = useState(true)

  useEffect(() => {
    async function getir() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { setYukleniyor(false); return }

      const yanit = await fetch('/api/kullanicilar/benim')
      if (yanit.ok) {
        const veri = await yanit.json()
        setKullanici(veri)
      }
      setYukleniyor(false)
    }
    getir()

    // Supabase auth state değişimlerini dinle
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_OUT') {
        setKullanici(null)
        // Diğer sekmelere çıkış sinyali gönder
        try {
          const kanal = new BroadcastChannel(AUTH_KANAL)
          kanal.postMessage({ tip: 'cikis' })
          kanal.close()
        } catch { /* BroadcastChannel desteklenmiyorsa yoksay */ }
        window.location.href = '/login'
      }
    })

    // Diğer sekmelerden gelen çıkış sinyalini dinle
    let broadcastKanal: BroadcastChannel | null = null
    try {
      broadcastKanal = new BroadcastChannel(AUTH_KANAL)
      broadcastKanal.onmessage = (e) => {
        if (e.data?.tip === 'cikis') {
          window.location.href = '/login'
        }
      }
    } catch { /* BroadcastChannel desteklenmiyorsa yoksay */ }

    return () => {
      subscription.unsubscribe()
      broadcastKanal?.close()
    }
  }, [])

  return { kullanici, yukleniyor }
}
