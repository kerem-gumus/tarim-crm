'use client'

import { useEffect, useState } from 'react'

interface YetkiVarsaProps {
  anahtar: string
  children: React.ReactNode
  fallback?: React.ReactNode // yetki yoksa gösterilecek (opsiyonel)
}

// Kullanıcının yetkilerini session'dan çeker ve cache'ler
let yetkiCache: { anahtarlar: string[]; son: number } | null = null
const CACHE_SURE = 5 * 60 * 1000 // 5 dakika

async function kullaniciyetkileriniGetir(): Promise<string[]> {
  const simdi = Date.now()
  if (yetkiCache && simdi - yetkiCache.son < CACHE_SURE) {
    return yetkiCache.anahtarlar
  }
  try {
    const yanit = await fetch('/api/kullanicilar/benim/yetkiler')
    if (!yanit.ok) return []
    const veri = await yanit.json()
    yetkiCache = { anahtarlar: veri.yetkiler ?? [], son: simdi }
    return yetkiCache.anahtarlar
  } catch {
    return []
  }
}

// Cache'i sıfırla (logout/rol değişikliğinde çağrılır)
export function yetkiCacheSifirla() {
  yetkiCache = null
}

export default function YetkiVarsa({ anahtar, children, fallback = null }: YetkiVarsaProps) {
  const [yetkiVar, setYetkiVar] = useState<boolean | null>(null)

  useEffect(() => {
    kullaniciyetkileriniGetir().then((yetkiler) => {
      const var_ =
        yetkiler.includes('*') ||
        yetkiler.includes(anahtar) ||
        yetkiler.some((y) => {
          if (y.endsWith('.*')) return anahtar.startsWith(y.slice(0, -2) + '.')
          return false
        })
      setYetkiVar(var_)
    })
  }, [anahtar])

  if (yetkiVar === null) return null // yüklenirken gizle
  if (!yetkiVar) return <>{fallback}</>
  return <>{children}</>
}
