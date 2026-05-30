'use client'

import { useCallback, useEffect, useState } from 'react'
import Image from 'next/image'
import { fotografUrlGetir } from '@/lib/fotograf'

type Fotograf = {
  id: string
  dosyaYolu: string
  dosyaAdi: string
  boyutKb: number
  aciklama: string | null
  yuklemeTarihi: string
}

type Props = {
  modul: string
  kayitId: string
}

export default function FotografGalerisi({ modul, kayitId }: Props) {
  const [fotograflar, setFotograflar] = useState<Fotograf[]>([])
  const [yukleniyor, setYukleniyor] = useState(true)
  const [siliniyor, setSiliniyor] = useState<string | null>(null)

  const fotograflariGetir = useCallback(async () => {
    setYukleniyor(true)
    try {
      const yanit = await fetch(`/api/fotograflar?modul=${modul}&kayitId=${kayitId}`)
      if (yanit.ok) {
        const veri = await yanit.json()
        setFotograflar(veri)
      }
    } finally {
      setYukleniyor(false)
    }
  }, [modul, kayitId])

  useEffect(() => {
    fotograflariGetir()
  }, [fotograflariGetir])

  async function fotografSilOnay(id: string) {
    setSiliniyor(id)
    try {
      const yanit = await fetch(`/api/fotograflar/${id}`, { method: 'DELETE' })
      if (yanit.ok) {
        setFotograflar((onceki) => onceki.filter((f) => f.id !== id))
      }
    } finally {
      setSiliniyor(null)
    }
  }

  if (yukleniyor) {
    return (
      <div className="flex items-center justify-center py-8 text-sm text-gray-400">
        Fotoğraflar yükleniyor...
      </div>
    )
  }

  return (
    <div>
      <p className="mb-3 text-sm font-medium text-gray-600">
        {fotograflar.length > 0 ? `${fotograflar.length} fotoğraf` : 'Henüz fotoğraf yok'}
      </p>

      {fotograflar.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-200 py-10 text-gray-400">
          <svg className="mb-2 h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <span className="text-sm">Henüz fotoğraf yok</span>
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-3">
          {fotograflar.map((fotograf) => {
            const url = fotografUrlGetir(fotograf.dosyaYolu)
            return (
              <div key={fotograf.id} className="group relative aspect-square overflow-hidden rounded-lg bg-gray-100">
                <Image
                  src={url}
                  alt={fotograf.dosyaAdi}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 33vw, 200px"
                />
                <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
                  <button
                    onClick={() => fotografSilOnay(fotograf.id)}
                    disabled={siliniyor === fotograf.id}
                    className="rounded-md bg-red-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-700 disabled:opacity-60"
                  >
                    {siliniyor === fotograf.id ? 'Siliniyor...' : 'Sil'}
                  </button>
                </div>
                <div className="absolute bottom-0 left-0 right-0 bg-black/50 px-2 py-1 text-xs text-white opacity-0 transition-opacity group-hover:opacity-100">
                  <p className="truncate">{fotograf.dosyaAdi}</p>
                  <p className="text-gray-300">{fotograf.boyutKb} KB</p>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
