'use client'

import { useState } from 'react'

interface AiRaporBolamuProps {
  tip: string
  veri: unknown
  ekBaglam?: string
  baslik?: string
}

export default function AiRaporBolumu({
  tip,
  veri,
  ekBaglam,
  baslik = 'AI Analizi',
}: AiRaporBolamuProps) {
  const [analiz, setAnaliz] = useState<string | null>(null)
  const [yukleniyor, setYukleniyor] = useState(false)
  const [hata, setHata] = useState<string | null>(null)
  const [olusturmaTarihi, setOlusturmaTarihi] = useState<string | null>(null)
  const [saglayi, setSaglayi] = useState<string | null>(null)

  async function analizUret() {
    setYukleniyor(true)
    setHata(null)
    try {
      const yanit = await fetch('/api/raporlar/ai-analiz', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tip, veri, ekBaglam }),
      })
      const veriY = await yanit.json()
      if (!yanit.ok) {
        setHata(veriY.hata ?? 'AI analiz başarısız')
        return
      }
      setAnaliz(veriY.analiz)
      setOlusturmaTarihi(veriY.olusturmaTarihi)
      setSaglayi(veriY.saglayi ?? veriY.model)
    } catch {
      setHata('Bağlantı hatası, tekrar deneyin')
    } finally {
      setYukleniyor(false)
    }
  }

  // Markdown benzeri basit format (** **=kalın, - =liste)
  function formatliMetin(metin: string) {
    return metin.split('\n').map((satir, i) => {
      const kalip = satir.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      if (satir.startsWith('- ') || satir.startsWith('• ')) {
        return (
          <li key={i} className="ml-4 list-disc"
            dangerouslySetInnerHTML={{ __html: kalip.slice(2) }} />
        )
      }
      if (satir.match(/^\d+\./)) {
        return (
          <li key={i} className="ml-4 list-decimal"
            dangerouslySetInnerHTML={{ __html: kalip }} />
        )
      }
      if (!satir.trim()) return <br key={i} />
      return (
        <p key={i} className="mb-1"
          dangerouslySetInnerHTML={{ __html: kalip }} />
      )
    })
  }

  return (
    <div className="rounded-2xl border border-blue-100 bg-white shadow-sm overflow-hidden">
      {/* Başlık */}
      <div className="border-b border-blue-100 bg-blue-50 px-4 py-3 flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-2">
          <span className="text-lg">🤖</span>
          <h3 className="text-sm font-semibold text-blue-800">{baslik}</h3>
          {olusturmaTarihi && (
            <span className="text-xs text-blue-400">
              {new Date(olusturmaTarihi).toLocaleString('tr-TR', { dateStyle: 'short', timeStyle: 'short' })}
              {saglayi && ` · ${saglayi}`}
            </span>
          )}
        </div>
        <div className="flex gap-2">
          {analiz && (
            <button
              onClick={analizUret}
              disabled={yukleniyor}
              className="rounded-lg border border-blue-300 px-3 py-1.5 text-xs font-medium text-blue-700 hover:bg-blue-100 disabled:opacity-50"
            >
              {yukleniyor ? 'Güncelleniyor...' : '↻ Yenile'}
            </button>
          )}
          {!analiz && (
            <button
              onClick={analizUret}
              disabled={yukleniyor || !veri}
              className="rounded-lg bg-blue-600 px-4 py-1.5 text-xs font-medium text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {yukleniyor ? (
                <span className="flex items-center gap-2">
                  <svg className="h-3 w-3 animate-spin" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Analiz yapılıyor...
                </span>
              ) : 'AI ile Analiz Et'}
            </button>
          )}
        </div>
      </div>

      {/* İçerik */}
      <div className="p-4">
        {hata && (
          <div className="rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700">
            {hata}
          </div>
        )}
        {yukleniyor && !analiz && (
          <div className="flex items-center gap-3 py-4 text-sm text-gray-500">
            <svg className="h-5 w-5 animate-spin text-blue-500" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            AI raporu analiz ediyor, lütfen bekleyin...
          </div>
        )}
        {!analiz && !yukleniyor && !hata && (
          <p className="text-sm text-gray-400 py-2">
            Rapor verilerini AI ile analiz etmek için butona tıklayın.
            Verim, maliyet ve trend analizi + öneriler üretilir.
          </p>
        )}
        {analiz && (
          <div className="text-sm text-gray-700 leading-relaxed space-y-0.5">
            {formatliMetin(analiz)}
          </div>
        )}
      </div>
    </div>
  )
}
