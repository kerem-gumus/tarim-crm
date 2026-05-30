'use client'

import { useState, useCallback, useEffect } from 'react'
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell,
} from 'recharts'

// ── Tipler ────────────────────────────────────────────────────────────────────

interface HasatDonemi {
  id: string; donemAdi: string; yil: number
  surgunler: { id: string; surgunAdi: string; surgunNo: number }[]
}

interface HasatGirisi {
  id: string; tarih: string; surgunAdi: string; donemAdi: string; donemYil: number
  tarlaAdi: string; tarlaDonum: number; ciftciAdSoyad: string
  ekipAdi: string | null; musteriAdi: string
  tartimMiktariKg: number; satisMiktariKg: number; toplanmaTuru: string
}

interface TarlaOzeti {
  tarlaAdi: string; ciftciAdSoyad: string; tarlaDonum: number
  toplamKg: number; toplamSatisKg: number; girisAdedi: number; kgPerDonum: number | null
}

interface GunlukVeri { tarih: string; kg: number }
interface EkipOzeti { ekipAdi: string; toplamKg: number; toplamTutar: number; odenenTutar: number; kayitSayisi: number; maliyetPerKg: number | null }

interface HasatRaporVeri {
  hasatGirisleri: HasatGirisi[]; tarlaOzeti: TarlaOzeti[]
  gunlukDagilim: GunlukVeri[]; ekipOzeti: EkipOzeti[]
  toplamKg: number; toplamSatisKg: number; toplam: number
}

interface GelirKaydi {
  id: string; surgunAdi: string; musteriAdi: string | null; toplamKg: number
  birimFiyat: number; toplamTutar: number; odenenTutar: number
  kalanTutar: number; odemeDurumu: string; kayitTarihi: string
}

interface OdemeKaydi {
  id: string; kategori: string; aciklama: string
  tutar: number; odenenTutar: number; odemeDurumu: string; kayitTarihi: string
}

interface FinansRaporVeri {
  gelirler: GelirKaydi[]; odemeler: OdemeKaydi[]
  toplamGelir: number; toplamGider: number; netKar: number
  aylikDagilim: { ay: string; gelir: number; gider: number; kar: number }[]
  giderKategoriDagilim: { kategori: string; tutar: number }[]
  odemeDurumuOzet: { odendi: number; kismiOdendi: number; bekliyor: number }
}

interface IscilikOdeme {
  id: string; aciklama: string; tutar: number; odenenTutar: number
  odemeDurumu: string; odemeTarihi: string | null; kayitTarihi: string
  ekipAdi: string | null; isciAdi: string | null
}

interface IscilikRaporVeri {
  iscilikOdemeleri: IscilikOdeme[]; ekipOzeti: EkipOzeti[]
  gunlukKarsilastirma: Record<string, number | string>[]; ekipler: string[]
  toplamTutar: number; toplamOdenen: number; toplam: number
}

interface Malzeme {
  id: string; malzemeAdi: string; kategori: string; birim: string
  mevcutStok: number; minimumStok: number; birimFiyat: number
  kritikMi: boolean; donemCikis: number; donemGiris: number
  donemHarcama: number; aylikKullanim: { ay: string; miktar: number }[]
  sonHareketler: { id: string; hareketTipi: string; miktar: number; tarih: string; olusturmaTarihi: string }[]
}

interface EnvanterRaporVeri {
  malzemeler: Malzeme[]
  kategoriOzeti: { kategori: string; toplamHarcama: number; toplamCikis: number; malzemeSayisi: number }[]
  kritikMalzemeler: Malzeme[]
  toplamHarcama: number; kritikSayisi: number; toplam: number
}

interface AracVeri {
  id: string; ekipmanAdi: string; plaka: string | null; marka: string | null; model: string | null
  kmSayaci: number | null; sonBakimTarihi: string | null; sonrakiBakimTarihi: string | null
  toplamGider: number; toplamGelir: number; netKar: number
  giderTipiDagilim: { tip: string; tutar: number }[]
  gelirTipiDagilim: { tip: string; tutar: number }[]
  aylikDagilim: { ay: string; gider: number; gelir: number; kar: number }[]
  onarimlar: { id: string; tarih: string; tutar: number; aciklama: string | null }[]
  yakit: number; bakim: number; onarim: number
}

interface AracRaporVeri {
  araclar: AracVeri[]; genelGider: number; genelGelir: number; genelKar: number; aracSayisi: number
}

// ── Yardımcılar ───────────────────────────────────────────────────────────────

function tarihFormat(tarihStr: string): string {
  if (!tarihStr) return '-'
  return new Date(tarihStr).toLocaleDateString('tr-TR')
}

function paraFormat(tutar: number): string {
  return new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(tutar)
}

function sayiFormat(sayi: number, ondalik = 1): string {
  return new Intl.NumberFormat('tr-TR', { minimumFractionDigits: ondalik, maximumFractionDigits: ondalik }).format(sayi)
}

function odemeDurumuRenk(durum: string): string {
  if (durum === 'odendi') return 'bg-green-100 text-green-700'
  if (durum === 'kismi_odendi') return 'bg-yellow-100 text-yellow-700'
  return 'bg-red-100 text-red-700'
}

function odemeDurumuEtiket(durum: string): string {
  if (durum === 'odendi') return 'Ödendi'
  if (durum === 'kismi_odendi') return 'Kısmen'
  return 'Bekliyor'
}

const GRAFIKRENK = ['#16a34a', '#2563eb', '#d97706', '#dc2626', '#7c3aed', '#0891b2', '#ea580c', '#4f46e5']

function ayFormat(ay: string): string {
  const [yil, ay2] = ay.split('-')
  const aylar = ['', 'Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz', 'Tem', 'Ağu', 'Eyl', 'Eki', 'Kas', 'Ara']
  return `${aylar[parseInt(ay2)]} ${yil.slice(2)}`
}

function kategoriEtiket(k: string): string {
  const map: Record<string, string> = {
    iscilik: 'İşçilik', yemek: 'Yemek', malzeme: 'Malzeme',
    yakit: 'Yakıt', gubre: 'Gübre', diger: 'Diğer',
    yakıt: 'Yakıt', bakim: 'Bakım', onarim: 'Onarım',
    lastik: 'Lastik', sigorta: 'Sigorta', vergi: 'Vergi/Muayene',
    yedek_parca: 'Yedek Parça', nakliye: 'Nakliye', kiralama: 'Kiralama', hizmet: 'Hizmet',
  }
  return map[k] ?? k
}

// ── Özet Kart ─────────────────────────────────────────────────────────────────

function OzetKart({ baslik, deger, renk, alt }: { baslik: string; deger: string; renk: string; alt?: string }) {
  return (
    <div className={`rounded-xl p-4 ${renk}`}>
      <p className="text-xs font-medium opacity-70">{baslik}</p>
      <p className="text-xl font-bold mt-1 leading-tight">{deger}</p>
      {alt && <p className="text-xs opacity-60 mt-0.5">{alt}</p>}
    </div>
  )
}

// ── Filtre Paneli (sticky bar) ─────────────────────────────────────────────────

function FiltrePaneli({
  children,
  onFiltrele,
  yukleniyor,
}: { children: React.ReactNode; onFiltrele: () => void; yukleniyor: boolean }) {
  return (
    <div className="sticky top-0 z-10 bg-white border-b border-gray-100 shadow-sm">
      <div className="flex flex-wrap items-end gap-3 p-3 bg-gray-50">
        {children}
        <button
          onClick={onFiltrele}
          disabled={yukleniyor}
          className="w-full sm:w-auto px-5 py-2.5 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-50 transition-colors"
        >
          {yukleniyor ? 'Yükleniyor...' : 'Raporu Getir'}
        </button>
      </div>
    </div>
  )
}

function TarihInput({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div className="flex-1 min-w-[140px]">
      <label className="block text-xs text-gray-500 mb-1">{label}</label>
      <input
        type="date" value={value} onChange={(e) => onChange(e.target.value)}
        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-300"
      />
    </div>
  )
}

function SelectInput({ label, value, onChange, children }: {
  label: string; value: string; onChange: (v: string) => void; children: React.ReactNode
}) {
  return (
    <div className="flex-1 min-w-[140px]">
      <label className="block text-xs text-gray-500 mb-1">{label}</label>
      <select
        value={value} onChange={(e) => onChange(e.target.value)}
        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-300"
      >
        {children}
      </select>
    </div>
  )
}

// ── Hasat Raporu ──────────────────────────────────────────────────────────────

function HasatRaporu() {
  const [donemler, setDonemler] = useState<HasatDonemi[]>([])
  const [seciliDonemId, setSeciliDonemId] = useState('')
  const [seciliSurgunId, setSeciliSurgunId] = useState('')
  const [baslangic, setBaslangic] = useState('')
  const [bitis, setBitis] = useState('')
  const [veri, setVeri] = useState<HasatRaporVeri | null>(null)
  const [yukleniyor, setYukleniyor] = useState(false)
  const [hata, setHata] = useState<string | null>(null)
  const [aktifAlt, setAktifAlt] = useState<'tablo' | 'grafik'>('grafik')

  useEffect(() => {
    fetch('/api/hasat-donemleri')
      .then((r) => r.json())
      .then((d) => { if (Array.isArray(d)) setDonemler(d) })
      .catch(() => {})
  }, [])

  const seciliDonem = donemler.find((d) => d.id === seciliDonemId)

  const veriYukle = useCallback(async () => {
    setYukleniyor(true); setHata(null)
    try {
      const p = new URLSearchParams()
      if (seciliSurgunId) p.set('surgunId', seciliSurgunId)
      else if (seciliDonemId) p.set('hasatDonemiId', seciliDonemId)
      if (baslangic) p.set('baslangic', baslangic)
      if (bitis) p.set('bitis', bitis)
      const yanit = await fetch(`/api/raporlar/hasat?${p}`)
      if (!yanit.ok) throw new Error()
      setVeri(await yanit.json())
    } catch { setHata('Hasat raporu yüklenemedi.') }
    finally { setYukleniyor(false) }
  }, [seciliDonemId, seciliSurgunId, baslangic, bitis])

  const maxKg = veri ? Math.max(...veri.tarlaOzeti.map((t) => t.toplamKg), 1) : 1

  return (
    <div className="space-y-4">
      <FiltrePaneli onFiltrele={veriYukle} yukleniyor={yukleniyor}>
        <SelectInput label="Hasat Dönemi" value={seciliDonemId} onChange={(v) => { setSeciliDonemId(v); setSeciliSurgunId('') }}>
          <option value="">Tüm Dönemler</option>
          {donemler.map((d) => <option key={d.id} value={d.id}>{d.donemAdi} ({d.yil})</option>)}
        </SelectInput>
        {seciliDonem && seciliDonem.surgunler.length > 0 && (
          <SelectInput label="Sürgün" value={seciliSurgunId} onChange={setSeciliSurgunId}>
            <option value="">Tüm Sürgünler</option>
            {seciliDonem.surgunler.map((s) => <option key={s.id} value={s.id}>{s.surgunNo}. Sürgün — {s.surgunAdi}</option>)}
          </SelectInput>
        )}
        <TarihInput label="Başlangıç" value={baslangic} onChange={setBaslangic} />
        <TarihInput label="Bitiş" value={bitis} onChange={setBitis} />
      </FiltrePaneli>

      {hata && <p className="text-red-500 text-sm p-3 bg-red-50 rounded-lg mx-4">{hata}</p>}

      {!veri && !yukleniyor && !hata && (
        <div className="text-center py-16 text-gray-400 text-sm px-4">Dönem ve/veya tarih seçip &quot;Raporu Getir&quot; butonuna tıklayın</div>
      )}

      {veri && (
        <div className="px-4 space-y-4">
          {/* Özet kartlar — mobilde 2×n grid */}
          <div className="grid grid-cols-2 gap-3">
            <OzetKart baslik="Toplam Tartım" deger={`${sayiFormat(veri.toplamKg, 0)} kg`} renk="bg-green-50 text-green-800" />
            <OzetKart baslik="Toplam Satış" deger={`${sayiFormat(veri.toplamSatisKg, 0)} kg`} renk="bg-blue-50 text-blue-800" />
            <OzetKart baslik="Giriş Sayısı" deger={String(veri.toplam)} renk="bg-gray-50 text-gray-800" />
            <OzetKart baslik="Tarla Sayısı" deger={String(veri.tarlaOzeti.length)} renk="bg-amber-50 text-amber-800" />
          </div>

          {/* Alt sekme */}
          <div className="flex gap-2 border-b border-gray-200">
            {(['grafik', 'tablo'] as const).map((t) => (
              <button key={t} onClick={() => setAktifAlt(t)}
                className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${aktifAlt === t ? 'border-green-600 text-green-700' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
                {t === 'grafik' ? 'Grafikler' : 'Detay Tablo'}
              </button>
            ))}
          </div>

          {aktifAlt === 'grafik' && (
            <div className="space-y-5">
              {/* Tarla bazlı bar chart — tam genişlik, 200px yükseklik */}
              {veri.tarlaOzeti.length > 0 && (
                <div className="rounded-xl border border-gray-100 p-4">
                  <h4 className="text-sm font-semibold text-gray-700 mb-3">Tarla Bazlı Hasat (kg)</h4>
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={veri.tarlaOzeti.slice(0, 15)} margin={{ left: 0, right: 4 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis dataKey="tarlaAdi" tick={{ fontSize: 10 }} angle={-30} textAnchor="end" height={55} />
                      <YAxis tick={{ fontSize: 10 }} tickFormatter={(v) => `${(v / 1000).toFixed(0)}t`} width={30} />
                      <Tooltip formatter={(v: any) => [`${sayiFormat(Number(v ?? 0), 0)} kg`, "Tartım"]} />
                      <Bar dataKey="toplamKg" fill="#16a34a" radius={[4, 4, 0, 0]} name="Tartım kg" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}

              {/* Günlük dağılım — 200px */}
              {veri.gunlukDagilim.length > 1 && (
                <div className="rounded-xl border border-gray-100 p-4">
                  <h4 className="text-sm font-semibold text-gray-700 mb-3">Günlük Hasat Dağılımı</h4>
                  <ResponsiveContainer width="100%" height={200}>
                    <LineChart data={veri.gunlukDagilim} margin={{ left: 0, right: 4 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis dataKey="tarih" tick={{ fontSize: 9 }} tickFormatter={(v) => tarihFormat(v)} angle={-30} textAnchor="end" height={50} />
                      <YAxis tick={{ fontSize: 10 }} width={30} />
                      <Tooltip labelFormatter={(v: unknown) => tarihFormat(String(v))} formatter={(v: any) => [`${sayiFormat(v, 0)} kg`, 'Hasat']} />
                      <Line type="monotone" dataKey="kg" stroke="#16a34a" strokeWidth={2} dot={false} name="kg" />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              )}

              {/* Tarla özeti — masaüstü tablo / mobil kart listesi */}
              <div className="rounded-xl border border-gray-100 overflow-hidden">
                <div className="bg-gray-50 px-4 py-2.5 flex items-center justify-between">
                  <h4 className="text-sm font-semibold text-gray-700">Tarla Özeti</h4>
                  <span className="text-xs text-gray-400">{veri.tarlaOzeti.length} tarla</span>
                </div>
                {/* Masaüstü tablo */}
                <div className="hidden md:block overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 border-t border-gray-100">
                      <tr className="text-left text-gray-500 text-xs uppercase tracking-wide">
                        <th className="px-4 py-2.5">Tarla</th>
                        <th className="px-4 py-2.5">Çiftçi</th>
                        <th className="px-4 py-2.5 text-right">Dönüm</th>
                        <th className="px-4 py-2.5 text-right">Toplam kg</th>
                        <th className="px-4 py-2.5 text-right">kg/Dönüm</th>
                        <th className="px-4 py-2.5 text-right">Giriş</th>
                        <th className="px-4 py-2.5">Pay</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {veri.tarlaOzeti.map((t) => (
                        <tr key={t.tarlaAdi} className="hover:bg-gray-50">
                          <td className="px-4 py-2.5 font-medium text-gray-800">{t.tarlaAdi}</td>
                          <td className="px-4 py-2.5 text-gray-600 text-xs">{t.ciftciAdSoyad}</td>
                          <td className="px-4 py-2.5 text-right text-gray-600">{sayiFormat(t.tarlaDonum, 2)}</td>
                          <td className="px-4 py-2.5 text-right font-semibold text-gray-800">{sayiFormat(t.toplamKg, 0)}</td>
                          <td className="px-4 py-2.5 text-right text-gray-600">{t.kgPerDonum ? sayiFormat(t.kgPerDonum, 0) : '—'}</td>
                          <td className="px-4 py-2.5 text-right text-gray-500">{t.girisAdedi}</td>
                          <td className="px-4 py-2.5 w-32">
                            <div className="bg-gray-200 rounded-full h-1.5">
                              <div className="bg-green-500 h-1.5 rounded-full" style={{ width: `${(t.toplamKg / maxKg) * 100}%` }} />
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {/* Mobil kart listesi */}
                <div className="md:hidden divide-y divide-gray-100">
                  {veri.tarlaOzeti.map((t) => (
                    <div key={t.tarlaAdi} className="p-4 space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="font-semibold text-gray-800 text-sm">{t.tarlaAdi}</p>
                          <p className="text-xs text-gray-500">{t.ciftciAdSoyad}</p>
                        </div>
                        <span className="text-sm font-bold text-green-700 flex-shrink-0">{sayiFormat(t.toplamKg, 0)} kg</span>
                      </div>
                      <div className="grid grid-cols-3 gap-2 text-xs text-gray-600">
                        <div><span className="text-gray-400 block">Dönüm</span>{sayiFormat(t.tarlaDonum, 2)}</div>
                        <div><span className="text-gray-400 block">kg/Dönüm</span>{t.kgPerDonum ? sayiFormat(t.kgPerDonum, 0) : '—'}</div>
                        <div><span className="text-gray-400 block">Giriş</span>{t.girisAdedi}</div>
                      </div>
                      <div className="bg-gray-200 rounded-full h-1.5">
                        <div className="bg-green-500 h-1.5 rounded-full" style={{ width: `${(t.toplamKg / maxKg) * 100}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {aktifAlt === 'tablo' && (
            <div>
              {/* Masaüstü tablo */}
              <div className="hidden md:block overflow-x-auto rounded-xl border border-gray-100">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr className="text-left text-gray-500 text-xs uppercase tracking-wide">
                      <th className="px-4 py-3">Tarih</th>
                      <th className="px-4 py-3">Çiftçi</th>
                      <th className="px-4 py-3">Tarla</th>
                      <th className="px-4 py-3">Sürgün</th>
                      <th className="px-4 py-3">Ekip</th>
                      <th className="px-4 py-3">Müşteri</th>
                      <th className="px-4 py-3 text-right">Tartım kg</th>
                      <th className="px-4 py-3 text-right">Satış kg</th>
                      <th className="px-4 py-3">Tür</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {veri.hasatGirisleri.map((g) => (
                      <tr key={g.id} className="hover:bg-gray-50">
                        <td className="px-4 py-2.5 text-gray-500 text-xs">{tarihFormat(g.tarih)}</td>
                        <td className="px-4 py-2.5 font-medium text-gray-800">{g.ciftciAdSoyad}</td>
                        <td className="px-4 py-2.5 text-gray-600">{g.tarlaAdi}</td>
                        <td className="px-4 py-2.5 text-gray-600 text-xs">{g.surgunAdi}</td>
                        <td className="px-4 py-2.5 text-gray-500 text-xs">{g.ekipAdi ?? '—'}</td>
                        <td className="px-4 py-2.5 text-gray-600 text-xs">{g.musteriAdi}</td>
                        <td className="px-4 py-2.5 text-right font-semibold text-gray-800">{sayiFormat(g.tartimMiktariKg)}</td>
                        <td className="px-4 py-2.5 text-right text-gray-600">{sayiFormat(g.satisMiktariKg)}</td>
                        <td className="px-4 py-2.5">
                          <span className={`px-2 py-0.5 rounded text-xs font-medium ${g.toplanmaTuru === 'isci' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'}`}>
                            {g.toplanmaTuru === 'isci' ? 'İşçi' : 'Tarla Sahibi'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {/* Mobil kart listesi */}
              <div className="md:hidden space-y-3">
                {veri.hasatGirisleri.map((g) => (
                  <div key={g.id} className="rounded-xl border border-gray-100 p-4 space-y-2 bg-white">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="font-semibold text-gray-800 text-sm">{g.ciftciAdSoyad}</p>
                        <p className="text-xs text-gray-500">{g.tarlaAdi} · {tarihFormat(g.tarih)}</p>
                      </div>
                      <span className={`px-2 py-0.5 rounded text-xs font-medium flex-shrink-0 ${g.toplanmaTuru === 'isci' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'}`}>
                        {g.toplanmaTuru === 'isci' ? 'İşçi' : 'Tarla Sahibi'}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs text-gray-600">
                      <div><span className="text-gray-400 block">Tartım</span><span className="font-semibold text-gray-800">{sayiFormat(g.tartimMiktariKg)} kg</span></div>
                      <div><span className="text-gray-400 block">Satış</span>{sayiFormat(g.satisMiktariKg)} kg</div>
                      <div><span className="text-gray-400 block">Sürgün</span>{g.surgunAdi}</div>
                      <div><span className="text-gray-400 block">Ekip</span>{g.ekipAdi ?? '—'}</div>
                    </div>
                    {g.musteriAdi && <p className="text-xs text-gray-500">Müşteri: {g.musteriAdi}</p>}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ── Finans Raporu ─────────────────────────────────────────────────────────────

function FinansRaporu() {
  const [veri, setVeri] = useState<FinansRaporVeri | null>(null)
  const [yukleniyor, setYukleniyor] = useState(false)
  const [hata, setHata] = useState<string | null>(null)
  const [baslangic, setBaslangic] = useState('')
  const [bitis, setBitis] = useState('')

  const veriYukle = useCallback(async () => {
    setYukleniyor(true); setHata(null)
    try {
      const p = new URLSearchParams()
      if (baslangic) p.set('baslangic', baslangic)
      if (bitis) p.set('bitis', bitis)
      const yanit = await fetch(`/api/raporlar/finans?${p}`)
      if (!yanit.ok) throw new Error()
      setVeri(await yanit.json())
    } catch { setHata('Finans raporu yüklenemedi.') }
    finally { setYukleniyor(false) }
  }, [baslangic, bitis])

  return (
    <div className="space-y-4">
      <FiltrePaneli onFiltrele={veriYukle} yukleniyor={yukleniyor}>
        <TarihInput label="Başlangıç" value={baslangic} onChange={setBaslangic} />
        <TarihInput label="Bitiş" value={bitis} onChange={setBitis} />
      </FiltrePaneli>

      {hata && <p className="text-red-500 text-sm p-3 bg-red-50 rounded-lg mx-4">{hata}</p>}
      {!veri && !yukleniyor && !hata && <div className="text-center py-16 text-gray-400 text-sm px-4">Filtreleyip &quot;Raporu Getir&quot; tıklayın</div>}

      {veri && (
        <div className="px-4 space-y-4">
          {/* Özet kartlar — mobilde 2×2 grid */}
          <div className="grid grid-cols-2 gap-3">
            <OzetKart baslik="Toplam Gelir" deger={paraFormat(veri.toplamGelir)} renk="bg-green-50 text-green-800" />
            <OzetKart baslik="Toplam Gider" deger={paraFormat(veri.toplamGider)} renk="bg-red-50 text-red-800" />
            <OzetKart baslik="Net Kâr" deger={paraFormat(veri.netKar)} renk={veri.netKar >= 0 ? 'bg-blue-50 text-blue-800' : 'bg-orange-50 text-orange-800'} />
            <div className="rounded-xl p-4 bg-green-50">
              <p className="text-xs font-medium text-green-700 opacity-70">Tahsil Edildi</p>
              <p className="text-xl font-bold mt-1 leading-tight text-green-800">{paraFormat(veri.odemeDurumuOzet.odendi)}</p>
            </div>
          </div>

          {/* Ödeme durumu özeti — 2 sütun */}
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-lg bg-yellow-50 border border-yellow-100 p-3 text-center">
              <p className="text-xs text-yellow-600">Kısmen Tahsil</p>
              <p className="text-base font-bold text-yellow-700">{paraFormat(veri.odemeDurumuOzet.kismiOdendi)}</p>
            </div>
            <div className="rounded-lg bg-red-50 border border-red-100 p-3 text-center">
              <p className="text-xs text-red-600">Bekleyen Alacak</p>
              <p className="text-base font-bold text-red-700">{paraFormat(veri.odemeDurumuOzet.bekliyor)}</p>
            </div>
          </div>

          {/* Aylık gelir/gider — tam genişlik, 200px */}
          {veri.aylikDagilim.length > 0 && (
            <div className="rounded-xl border border-gray-100 p-4">
              <h4 className="text-sm font-semibold text-gray-700 mb-3">Aylık Gelir / Gider</h4>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={veri.aylikDagilim} margin={{ left: 0, right: 4 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="ay" tickFormatter={ayFormat} tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} tickFormatter={(v) => `${(v / 1000).toFixed(0)}K`} width={30} />
                  <Tooltip labelFormatter={(v: unknown) => ayFormat(String(v))} formatter={(v: any, n: any) => [paraFormat(Number(v ?? 0)), n === 'gelir' ? 'Gelir' : n === 'gider' ? 'Gider' : 'Net Kâr']} />
                  <Legend formatter={(v) => v === 'gelir' ? 'Gelir' : v === 'gider' ? 'Gider' : 'Net Kâr'} />
                  <Bar dataKey="gelir" fill="#16a34a" radius={[3, 3, 0, 0]} name="gelir" />
                  <Bar dataKey="gider" fill="#dc2626" radius={[3, 3, 0, 0]} name="gider" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Net kâr çizgisi — 180px */}
          {veri.aylikDagilim.length > 1 && (
            <div className="rounded-xl border border-gray-100 p-4">
              <h4 className="text-sm font-semibold text-gray-700 mb-3">Aylık Net Kâr Eğrisi</h4>
              <ResponsiveContainer width="100%" height={180}>
                <LineChart data={veri.aylikDagilim} margin={{ left: 0, right: 4 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="ay" tickFormatter={ayFormat} tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} tickFormatter={(v) => `${(v / 1000).toFixed(0)}K`} width={30} />
                  <Tooltip labelFormatter={(v: unknown) => ayFormat(String(v))} formatter={(v: any) => [paraFormat(Number(v ?? 0)), 'Net Kâr']} />
                  <Line type="monotone" dataKey="kar" stroke="#2563eb" strokeWidth={2} dot={{ r: 4 }} name="kar" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Gider kategori pasta */}
          {veri.giderKategoriDagilim.length > 0 && (
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="rounded-xl border border-gray-100 p-4">
                <h4 className="text-sm font-semibold text-gray-700 mb-3">Gider Dağılımı</h4>
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie data={veri.giderKategoriDagilim} dataKey="tutar" nameKey="kategori" cx="50%" cy="50%" outerRadius={75} label={(props: any) => props.percent > 0.05 ? `${kategoriEtiket(props.kategori)} ${((props.percent ?? 0) * 100).toFixed(0)}%` : ""} labelLine={false}>
                      {veri.giderKategoriDagilim.map((_, i) => <Cell key={i} fill={GRAFIKRENK[i % GRAFIKRENK.length]} />)}
                    </Pie>
                    <Tooltip formatter={(v: any) => paraFormat(Number(v ?? 0))} />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div className="rounded-xl border border-gray-100 p-4">
                <h4 className="text-sm font-semibold text-gray-700 mb-3">Kategori Detayı</h4>
                <div className="space-y-2">
                  {veri.giderKategoriDagilim.map((k, i) => (
                    <div key={k.kategori} className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: GRAFIKRENK[i % GRAFIKRENK.length] }} />
                        <span className="text-sm text-gray-700">{kategoriEtiket(k.kategori)}</span>
                      </div>
                      <span className="text-sm font-semibold text-gray-800">{paraFormat(k.tutar)}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Gelir kayıtları — masaüstü tablo / mobil kart */}
          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-gray-700">Gelir Kayıtları</h4>
            <div className="hidden md:block overflow-x-auto rounded-xl border border-gray-100">
              <table className="w-full text-sm">
                <thead className="bg-gray-50"><tr className="text-left text-gray-500 text-xs uppercase tracking-wide">
                  <th className="px-4 py-3">Sürgün</th><th className="px-4 py-3">Müşteri</th>
                  <th className="px-4 py-3 text-right">Toplam ₺</th><th className="px-4 py-3 text-right">Ödenen</th>
                  <th className="px-4 py-3 text-right">Kalan</th><th className="px-4 py-3">Durum</th>
                </tr></thead>
                <tbody className="divide-y divide-gray-50">
                  {veri.gelirler.map((g) => (
                    <tr key={g.id} className="hover:bg-gray-50">
                      <td className="px-4 py-2.5 font-medium text-gray-800">{g.surgunAdi}</td>
                      <td className="px-4 py-2.5 text-gray-600 text-xs">{g.musteriAdi ?? '—'}</td>
                      <td className="px-4 py-2.5 text-right font-semibold">{paraFormat(g.toplamTutar)}</td>
                      <td className="px-4 py-2.5 text-right text-green-600">{paraFormat(g.odenenTutar)}</td>
                      <td className="px-4 py-2.5 text-right text-orange-600">{paraFormat(g.kalanTutar)}</td>
                      <td className="px-4 py-2.5"><span className={`px-2 py-0.5 rounded text-xs font-medium ${odemeDurumuRenk(g.odemeDurumu)}`}>{odemeDurumuEtiket(g.odemeDurumu)}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="md:hidden space-y-3">
              {veri.gelirler.map((g) => (
                <div key={g.id} className="rounded-xl border border-gray-100 p-4 bg-white space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-semibold text-gray-800 text-sm">{g.surgunAdi}</p>
                      <p className="text-xs text-gray-500">{g.musteriAdi ?? '—'}</p>
                    </div>
                    <span className={`px-2 py-0.5 rounded text-xs font-medium flex-shrink-0 ${odemeDurumuRenk(g.odemeDurumu)}`}>{odemeDurumuEtiket(g.odemeDurumu)}</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-xs">
                    <div><span className="text-gray-400 block">Toplam</span><span className="font-semibold text-gray-800">{paraFormat(g.toplamTutar)}</span></div>
                    <div><span className="text-gray-400 block">Ödenen</span><span className="text-green-600">{paraFormat(g.odenenTutar)}</span></div>
                    <div><span className="text-gray-400 block">Kalan</span><span className="text-orange-600">{paraFormat(g.kalanTutar)}</span></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ── İşçilik Raporu ─────────────────────────────────────────────────────────────

function IscilikRaporu() {
  const [veri, setVeri] = useState<IscilikRaporVeri | null>(null)
  const [donemler, setDonemler] = useState<HasatDonemi[]>([])
  const [ekipler, setEkipler] = useState<{ id: string; ekipAdi: string }[]>([])
  const [baslangic, setBaslangic] = useState('')
  const [bitis, setBitis] = useState('')
  const [seciliEkipId, setSeciliEkipId] = useState('')
  const [seciliDonemId, setSeciliDonemId] = useState('')
  const [seciliSurgunId, setSeciliSurgunId] = useState('')
  const [yukleniyor, setYukleniyor] = useState(false)
  const [hata, setHata] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/hasat-donemleri').then((r) => r.json()).then((d) => { if (Array.isArray(d)) setDonemler(d) }).catch(() => {})
    fetch('/api/ekipler').then((r) => r.json()).then((d) => { if (Array.isArray(d)) setEkipler(d) }).catch(() => {})
  }, [])

  const seciliDonem = donemler.find((d) => d.id === seciliDonemId)

  const veriYukle = useCallback(async () => {
    setYukleniyor(true); setHata(null)
    try {
      const p = new URLSearchParams()
      if (baslangic) p.set('baslangic', baslangic)
      if (bitis) p.set('bitis', bitis)
      if (seciliEkipId) p.set('ekipId', seciliEkipId)
      if (seciliSurgunId) p.set('surgunId', seciliSurgunId)
      const yanit = await fetch(`/api/raporlar/iscilik?${p}`)
      if (!yanit.ok) throw new Error()
      setVeri(await yanit.json())
    } catch { setHata('İşçilik raporu yüklenemedi.') }
    finally { setYukleniyor(false) }
  }, [baslangic, bitis, seciliEkipId, seciliSurgunId])

  const karsilastirmaRenkleri = ['#16a34a', '#2563eb', '#d97706', '#dc2626', '#7c3aed']

  return (
    <div className="space-y-4">
      <FiltrePaneli onFiltrele={veriYukle} yukleniyor={yukleniyor}>
        <TarihInput label="Başlangıç" value={baslangic} onChange={setBaslangic} />
        <TarihInput label="Bitiş" value={bitis} onChange={setBitis} />
        {ekipler.length > 0 && (
          <SelectInput label="Ekip" value={seciliEkipId} onChange={setSeciliEkipId}>
            <option value="">Tüm Ekipler</option>
            {ekipler.map((e) => <option key={e.id} value={e.id}>{e.ekipAdi}</option>)}
          </SelectInput>
        )}
        <SelectInput label="Dönem" value={seciliDonemId} onChange={(v) => { setSeciliDonemId(v); setSeciliSurgunId('') }}>
          <option value="">Tüm Dönemler</option>
          {donemler.map((d) => <option key={d.id} value={d.id}>{d.donemAdi} ({d.yil})</option>)}
        </SelectInput>
        {seciliDonem && (
          <SelectInput label="Sürgün" value={seciliSurgunId} onChange={setSeciliSurgunId}>
            <option value="">Tüm Sürgünler</option>
            {seciliDonem.surgunler.map((s) => <option key={s.id} value={s.id}>{s.surgunNo}. Sürgün</option>)}
          </SelectInput>
        )}
      </FiltrePaneli>

      {hata && <p className="text-red-500 text-sm p-3 bg-red-50 rounded-lg mx-4">{hata}</p>}
      {!veri && !yukleniyor && !hata && <div className="text-center py-16 text-gray-400 text-sm px-4">Filtre seçip &quot;Raporu Getir&quot; tıklayın</div>}

      {veri && (
        <div className="px-4 space-y-4">
          {/* Özet kartlar — 2×2 */}
          <div className="grid grid-cols-2 gap-3">
            <OzetKart baslik="Toplam Tutar" deger={paraFormat(veri.toplamTutar)} renk="bg-blue-50 text-blue-800" />
            <OzetKart baslik="Ödenen" deger={paraFormat(veri.toplamOdenen)} renk="bg-green-50 text-green-800" />
            <OzetKart baslik="Bekleyen" deger={paraFormat(veri.toplamTutar - veri.toplamOdenen)} renk="bg-orange-50 text-orange-800" />
            <OzetKart baslik="Kayıt Sayısı" deger={String(veri.toplam)} renk="bg-gray-50 text-gray-800" />
          </div>

          {/* Ekip karşılaştırma */}
          {veri.ekipOzeti.length > 1 && (
            <div className="rounded-xl border border-gray-100 p-4">
              <h4 className="text-sm font-semibold text-gray-700 mb-3">Ekip Bazlı İşçilik Karşılaştırması</h4>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={veri.ekipOzeti} margin={{ left: 0, right: 4 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="ekipAdi" tick={{ fontSize: 10 }} />
                  <YAxis yAxisId="left" tick={{ fontSize: 10 }} tickFormatter={(v) => `${(v / 1000).toFixed(0)}K`} width={30} />
                  <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 9 }} tickFormatter={(v) => `${sayiFormat(v, 0)}t`} width={28} />
                  <Tooltip formatter={(v: any, n: any) => [n === 'toplamKg' ? `${sayiFormat(v, 0)} kg` : paraFormat(Number(v ?? 0)), n === 'toplamKg' ? 'Hasat kg' : n === 'toplamTutar' ? 'Maliyet' : 'Ödenen']} />
                  <Legend />
                  <Bar yAxisId="left" dataKey="toplamTutar" fill="#2563eb" radius={[3, 3, 0, 0]} name="Maliyet (₺)" />
                  <Bar yAxisId="right" dataKey="toplamKg" fill="#16a34a" radius={[3, 3, 0, 0]} name="Hasat (kg)" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Günlük ekip karşılaştırma */}
          {veri.gunlukKarsilastirma.length > 1 && veri.ekipler.length > 1 && (
            <div className="rounded-xl border border-gray-100 p-4">
              <h4 className="text-sm font-semibold text-gray-700 mb-3">Günlük Hasat Karşılaştırması (Ekip Bazlı)</h4>
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={veri.gunlukKarsilastirma} margin={{ left: 0, right: 4 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="tarih" tick={{ fontSize: 9 }} tickFormatter={(v) => tarihFormat(v as string)} angle={-30} textAnchor="end" height={50} />
                  <YAxis tick={{ fontSize: 10 }} width={28} />
                  <Tooltip labelFormatter={(v: unknown) => tarihFormat(String(v))} formatter={(v: any, n: any) => [`${sayiFormat(v, 0)} kg`, n]} />
                  <Legend />
                  {veri.ekipler.map((ekip, i) => (
                    <Line key={ekip} type="monotone" dataKey={ekip} stroke={karsilastirmaRenkleri[i % karsilastirmaRenkleri.length]} strokeWidth={2} dot={false} name={ekip} />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Ekip özet — masaüstü tablo / mobil kart */}
          {veri.ekipOzeti.length > 0 && (
            <div>
              <div className="hidden md:block overflow-x-auto rounded-xl border border-gray-100">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50"><tr className="text-left text-gray-500 text-xs uppercase tracking-wide">
                    <th className="px-4 py-3">Ekip</th><th className="px-4 py-3 text-right">Toplam Maliyet</th>
                    <th className="px-4 py-3 text-right">Ödenen</th><th className="px-4 py-3 text-right">Hasat kg</th>
                    <th className="px-4 py-3 text-right">₺/kg</th><th className="px-4 py-3 text-right">Kayıt</th>
                  </tr></thead>
                  <tbody className="divide-y divide-gray-50">
                    {veri.ekipOzeti.map((e) => (
                      <tr key={e.ekipAdi} className="hover:bg-gray-50">
                        <td className="px-4 py-2.5 font-medium text-gray-800">{e.ekipAdi}</td>
                        <td className="px-4 py-2.5 text-right font-semibold">{paraFormat(e.toplamTutar)}</td>
                        <td className="px-4 py-2.5 text-right text-green-600">{paraFormat(e.odenenTutar)}</td>
                        <td className="px-4 py-2.5 text-right text-gray-600">{sayiFormat(e.toplamKg, 0)} kg</td>
                        <td className="px-4 py-2.5 text-right text-blue-600">{e.maliyetPerKg ? sayiFormat(e.maliyetPerKg, 2) : '—'}</td>
                        <td className="px-4 py-2.5 text-right text-gray-500">{e.kayitSayisi}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="md:hidden space-y-3">
                {veri.ekipOzeti.map((e) => (
                  <div key={e.ekipAdi} className="rounded-xl border border-gray-100 p-4 bg-white space-y-2">
                    <p className="font-semibold text-gray-800 text-sm">{e.ekipAdi}</p>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div><span className="text-gray-400 block">Maliyet</span><span className="font-semibold text-gray-800">{paraFormat(e.toplamTutar)}</span></div>
                      <div><span className="text-gray-400 block">Ödenen</span><span className="text-green-600">{paraFormat(e.odenenTutar)}</span></div>
                      <div><span className="text-gray-400 block">Hasat</span>{sayiFormat(e.toplamKg, 0)} kg</div>
                      <div><span className="text-gray-400 block">₺/kg</span><span className="text-blue-600">{e.maliyetPerKg ? sayiFormat(e.maliyetPerKg, 2) : '—'}</span></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Detay liste — masaüstü tablo / mobil kart */}
          <div>
            <div className="hidden md:block overflow-x-auto rounded-xl border border-gray-100">
              <table className="w-full text-sm">
                <thead className="bg-gray-50"><tr className="text-left text-gray-500 text-xs uppercase tracking-wide">
                  <th className="px-4 py-3">Tarih</th><th className="px-4 py-3">Açıklama</th>
                  <th className="px-4 py-3">Ekip / İşçi</th><th className="px-4 py-3 text-right">Tutar</th>
                  <th className="px-4 py-3 text-right">Ödenen</th><th className="px-4 py-3">Durum</th>
                </tr></thead>
                <tbody className="divide-y divide-gray-50">
                  {veri.iscilikOdemeleri.map((o) => (
                    <tr key={o.id} className="hover:bg-gray-50">
                      <td className="px-4 py-2.5 text-gray-500 text-xs">{tarihFormat(o.kayitTarihi)}</td>
                      <td className="px-4 py-2.5 text-gray-800">{o.aciklama}</td>
                      <td className="px-4 py-2.5 text-gray-600 text-xs">{o.ekipAdi ?? o.isciAdi ?? '—'}</td>
                      <td className="px-4 py-2.5 text-right font-semibold">{paraFormat(o.tutar)}</td>
                      <td className="px-4 py-2.5 text-right text-green-600">{paraFormat(o.odenenTutar)}</td>
                      <td className="px-4 py-2.5"><span className={`px-2 py-0.5 rounded text-xs font-medium ${odemeDurumuRenk(o.odemeDurumu)}`}>{odemeDurumuEtiket(o.odemeDurumu)}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="md:hidden space-y-3">
              {veri.iscilikOdemeleri.map((o) => (
                <div key={o.id} className="rounded-xl border border-gray-100 p-4 bg-white space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-semibold text-gray-800 text-sm">{o.aciklama}</p>
                      <p className="text-xs text-gray-500">{o.ekipAdi ?? o.isciAdi ?? '—'} · {tarihFormat(o.kayitTarihi)}</p>
                    </div>
                    <span className={`px-2 py-0.5 rounded text-xs font-medium flex-shrink-0 ${odemeDurumuRenk(o.odemeDurumu)}`}>{odemeDurumuEtiket(o.odemeDurumu)}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div><span className="text-gray-400 block">Tutar</span><span className="font-semibold text-gray-800">{paraFormat(o.tutar)}</span></div>
                    <div><span className="text-gray-400 block">Ödenen</span><span className="text-green-600">{paraFormat(o.odenenTutar)}</span></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Envanter Raporu ──────────────────────────────────────────────────────────

function EnvanterRaporu() {
  const [veri, setVeri] = useState<EnvanterRaporVeri | null>(null)
  const [kategoriFiltre, setKategoriFiltre] = useState('')
  const [baslangic, setBaslangic] = useState('')
  const [bitis, setBitis] = useState('')
  const [yukleniyor, setYukleniyor] = useState(false)
  const [hata, setHata] = useState<string | null>(null)
  const [sadecekritik, setSadeceKritik] = useState(false)

  const veriYukle = useCallback(async () => {
    setYukleniyor(true); setHata(null)
    try {
      const p = new URLSearchParams()
      if (kategoriFiltre) p.set('kategori', kategoriFiltre)
      if (baslangic) p.set('baslangic', baslangic)
      if (bitis) p.set('bitis', bitis)
      const yanit = await fetch(`/api/raporlar/envanter?${p}`)
      if (!yanit.ok) throw new Error()
      setVeri(await yanit.json())
    } catch { setHata('Envanter raporu yüklenemedi.') }
    finally { setYukleniyor(false) }
  }, [kategoriFiltre, baslangic, bitis])

  const gosterilenMalzemeler = veri?.malzemeler.filter((m) => !sadecekritik || m.kritikMi) ?? []
  const yakitMalzemeleri = veri?.malzemeler.filter((m) => m.kategori === 'yakit' || m.malzemeAdi.toLowerCase().includes('mazot') || m.malzemeAdi.toLowerCase().includes('benzin')) ?? []

  return (
    <div className="space-y-4">
      <FiltrePaneli onFiltrele={veriYukle} yukleniyor={yukleniyor}>
        <SelectInput label="Kategori" value={kategoriFiltre} onChange={setKategoriFiltre}>
          <option value="">Tüm Kategoriler</option>
          <option value="yakit">Yakıt</option>
          <option value="kimyasal">Kimyasal</option>
          <option value="tohum">Tohum</option>
          <option value="malzeme">Malzeme</option>
          <option value="ekipman">Ekipman</option>
          <option value="gubre">Gübre</option>
          <option value="diger">Diğer</option>
        </SelectInput>
        <TarihInput label="Periyot Başlangıcı" value={baslangic} onChange={setBaslangic} />
        <TarihInput label="Periyot Bitişi" value={bitis} onChange={setBitis} />
      </FiltrePaneli>

      {hata && <p className="text-red-500 text-sm p-3 bg-red-50 rounded-lg mx-4">{hata}</p>}
      {!veri && !yukleniyor && !hata && <div className="text-center py-16 text-gray-400 text-sm px-4">Raporu Getir tıklayın</div>}

      {veri && (
        <div className="px-4 space-y-4">
          {/* Özet kartlar — 2×2 */}
          <div className="grid grid-cols-2 gap-3">
            <OzetKart baslik="Toplam Malzeme" deger={String(veri.toplam)} renk="bg-gray-50 text-gray-800" />
            <OzetKart baslik="Kritik Stok" deger={String(veri.kritikSayisi)} renk={veri.kritikSayisi > 0 ? 'bg-red-50 text-red-800' : 'bg-green-50 text-green-800'} />
            <OzetKart baslik="Dönem Harcaması" deger={paraFormat(veri.toplamHarcama)} renk="bg-blue-50 text-blue-800" />
            <OzetKart baslik="Kategori Sayısı" deger={String(veri.kategoriOzeti.length)} renk="bg-purple-50 text-purple-800" />
          </div>

          {/* Kritik malzemeler uyarısı */}
          {veri.kritikMalzemeler.length > 0 && (
            <div className="rounded-xl border border-red-200 bg-red-50 p-4">
              <p className="text-sm font-semibold text-red-800 mb-2">⚠️ Kritik Stok Düzeyindeki Malzemeler ({veri.kritikMalzemeler.length})</p>
              <div className="flex flex-wrap gap-2">
                {veri.kritikMalzemeler.map((m) => (
                  <span key={m.id} className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-xs font-medium">
                    {m.malzemeAdi} — {sayiFormat(m.mevcutStok, 2)} {m.birim} (min: {sayiFormat(m.minimumStok, 2)})
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Kategori harcama grafiği */}
          {veri.kategoriOzeti.length > 0 && veri.toplamHarcama > 0 && (
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="rounded-xl border border-gray-100 p-4">
                <h4 className="text-sm font-semibold text-gray-700 mb-3">Kategori Bazlı Harcama</h4>
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie data={veri.kategoriOzeti.filter((k) => k.toplamHarcama > 0)} dataKey="toplamHarcama" nameKey="kategori" cx="50%" cy="50%" outerRadius={75} label={(props: any) => (props.percent ?? 0) > 0.05 ? `${kategoriEtiket(props.kategori ?? "")} ${((props.percent ?? 0) * 100).toFixed(0)}%` : ""}>
                      {veri.kategoriOzeti.map((_, i) => <Cell key={i} fill={GRAFIKRENK[i % GRAFIKRENK.length]} />)}
                    </Pie>
                    <Tooltip formatter={(v: any) => paraFormat(Number(v ?? 0))} labelFormatter={(k: unknown) => kategoriEtiket(String(k))} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="rounded-xl border border-gray-100 p-4">
                <h4 className="text-sm font-semibold text-gray-700 mb-3">Harcama Detayı</h4>
                <div className="space-y-2">
                  {veri.kategoriOzeti.filter((k) => k.toplamHarcama > 0).map((k, i) => (
                    <div key={k.kategori} className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: GRAFIKRENK[i % GRAFIKRENK.length] }} />
                        <span className="text-sm text-gray-700">{kategoriEtiket(k.kategori)}</span>
                        <span className="text-xs text-gray-400">({k.malzemeSayisi})</span>
                      </div>
                      <span className="text-sm font-semibold text-gray-800">{paraFormat(k.toplamHarcama)}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Yakıt aylık kullanım */}
          {yakitMalzemeleri.length > 0 && yakitMalzemeleri[0].aylikKullanim.length > 1 && (
            <div className="rounded-xl border border-gray-100 p-4">
              <h4 className="text-sm font-semibold text-gray-700 mb-3">Yakıt Aylık Kullanım</h4>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={yakitMalzemeleri[0].aylikKullanim} margin={{ left: 0, right: 4 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="ay" tickFormatter={ayFormat} tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} width={28} />
                  <Tooltip labelFormatter={(v: unknown) => ayFormat(String(v))} formatter={(v: any) => [`${sayiFormat(v, 1)} ${yakitMalzemeleri[0].birim}`, yakitMalzemeleri[0].malzemeAdi]} />
                  <Bar dataKey="miktar" fill="#d97706" radius={[3, 3, 0, 0]} name="Kullanım" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Malzeme listesi — masaüstü tablo / mobil kart */}
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-semibold text-gray-700">Malzeme Listesi</h4>
            <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
              <input type="checkbox" checked={sadecekritik} onChange={(e) => setSadeceKritik(e.target.checked)} className="accent-red-500" />
              Sadece Kritik
            </label>
          </div>
          <div className="hidden md:block overflow-x-auto rounded-xl border border-gray-100">
            <table className="w-full text-sm">
              <thead className="bg-gray-50"><tr className="text-left text-gray-500 text-xs uppercase tracking-wide">
                <th className="px-4 py-3">Malzeme</th><th className="px-4 py-3">Kategori</th>
                <th className="px-4 py-3 text-right">Mevcut</th><th className="px-4 py-3 text-right">Min.</th>
                <th className="px-4 py-3 text-right">Dönem Çıkış</th><th className="px-4 py-3 text-right">Dönem Harcama</th>
                <th className="px-4 py-3 text-center">Durum</th>
              </tr></thead>
              <tbody className="divide-y divide-gray-50">
                {gosterilenMalzemeler.map((m) => (
                  <tr key={m.id} className={`hover:bg-gray-50 ${m.kritikMi ? 'bg-red-50' : ''}`}>
                    <td className="px-4 py-2.5 font-medium text-gray-800">{m.malzemeAdi}</td>
                    <td className="px-4 py-2.5 text-gray-600 text-xs">{kategoriEtiket(m.kategori)}</td>
                    <td className={`px-4 py-2.5 text-right font-semibold ${m.kritikMi ? 'text-red-600' : 'text-gray-800'}`}>{sayiFormat(m.mevcutStok, 2)} {m.birim}</td>
                    <td className="px-4 py-2.5 text-right text-gray-500">{sayiFormat(m.minimumStok, 2)}</td>
                    <td className="px-4 py-2.5 text-right text-gray-600">{sayiFormat(m.donemCikis, 2)}</td>
                    <td className="px-4 py-2.5 text-right text-gray-600">{m.donemHarcama > 0 ? paraFormat(m.donemHarcama) : '—'}</td>
                    <td className="px-4 py-2.5 text-center">
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${m.kritikMi ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                        {m.kritikMi ? 'Kritik' : 'Normal'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="md:hidden space-y-3">
            {gosterilenMalzemeler.map((m) => (
              <div key={m.id} className={`rounded-xl border p-4 space-y-2 ${m.kritikMi ? 'border-red-200 bg-red-50' : 'border-gray-100 bg-white'}`}>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-semibold text-gray-800 text-sm">{m.malzemeAdi}</p>
                    <p className="text-xs text-gray-500">{kategoriEtiket(m.kategori)}</p>
                  </div>
                  <span className={`px-2 py-0.5 rounded text-xs font-medium flex-shrink-0 ${m.kritikMi ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                    {m.kritikMi ? 'Kritik' : 'Normal'}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs text-gray-600">
                  <div><span className="text-gray-400 block">Mevcut Stok</span><span className={`font-semibold ${m.kritikMi ? 'text-red-600' : 'text-gray-800'}`}>{sayiFormat(m.mevcutStok, 2)} {m.birim}</span></div>
                  <div><span className="text-gray-400 block">Min. Stok</span>{sayiFormat(m.minimumStok, 2)} {m.birim}</div>
                  <div><span className="text-gray-400 block">Dönem Çıkış</span>{sayiFormat(m.donemCikis, 2)}</div>
                  <div><span className="text-gray-400 block">Dönem Harcama</span>{m.donemHarcama > 0 ? paraFormat(m.donemHarcama) : '—'}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// ── Araç Raporu ───────────────────────────────────────────────────────────────

function AracRaporu() {
  const [veri, setVeri] = useState<AracRaporVeri | null>(null)
  const [baslangic, setBaslangic] = useState('')
  const [bitis, setBitis] = useState('')
  const [seciliAracId, setSeciliAracId] = useState('')
  const [yukleniyor, setYukleniyor] = useState(false)
  const [hata, setHata] = useState<string | null>(null)
  const [acikArac, setAcikArac] = useState<string | null>(null)

  const veriYukle = useCallback(async () => {
    setYukleniyor(true); setHata(null)
    try {
      const p = new URLSearchParams()
      if (baslangic) p.set('baslangic', baslangic)
      if (bitis) p.set('bitis', bitis)
      if (seciliAracId) p.set('ekipmanId', seciliAracId)
      const yanit = await fetch(`/api/raporlar/arac?${p}`)
      if (!yanit.ok) throw new Error()
      setVeri(await yanit.json())
    } catch { setHata('Araç raporu yüklenemedi.') }
    finally { setYukleniyor(false) }
  }, [baslangic, bitis, seciliAracId])

  const giderTipiRenk: Record<string, string> = {
    yakit: '#d97706', bakim: '#2563eb', onarim: '#dc2626',
    lastik: '#7c3aed', sigorta: '#0891b2', vergi_muayene: '#ea580c',
    yedek_parca: '#4f46e5', diger: '#6b7280',
  }

  return (
    <div className="space-y-4">
      <FiltrePaneli onFiltrele={veriYukle} yukleniyor={yukleniyor}>
        <TarihInput label="Başlangıç" value={baslangic} onChange={setBaslangic} />
        <TarihInput label="Bitiş" value={bitis} onChange={setBitis} />
        {veri && veri.araclar.length > 0 && (
          <SelectInput label="Araç" value={seciliAracId} onChange={setSeciliAracId}>
            <option value="">Tüm Araçlar</option>
            {veri.araclar.map((a) => <option key={a.id} value={a.id}>{a.ekipmanAdi}{a.plaka ? ` (${a.plaka})` : ''}</option>)}
          </SelectInput>
        )}
      </FiltrePaneli>

      {hata && <p className="text-red-500 text-sm p-3 bg-red-50 rounded-lg mx-4">{hata}</p>}
      {!veri && !yukleniyor && !hata && <div className="text-center py-16 text-gray-400 text-sm px-4">Tarih aralığı seçip &quot;Raporu Getir&quot; tıklayın</div>}

      {veri && veri.araclar.length === 0 && (
        <div className="text-center py-16 text-gray-400 text-sm px-4">Sisteme tanımlı araç bulunamadı. Envanter modülünden &quot;araç&quot; kategorisinde ekipman ekleyin.</div>
      )}

      {veri && veri.araclar.length > 0 && (
        <div className="px-4 space-y-4">
          {/* Özet kartlar — 2×2 */}
          <div className="grid grid-cols-2 gap-3">
            <OzetKart baslik="Toplam Gelir" deger={paraFormat(veri.genelGelir)} renk="bg-green-50 text-green-800" />
            <OzetKart baslik="Toplam Gider" deger={paraFormat(veri.genelGider)} renk="bg-red-50 text-red-800" />
            <OzetKart baslik="Net Kâr/Zarar" deger={paraFormat(veri.genelKar)} renk={veri.genelKar >= 0 ? 'bg-blue-50 text-blue-800' : 'bg-orange-50 text-orange-800'} />
            <OzetKart baslik="Araç Sayısı" deger={String(veri.aracSayisi)} renk="bg-gray-50 text-gray-800" />
          </div>

          {/* Her araç için accordion */}
          {veri.araclar.map((arac) => (
            <div key={arac.id} className="rounded-xl border border-gray-200 overflow-hidden">
              <button
                onClick={() => setAcikArac(acikArac === arac.id ? null : arac.id)}
                className="w-full flex items-center justify-between px-4 py-3 bg-white hover:bg-gray-50 transition-colors text-left"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-base flex-shrink-0">🚛</span>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-gray-800 truncate">
                      {arac.ekipmanAdi}
                      {arac.plaka && <span className="ml-2 text-xs font-mono text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded">{arac.plaka}</span>}
                    </p>
                    {arac.marka && <p className="text-xs text-gray-500 truncate">{arac.marka} {arac.model}</p>}
                  </div>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0 ml-2">
                  {/* Gelir/Gider yalnızca büyük ekranda */}
                  <div className="text-right hidden sm:block">
                    <p className="text-xs text-green-600">Gelir: {paraFormat(arac.toplamGelir)}</p>
                    <p className="text-xs text-red-600">Gider: {paraFormat(arac.toplamGider)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-500">Net</p>
                    <p className={`text-sm font-bold ${arac.netKar >= 0 ? 'text-green-700' : 'text-red-700'}`}>{paraFormat(arac.netKar)}</p>
                  </div>
                  <span className="text-gray-400 text-xs">{acikArac === arac.id ? '▲' : '▼'}</span>
                </div>
              </button>

              {acikArac === arac.id && (
                <div className="border-t border-gray-100 p-4 space-y-4 bg-gray-50">
                  {/* Mobilde gelir/gider satırı */}
                  <div className="sm:hidden grid grid-cols-2 gap-2 text-xs">
                    <div className="bg-green-50 rounded-lg p-2 text-center">
                      <p className="text-green-600">Gelir</p>
                      <p className="font-bold text-green-700">{paraFormat(arac.toplamGelir)}</p>
                    </div>
                    <div className="bg-red-50 rounded-lg p-2 text-center">
                      <p className="text-red-600">Gider</p>
                      <p className="font-bold text-red-700">{paraFormat(arac.toplamGider)}</p>
                    </div>
                  </div>

                  {/* Araç gider özeti */}
                  <div className="grid grid-cols-3 gap-2">
                    <OzetKart baslik="Yakıt" deger={paraFormat(arac.yakit)} renk="bg-amber-50 text-amber-800" />
                    <OzetKart baslik="Bakım" deger={paraFormat(arac.bakim)} renk="bg-blue-50 text-blue-800" />
                    <OzetKart baslik="Onarım" deger={paraFormat(arac.onarim)} renk="bg-red-50 text-red-800" />
                  </div>

                  {/* Aylık gelir/gider — 180px */}
                  {arac.aylikDagilim.length > 0 && (
                    <div className="rounded-xl border border-gray-100 bg-white p-4">
                      <h5 className="text-xs font-semibold text-gray-600 mb-3">Aylık Gelir / Gider</h5>
                      <ResponsiveContainer width="100%" height={180}>
                        <BarChart data={arac.aylikDagilim} margin={{ left: 0, right: 4 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                          <XAxis dataKey="ay" tickFormatter={ayFormat} tick={{ fontSize: 9 }} />
                          <YAxis tick={{ fontSize: 9 }} tickFormatter={(v) => `${(v / 1000).toFixed(0)}K`} width={28} />
                          <Tooltip labelFormatter={(v: unknown) => ayFormat(String(v))} formatter={(v: any, n: any) => [paraFormat(Number(v ?? 0)), n === 'gelir' ? 'Gelir' : 'Gider']} />
                          <Bar dataKey="gelir" fill="#16a34a" radius={[3, 3, 0, 0]} name="gelir" />
                          <Bar dataKey="gider" fill="#dc2626" radius={[3, 3, 0, 0]} name="gider" />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  )}

                  {/* Gider tipi dağılımı */}
                  {arac.giderTipiDagilim.length > 0 && (
                    <div className="rounded-xl border border-gray-100 bg-white p-4">
                      <h5 className="text-xs font-semibold text-gray-600 mb-3">Gider Tipi Dağılımı</h5>
                      <div className="space-y-2">
                        {arac.giderTipiDagilim.map((g) => {
                          const pct = arac.toplamGider > 0 ? (g.tutar / arac.toplamGider) * 100 : 0
                          return (
                            <div key={g.tip} className="flex items-center gap-3">
                              <span className="text-xs text-gray-600 w-20 flex-shrink-0">{kategoriEtiket(g.tip)}</span>
                              <div className="flex-1 bg-gray-200 rounded-full h-2">
                                <div className="h-2 rounded-full" style={{ width: `${pct}%`, background: giderTipiRenk[g.tip] ?? '#6b7280' }} />
                              </div>
                              <span className="text-xs font-medium text-gray-700 w-16 text-right">{paraFormat(g.tutar)}</span>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )}

                  {/* Onarım geçmişi */}
                  {arac.onarimlar.length > 0 && (
                    <div className="rounded-xl border border-gray-100 bg-white p-4">
                      <h5 className="text-xs font-semibold text-red-700 mb-3">Onarım Geçmişi ({arac.onarimlar.length} kayıt)</h5>
                      <div className="space-y-2">
                        {arac.onarimlar.slice(0, 10).map((o) => (
                          <div key={o.id} className="flex items-center justify-between text-xs gap-2">
                            <div className="flex items-center gap-2 min-w-0">
                              <span className="text-gray-400 flex-shrink-0">{tarihFormat(o.tarih)}</span>
                              <span className="text-gray-700 truncate">{o.aciklama ?? 'Onarım'}</span>
                            </div>
                            <span className="font-semibold text-red-700 flex-shrink-0">{paraFormat(o.tutar)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ── Ana Sayfa ─────────────────────────────────────────────────────────────────

type TabTipi = 'hasat' | 'finans' | 'iscilik' | 'envanter' | 'arac'

const TABLAR: { id: TabTipi; etiket: string; ikon: string }[] = [
  { id: 'hasat', etiket: 'Hasat Raporu', ikon: '🍃' },
  { id: 'finans', etiket: 'Finans Raporu', ikon: '💰' },
  { id: 'iscilik', etiket: 'İşçilik Raporu', ikon: '👷' },
  { id: 'envanter', etiket: 'Envanter Raporu', ikon: '📦' },
  { id: 'arac', etiket: 'Araç Raporu', ikon: '🚛' },
]

export default function RaporlarSayfasi() {
  const [aktifTab, setAktifTab] = useState<TabTipi>('hasat')

  return (
    <div className="pb-6">
      {/* Başlık */}
      <div className="px-4 pt-4 pb-3">
        <h2 className="text-xl font-bold text-gray-800">Raporlar</h2>
      </div>

      {/* Üst sekme — yatay scroll ile mobil uyumlu, sticky */}
      <div className="border-b border-gray-200 bg-white sticky top-0 z-20">
        <nav className="-mb-px flex overflow-x-auto px-2" style={{ scrollbarWidth: 'none' }}>
          {TABLAR.map((tab) => (
            <button
              key={tab.id} onClick={() => setAktifTab(tab.id)}
              className={`flex-shrink-0 px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap flex items-center gap-1.5 ${
                aktifTab === tab.id ? 'border-green-600 text-green-700' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <span>{tab.ikon}</span>
              {/* Mobilde sadece ilk kelime, masaüstünde tam etiket */}
              <span className="hidden sm:inline">{tab.etiket}</span>
              <span className="sm:hidden">{tab.etiket.split(' ')[0]}</span>
            </button>
          ))}
        </nav>
      </div>

      <div className="pt-4">
        {aktifTab === 'hasat' && <HasatRaporu />}
        {aktifTab === 'finans' && <FinansRaporu />}
        {aktifTab === 'iscilik' && <IscilikRaporu />}
        {aktifTab === 'envanter' && <EnvanterRaporu />}
        {aktifTab === 'arac' && <AracRaporu />}
      </div>
    </div>
  )
}
