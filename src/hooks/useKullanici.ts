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
  }, [])

  return { kullanici, yukleniyor }
}
