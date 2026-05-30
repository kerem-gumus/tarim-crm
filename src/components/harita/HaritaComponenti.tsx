'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';

interface TarlaPin {
  id: string;
  tarlaAdi: string;
  ciftciAdi: string;
  koordinatLat: number | null;
  koordinatLng: number | null;
  donum: number;
  verimRengi: 'yesil' | 'sari' | 'kirmizi' | 'gri';
  sonHasatKg: number;
  hasatGirisAdet: number;
}

const renkMap: Record<string, string> = {
  yesil: '#22c55e',
  sari: '#eab308',
  kirmizi: '#ef4444',
  gri: '#9ca3af',
};

const verimEtiketi: Record<string, string> = {
  yesil: 'Verim Artışı',
  sari: 'Stabil',
  kirmizi: 'Verim Düşüşü',
  gri: 'Veri Yok',
};

// Leaflet SSR'da çalışmaz — dynamic import ile istemci tarafında yükle
const HaritaIci = dynamic(() => import('./HaritaIci'), {
  ssr: false,
  loading: () => (
    <div className="h-full flex items-center justify-center text-gray-400 text-sm">
      Harita yükleniyor...
    </div>
  ),
});

export default function HaritaComponenti() {
  const [tarlalar, setTarlalar] = useState<TarlaPin[]>([]);
  const [yukleniyor, setYukleniyor] = useState(true);
  const [hata, setHata] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/harita/tarlalar')
      .then((r) => r.json())
      .then((veri) => {
        if (Array.isArray(veri)) {
          setTarlalar(veri);
        } else {
          setHata('Veri yüklenemedi');
        }
      })
      .catch(() => setHata('Sunucu bağlantı hatası'))
      .finally(() => setYukleniyor(false));
  }, []);

  const koordinatliTarlalar = tarlalar.filter(
    (t) => t.koordinatLat !== null && t.koordinatLng !== null
  ) as (TarlaPin & { koordinatLat: number; koordinatLng: number })[];

  const koordinatsizTarlalar = tarlalar.filter(
    (t) => t.koordinatLat === null || t.koordinatLng === null
  );

  if (yukleniyor) {
    return (
      <div className="h-96 bg-gray-100 rounded-xl border flex items-center justify-center text-gray-500">
        <p>Yükleniyor...</p>
      </div>
    );
  }

  if (hata) {
    return (
      <div className="h-96 bg-red-50 rounded-xl border border-red-200 flex items-center justify-center text-red-500">
        <p>{hata}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="h-[500px] rounded-xl border overflow-hidden">
        <HaritaIci tarlalar={koordinatliTarlalar} />
      </div>

      {koordinatliTarlalar.length === 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 text-sm text-yellow-700">
          Koordinatı girilmiş tarla bulunamadı. Tarla düzenleme ekranından koordinat ekleyebilirsiniz.
        </div>
      )}

      {/* Koordinatsız Tarlalar Tablosu */}
      {koordinatsizTarlalar.length > 0 && (
        <div className="bg-white rounded-xl border p-4">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">
            Koordinatsız Tarlalar ({koordinatsizTarlalar.length})
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-gray-500">
                  <th className="pb-2 pr-4 font-medium">Tarla Adı</th>
                  <th className="pb-2 pr-4 font-medium">Çiftçi</th>
                  <th className="pb-2 pr-4 font-medium">Dönüm</th>
                  <th className="pb-2 font-medium">Verim</th>
                </tr>
              </thead>
              <tbody>
                {koordinatsizTarlalar.map((tarla) => (
                  <tr key={tarla.id} className="border-b last:border-0">
                    <td className="py-2 pr-4 text-gray-800">{tarla.tarlaAdi}</td>
                    <td className="py-2 pr-4 text-gray-600">{tarla.ciftciAdi}</td>
                    <td className="py-2 pr-4 text-gray-600">{tarla.donum} dönüm</td>
                    <td className="py-2">
                      <span
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium text-white"
                        style={{ backgroundColor: renkMap[tarla.verimRengi] }}
                      >
                        {verimEtiketi[tarla.verimRengi]}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tarlalar.length === 0 && (
        <div className="bg-gray-50 rounded-xl border p-8 text-center text-gray-500">
          <p>Aktif tarla bulunamadı.</p>
        </div>
      )}
    </div>
  );
}
