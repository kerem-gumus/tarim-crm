'use client'

import { useEffect, useState } from 'react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import Link from 'next/link'

interface GunlukHasat { tarih: string; toplamKg: number }
interface KritikStok { id: string; ad: string; mevcutStok: number; minimumStok: number; birim: string }
interface VadesiYaklasan {
  id: string; kullaniciAd: string; cuzdanKullaniciId: string
  miktarKg: number; tutarTl: number | null; yon: string
  vadeTarihi: string; aciklama: string | null
}

interface DashboardOzet {
  aktifSurgunSayisi: number; bugunHasatKg: number; bugunHasatGiris: number
  toplamHasatKgBuSezon: number; netKar: number; sonOtuzGunHasat: GunlukHasat[]
  kritikStoklar: KritikStok[]; aktifKontenjanSayisi: number
  odenmemisAlacak: number; odenmemisBorc: number
  // Cari hesap (kg)
  cariAlacakKg: number; cariBorcKg: number; netCariKg: number; fazlaSatisKg: number
  // Vadesi yaklaşan cari hareketler
  vadesiYaklasan: VadesiYaklasan[]
}

function paraFormat(t: number) {
  return new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(t)
}
function sayiFormat(s: number, d = 0) {
  return new Intl.NumberFormat('tr-TR', { minimumFractionDigits: d, maximumFractionDigits: d }).format(s)
}

// Stat kartı — mobilde kompakt, masaüstünde geniş
function StatKart({ baslik, deger, alt, renk, ikn }: {
  baslik: string; deger: string; alt?: string; renk: string; ikn: string
}) {
  return (
    <div className={`rounded-2xl p-4 md:p-5 ${renk} flex items-start gap-3 md:gap-4`}>
      <div className="text-2xl md:text-3xl shrink-0">{ikn}</div>
      <div className="min-w-0">
        <p className="text-[11px] md:text-xs font-semibold uppercase tracking-wide opacity-70">{baslik}</p>
        <p className="text-lg md:text-2xl font-bold mt-0.5 leading-tight">{deger}</p>
        {alt && <p className="text-[11px] md:text-xs opacity-60 mt-0.5">{alt}</p>}
      </div>
    </div>
  )
}

// Finans satırı — masaüstünde tablo gibi
function FinansSatir({ etiket, tutar, renk }: { etiket: string; tutar: number; renk: string }) {
  return (
    <div className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0">
      <span className="text-sm text-gray-600">{etiket}</span>
      <span className={`font-semibold ${renk}`}>{paraFormat(tutar)}</span>
    </div>
  )
}

export default function DashboardSayfasi() {
  const [veri, setVeri] = useState<DashboardOzet | null>(null)
  const [yukleniyor, setYukleniyor] = useState(true)

  useEffect(() => {
    fetch('/api/dashboard/ozet')
      .then((r) => r.json())
      .then((d) => setVeri(d))
      .catch(() => {})
      .finally(() => setYukleniyor(false))
  }, [])

  if (yukleniyor) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-green-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-gray-400">Yükleniyor...</p>
        </div>
      </div>
    )
  }

  if (!veri) return null

  const grafikVerisi = veri.sonOtuzGunHasat.map((g) => ({
    tarih: (() => { const d = new Date(g.tarih); return `${d.getDate()}/${d.getMonth() + 1}` })(),
    kg: g.toplamKg,
  }))

  return (
    <div className="p-4 md:p-6 space-y-4 md:space-y-6 max-w-6xl mx-auto">

      {/* ── İstatistik kartları ── */}
      {/* Mobil: 2×2 kompakt | Masaüstü: 4×1 geniş */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        <StatKart baslik="Aktif Sürgün" deger={sayiFormat(veri.aktifSurgunSayisi)} alt="Şu an aktif" ikn="🌱" renk="bg-green-50 text-green-800" />
        <StatKart baslik="Bugün Hasat" deger={`${sayiFormat(veri.bugunHasatKg, 1)} kg`} alt={`${veri.bugunHasatGiris} giriş`} ikn="🍃" renk="bg-blue-50 text-blue-800" />
        <StatKart baslik="Bu Sezon" deger={`${sayiFormat(veri.toplamHasatKgBuSezon, 0)} kg`} alt="Toplam hasat" ikn="📊" renk="bg-purple-50 text-purple-800" />
        <StatKart baslik="Net Kâr" deger={paraFormat(veri.netKar)} alt="Gelir - Gider" ikn="💰"
          renk={veri.netKar >= 0 ? 'bg-emerald-50 text-emerald-800' : 'bg-red-50 text-red-800'} />
      </div>

      {/* ── Ana içerik grid'i ── */}
      {/* Mobil: tek sütun | Masaüstü: sol 60% + sağ 40% */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 md:gap-6">

        {/* Sol kolon — grafik + kritik stoklar */}
        <div className="md:col-span-3 space-y-4">

          {/* Hasat grafiği */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 md:p-5">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm md:text-base font-semibold text-gray-800">Son 30 Gün Hasat</h2>
              <Link href="/hasat" className="text-xs text-green-600 font-medium hover:underline">Tümü →</Link>
            </div>
            {grafikVerisi.length > 0 ? (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={grafikVerisi} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                  <XAxis dataKey="tarih" tick={{ fontSize: 11, fill: '#9ca3af' }} tickLine={false} axisLine={false} interval="preserveStartEnd" />
                  <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} tickLine={false} axisLine={false} />
                  <Tooltip
                    formatter={(d) => [`${sayiFormat(Number(d), 1)} kg`, 'Hasat']}
                    contentStyle={{ borderRadius: '12px', border: '1px solid #f3f4f6', fontSize: '12px' }}
                  />
                  <Bar dataKey="kg" fill="#16a34a" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-44 flex items-center justify-center text-gray-300 text-sm">Veri yok</div>
            )}
          </div>

          {/* Kritik stoklar */}
          {veri.kritikStoklar.length > 0 && (
            <div className="bg-white rounded-2xl border border-red-100 shadow-sm p-4 md:p-5">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-sm md:text-base font-semibold text-gray-800 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-red-500 inline-block" />
                  Kritik Stoklar
                </h2>
                <Link href="/envanter" className="text-xs text-green-600 font-medium hover:underline">Tümü →</Link>
              </div>
              <div className="space-y-2.5">
                {veri.kritikStoklar.map((stok) => {
                  const oran = stok.minimumStok > 0 ? Math.min(stok.mevcutStok / stok.minimumStok, 1) : 0
                  return (
                    <div key={stok.id}>
                      <div className="flex justify-between items-center mb-1">
                        <p className="text-sm font-medium text-gray-700 truncate">{stok.ad}</p>
                        <p className="text-xs text-red-600 font-semibold ml-2 shrink-0">
                          {sayiFormat(stok.mevcutStok, 1)} / {sayiFormat(stok.minimumStok, 1)} {stok.birim}
                        </p>
                      </div>
                      <div className="h-1.5 rounded-full bg-gray-100">
                        <div className="h-full rounded-full bg-red-400 transition-all" style={{ width: `${oran * 100}%` }} />
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>

        {/* Sağ kolon — finansal durum + özet */}
        <div className="md:col-span-2 space-y-4">

          {/* Finansal durum */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 md:p-5">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm md:text-base font-semibold text-gray-800">Finansal Durum</h2>
              <Link href="/finans" className="text-xs text-green-600 font-medium hover:underline">Detay →</Link>
            </div>
            <FinansSatir etiket="Ödenmemiş Alacak" tutar={veri.odenmemisAlacak} renk="text-amber-600" />
            <FinansSatir etiket="Ödenmemiş Borç" tutar={veri.odenmemisBorc} renk="text-red-600" />
            <div className="flex items-center justify-between pt-3">
              <span className="text-sm font-semibold text-gray-700">Net Kâr</span>
              <span className={`text-lg font-bold ${veri.netKar >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {paraFormat(veri.netKar)}
              </span>
            </div>
          </div>

          {/* Cari Hesap — kg bazlı borç/alacak */}
          {(veri.cariAlacakKg > 0 || veri.cariBorcKg > 0 || veri.fazlaSatisKg > 0) && (
            <div className="bg-white rounded-2xl border border-orange-100 shadow-sm p-4 md:p-5">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-sm md:text-base font-semibold text-gray-800">Cüzdan Cari Hesap</h2>
                <Link href="/cari-hesap" className="text-xs text-orange-600 font-medium hover:underline">Ekstre →</Link>
              </div>
              <div className="space-y-2">
                {veri.cariAlacakKg > 0 && (
                  <div className="flex items-center justify-between rounded-xl bg-green-50 px-3 py-2">
                    <span className="text-sm text-green-700">Toplam Alacak</span>
                    <span className="text-base font-bold text-green-800">
                      {sayiFormat(veri.cariAlacakKg, 1)} kg
                    </span>
                  </div>
                )}
                {veri.cariBorcKg > 0 && (
                  <div className="flex items-center justify-between rounded-xl bg-red-50 px-3 py-2">
                    <span className="text-sm text-red-700">Toplam Borcum</span>
                    <span className="text-base font-bold text-red-800">
                      {sayiFormat(veri.cariBorcKg, 1)} kg
                    </span>
                  </div>
                )}
                {veri.fazlaSatisKg > 0 && (
                  <div className="flex items-center justify-between rounded-xl bg-amber-50 px-3 py-2">
                    <span className="text-sm text-amber-700">Fazla Satış</span>
                    <span className="text-base font-bold text-amber-800">
                      {sayiFormat(veri.fazlaSatisKg, 1)} kg
                    </span>
                  </div>
                )}
                <div className={`flex items-center justify-between rounded-xl px-3 py-2 ${veri.netCariKg > 0 ? 'bg-green-100' : veri.netCariKg < 0 ? 'bg-red-100' : 'bg-gray-100'}`}>
                  <span className="text-sm font-semibold text-gray-700">Net</span>
                  <span className={`text-base font-bold ${veri.netCariKg > 0 ? 'text-green-800' : veri.netCariKg < 0 ? 'text-red-800' : 'text-gray-600'}`}>
                    {veri.netCariKg > 0 ? '+' : ''}{sayiFormat(veri.netCariKg, 1)} kg
                    <span className="text-xs font-normal ml-1 opacity-70">
                      {veri.netCariKg > 0 ? 'alacak' : veri.netCariKg < 0 ? 'borç' : ''}
                    </span>
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Vadesi Yaklaşan Cari Hareketler */}
          {veri.vadesiYaklasan && veri.vadesiYaklasan.length > 0 && (
            <div className="bg-white rounded-2xl border border-red-200 shadow-sm p-4 md:p-5">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-sm md:text-base font-semibold text-red-800 flex items-center gap-2">
                  <span>⚠️</span> Vadesi Yaklaşan Cari
                </h2>
                <Link href="/cari-hesap" className="text-xs text-red-600 font-medium hover:underline">Tümü →</Link>
              </div>
              <div className="space-y-2">
                {veri.vadesiYaklasan.map((v) => {
                  const vade = new Date(v.vadeTarihi)
                  const bugun = new Date()
                  const gunFark = Math.ceil((vade.getTime() - bugun.getTime()) / (1000 * 60 * 60 * 24))
                  const gecti = gunFark < 0
                  return (
                    <Link
                      key={v.id}
                      href={`/cari-hesap?id=${v.cuzdanKullaniciId}`}
                      className={`block rounded-xl px-3 py-2 text-sm ${gecti ? 'bg-red-50 border border-red-200' : 'bg-orange-50 border border-orange-200'}`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-gray-800">{v.kullaniciAd}</span>
                        <span className={`text-xs font-medium ${gecti ? 'text-red-700' : 'text-orange-700'}`}>
                          {gecti ? `${Math.abs(gunFark)} gün geçti` : gunFark === 0 ? 'Bugün' : `${gunFark} gün kaldı`}
                        </span>
                      </div>
                      <div className="flex items-center justify-between mt-0.5">
                        <span className="text-xs text-gray-500">{v.aciklama ?? (v.yon === 'bana_borclu' ? 'Bana borçlu' : 'Ben borçluyum')}</span>
                        <span className="text-xs font-semibold text-gray-700">
                          {v.tutarTl ? `₺${v.tutarTl.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}` : `${v.miktarKg} kg`}
                        </span>
                      </div>
                    </Link>
                  )
                })}
              </div>
            </div>
          )}

          {/* Özet bilgiler */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 md:p-5">
            <h2 className="text-sm md:text-base font-semibold text-gray-800 mb-3">Genel Özet</h2>
            <div className="space-y-2.5">
              <div className="flex items-center justify-between rounded-xl bg-sky-50 px-3 py-2.5">
                <span className="text-sm text-sky-700">Aktif Kontenjan</span>
                <span className="text-base font-bold text-sky-800">{sayiFormat(veri.aktifKontenjanSayisi)}</span>
              </div>
              <div className="flex items-center justify-between rounded-xl bg-green-50 px-3 py-2.5">
                <span className="text-sm text-green-700">Bugün Hasat Girişi</span>
                <span className="text-base font-bold text-green-800">{sayiFormat(veri.bugunHasatGiris)} adet</span>
              </div>
              <div className="flex items-center justify-between rounded-xl bg-purple-50 px-3 py-2.5">
                <span className="text-sm text-purple-700">Bu Sezon Toplam</span>
                <span className="text-base font-bold text-purple-800">{sayiFormat(veri.toplamHasatKgBuSezon)} kg</span>
              </div>
            </div>
          </div>

          {/* Hızlı erişim — SADECE MOBİLDE (masaüstünde sidebar var) */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 md:hidden">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Hızlı Erişim</p>
            <div className="grid grid-cols-4 gap-2">
              {[
                { href: '/hasat', ikon: '🍃', etiket: 'Hasat', renk: 'bg-green-50 text-green-700' },
                { href: '/finans', ikon: '💳', etiket: 'Finans', renk: 'bg-blue-50 text-blue-700' },
                { href: '/banka-kasa', ikon: '🏦', etiket: 'Banka', renk: 'bg-indigo-50 text-indigo-700' },
                { href: '/envanter', ikon: '📦', etiket: 'Envanter', renk: 'bg-orange-50 text-orange-700' },
              ].map((b) => (
                <Link key={b.href} href={b.href}
                  className={`flex flex-col items-center gap-1 p-2.5 rounded-xl text-center ${b.renk}`}>
                  <span className="text-xl">{b.ikon}</span>
                  <span className="text-[10px] font-medium">{b.etiket}</span>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
