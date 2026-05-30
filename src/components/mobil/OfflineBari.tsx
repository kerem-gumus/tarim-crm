'use client'
import { useOfflineSenkron } from '@/hooks/useOfflineSenkron'

export default function OfflineBari() {
  const { cevrimici, kuyrukSayisi, senkronIsleniyor, senkronEt } = useOfflineSenkron()

  if (cevrimici && kuyrukSayisi === 0) return null

  return (
    <div className={`fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-4 py-2 text-sm text-white ${cevrimici ? 'bg-yellow-500' : 'bg-red-600'}`}>
      <span>
        {!cevrimici && '📶 Çevrimdışı — '}
        {kuyrukSayisi > 0 && `${kuyrukSayisi} giriş senkronize edilmedi`}
        {cevrimici && kuyrukSayisi > 0 && ' — Çevrimiçi'}
      </span>
      {cevrimici && kuyrukSayisi > 0 && (
        <button
          onClick={senkronEt}
          disabled={senkronIsleniyor}
          className="ml-3 rounded bg-white/20 px-2 py-0.5 text-xs font-medium hover:bg-white/30 disabled:opacity-60"
        >
          {senkronIsleniyor ? 'Senkronize ediliyor...' : 'Şimdi Senkronize Et'}
        </button>
      )}
    </div>
  )
}
