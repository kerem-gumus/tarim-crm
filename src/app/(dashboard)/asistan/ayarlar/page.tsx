'use client'

import { useState, useEffect, useCallback } from 'react'
import { AI_MODELLER } from '@/lib/ai/saglayicilar'

interface AiAyar {
  id?: string
  saglayi: string
  apiAnahtari: string | null
  varsayilanModel: string | null
  aktif: boolean
  ayarlar: { baseUrl?: string } | null
}

interface TestSonuc {
  saglayi: string
  basarili: boolean
  sure?: number
  hata?: string
}

const SAGLAYICI_BILGILERI = [
  {
    id: 'claude',
    ad: 'Anthropic Claude',
    renk: 'purple',
    ikon: '🟣',
    aciklama: 'claude.ai — Güçlü analiz ve yazım kabiliyeti',
    apiKeyPlaceholder: 'sk-ant-...',
    linkMetni: 'API anahtarı için: console.anthropic.com',
    ucretsiz: false,
  },
  {
    id: 'openai',
    ad: 'OpenAI GPT',
    renk: 'green',
    ikon: '🟢',
    aciklama: 'openai.com — GPT-4o ve GPT-4o Mini',
    apiKeyPlaceholder: 'sk-...',
    linkMetni: 'API anahtarı için: platform.openai.com',
    ucretsiz: false,
  },
  {
    id: 'gemini',
    ad: 'Google Gemini',
    renk: 'blue',
    ikon: '🔵',
    aciklama: 'Google AI — Gemini 2.0 Flash ücretsiz kullanılabilir',
    apiKeyPlaceholder: 'Ücretsiz kullanım için boş bırakın',
    linkMetni: 'API anahtarı için: aistudio.google.com',
    ucretsiz: true,
  },
  {
    id: 'groq',
    ad: 'Groq',
    renk: 'orange',
    ikon: '🟠',
    aciklama: 'Groq — LLaMA ve Mixtral modelleri ücretsiz',
    apiKeyPlaceholder: 'gsk_...',
    linkMetni: 'Ücretsiz API anahtarı için: console.groq.com',
    ucretsiz: true,
  },
  {
    id: 'ollama',
    ad: 'Ollama (Local)',
    renk: 'gray',
    ikon: '⚫',
    aciklama: 'Yerel model — Internet bağlantısı gerektirmez',
    apiKeyPlaceholder: null,
    linkMetni: 'Kurulum için: ollama.ai',
    ucretsiz: true,
    ollamaBaseUrl: true,
  },
]

export default function AsistanAyarlarSayfasi() {
  const [ayarlar, setAyarlar] = useState<Record<string, AiAyar>>({})
  const [duzenleModlar, setDuzenleModlar] = useState<Record<string, boolean>>({})
  const [geciciAnahtarlar, setGeciciAnahtarlar] = useState<Record<string, string>>({})
  const [geciciUrllar, setGeciciUrllar] = useState<Record<string, string>>({})
  const [geciciModeller, setGeciciModeller] = useState<Record<string, string>>({})
  const [yukleniyor, setYukleniyor] = useState(true)
  const [kayitYukleniyor, setKayitYukleniyor] = useState<Record<string, boolean>>({})
  const [testSonuclari, setTestSonuclari] = useState<Record<string, TestSonuc>>({})
  const [testYukleniyor, setTestYukleniyor] = useState<Record<string, boolean>>({})

  const ayarlariYukle = useCallback(async () => {
    try {
      const res = await fetch('/api/asistan/ayarlar')
      if (res.ok) {
        const veri: AiAyar[] = await res.json()
        const map: Record<string, AiAyar> = {}
        veri.forEach(a => { map[a.saglayi] = a })
        setAyarlar(map)
      }
    } catch {
      // sessizce geç
    } finally {
      setYukleniyor(false)
    }
  }, [])

  useEffect(() => {
    ayarlariYukle()
  }, [ayarlariYukle])

  const duzenleyeBasla = (saglayiciId: string) => {
    const mevcut = ayarlar[saglayiciId]
    setGeciciAnahtarlar(prev => ({ ...prev, [saglayiciId]: '' }))
    setGeciciUrllar(prev => ({
      ...prev,
      [saglayiciId]: (mevcut?.ayarlar as { baseUrl?: string } | null)?.baseUrl ?? 'http://localhost:11434',
    }))
    setGeciciModeller(prev => ({ ...prev, [saglayiciId]: mevcut?.varsayilanModel ?? '' }))
    setDuzenleModlar(prev => ({ ...prev, [saglayiciId]: true }))
  }

  const duzenlemeyiIptal = (saglayiciId: string) => {
    setDuzenleModlar(prev => ({ ...prev, [saglayiciId]: false }))
  }

  const ayarKaydet = async (saglayiciId: string, aktifMi: boolean) => {
    setKayitYukleniyor(prev => ({ ...prev, [saglayiciId]: true }))
    try {
      const bilgi = SAGLAYICI_BILGILERI.find(s => s.id === saglayiciId)
      const res = await fetch('/api/asistan/ayarlar', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          saglayi: saglayiciId,
          apiAnahtari: geciciAnahtarlar[saglayiciId] || undefined,
          varsayilanModel: geciciModeller[saglayiciId] || undefined,
          aktif: aktifMi,
          ayarlar: bilgi?.ollamaBaseUrl
            ? { baseUrl: geciciUrllar[saglayiciId] || 'http://localhost:11434' }
            : undefined,
        }),
      })
      if (res.ok) {
        await ayarlariYukle()
        setDuzenleModlar(prev => ({ ...prev, [saglayiciId]: false }))
      }
    } catch {
      // sessizce geç
    } finally {
      setKayitYukleniyor(prev => ({ ...prev, [saglayiciId]: false }))
    }
  }

  const baglantiyiTest = async (saglayiciId: string) => {
    setTestYukleniyor(prev => ({ ...prev, [saglayiciId]: true }))
    const baslangic = Date.now()
    try {
      const res = await fetch('/api/asistan/sohbet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mesaj: 'Merhaba! Bağlantı testi.',
          saglayi: saglayiciId,
          model: ayarlar[saglayiciId]?.varsayilanModel || AI_MODELLER.find(m => m.saglayi === saglayiciId)?.id || '',
        }),
      })
      const veri = await res.json()
      const sure = Date.now() - baslangic
      if (veri.hata) {
        setTestSonuclari(prev => ({ ...prev, [saglayiciId]: { saglayi: saglayiciId, basarili: false, hata: veri.hata } }))
      } else {
        setTestSonuclari(prev => ({ ...prev, [saglayiciId]: { saglayi: saglayiciId, basarili: true, sure } }))
        // Test sohbetini temizle
        if (veri.sohbetId) {
          await fetch(`/api/asistan/sohbetler/${veri.sohbetId}`, { method: 'DELETE' })
        }
      }
    } catch (hata) {
      setTestSonuclari(prev => ({
        ...prev,
        [saglayiciId]: { saglayi: saglayiciId, basarili: false, hata: hata instanceof Error ? hata.message : 'Bağlantı hatası' },
      }))
    } finally {
      setTestYukleniyor(prev => ({ ...prev, [saglayiciId]: false }))
    }
  }

  if (yukleniyor) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-sm text-gray-400">Ayarlar yükleniyor...</p>
      </div>
    )
  }

  return (
    <div className="flex h-full flex-col">
      {/* Üst Bar */}
      <div className="flex items-center gap-3 border-b border-gray-200 bg-white px-6 py-4">
        <a href="/asistan" className="text-sm text-gray-400 hover:text-gray-600">
          AI Asistan
        </a>
        <span className="text-gray-300">/</span>
        <h1 className="text-sm font-semibold text-gray-800">AI Sağlayıcı Ayarları</h1>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        <p className="mb-6 text-sm text-gray-500">
          Kullanmak istediğiniz AI sağlayıcılarını yapılandırın. API anahtarları şifreli olarak saklanır.
        </p>

        <div className="space-y-4">
          {SAGLAYICI_BILGILERI.map(bilgi => {
            const mevcut = ayarlar[bilgi.id]
            const duzenlemede = duzenleModlar[bilgi.id]
            const testSonucu = testSonuclari[bilgi.id]
            const modeller = AI_MODELLER.filter(m => m.saglayi === bilgi.id)

            return (
              <div key={bilgi.id} className="rounded-xl border border-gray-200 bg-white p-5">
                {/* Kart Başlığı */}
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-xl">{bilgi.ikon}</span>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-gray-800">{bilgi.ad}</h3>
                        {bilgi.ucretsiz && (
                          <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">
                            Ücretsiz
                          </span>
                        )}
                        {mevcut?.aktif && (
                          <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700">
                            Aktif
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-400">{bilgi.aciklama}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {mevcut?.apiAnahtari && !duzenlemede && (
                      <span className="text-xs text-gray-500">
                        API: {mevcut.apiAnahtari}
                      </span>
                    )}
                    {!duzenlemede && (
                      <button
                        onClick={() => duzenleyeBasla(bilgi.id)}
                        className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs text-gray-600 hover:bg-gray-50"
                      >
                        Düzenle
                      </button>
                    )}
                  </div>
                </div>

                {/* Bilgi Linki */}
                <p className="mt-2 text-xs text-gray-400">{bilgi.linkMetni}</p>

                {/* Durum Satırı */}
                {testSonucu && !duzenlemede && (
                  <div
                    className={`mt-3 rounded-lg px-3 py-2 text-xs ${
                      testSonucu.basarili
                        ? 'bg-green-50 text-green-700'
                        : 'bg-red-50 text-red-600'
                    }`}
                  >
                    {testSonucu.basarili
                      ? `Bağlantı başarılı — ${testSonucu.sure}ms`
                      : `Bağlantı hatası: ${testSonucu.hata}`}
                  </div>
                )}

                {/* Düzenleme Formu */}
                {duzenlemede && (
                  <div className="mt-4 space-y-3 border-t border-gray-100 pt-4">
                    {/* API Anahtarı veya Base URL */}
                    {bilgi.ollamaBaseUrl ? (
                      <div>
                        <label className="mb-1 block text-xs font-medium text-gray-600">Base URL</label>
                        <input
                          type="text"
                          value={geciciUrllar[bilgi.id] ?? 'http://localhost:11434'}
                          onChange={e => setGeciciUrllar(prev => ({ ...prev, [bilgi.id]: e.target.value }))}
                          placeholder="http://localhost:11434"
                          className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-green-400 focus:outline-none"
                        />
                      </div>
                    ) : (
                      <div>
                        <label className="mb-1 block text-xs font-medium text-gray-600">API Anahtarı</label>
                        <input
                          type="password"
                          value={geciciAnahtarlar[bilgi.id] ?? ''}
                          onChange={e => setGeciciAnahtarlar(prev => ({ ...prev, [bilgi.id]: e.target.value }))}
                          placeholder={bilgi.apiKeyPlaceholder ?? ''}
                          className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-green-400 focus:outline-none"
                        />
                        {mevcut?.apiAnahtari && (
                          <p className="mt-1 text-xs text-gray-400">
                            Mevcut: {mevcut.apiAnahtari} (değiştirmek için yeni anahtar girin)
                          </p>
                        )}
                      </div>
                    )}

                    {/* Varsayılan Model */}
                    <div>
                      <label className="mb-1 block text-xs font-medium text-gray-600">Varsayılan Model</label>
                      <select
                        value={geciciModeller[bilgi.id] ?? ''}
                        onChange={e => setGeciciModeller(prev => ({ ...prev, [bilgi.id]: e.target.value }))}
                        className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-green-400 focus:outline-none"
                      >
                        <option value="">Model seçin</option>
                        {modeller.map(m => (
                          <option key={m.id} value={m.id}>
                            {m.ad} {m.ucretsiz ? '(Ücretsiz)' : ''}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Butonlar */}
                    <div className="flex gap-2">
                      <button
                        onClick={() => ayarKaydet(bilgi.id, true)}
                        disabled={kayitYukleniyor[bilgi.id]}
                        className="rounded-lg bg-green-600 px-4 py-2 text-xs font-medium text-white hover:bg-green-700 disabled:opacity-50"
                      >
                        {kayitYukleniyor[bilgi.id] ? 'Kaydediliyor...' : 'Kaydet ve Etkinleştir'}
                      </button>
                      <button
                        onClick={() => ayarKaydet(bilgi.id, false)}
                        disabled={kayitYukleniyor[bilgi.id]}
                        className="rounded-lg border border-gray-200 px-4 py-2 text-xs text-gray-600 hover:bg-gray-50 disabled:opacity-50"
                      >
                        Kaydet
                      </button>
                      <button
                        onClick={() => duzenlemeyiIptal(bilgi.id)}
                        className="rounded-lg px-4 py-2 text-xs text-gray-400 hover:text-gray-600"
                      >
                        İptal
                      </button>
                    </div>
                  </div>
                )}

                {/* Test Butonu */}
                {!duzenlemede && (
                  <div className="mt-3 flex items-center gap-2">
                    <button
                      onClick={() => baglantiyiTest(bilgi.id)}
                      disabled={testYukleniyor[bilgi.id]}
                      className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs text-gray-600 hover:bg-gray-50 disabled:opacity-50"
                    >
                      {testYukleniyor[bilgi.id] ? 'Test ediliyor...' : 'Bağlantıyı Test Et'}
                    </button>
                    {mevcut?.varsayilanModel && (
                      <span className="text-xs text-gray-400">
                        Varsayılan: {mevcut.varsayilanModel}
                      </span>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
