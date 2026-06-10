'use client'

import { useCallback, useEffect, useState } from 'react'

interface Tarla { id: string; tarlaAdi: string; konumIl: string; konumIlce: string }
interface ToprakAnaliz {
  ph: number | null; organikMadde: number | null; azot: number | null
  fosfor: number | null; potasyum: number | null; kalsiyum: number | null
  magnezyum: number | null; sonucTarihi: string
  aiAnaliz: string | null
}
interface ToprakNumune {
  id: string; tarlaId: string; yil: number; numuneNo: number
  barkod: string; alinmaTarihi: string; durum: 'beklemede' | 'sonuclandi'
  tarla: { id: string; tarlaAdi: string; konumIl: string; konumIlce: string }
  sonuc: ToprakAnaliz | null
}

function sayiGoster(deger: number | null, birim = '') {
  if (deger == null) return <span className="text-gray-300">—</span>
  return <span>{deger}{birim}</span>
}

function phRenk(ph: number | null) {
  if (ph == null) return 'text-gray-400'
  if (ph < 4.5) return 'text-red-600'
  if (ph > 5.5) return 'text-orange-500'
  return 'text-green-600'
}

// ─── Barkod Bileşeni ───────────────────────────────────────────────────────────
function BarkodYazdir({ barkod }: { barkod: string }) {
  function yazdir() {
    const yeni = window.open('', '_blank')
    if (!yeni) return
    yeni.document.write(`<html><body>
      <div style="text-align:center;font-family:monospace;padding:20px">
        <div style="font-size:10px;letter-spacing:2px;margin-bottom:4px">${barkod}</div>
        <svg id="bc"></svg>
      </div>
      <script>
        // Basit Code128 benzeri barkod görselleştirmesi
        const s=document.getElementById('bc');
        s.setAttribute('viewBox','0 0 200 60');
        s.setAttribute('width','200');s.setAttribute('height','60');
        const txt="${barkod}";
        for(let i=0;i<txt.length;i++){
          const r=document.createElementNS('http://www.w3.org/2000/svg','rect');
          r.setAttribute('x',String(i*3));r.setAttribute('y','0');
          r.setAttribute('width',txt.charCodeAt(i)%2===0?'2':'1');
          r.setAttribute('height','50');r.setAttribute('fill','black');
          s.appendChild(r);
        }
      </script>
      </body></html>`)
    setTimeout(() => { yeni.print(); yeni.close() }, 300)
  }
  return (
    <button onClick={yazdir}
      className="text-xs text-blue-600 hover:underline font-mono">
      {barkod} 🖨️
    </button>
  )
}

// ─── Sonuç Formu ───────────────────────────────────────────────────────────────
function SonucFormu({
  numune, onKaydet, onKapat,
}: { numune: ToprakNumune; onKaydet: () => void; onKapat: () => void }) {
  const [form, setForm] = useState({
    ph: numune.sonuc?.ph?.toString() ?? '',
    organikMadde: numune.sonuc?.organikMadde?.toString() ?? '',
    azot: numune.sonuc?.azot?.toString() ?? '',
    fosfor: numune.sonuc?.fosfor?.toString() ?? '',
    potasyum: numune.sonuc?.potasyum?.toString() ?? '',
    kalsiyum: numune.sonuc?.kalsiyum?.toString() ?? '',
    magnezyum: numune.sonuc?.magnezyum?.toString() ?? '',
    sonucTarihi: numune.sonuc?.sonucTarihi?.split('T')[0] ?? new Date().toISOString().split('T')[0],
    birlesik: false,
  })
  const [kaydediliyor, setKaydediliyor] = useState(false)
  const [hata, setHata] = useState('')

  function sayi(v: string) { return v ? Number(v) : null }

  async function kaydet() {
    setKaydediliyor(true); setHata('')
    try {
      const yanit = await fetch(`/api/toprak-analiz/${numune.id}/sonuc`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ph: sayi(form.ph), organikMadde: sayi(form.organikMadde),
          azot: sayi(form.azot), fosfor: sayi(form.fosfor),
          potasyum: sayi(form.potasyum), kalsiyum: sayi(form.kalsiyum),
          magnezyum: sayi(form.magnezyum), sonucTarihi: form.sonucTarihi,
          birlesik: form.birlesik,
        }),
      })
      if (!yanit.ok) { const v = await yanit.json(); setHata(v.hata ?? 'Hata'); return }
      onKaydet()
    } catch { setHata('Bağlantı hatası') } finally { setKaydediliyor(false) }
  }

  const gi = (alan: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm(p => ({ ...p, [alan]: e.target.type === 'checkbox' ? e.target.checked : e.target.value } as typeof form))

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-sm max-h-[90vh] overflow-y-auto rounded-xl bg-white p-5 shadow-xl space-y-3">
        <h3 className="text-sm font-semibold text-gray-800">
          Lab Sonucu — Numune #{numune.numuneNo} ({numune.tarla.tarlaAdi})
        </h3>

        <div className="grid grid-cols-2 gap-2 text-xs">
          {[
            { alan: 'ph', etiket: 'pH' },
            { alan: 'organikMadde', etiket: 'Organik Madde (%)' },
            { alan: 'azot', etiket: 'Azot N (mg/kg)' },
            { alan: 'fosfor', etiket: 'Fosfor P (mg/kg)' },
            { alan: 'potasyum', etiket: 'Potasyum K (mg/kg)' },
            { alan: 'kalsiyum', etiket: 'Kalsiyum (mg/kg)' },
            { alan: 'magnezyum', etiket: 'Magnezyum (mg/kg)' },
          ].map(({ alan, etiket }) => (
            <div key={alan}>
              <label className="block text-gray-500 mb-0.5">{etiket}</label>
              <input type="number" step="0.01"
                value={String((form as Record<string, unknown>)[alan] ?? '')}
                onChange={gi(alan as keyof typeof form)}
                placeholder="—"
                className="w-full rounded border border-gray-300 px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-green-500" />
            </div>
          ))}
          <div className="col-span-2">
            <label className="block text-gray-500 mb-0.5">Sonuç Tarihi</label>
            <input type="date" value={form.sonucTarihi} onChange={gi('sonucTarihi')}
              className="w-full rounded border border-gray-300 px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-green-500" />
          </div>
        </div>

        <label className="flex items-center gap-2 cursor-pointer">
          <input type="checkbox" checked={form.birlesik}
            onChange={(e) => setForm(p => ({ ...p, birlesik: e.target.checked }))}
            className="accent-green-600" />
          <span className="text-xs text-gray-600">Birleşik sonuç — aynı tarla+yıl tüm numunelere yaz</span>
        </label>

        {hata && <p className="text-xs text-red-600 bg-red-50 px-2 py-1 rounded">{hata}</p>}

        <div className="flex gap-2 pt-1">
          <button onClick={onKapat} className="flex-1 rounded-lg border border-gray-300 py-1.5 text-xs text-gray-600 hover:bg-gray-50">İptal</button>
          <button onClick={kaydet} disabled={kaydediliyor}
            className="flex-1 rounded-lg bg-green-600 py-1.5 text-xs font-medium text-white hover:bg-green-700 disabled:opacity-50">
            {kaydediliyor ? 'Kaydediliyor...' : 'Kaydet'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Yeni Numune Formu ─────────────────────────────────────────────────────────
function YeniNumuneFormu({
  tarlalar, onKaydet, onKapat,
}: { tarlalar: Tarla[]; onKaydet: () => void; onKapat: () => void }) {
  const [tarlaId, setTarlaId] = useState('')
  const [yil, setYil] = useState(new Date().getFullYear().toString())
  const [alinmaTarihi, setAlinmaTarihi] = useState(new Date().toISOString().split('T')[0])
  const [kaydediliyor, setKaydediliyor] = useState(false)
  const [hata, setHata] = useState('')

  async function kaydet() {
    if (!tarlaId) { setHata('Tarla seçiniz'); return }
    setKaydediliyor(true); setHata('')
    try {
      const yanit = await fetch('/api/toprak-analiz', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tarlaId, yil: Number(yil), alinmaTarihi }),
      })
      if (!yanit.ok) { const v = await yanit.json(); setHata(v.hata ?? 'Hata'); return }
      onKaydet()
    } catch { setHata('Bağlantı hatası') } finally { setKaydediliyor(false) }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-sm rounded-xl bg-white p-5 shadow-xl space-y-4">
        <h3 className="text-sm font-semibold text-gray-800">Yeni Toprak Numunesi (3 adet oluşturulur)</h3>

        <div>
          <label className="block text-xs text-gray-600 mb-1">Tarla *</label>
          <select value={tarlaId} onChange={(e) => setTarlaId(e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500">
            <option value="">Tarla seçin...</option>
            {tarlalar.map((t) => (
              <option key={t.id} value={t.id}>{t.tarlaAdi} ({t.konumIlce})</option>
            ))}
          </select>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs text-gray-600 mb-1">Yıl</label>
            <input type="number" value={yil} onChange={(e) => setYil(e.target.value)}
              min={2020} max={2035}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
          </div>
          <div>
            <label className="block text-xs text-gray-600 mb-1">Alınma Tarihi</label>
            <input type="date" value={alinmaTarihi} onChange={(e) => setAlinmaTarihi(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
          </div>
        </div>

        {hata && <p className="text-xs text-red-600 bg-red-50 px-2 py-1 rounded">{hata}</p>}

        <div className="flex gap-2">
          <button onClick={onKapat} className="flex-1 rounded-lg border border-gray-300 py-2 text-sm text-gray-600 hover:bg-gray-50">İptal</button>
          <button onClick={kaydet} disabled={kaydediliyor}
            className="flex-1 rounded-lg bg-green-600 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50">
            {kaydediliyor ? 'Oluşturuluyor...' : '3 Numune Oluştur'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Ana Sayfa ─────────────────────────────────────────────────────────────────
export default function ToprakAnalizSayfasi() {
  const [numuneler, setNumuneler] = useState<ToprakNumune[]>([])
  const [tarlalar, setTarlalar] = useState<Tarla[]>([])
  const [yukleniyor, setYukleniyor] = useState(true)
  const [filtreTarlaId, setFiltreTarlaId] = useState('')
  const [filtreYil, setFiltreYil] = useState('')
  const [yeniFormAcik, setYeniFormAcik] = useState(false)
  const [sonucFormuNumune, setSonucFormuNumune] = useState<ToprakNumune | null>(null)
  const [aiYuklenen, setAiYuklenen] = useState<string | null>(null)
  const [aiAnaliz, setAiAnaliz] = useState<Record<string, string>>({})

  const getir = useCallback(async () => {
    setYukleniyor(true)
    try {
      const p = new URLSearchParams()
      if (filtreTarlaId) p.set('tarlaId', filtreTarlaId)
      if (filtreYil) p.set('yil', filtreYil)
      const yanit = await fetch(`/api/toprak-analiz?${p}`)
      const veri = await yanit.json()
      if (Array.isArray(veri)) setNumuneler(veri)
    } finally { setYukleniyor(false) }
  }, [filtreTarlaId, filtreYil])

  useEffect(() => {
    getir()
    fetch('/api/tarlalar').then(r => r.json()).then(v => setTarlalar(Array.isArray(v) ? v : []))
  }, [getir])

  async function aiAnalizYap(numune: ToprakNumune) {
    setAiYuklenen(numune.id)
    try {
      const yanit = await fetch(`/api/toprak-analiz/${numune.id}/ai`, { method: 'POST' })
      const veri = await yanit.json()
      if (yanit.ok) {
        setAiAnaliz(p => ({ ...p, [numune.id]: veri.analiz }))
        getir() // sonucu DB'den yenilemek için
      }
    } finally { setAiYuklenen(null) }
  }

  const yillar = [...new Set(numuneler.map(n => n.yil))].sort((a, b) => b - a)

  return (
    <div className="min-h-full bg-gray-50">
      {/* Başlık */}
      <div className="flex items-center justify-between px-4 pt-4 pb-2 flex-wrap gap-2">
        <div>
          <h1 className="text-lg font-bold text-gray-800">Toprak Analizi</h1>
          <p className="text-xs text-gray-500">Tarla bazlı numune takibi, lab sonuçları ve AI gübre önerileri</p>
        </div>
        <button onClick={() => setYeniFormAcik(true)}
          className="rounded-lg bg-green-600 px-3 py-2 text-sm font-medium text-white hover:bg-green-700">
          + Numune Al
        </button>
      </div>

      {/* Filtreler */}
      <div className="px-4 pb-3 flex gap-3 flex-wrap">
        <select value={filtreTarlaId} onChange={(e) => setFiltreTarlaId(e.target.value)}
          className="rounded-lg border border-gray-300 px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-green-500 min-w-[140px]">
          <option value="">Tüm Tarlalar</option>
          {tarlalar.map((t) => <option key={t.id} value={t.id}>{t.tarlaAdi}</option>)}
        </select>
        <select value={filtreYil} onChange={(e) => setFiltreYil(e.target.value)}
          className="rounded-lg border border-gray-300 px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-green-500">
          <option value="">Tüm Yıllar</option>
          {yillar.map(y => <option key={y} value={y}>{y}</option>)}
        </select>
      </div>

      {/* Liste */}
      <div className="px-4 pb-8 space-y-3">
        {yukleniyor ? (
          <p className="text-center text-gray-400 py-12">Yükleniyor...</p>
        ) : numuneler.length === 0 ? (
          <div className="rounded-2xl border border-gray-100 bg-white p-12 text-center">
            <p className="text-sm text-gray-400 mb-3">Henüz toprak numunesi yok.</p>
            <button onClick={() => setYeniFormAcik(true)}
              className="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700">
              İlk Numuneyi Al
            </button>
          </div>
        ) : (
          // Tarla+yıl grubuna göre grupla
          Object.entries(
            numuneler.reduce((gruplar, n) => {
              const anahtar = `${n.tarlaId}-${n.yil}`
              if (!gruplar[anahtar]) gruplar[anahtar] = { tarla: n.tarla, yil: n.yil, numuneler: [] }
              gruplar[anahtar].numuneler.push(n)
              return gruplar
            }, {} as Record<string, { tarla: ToprakNumune['tarla']; yil: number; numuneler: ToprakNumune[] }>)
          ).map(([anahtar, grup]) => (
            <div key={anahtar} className="rounded-2xl border border-gray-200 bg-white overflow-hidden">
              {/* Grup başlığı */}
              <div className="bg-gray-50 border-b border-gray-100 px-4 py-3 flex items-center justify-between">
                <div>
                  <p className="font-semibold text-gray-800">{grup.tarla.tarlaAdi}</p>
                  <p className="text-xs text-gray-500">{grup.tarla.konumIl}/{grup.tarla.konumIlce} · {grup.yil} yılı</p>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                  grup.numuneler.every(n => n.durum === 'sonuclandi')
                    ? 'bg-green-100 text-green-700'
                    : 'bg-amber-100 text-amber-700'
                }`}>
                  {grup.numuneler.filter(n => n.durum === 'sonuclandi').length}/{grup.numuneler.length} Sonuçlandı
                </span>
              </div>

              {/* Numuneler tablosu */}
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-gray-100 text-gray-500">
                      <th className="px-4 py-2 text-left font-medium">Numune</th>
                      <th className="px-4 py-2 text-left font-medium">Barkod</th>
                      <th className="px-4 py-2 text-center font-medium">pH</th>
                      <th className="px-4 py-2 text-center font-medium">Org. Madde</th>
                      <th className="px-4 py-2 text-center font-medium">N</th>
                      <th className="px-4 py-2 text-center font-medium">P</th>
                      <th className="px-4 py-2 text-center font-medium">K</th>
                      <th className="px-4 py-2 text-center font-medium">Durum</th>
                      <th className="px-4 py-2 text-right font-medium">İşlem</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {grup.numuneler.map((n) => (
                      <tr key={n.id} className="hover:bg-gray-50">
                        <td className="px-4 py-2.5 font-medium text-gray-700">#{n.numuneNo}</td>
                        <td className="px-4 py-2.5"><BarkodYazdir barkod={n.barkod} /></td>
                        <td className={`px-4 py-2.5 text-center font-semibold ${phRenk(n.sonuc?.ph ?? null)}`}>
                          {sayiGoster(n.sonuc?.ph ?? null)}
                        </td>
                        <td className="px-4 py-2.5 text-center text-gray-600">
                          {sayiGoster(n.sonuc?.organikMadde ?? null, '%')}
                        </td>
                        <td className="px-4 py-2.5 text-center text-gray-600">{sayiGoster(n.sonuc?.azot ?? null)}</td>
                        <td className="px-4 py-2.5 text-center text-gray-600">{sayiGoster(n.sonuc?.fosfor ?? null)}</td>
                        <td className="px-4 py-2.5 text-center text-gray-600">{sayiGoster(n.sonuc?.potasyum ?? null)}</td>
                        <td className="px-4 py-2.5 text-center">
                          <span className={`rounded-full px-2 py-0.5 font-medium ${
                            n.durum === 'sonuclandi' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
                          }`}>
                            {n.durum === 'sonuclandi' ? 'Sonuçlandı' : 'Beklemede'}
                          </span>
                        </td>
                        <td className="px-4 py-2.5 text-right space-x-1">
                          <button onClick={() => setSonucFormuNumune(n)}
                            className="text-blue-600 hover:underline">
                            {n.durum === 'sonuclandi' ? 'Güncelle' : 'Sonuç Gir'}
                          </button>
                          {n.durum === 'sonuclandi' && (
                            <button onClick={() => aiAnalizYap(n)}
                              disabled={aiYuklenen === n.id}
                              className="text-purple-600 hover:underline disabled:opacity-50">
                              {aiYuklenen === n.id ? '...' : '🤖'}
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* AI Analiz Sonuçları */}
              {grup.numuneler.map((n) => {
                const analiz = aiAnaliz[n.id] ?? n.sonuc?.aiAnaliz
                if (!analiz) return null
                return (
                  <div key={`ai-${n.id}`} className="border-t border-purple-100 bg-purple-50 px-4 py-3">
                    <p className="text-xs font-semibold text-purple-700 mb-1">🤖 AI Analizi — Numune #{n.numuneNo}</p>
                    <p className="text-xs text-gray-700 whitespace-pre-wrap leading-relaxed">{analiz}</p>
                  </div>
                )
              })}
            </div>
          ))
        )}
      </div>

      {/* Formlar */}
      {yeniFormAcik && (
        <YeniNumuneFormu
          tarlalar={tarlalar}
          onKaydet={() => { setYeniFormAcik(false); getir() }}
          onKapat={() => setYeniFormAcik(false)}
        />
      )}
      {sonucFormuNumune && (
        <SonucFormu
          numune={sonucFormuNumune}
          onKaydet={() => { setSonucFormuNumune(null); getir() }}
          onKapat={() => setSonucFormuNumune(null)}
        />
      )}
    </div>
  )
}
