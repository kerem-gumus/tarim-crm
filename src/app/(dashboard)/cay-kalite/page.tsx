'use client'
import { useCallback, useEffect, useState } from 'react'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
  ScatterChart, Scatter, ZAxis,
} from 'recharts'
import CayKaliteFormu from '@/components/caykalite/CayKaliteFormu'
import AiRaporBolumu from '@/components/rapor/AiRaporBolumu'

interface CayKalite {
  id: string
  tarih: string
  tarlaId: string | null
  toplamaYontemi: string
  agirlikKg: number | string
  yaprakNotu: number
  nemOrani: number | null
  fizikselHata: number | null
  renk: string | null
  koku: string | null
  genelNot: number
  havaScaklik: number | null
  havaNem: number | null
  notlar: string | null
  tarla?: { id: string; tarlaAdi: string; konumIlce: string } | null
}

const NOT_RENK: Record<number, string> = {
  1: 'bg-red-100 text-red-700',
  2: 'bg-orange-100 text-orange-700',
  3: 'bg-yellow-100 text-yellow-700',
  4: 'bg-green-100 text-green-700',
  5: 'bg-emerald-100 text-emerald-700',
}

const NOT_YILDIZ = (not: number) => '★'.repeat(not) + '☆'.repeat(5 - not)

export default function CayKaliteSayfasi() {
  const [kayitlar, setKayitlar] = useState<CayKalite[]>([])
  const [yukleniyor, setYukleniyor] = useState(true)
  const [formAcik, setFormAcik] = useState(false)
  const [seciliKayit, setSeciliKayit] = useState<CayKalite | null>(null)
  const [silOnayId, setSilOnayId] = useState<string | null>(null)
  const [siliniyor, setSiliniyor] = useState(false)
  const [aktifSekme, setAktifSekme] = useState<'liste' | 'analiz'>('liste')

  const kayitlariGetir = useCallback(async () => {
    setYukleniyor(true)
    try {
      const yanit = await fetch('/api/cay-kalite')
      const veri = await yanit.json()
      setKayitlar(Array.isArray(veri) ? veri : [])
    } finally {
      setYukleniyor(false)
    }
  }, [])

  useEffect(() => { kayitlariGetir() }, [kayitlariGetir])

  async function sil(id: string) {
    setSiliniyor(true)
    try {
      await fetch(`/api/cay-kalite/${id}`, { method: 'DELETE' })
      setSilOnayId(null)
      await kayitlariGetir()
    } finally {
      setSiliniyor(false)
    }
  }

  // Analiz verileri
  const grafik = [...kayitlar]
    .sort((a, b) => new Date(a.tarih).getTime() - new Date(b.tarih).getTime())
    .slice(-30)
    .map((k) => ({
      tarih: new Date(k.tarih).toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit' }),
      yaprakNotu: k.yaprakNotu,
      genelNot: k.genelNot,
      nem: k.nemOrani ? Number(k.nemOrani) : null,
      agirlik: Number(k.agirlikKg),
      havaScaklik: k.havaScaklik ? Number(k.havaScaklik) : null,
      havaNem: k.havaNem ? Number(k.havaNem) : null,
    }))

  const ortalamalar = kayitlar.length > 0
    ? {
        yaprak: (kayitlar.reduce((s, k) => s + k.yaprakNotu, 0) / kayitlar.length).toFixed(1),
        genel: (kayitlar.reduce((s, k) => s + k.genelNot, 0) / kayitlar.length).toFixed(1),
        agirlik: (kayitlar.reduce((s, k) => s + Number(k.agirlikKg), 0) / kayitlar.length).toFixed(0),
      }
    : null

  // Hava-kalite korelasyon scatter verisi
  const korelasyon = kayitlar
    .filter((k) => k.havaNem !== null)
    .map((k) => ({
      x: Number(k.havaNem),
      y: k.genelNot,
      z: Number(k.agirlikKg),
    }))

  return (
    <div className="p-6 space-y-5">
      {/* Başlık + butonlar */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">{kayitlar.length} kalite kaydı</p>
        <button
          onClick={() => { setSeciliKayit(null); setFormAcik(true) }}
          className="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700"
        >
          + Yeni Kalite Kaydı
        </button>
      </div>

      {/* Özet kartlar */}
      {ortalamalar && (
        <div className="grid grid-cols-3 gap-4">
          <div className="rounded-xl bg-white border p-4">
            <p className="text-xs text-gray-500 mb-1">Ort. Yaprak Notu</p>
            <p className="text-2xl font-bold text-green-600">{ortalamalar.yaprak} / 5</p>
          </div>
          <div className="rounded-xl bg-white border p-4">
            <p className="text-xs text-gray-500 mb-1">Ort. Genel Not</p>
            <p className="text-2xl font-bold text-blue-600">{ortalamalar.genel} / 5</p>
          </div>
          <div className="rounded-xl bg-white border p-4">
            <p className="text-xs text-gray-500 mb-1">Ort. Ağırlık</p>
            <p className="text-2xl font-bold text-gray-700">{ortalamalar.agirlik} kg</p>
          </div>
        </div>
      )}

      {/* Sekmeler */}
      <div className="flex gap-2">
        {(['liste', 'analiz'] as const).map((sekme) => (
          <button
            key={sekme}
            onClick={() => setAktifSekme(sekme)}
            className={`rounded-full px-4 py-1.5 text-xs font-medium transition-colors ${
              aktifSekme === sekme
                ? 'bg-green-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {sekme === 'liste' ? 'Kayıtlar' : 'Analiz'}
          </button>
        ))}
      </div>

      {aktifSekme === 'liste' && (
        <>
          {yukleniyor ? (
            <div className="flex items-center justify-center py-20 text-gray-400">Yükleniyor...</div>
          ) : kayitlar.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-gray-400">
              <p className="text-lg">Henüz kalite kaydı yok.</p>
              <button
                onClick={() => { setSeciliKayit(null); setFormAcik(true) }}
                className="mt-3 text-sm text-green-600 hover:underline"
              >
                İlk kalite kaydını ekle →
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-xl border bg-white shadow-sm">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-gray-50 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                    <th className="px-4 py-3">Tarih</th>
                    <th className="px-4 py-3">Tarla</th>
                    <th className="px-4 py-3">Yöntem</th>
                    <th className="px-4 py-3">Ağırlık</th>
                    <th className="px-4 py-3">Yaprak</th>
                    <th className="px-4 py-3">Nem %</th>
                    <th className="px-4 py-3">Hata %</th>
                    <th className="px-4 py-3">Genel</th>
                    <th className="px-4 py-3 text-right">İşlem</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {kayitlar.map((k) => (
                    <tr key={k.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3 text-gray-600">
                        {new Date(k.tarih).toLocaleDateString('tr-TR')}
                      </td>
                      <td className="px-4 py-3 text-gray-700 font-medium">
                        {k.tarla ? `${k.tarla.tarlaAdi} (${k.tarla.konumIlce})` : '—'}
                      </td>
                      <td className="px-4 py-3 text-gray-600 capitalize">
                        {k.toplamaYontemi}
                      </td>
                      <td className="px-4 py-3 text-gray-700">
                        {Number(k.agirlikKg).toFixed(1)} kg
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${NOT_RENK[k.yaprakNotu]}`}>
                          {NOT_YILDIZ(k.yaprakNotu)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-600">
                        {k.nemOrani != null ? `%${Number(k.nemOrani).toFixed(1)}` : '—'}
                      </td>
                      <td className="px-4 py-3 text-gray-600">
                        {k.fizikselHata != null ? `%${Number(k.fizikselHata).toFixed(1)}` : '—'}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${NOT_RENK[k.genelNot]}`}>
                          {k.genelNot}/5
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => { setSeciliKayit(k); setFormAcik(true) }}
                          className="mr-2 rounded px-2 py-1 text-xs font-medium text-blue-600 hover:bg-blue-50"
                        >
                          Düzenle
                        </button>
                        {silOnayId === k.id ? (
                          <span className="inline-flex gap-1">
                            <button
                              onClick={() => sil(k.id)}
                              disabled={siliniyor}
                              className="rounded px-2 py-1 text-xs font-medium text-red-600 hover:bg-red-50 disabled:opacity-50"
                            >
                              {siliniyor ? '...' : 'Evet'}
                            </button>
                            <button
                              onClick={() => setSilOnayId(null)}
                              className="rounded px-2 py-1 text-xs font-medium text-gray-500 hover:bg-gray-100"
                            >
                              İptal
                            </button>
                          </span>
                        ) : (
                          <button
                            onClick={() => setSilOnayId(k.id)}
                            className="rounded px-2 py-1 text-xs font-medium text-red-500 hover:bg-red-50"
                          >
                            Sil
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {aktifSekme === 'analiz' && (
        <div className="space-y-6">
          {grafik.length < 2 ? (
            <div className="flex items-center justify-center py-20 text-gray-400">
              Analiz için en az 2 kayıt gereklidir.
            </div>
          ) : (
            <>
              {/* Kalite trendi */}
              <div className="bg-white rounded-xl border p-5">
                <h3 className="text-sm font-semibold text-gray-700 mb-4">Kalite Trendi (Son 30 Gün)</h3>
                <ResponsiveContainer width="100%" height={260}>
                  <LineChart data={grafik}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="tarih" tick={{ fontSize: 11 }} />
                    <YAxis domain={[0, 5]} ticks={[1, 2, 3, 4, 5]} tick={{ fontSize: 11 }} />
                    <Tooltip
                      formatter={(deger, isim) => [
                        `${deger}`,
                        isim === 'yaprakNotu' ? 'Yaprak Notu' : 'Genel Not',
                      ]}
                    />
                    <Legend formatter={(v) => v === 'yaprakNotu' ? 'Yaprak Notu' : 'Genel Not'} />
                    <Line type="monotone" dataKey="yaprakNotu" stroke="#16a34a" strokeWidth={2} dot={{ r: 4 }} />
                    <Line type="monotone" dataKey="genelNot" stroke="#2563eb" strokeWidth={2} dot={{ r: 4 }} strokeDasharray="5 5" />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              {/* Ağırlık trendi */}
              <div className="bg-white rounded-xl border p-5">
                <h3 className="text-sm font-semibold text-gray-700 mb-4">Hasat Ağırlığı Trendi (kg)</h3>
                <ResponsiveContainer width="100%" height={200}>
                  <LineChart data={grafik}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="tarih" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip formatter={(deger) => [`${deger} kg`, 'Ağırlık']} />
                    <Line type="monotone" dataKey="agirlik" stroke="#f59e0b" strokeWidth={2} dot={{ r: 3 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              {/* Hava nem - kalite korelasyonu */}
              {korelasyon.length >= 3 && (
                <div className="bg-white rounded-xl border p-5">
                  <h3 className="text-sm font-semibold text-gray-700 mb-1">Hava Nemi vs Kalite Korelasyonu</h3>
                  <p className="text-xs text-gray-400 mb-4">X: Hava nemi (%), Y: Genel not, boyut: ağırlık</p>
                  <ResponsiveContainer width="100%" height={220}>
                    <ScatterChart>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis dataKey="x" name="Hava Nemi" unit="%" tick={{ fontSize: 11 }} domain={['auto', 'auto']} />
                      <YAxis dataKey="y" name="Genel Not" domain={[0, 5]} ticks={[1, 2, 3, 4, 5]} tick={{ fontSize: 11 }} />
                      <ZAxis dataKey="z" range={[40, 200]} />
                      <Tooltip
                        cursor={{ strokeDasharray: '3 3' }}
                        formatter={(deger, isim) => {
                          if (isim === 'x') return [`%${deger}`, 'Hava Nemi']
                          if (isim === 'y') return [String(deger), 'Genel Not']
                          return [String(deger), isim]
                        }}
                      />
                      <Scatter data={korelasyon} fill="#16a34a" fillOpacity={0.7} />
                    </ScatterChart>
                  </ResponsiveContainer>
                </div>
              )}
              {/* AI Kalite Analizi */}
              {grafik.length >= 2 && (
                <AiRaporBolumu
                  tip="hasat"
                  veri={{ kayitlar: grafik, ortalamalar, korelasyon }}
                  ekBaglam="Çay kalite kaydı analizi — yaprak notu, genel not, hava-kalite korelasyonu"
                  baslik="Çay Kalite AI Analizi"
                />
              )}
            </>
          )}
        </div>
      )}

      {formAcik && (
        <CayKaliteFormu
          seciliKayit={seciliKayit}
          onKapat={() => { setFormAcik(false); setSeciliKayit(null) }}
          onKaydet={() => { setFormAcik(false); setSeciliKayit(null); kayitlariGetir() }}
        />
      )}
    </div>
  )
}
