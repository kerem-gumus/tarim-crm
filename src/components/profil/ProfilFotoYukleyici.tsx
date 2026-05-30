'use client'
import { useRef, useState } from 'react'
import { useMobilKamera } from '@/hooks/useMobilKamera'

interface Props {
  mevcutUrl: string | null | undefined
  adSoyad: string
  rol: string
  onGuncellendi: (url: string | null) => void
}

const ROL_RENK: Record<string, string> = {
  admin: 'bg-red-100 text-red-700',
  muhasebeci: 'bg-blue-100 text-blue-700',
  tarimci: 'bg-green-100 text-green-700',
  izleyici: 'bg-gray-100 text-gray-600',
}

export default function ProfilFotoYukleyici({ mevcutUrl, adSoyad, rol, onGuncellendi }: Props) {
  const [yukleniyor, setYukleniyor] = useState(false)
  const [hata, setHata] = useState('')
  const dosyaInputRef = useRef<HTMLInputElement>(null)
  const { mobilMi, kameraIleYukle } = useMobilKamera()

  async function dosyayiYukle(dosya: File) {
    setHata('')
    setYukleniyor(true)
    try {
      const form = new FormData()
      form.append('foto', dosya)
      const yanit = await fetch('/api/kullanicilar/benim/foto', { method: 'POST', body: form })
      const veri = await yanit.json()
      if (!yanit.ok) { setHata(veri.hata ?? 'Yükleme başarısız'); return }
      onGuncellendi(veri.profilFotoUrl)
    } catch {
      setHata('Yükleme başarısız')
    } finally {
      setYukleniyor(false)
    }
  }

  async function webdenSec() {
    dosyaInputRef.current?.click()
  }

  async function mobildenCek() {
    const dosya = await kameraIleYukle()
    if (dosya) dosyayiYukle(dosya)
  }

  async function kaldir() {
    setYukleniyor(true)
    await fetch('/api/kullanicilar/benim/foto', { method: 'DELETE' })
    onGuncellendi(null)
    setYukleniyor(false)
  }

  const avatarHarf = adSoyad?.charAt(0).toUpperCase() ?? 'K'
  const rolRenk = ROL_RENK[rol] ?? 'bg-gray-100 text-gray-600'

  return (
    <div className="flex flex-col items-center gap-3">
      {/* Avatar */}
      <div className={`relative w-24 h-24 rounded-full overflow-hidden flex items-center justify-center text-3xl font-bold ${mevcutUrl ? '' : rolRenk}`}>
        {mevcutUrl ? (
          <img src={mevcutUrl} alt={adSoyad} className="w-full h-full object-cover" />
        ) : (
          avatarHarf
        )}
        {yukleniyor && (
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center rounded-full">
            <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
          </div>
        )}
      </div>

      {/* Butonlar */}
      <div className="flex flex-col gap-1.5 w-full">
        {/* Mobilde kamera seçeneği de göster */}
        {mobilMi && (
          <button
            type="button"
            onClick={mobildenCek}
            disabled={yukleniyor}
            className="w-full rounded-lg bg-green-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-green-700 disabled:opacity-60"
          >
            Fotograf Cek
          </button>
        )}
        <button
          type="button"
          onClick={webdenSec}
          disabled={yukleniyor}
          className="w-full rounded-lg bg-gray-100 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-200 disabled:opacity-60"
        >
          {mobilMi ? 'Galeriden Sec' : 'Dosyadan Sec'}
        </button>
        {mevcutUrl && (
          <button
            type="button"
            onClick={kaldir}
            disabled={yukleniyor}
            className="w-full rounded-lg bg-red-50 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-100 disabled:opacity-60"
          >
            Kaldir
          </button>
        )}
      </div>

      {/* Gizli dosya input */}
      <input
        ref={dosyaInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={e => {
          const dosya = e.target.files?.[0]
          if (dosya) dosyayiYukle(dosya)
          e.target.value = '' // reset
        }}
      />

      {hata && <p className="text-xs text-red-500 text-center">{hata}</p>}
      <p className="text-xs text-gray-400 text-center">Max 5MB · JPG, PNG, WebP</p>
    </div>
  )
}
