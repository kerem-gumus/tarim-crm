'use client'

import { useRef, useState } from 'react'
import { fotografYukle } from '@/lib/fotograf'

type Props = {
  modul: 'hasat' | 'tarla' | 'ekipman' | 'malzeme'
  kayitId: string
  onChange?: () => void
}

export default function FotografYukleyici({ modul, kayitId, onChange }: Props) {
  const [yukleniyor, setYukleniyor] = useState(false)
  const [hata, setHata] = useState<string | null>(null)
  const [surukUzerinde, setSurukUzerinde] = useState(false)
  const dosyaInputRef = useRef<HTMLInputElement>(null)

  async function dosyaIsle(dosya: File) {
    setHata(null)
    setYukleniyor(true)
    try {
      const { dosyaYolu, dosyaAdi, boyutKb } = await fotografYukle(dosya, modul, kayitId)

      const yanit = await fetch('/api/fotograflar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ modul, kayitId, dosyaYolu, dosyaAdi, boyutKb }),
      })

      if (!yanit.ok) {
        const veri = await yanit.json()
        throw new Error(veri.hata ?? 'Metadata kaydedilemedi')
      }

      onChange?.()
    } catch (hata_) {
      const mesaj = hata_ instanceof Error ? hata_.message : 'Bilinmeyen hata'
      setHata(`Yükleme başarısız: ${mesaj}`)
    } finally {
      setYukleniyor(false)
      if (dosyaInputRef.current) dosyaInputRef.current.value = ''
    }
  }

  function inputDegisti(e: React.ChangeEvent<HTMLInputElement>) {
    const dosya = e.target.files?.[0]
    if (dosya) dosyaIsle(dosya)
  }

  function surukBirak(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault()
    setSurukUzerinde(false)
    const dosya = e.dataTransfer.files?.[0]
    if (dosya) dosyaIsle(dosya)
  }

  return (
    <div className="space-y-2">
      <div
        onDragOver={(e) => { e.preventDefault(); setSurukUzerinde(true) }}
        onDragLeave={() => setSurukUzerinde(false)}
        onDrop={surukBirak}
        onClick={() => !yukleniyor && dosyaInputRef.current?.click()}
        className={`flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed px-6 py-8 text-sm transition-colors ${
          surukUzerinde
            ? 'border-green-400 bg-green-50 text-green-700'
            : 'border-gray-300 bg-gray-50 text-gray-500 hover:border-green-400 hover:bg-green-50'
        } ${yukleniyor ? 'pointer-events-none opacity-60' : ''}`}
      >
        {yukleniyor ? (
          <>
            <svg className="mb-2 h-6 w-6 animate-spin text-green-500" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
            </svg>
            <span>Yükleniyor...</span>
          </>
        ) : (
          <>
            <svg className="mb-2 h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <span>Fotoğraf sürükleyin veya tıklayın</span>
            <span className="mt-1 text-xs text-gray-400">PNG, JPG, WEBP — Maks. 5 MB</span>
          </>
        )}
      </div>

      <input
        ref={dosyaInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={inputDegisti}
      />

      {hata && (
        <p className="rounded-md bg-red-50 px-3 py-2 text-xs text-red-600">{hata}</p>
      )}
    </div>
  )
}
