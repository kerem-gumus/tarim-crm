'use client';

import { useEffect, useState } from 'react';
import { illerListesi, ilceleriGetir } from '@/lib/konumlar';

interface SaatlikVeri {
  saat: string;
  sicaklik: number;
  nem: number;
  yagis: number;
  ruzgar: number;
  durum: string;
}

interface Tahmin {
  tarih: string;
  sicaklikMax: number;
  sicaklikMin: number;
  yagisMm: number;
  ruzgarHizi: number;
  havaDurumu: string;
}

interface BugunHava {
  tarih: string;
  il: string;
  ilce: string;
  sicaklikMin: number;
  sicaklikMax: number;
  sicaklikOrtalama: number | null;
  nemOrani: number | null;
  yagisMm: number;
  ruzgarHizi: number;
  havaDurumu: string;
  saatlikVeriler: SaatlikVeri[];
  tahmin7Gun: Tahmin[];
  kaynakCache: boolean;
}

const havaDurumuIkon: Record<string, string> = {
  güneşli: '☀️',
  'parçalı bulutlu': '⛅',
  sisli: '🌫️',
  yağmurlu: '🌧️',
  karlı: '❄️',
  sağanak: '⛈️',
  fırtınalı: '🌪️',
};

function tarihFormatla(tarih: string): string {
  return new Date(tarih).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short', weekday: 'short' });
}

const ILLER = illerListesi();

export default function HavaDurumuSayfasi() {
  const [secilenIl, setSecilenIl] = useState('Rize');
  const [secilenIlce, setSecilenIlce] = useState('Merkez');
  const [ilceler, setIlceler] = useState<string[]>([]);
  const [bugunHava, setBugunHava] = useState<BugunHava | null>(null);
  const [yukleniyor, setYukleniyor] = useState(false);
  const [hata, setHata] = useState<string | null>(null);
  const [saatlikAcik, setSaatlikAcik] = useState(false);

  useEffect(() => {
    const liste = ilceleriGetir(secilenIl);
    setIlceler(liste);
    setSecilenIlce(liste[0] ?? 'Merkez');
  }, [secilenIl]);

  // Sayfa açılınca sistem ayarından konum oku ve otomatik getir
  useEffect(() => {
    fetch('/api/sistem-ayarlar')
      .then((r) => r.json())
      .then((ayarlar) => {
        const il = ayarlar['hava_il'] ?? 'Rize';
        const ilce = ayarlar['hava_ilce'] ?? 'Merkez';
        setSecilenIl(il);
        setSecilenIlce(ilce);
        havaDurumuGetir(il, ilce);
      })
      .catch(() => havaDurumuGetir('Rize', 'Merkez'));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const havaDurumuGetir = async (il: string, ilce: string) => {
    setYukleniyor(true);
    setHata(null);
    try {
      const yanit = await fetch(`/api/hava-durumu/bugun?il=${encodeURIComponent(il)}&ilce=${encodeURIComponent(ilce)}`);
      if (!yanit.ok) throw new Error('Hava durumu alınamadı');
      const veri = await yanit.json();
      setBugunHava(veri);
    } catch {
      setHata('Hava durumu bilgisi alınamadı. Lütfen tekrar deneyin.');
    } finally {
      setYukleniyor(false);
    }
  };

  async function konumuKaydet() {
    await fetch('/api/sistem-ayarlar', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ hava_il: secilenIl, hava_ilce: secilenIlce }),
    });
    havaDurumuGetir(secilenIl, secilenIlce);
  }

  return (
    <div className="p-6 space-y-6">
      {/* Başlık ve Konum Seçici */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-800">Hava Durumu</h2>
          <p className="text-xs text-gray-400 mt-0.5">Cron: günde 5 kez otomatik güncellenir</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <select
            value={secilenIl}
            onChange={(e) => setSecilenIl(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
          >
            {ILLER.map((il) => (
              <option key={il} value={il}>{il}</option>
            ))}
          </select>
          <select
            value={secilenIlce}
            onChange={(e) => setSecilenIlce(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
          >
            {ilceler.map((ilce) => (
              <option key={ilce} value={ilce}>{ilce}</option>
            ))}
          </select>
          <button
            onClick={konumuKaydet}
            disabled={yukleniyor}
            className="bg-green-600 hover:bg-green-700 disabled:bg-green-300 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            {yukleniyor ? 'Yükleniyor...' : 'Getir & Kaydet'}
          </button>
        </div>
      </div>

      {hata && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-600 text-sm">{hata}</div>
      )}

      {/* Ana kart */}
      {bugunHava && (
        <div className="bg-gradient-to-br from-blue-500 to-blue-700 rounded-2xl p-6 text-white shadow-lg">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="text-2xl font-bold">{bugunHava.ilce}, {bugunHava.il}</h3>
              <p className="text-blue-200 text-sm mt-1">{tarihFormatla(bugunHava.tarih)}</p>
              <p className="text-3xl mt-2 capitalize">{bugunHava.havaDurumu}</p>
              {bugunHava.kaynakCache && (
                <p className="text-blue-300 text-xs mt-1">Son cron verisi</p>
              )}
            </div>
            <div className="text-6xl">{havaDurumuIkon[bugunHava.havaDurumu] ?? '🌡️'}</div>
          </div>

          <div className="grid grid-cols-4 gap-3 mt-6 pt-4 border-t border-blue-400">
            <div className="text-center">
              <p className="text-blue-200 text-xs uppercase tracking-wide">Sıcaklık</p>
              <p className="text-lg font-semibold mt-1">
                {bugunHava.sicaklikMin}° / {bugunHava.sicaklikMax}°C
              </p>
              {bugunHava.sicaklikOrtalama && (
                <p className="text-blue-200 text-xs">Ort: {bugunHava.sicaklikOrtalama.toFixed(1)}°C</p>
              )}
            </div>
            <div className="text-center">
              <p className="text-blue-200 text-xs uppercase tracking-wide">Nem</p>
              <p className="text-lg font-semibold mt-1">
                {bugunHava.nemOrani ? `%${bugunHava.nemOrani.toFixed(0)}` : '—'}
              </p>
            </div>
            <div className="text-center">
              <p className="text-blue-200 text-xs uppercase tracking-wide">Yağış</p>
              <p className="text-lg font-semibold mt-1">{bugunHava.yagisMm} mm</p>
            </div>
            <div className="text-center">
              <p className="text-blue-200 text-xs uppercase tracking-wide">Rüzgar</p>
              <p className="text-lg font-semibold mt-1">{bugunHava.ruzgarHizi} km/h</p>
            </div>
          </div>
        </div>
      )}

      {/* Saatlik veriler */}
      {bugunHava?.saatlikVeriler && bugunHava.saatlikVeriler.length > 0 && (
        <div className="bg-white rounded-xl border p-4">
          <button
            onClick={() => setSaatlikAcik(!saatlikAcik)}
            className="flex items-center justify-between w-full"
          >
            <h3 className="text-sm font-semibold text-gray-700">Saatlik Veriler</h3>
            <span className="text-gray-400 text-xs">{saatlikAcik ? '▲ Gizle' : '▼ Göster'}</span>
          </button>
          {saatlikAcik && (
            <div className="mt-3 overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b text-left text-gray-500">
                    <th className="pb-2 pr-3 font-medium">Saat</th>
                    <th className="pb-2 pr-3 font-medium">Sıcaklık</th>
                    <th className="pb-2 pr-3 font-medium">Nem %</th>
                    <th className="pb-2 pr-3 font-medium">Yağış</th>
                    <th className="pb-2 font-medium">Durum</th>
                  </tr>
                </thead>
                <tbody>
                  {bugunHava.saatlikVeriler.map((s) => (
                    <tr key={s.saat} className="border-b last:border-0 hover:bg-gray-50">
                      <td className="py-1.5 pr-3 text-gray-700 font-medium">{s.saat}</td>
                      <td className="py-1.5 pr-3 text-gray-600">{s.sicaklik}°C</td>
                      <td className="py-1.5 pr-3">
                        <span className={`font-medium ${s.nem > 85 ? 'text-blue-600' : s.nem > 70 ? 'text-green-600' : 'text-gray-600'}`}>
                          %{s.nem}
                        </span>
                      </td>
                      <td className="py-1.5 pr-3 text-gray-600">{s.yagis} mm</td>
                      <td className="py-1.5 text-gray-600 capitalize">{s.durum}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* 7 Günlük Tahmin */}
      {bugunHava && bugunHava.tahmin7Gun.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-gray-700 mb-3">7 Günlük Tahmin</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
            {bugunHava.tahmin7Gun.map((tahmin, i) => (
              <div
                key={tahmin.tarih}
                className={`bg-white rounded-xl border p-3 text-center shadow-sm ${i === 0 ? 'border-blue-300 bg-blue-50' : ''}`}
              >
                <p className="text-xs text-gray-500">{tarihFormatla(tahmin.tarih)}</p>
                <div className="text-2xl my-2">{havaDurumuIkon[tahmin.havaDurumu] ?? '🌡️'}</div>
                <p className="text-sm font-semibold text-gray-800">{tahmin.sicaklikMax}°C</p>
                <p className="text-xs text-gray-500 mt-0.5">{tahmin.yagisMm} mm</p>
                <p className="text-xs text-gray-400 mt-0.5 capitalize leading-tight">{tahmin.havaDurumu}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {!bugunHava && !yukleniyor && !hata && (
        <div className="bg-gray-50 rounded-xl border p-12 text-center text-gray-500">
          <div className="text-5xl mb-4">🌤️</div>
          <p className="text-lg">İl ve ilçe seçip "Getir & Kaydet" butonuna tıklayın.</p>
          <p className="text-sm text-gray-400 mt-2">Open-Meteo ücretsiz API · İlçe bazlı saatlik nem verisi dahil</p>
        </div>
      )}
    </div>
  );
}
