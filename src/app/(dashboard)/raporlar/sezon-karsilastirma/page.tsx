'use client';

import { useState, useEffect } from 'react';

interface SezonVerisi {
  yil: number;
  toplamHasatKg: number;
  surgunSayisi: number;
  toplamGelir: number;
  toplamGider: number;
  netKar: number;
  iscilikMaliyeti: number;
  donemSayisi: number;
}

interface KarsilastirmaVerisi {
  yil1: SezonVerisi;
  yil2: SezonVerisi;
}

interface MetrikTanimi {
  anahtar: keyof Omit<SezonVerisi, 'yil'>;
  etiket: string;
  para: boolean;
}

const metrikler: MetrikTanimi[] = [
  { anahtar: 'toplamHasatKg', etiket: 'Toplam Hasat (kg)', para: false },
  { anahtar: 'donemSayisi', etiket: 'Dönem Sayısı', para: false },
  { anahtar: 'surgunSayisi', etiket: 'Sürgün Sayısı', para: false },
  { anahtar: 'toplamGelir', etiket: 'Toplam Gelir (₺)', para: true },
  { anahtar: 'toplamGider', etiket: 'Toplam Gider (₺)', para: true },
  { anahtar: 'netKar', etiket: 'Net Kâr (₺)', para: true },
  { anahtar: 'iscilikMaliyeti', etiket: 'İşçilik Maliyeti (₺)', para: true },
];

function sayiyiBicimle(deger: number, para: boolean): string {
  if (para) {
    return new Intl.NumberFormat('tr-TR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(deger);
  }
  return new Intl.NumberFormat('tr-TR').format(deger);
}

function degisimYuzdesi(deger1: number, deger2: number): string {
  if (deger1 === 0) return deger2 > 0 ? '+∞%' : '0%';
  const oran = ((deger2 - deger1) / Math.abs(deger1)) * 100;
  const isaret = oran >= 0 ? '+' : '';
  return `${isaret}${oran.toFixed(1)}%`;
}

export default function SezonKarsilastirmaPage() {
  const buYil = new Date().getFullYear();
  const [yil1, setYil1] = useState(buYil - 1);
  const [yil2, setYil2] = useState(buYil);
  const [veri, setVeri] = useState<KarsilastirmaVerisi | null>(null);
  const [yukleniyor, setYukleniyor] = useState(false);
  const [hata, setHata] = useState<string | null>(null);

  const yilSecenekleri = Array.from({ length: buYil - 2019 }, (_, i) => 2020 + i);

  async function veriGetir() {
    setYukleniyor(true);
    setHata(null);
    try {
      const yanit = await fetch(
        `/api/raporlar/sezon-karsilastirma?yil1=${yil1}&yil2=${yil2}`,
      );
      if (!yanit.ok) throw new Error('Veri alınamadı');
      const json = await yanit.json();
      setVeri(json);
    } catch (err) {
      setHata('Veri yüklenirken bir hata oluştu.');
      console.error(err);
    } finally {
      setYukleniyor(false);
    }
  }

  useEffect(() => {
    veriGetir();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Bar grafiği için maksimum değeri bul (görsel ölçek için)
  function barGenisligi(deger: number, maksimum: number): string {
    if (maksimum === 0) return '0%';
    return `${Math.min(100, (Math.abs(deger) / maksimum) * 100).toFixed(1)}%`;
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Sezon Karşılaştırma</h2>
          <p className="text-sm text-gray-500 mt-1">İki sezon arasında performans karşılaştırması yapın</p>
        </div>
      </div>

      {/* Yıl Seçici */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <div className="flex flex-wrap items-end gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              1. Yıl
            </label>
            <select
              value={yil1}
              onChange={(e) => setYil1(Number(e.target.value))}
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              {yilSecenekleri.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              2. Yıl
            </label>
            <select
              value={yil2}
              onChange={(e) => setYil2(Number(e.target.value))}
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              {yilSecenekleri.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
          </div>
          <button
            onClick={veriGetir}
            disabled={yukleniyor}
            className="rounded-lg bg-green-600 px-5 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50 transition-colors"
          >
            {yukleniyor ? 'Yükleniyor...' : 'Karşılaştır'}
          </button>
        </div>
      </div>

      {hata && (
        <div className="rounded-lg bg-red-50 border border-red-200 p-4 text-sm text-red-600">
          {hata}
        </div>
      )}

      {yukleniyor && (
        <div className="flex items-center justify-center py-16">
          <div className="animate-spin rounded-full h-10 w-10 border-4 border-green-500 border-t-transparent" />
        </div>
      )}

      {veri && !yukleniyor && (
        <>
          {/* Karşılaştırma Tablosu */}
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100">
              <h3 className="font-semibold text-gray-800">Metrik Karşılaştırması</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="text-left px-5 py-3 font-medium text-gray-600">Metrik</th>
                    <th className="text-right px-5 py-3 font-medium text-blue-600">
                      {veri.yil1.yil}
                    </th>
                    <th className="text-right px-5 py-3 font-medium text-green-600">
                      {veri.yil2.yil}
                    </th>
                    <th className="text-right px-5 py-3 font-medium text-gray-600">
                      Değişim
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {metrikler.map((metrik, indeks) => {
                    const deger1 = veri.yil1[metrik.anahtar] as number;
                    const deger2 = veri.yil2[metrik.anahtar] as number;
                    const yuzde = degisimYuzdesi(deger1, deger2);
                    const artis = deger2 >= deger1;
                    return (
                      <tr
                        key={metrik.anahtar}
                        className={`border-t border-gray-50 ${indeks % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}`}
                      >
                        <td className="px-5 py-3 text-gray-700 font-medium">
                          {metrik.etiket}
                        </td>
                        <td className="px-5 py-3 text-right text-blue-700 tabular-nums">
                          {sayiyiBicimle(deger1, metrik.para)}
                        </td>
                        <td className="px-5 py-3 text-right text-green-700 tabular-nums">
                          {sayiyiBicimle(deger2, metrik.para)}
                        </td>
                        <td className={`px-5 py-3 text-right tabular-nums font-medium ${artis ? 'text-green-600' : 'text-red-500'}`}>
                          {yuzde}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Görsel Karşılaştırma — Grup Bar Grafiği (SVG olmayan, CSS tabanlı) */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h3 className="font-semibold text-gray-800 mb-5">Görsel Karşılaştırma</h3>
            <div className="space-y-4">
              {metrikler.map((metrik) => {
                const deger1 = veri.yil1[metrik.anahtar] as number;
                const deger2 = veri.yil2[metrik.anahtar] as number;
                const maksimum = Math.max(Math.abs(deger1), Math.abs(deger2));
                return (
                  <div key={metrik.anahtar}>
                    <div className="flex justify-between text-xs text-gray-500 mb-1">
                      <span>{metrik.etiket}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-blue-600 w-6">{veri.yil1.yil}</span>
                      <div className="flex-1 bg-gray-100 rounded-full h-4 overflow-hidden">
                        <div
                          className="h-full bg-blue-400 rounded-full transition-all duration-500"
                          style={{ width: barGenisligi(deger1, maksimum) }}
                        />
                      </div>
                      <span className="text-xs text-gray-600 tabular-nums w-24 text-right">
                        {sayiyiBicimle(deger1, metrik.para)}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-green-600 w-6">{veri.yil2.yil}</span>
                      <div className="flex-1 bg-gray-100 rounded-full h-4 overflow-hidden">
                        <div
                          className="h-full bg-green-400 rounded-full transition-all duration-500"
                          style={{ width: barGenisligi(deger2, maksimum) }}
                        />
                      </div>
                      <span className="text-xs text-gray-600 tabular-nums w-24 text-right">
                        {sayiyiBicimle(deger2, metrik.para)}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
            {/* Açıklama */}
            <div className="flex gap-4 mt-5 text-xs text-gray-500">
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded bg-blue-400" />
                <span>{veri.yil1.yil}</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded bg-green-400" />
                <span>{veri.yil2.yil}</span>
              </div>
            </div>
          </div>

          {/* Özet Kartları */}
          <div className="grid grid-cols-2 gap-4">
            {[veri.yil1, veri.yil2].map((sezon, idx) => (
              <div
                key={sezon.yil}
                className={`rounded-xl border p-5 ${idx === 0 ? 'border-blue-200 bg-blue-50' : 'border-green-200 bg-green-50'}`}
              >
                <h4 className={`text-lg font-bold mb-3 ${idx === 0 ? 'text-blue-700' : 'text-green-700'}`}>
                  {sezon.yil} Sezonu
                </h4>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Net Kâr</span>
                    <span className={`font-semibold ${sezon.netKar >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                      {sayiyiBicimle(sezon.netKar, true)} ₺
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Toplam Hasat</span>
                    <span className="font-medium text-gray-700">{sayiyiBicimle(sezon.toplamHasatKg, false)} kg</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Dönem Sayısı</span>
                    <span className="font-medium text-gray-700">{sezon.donemSayisi}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
