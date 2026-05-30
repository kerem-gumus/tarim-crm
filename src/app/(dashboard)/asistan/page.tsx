'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { AI_MODELLER, AiModel } from '@/lib/ai/saglayicilar'

interface Mesaj {
  id: string
  rol: 'kullanici' | 'asistan'
  icerik: string
  girilenToken?: number
  cikanToken?: number
}

interface Sohbet {
  id: string
  baslik: string
  saglayi: string
  model: string
  guncellenmeTarihi: string
  _count: { mesajlar: number }
}

interface TokenBilgi {
  girilen: number
  cikan: number
  maliyet: number
}

const SAGLAYICILAR = [
  { id: 'claude', ad: 'Anthropic Claude', ucretsiz: false },
  { id: 'openai', ad: 'OpenAI GPT', ucretsiz: false },
  { id: 'gemini', ad: 'Google Gemini', ucretsiz: true },
  { id: 'groq', ad: 'Groq', ucretsiz: true },
  { id: 'ollama', ad: 'Ollama (Local)', ucretsiz: true },
]

const HIZLI_SORULAR = [
  { etiket: 'Hasat Ozeti', soru: 'Bu sezonun hasat durumunu özetle. Hangi tarlalar en iyi performansı gösteriyor?' },
  { etiket: 'Finansal Durum', soru: 'Mevcut finansal durumu analiz et. Ödenmemiş alacaklar ve kritik ödemeler neler?' },
  { etiket: 'Stok Analizi', soru: 'Envanter durumunu değerlendir. Kritik stok seviyeleri ve önerilen tedbirler neler?' },
  { etiket: 'Verim Raporu', soru: 'Tarla verimliliği raporunu hazırla. Hangi alanlarda iyileştirme yapılabilir?' },
]

export default function AsistanSayfasi() {
  const [sohbetler, setSohbetler] = useState<Sohbet[]>([])
  const [aktifSohbetId, setAktifSohbetId] = useState<string | null>(null)
  const [mesajlar, setMesajlar] = useState<Mesaj[]>([])
  const [yazilan, setYazilan] = useState('')
  const [yukleniyor, setYukleniyor] = useState(false)
  const [secilenSaglayici, setSecilenSaglayici] = useState('groq')
  const [secilenModel, setSecilenModel] = useState('llama-3.3-70b-versatile')
  const [dbBaglami, setDbBaglami] = useState(false)
  const [sonTokenBilgi, setSonTokenBilgi] = useState<TokenBilgi | null>(null)
  const [aktifTab, setAktifTab] = useState<'sohbet' | 'istatistik'>('sohbet')
  const [istatistik, setIstatistik] = useState<{
    toplamKullanim: { girilenToken: number; cikanToken: number; toplamToken: number }
    saglayiciBazli: { saglayi: string; model: string; _sum: { toplamToken: number; tahminiMaliyet: number } }[]
    toplamMaliyetUsd: number
  } | null>(null)

  const mesajSonuRef = useRef<HTMLDivElement>(null)

  const saglayiciyaGoreModeller = AI_MODELLER.filter(m => m.saglayi === secilenSaglayici)

  const sohbetleriYukle = useCallback(async () => {
    try {
      const res = await fetch('/api/asistan/sohbetler')
      if (res.ok) {
        const veri = await res.json()
        setSohbetler(veri)
      }
    } catch {
      // sessizce geç
    }
  }, [])

  const sohbetYukle = useCallback(async (sohbetId: string) => {
    try {
      const res = await fetch(`/api/asistan/sohbetler/${sohbetId}`)
      if (res.ok) {
        const veri = await res.json()
        setMesajlar(
          veri.mesajlar
            .filter((m: { rol: string }) => m.rol !== 'sistem')
            .map((m: { id: string; rol: string; icerik: string; girilenToken?: number; cikanToken?: number }) => ({
              id: m.id,
              rol: m.rol,
              icerik: m.icerik,
              girilenToken: m.girilenToken,
              cikanToken: m.cikanToken,
            }))
        )
      }
    } catch {
      // sessizce geç
    }
  }, [])

  const istatistikYukle = useCallback(async () => {
    try {
      const res = await fetch('/api/asistan/token-istatistik')
      if (res.ok) {
        const veri = await res.json()
        setIstatistik(veri)
      }
    } catch {
      // sessizce geç
    }
  }, [])

  useEffect(() => {
    sohbetleriYukle()
  }, [sohbetleriYukle])

  useEffect(() => {
    if (aktifTab === 'istatistik') {
      istatistikYukle()
    }
  }, [aktifTab, istatistikYukle])

  useEffect(() => {
    mesajSonuRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [mesajlar])

  const saglayiciDegistir = (saglayiciId: string) => {
    setSecilenSaglayici(saglayiciId)
    const ilkModel = AI_MODELLER.find(m => m.saglayi === saglayiciId)
    if (ilkModel) setSecilenModel(ilkModel.id)
  }

  const yeniSohbetBaslat = () => {
    setAktifSohbetId(null)
    setMesajlar([])
    setSonTokenBilgi(null)
  }

  const sohbetSec = async (sohbet: Sohbet) => {
    setAktifSohbetId(sohbet.id)
    setSecilenSaglayici(sohbet.saglayi)
    const ilgiliModel = AI_MODELLER.find(m => m.id === sohbet.model)
    if (ilgiliModel) {
      setSecilenSaglayici(ilgiliModel.saglayi)
    }
    setSecilenModel(sohbet.model)
    setSonTokenBilgi(null)
    await sohbetYukle(sohbet.id)
  }

  const sohbetSil = async (sohbetId: string) => {
    if (!confirm('Bu sohbeti silmek istediğinize emin misiniz?')) return
    try {
      await fetch(`/api/asistan/sohbetler/${sohbetId}`, { method: 'DELETE' })
      if (aktifSohbetId === sohbetId) {
        yeniSohbetBaslat()
      }
      await sohbetleriYukle()
    } catch {
      // sessizce geç
    }
  }

  const mesajGonder = async () => {
    if (!yazilan.trim() || yukleniyor) return

    const kullaniciMesaji = yazilan.trim()
    setYazilan('')

    // Optimistik UI
    const geciciId = `gecici-${Date.now()}`
    setMesajlar(prev => [...prev, { id: geciciId, rol: 'kullanici', icerik: kullaniciMesaji }])
    setYukleniyor(true)
    setSonTokenBilgi(null)

    try {
      let baglamOzeti: string | undefined
      if (dbBaglami) {
        const baglamRes = await fetch('/api/asistan/baglam')
        if (baglamRes.ok) {
          const baglamVeri = await baglamRes.json()
          baglamOzeti = baglamVeri.ozet
        }
      }

      const res = await fetch('/api/asistan/sohbet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sohbetId: aktifSohbetId,
          mesaj: kullaniciMesaji,
          saglayi: secilenSaglayici,
          model: secilenModel,
          dbBaglami: baglamOzeti,
        }),
      })

      const veri = await res.json()

      if (veri.hata) {
        setMesajlar(prev => [
          ...prev,
          { id: `hata-${Date.now()}`, rol: 'asistan', icerik: `Hata: ${veri.hata}` },
        ])
      } else {
        if (!aktifSohbetId) {
          setAktifSohbetId(veri.sohbetId)
          await sohbetleriYukle()
        }
        setMesajlar(prev => [
          ...prev,
          {
            id: veri.mesajId,
            rol: 'asistan',
            icerik: veri.yanit,
            girilenToken: veri.tokenKullanim?.girilen,
            cikanToken: veri.tokenKullanim?.cikan,
          },
        ])
        setSonTokenBilgi(veri.tokenKullanim)
        await sohbetleriYukle()
      }
    } catch {
      setMesajlar(prev => [
        ...prev,
        { id: `hata-${Date.now()}`, rol: 'asistan', icerik: 'Bağlantı hatası oluştu. Lütfen tekrar deneyin.' },
      ])
    } finally {
      setYukleniyor(false)
    }
  }

  const hizliSoruSec = (soru: string) => {
    setYazilan(soru)
  }

  const enterTusla = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      mesajGonder()
    }
  }

  const secilenSaglayiciObj = SAGLAYICILAR.find(s => s.id === secilenSaglayici)
  const secilenModelObj: AiModel | undefined = AI_MODELLER.find(m => m.id === secilenModel)

  return (
    <div className="flex h-full flex-col">
      {/* Üst Bar */}
      <div className="flex items-center justify-between border-b border-gray-200 bg-white px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="text-xl">🤖</span>
          <h1 className="text-lg font-semibold text-gray-800">AI Asistan</h1>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setAktifTab('sohbet')}
            className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
              aktifTab === 'sohbet'
                ? 'bg-green-600 text-white'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            Sohbet
          </button>
          <button
            onClick={() => setAktifTab('istatistik')}
            className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
              aktifTab === 'istatistik'
                ? 'bg-green-600 text-white'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            Token İstatistik
          </button>
          <a
            href="/asistan/ayarlar"
            className="rounded-lg px-3 py-1.5 text-sm font-medium text-gray-600 hover:bg-gray-100"
          >
            Ayarlar
          </a>
        </div>
      </div>

      {aktifTab === 'istatistik' ? (
        <IstatistikPanel istatistik={istatistik} />
      ) : (
        <div className="flex flex-1 overflow-hidden">
          {/* Sol Panel — Sohbet Listesi */}
          <div className="flex w-64 flex-shrink-0 flex-col border-r border-gray-200 bg-gray-50">
            <div className="p-3">
              <button
                onClick={yeniSohbetBaslat}
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-green-600 px-3 py-2 text-sm font-medium text-white hover:bg-green-700"
              >
                <span>+</span> Yeni Sohbet
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-2">
              {sohbetler.length === 0 ? (
                <p className="px-2 py-3 text-xs text-gray-400">Henüz sohbet yok</p>
              ) : (
                sohbetler.map(sohbet => (
                  <div
                    key={sohbet.id}
                    className={`group mb-1 flex cursor-pointer items-start justify-between rounded-lg px-3 py-2 text-sm transition-colors ${
                      aktifSohbetId === sohbet.id
                        ? 'bg-green-50 text-green-700'
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}
                    onClick={() => sohbetSec(sohbet)}
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs font-medium">{sohbet.baslik}</p>
                      <p className="text-xs text-gray-400">
                        {sohbet._count.mesajlar} mesaj · {sohbet.saglayi}
                      </p>
                    </div>
                    <button
                      onClick={e => {
                        e.stopPropagation()
                        sohbetSil(sohbet.id)
                      }}
                      className="ml-1 hidden text-gray-400 hover:text-red-500 group-hover:block"
                    >
                      ✕
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Sağ Panel — Sohbet Alanı */}
          <div className="flex flex-1 flex-col overflow-hidden bg-white">
            {/* Model Seçici */}
            <div className="flex items-center gap-3 border-b border-gray-100 bg-gray-50 px-4 py-2">
              <select
                value={secilenSaglayici}
                onChange={e => saglayiciDegistir(e.target.value)}
                className="rounded-lg border border-gray-200 bg-white px-2 py-1.5 text-sm text-gray-700"
              >
                {SAGLAYICILAR.map(s => (
                  <option key={s.id} value={s.id}>
                    {s.ad} {s.ucretsiz ? '(Ücretsiz)' : ''}
                  </option>
                ))}
              </select>
              <select
                value={secilenModel}
                onChange={e => setSecilenModel(e.target.value)}
                className="rounded-lg border border-gray-200 bg-white px-2 py-1.5 text-sm text-gray-700"
              >
                {saglayiciyaGoreModeller.map(m => (
                  <option key={m.id} value={m.id}>
                    {m.ad}
                  </option>
                ))}
              </select>
              {secilenModelObj?.ucretsiz && (
                <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">
                  Ücretsiz
                </span>
              )}
              {secilenSaglayiciObj && !secilenSaglayiciObj.ucretsiz && (
                <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">
                  Ücretli
                </span>
              )}
              <label className="ml-auto flex cursor-pointer items-center gap-2 text-xs text-gray-600">
                <input
                  type="checkbox"
                  checked={dbBaglami}
                  onChange={e => setDbBaglami(e.target.checked)}
                  className="rounded"
                />
                🗃️ DB Bağlamı Ekle
              </label>
            </div>

            {/* Mesajlar */}
            <div className="flex-1 overflow-y-auto px-4 py-4">
              {mesajlar.length === 0 ? (
                <div className="flex h-full flex-col items-center justify-center text-center">
                  <span className="mb-3 text-5xl">🌿</span>
                  <h2 className="mb-1 text-lg font-semibold text-gray-700">TarımCRM AI Asistanı</h2>
                  <p className="mb-6 text-sm text-gray-400">
                    Çay tarımı, hasat yönetimi ve finansal analiz konularında yardım alabileceğiniz akıllı asistanınız.
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    {HIZLI_SORULAR.map(s => (
                      <button
                        key={s.etiket}
                        onClick={() => hizliSoruSec(s.soru)}
                        className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-left text-xs text-gray-600 hover:border-green-300 hover:bg-green-50"
                      >
                        {s.etiket}
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {mesajlar.map(mesaj => (
                    <div
                      key={mesaj.id}
                      className={`flex ${mesaj.rol === 'kullanici' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[75%] rounded-2xl px-4 py-3 text-sm ${
                          mesaj.rol === 'kullanici'
                            ? 'bg-green-600 text-white'
                            : 'border border-gray-200 bg-white text-gray-800'
                        }`}
                      >
                        <p className="whitespace-pre-wrap">{mesaj.icerik}</p>
                        {mesaj.rol === 'asistan' && mesaj.girilenToken !== undefined && mesaj.girilenToken > 0 && (
                          <p className="mt-1 text-xs text-gray-400">
                            ↑{mesaj.girilenToken} ↓{mesaj.cikanToken} token
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                  {yukleniyor && (
                    <div className="flex justify-start">
                      <div className="rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-500">
                        <span className="animate-pulse">Yanıt bekleniyor...</span>
                      </div>
                    </div>
                  )}
                  <div ref={mesajSonuRef} />
                </div>
              )}
            </div>

            {/* Token Bilgisi */}
            {sonTokenBilgi && (
              <div className="border-t border-gray-100 bg-gray-50 px-4 py-1.5 text-center text-xs text-gray-500">
                {sonTokenBilgi.maliyet > 0
                  ? `${sonTokenBilgi.girilen + sonTokenBilgi.cikan} token kullanıldı · ~$${sonTokenBilgi.maliyet.toFixed(6)} USD`
                  : `${sonTokenBilgi.girilen + sonTokenBilgi.cikan} token kullanıldı · Ücretsiz`}
              </div>
            )}

            {/* Hızlı Sorular */}
            {mesajlar.length > 0 && (
              <div className="flex gap-2 overflow-x-auto border-t border-gray-100 px-4 py-2">
                {HIZLI_SORULAR.map(s => (
                  <button
                    key={s.etiket}
                    onClick={() => hizliSoruSec(s.soru)}
                    className="flex-shrink-0 rounded-full border border-gray-200 bg-white px-3 py-1 text-xs text-gray-600 hover:border-green-300 hover:bg-green-50"
                  >
                    {s.etiket}
                  </button>
                ))}
              </div>
            )}

            {/* Mesaj Girişi */}
            <div className="border-t border-gray-200 bg-white p-4">
              <div className="flex items-end gap-2">
                <textarea
                  value={yazilan}
                  onChange={e => setYazilan(e.target.value)}
                  onKeyDown={enterTusla}
                  placeholder="Çay tarımı, hasat, finansal durum hakkında soru sorun..."
                  rows={2}
                  className="flex-1 resize-none rounded-xl border border-gray-200 px-3 py-2 text-sm text-gray-800 placeholder-gray-400 focus:border-green-400 focus:outline-none focus:ring-1 focus:ring-green-400"
                />
                <button
                  onClick={mesajGonder}
                  disabled={!yazilan.trim() || yukleniyor}
                  className="rounded-xl bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:cursor-not-allowed disabled:bg-gray-300"
                >
                  {yukleniyor ? '...' : 'Gönder'}
                </button>
              </div>
              <p className="mt-1 text-xs text-gray-400">Enter ile gönder · Shift+Enter yeni satır</p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function IstatistikPanel({
  istatistik,
}: {
  istatistik: {
    toplamKullanim: { girilenToken: number; cikanToken: number; toplamToken: number }
    saglayiciBazli: { saglayi: string; model: string; _sum: { toplamToken: number; tahminiMaliyet: number } }[]
    toplamMaliyetUsd: number
  } | null
}) {
  if (!istatistik) {
    return (
      <div className="flex flex-1 items-center justify-center text-sm text-gray-400">
        İstatistikler yükleniyor...
      </div>
    )
  }

  const { toplamKullanim, saglayiciBazli, toplamMaliyetUsd } = istatistik

  return (
    <div className="flex-1 overflow-y-auto p-6">
      <h2 className="mb-6 text-lg font-semibold text-gray-800">Token İstatistikleri</h2>

      {/* Özet Kartlar */}
      <div className="mb-6 grid grid-cols-3 gap-4">
        <div className="rounded-xl border border-gray-200 bg-white p-4">
          <p className="text-xs text-gray-500">Toplam Token</p>
          <p className="mt-1 text-2xl font-bold text-gray-800">
            {(toplamKullanim?.toplamToken ?? 0).toLocaleString('tr-TR')}
          </p>
          <p className="text-xs text-gray-400">
            ↑{(toplamKullanim?.girilenToken ?? 0).toLocaleString()} giriş ·{' '}
            ↓{(toplamKullanim?.cikanToken ?? 0).toLocaleString()} çıkış
          </p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-4">
          <p className="text-xs text-gray-500">Tahmini Toplam Maliyet</p>
          <p className="mt-1 text-2xl font-bold text-gray-800">
            ${toplamMaliyetUsd.toFixed(4)} USD
          </p>
          <p className="text-xs text-gray-400">Ücretli model kullanımı</p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-4">
          <p className="text-xs text-gray-500">Sağlayıcı Sayısı</p>
          <p className="mt-1 text-2xl font-bold text-gray-800">{saglayiciBazli.length}</p>
          <p className="text-xs text-gray-400">Kullanılan model/sağlayıcı</p>
        </div>
      </div>

      {/* Sağlayıcı Bazlı Tablo */}
      <div className="rounded-xl border border-gray-200 bg-white">
        <div className="border-b border-gray-100 px-4 py-3">
          <h3 className="text-sm font-semibold text-gray-700">Sağlayıcı & Model Bazlı Kullanım</h3>
        </div>
        {saglayiciBazli.length === 0 ? (
          <p className="px-4 py-6 text-center text-sm text-gray-400">Henüz token kullanımı yok</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 text-xs font-medium text-gray-500">
                <th className="px-4 py-2 text-left">Sağlayıcı</th>
                <th className="px-4 py-2 text-left">Model</th>
                <th className="px-4 py-2 text-right">Toplam Token</th>
                <th className="px-4 py-2 text-right">Maliyet (USD)</th>
              </tr>
            </thead>
            <tbody>
              {saglayiciBazli.map((s, i) => (
                <tr key={i} className="border-b border-gray-50 hover:bg-gray-50">
                  <td className="px-4 py-2 capitalize text-gray-700">{s.saglayi}</td>
                  <td className="px-4 py-2 text-gray-600">{s.model}</td>
                  <td className="px-4 py-2 text-right text-gray-700">
                    {Number(s._sum.toplamToken ?? 0).toLocaleString('tr-TR')}
                  </td>
                  <td className="px-4 py-2 text-right">
                    {Number(s._sum.tahminiMaliyet ?? 0) > 0 ? (
                      <span className="text-amber-600">
                        ${Number(s._sum.tahminiMaliyet ?? 0).toFixed(6)}
                      </span>
                    ) : (
                      <span className="text-green-600">Ücretsiz</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
