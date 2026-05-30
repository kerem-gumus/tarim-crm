'use client';

import { useCallback, useEffect, useState } from 'react';
import TarlaFormu from '@/components/tarla/TarlaFormu';
import FotografGalerisi from '@/components/fotograf/FotografGalerisi';
import FotografYukleyici from '@/components/fotograf/FotografYukleyici';
import TarlaQrKodu from '@/components/qr/TarlaQrKodu';

type TarlaListeItem = {
  id: string;
  tarlaAdi: string;
  konumIl: string;
  konumIlce: string;
  konumKoy: string;
  adaNo: string | null;
  parselNo: string | null;
  donum: string | number;
  metrekare: string | number | null;
  rakim: number | null;
  cayCesidi: string | null;
  dikimYili: number | null;
  topraktipi: string | null;
  sulamaDurumu: 'dogal' | 'sulamali' | 'karma';
  ciftciId: string;
  koordinatLat: string | number | null;
  koordinatLng: string | number | null;
  durum: 'aktif' | 'pasif';
  notlar: string | null;
  mulkiyetDurumu: 'sahip' | 'kiralik';
  kiraciCiftciId: string | null;
  ciftci: {
    id: string;
    adSoyad: string;
  } | null;
};

const sulamaDurumuEtiket: Record<string, string> = {
  dogal: 'Doğal',
  sulamali: 'Sulamalı',
  karma: 'Karma',
};

export default function TarlalarSayfasi() {
  const [tarlalar, setTarlalar] = useState<TarlaListeItem[]>([]);
  const [yukleniyor, setYukleniyor] = useState(true);
  const [aramaMetni, setAramaMetni] = useState('');
  const [formAcik, setFormAcik] = useState(false);
  const [seciliTarla, setSeciliTarla] = useState<TarlaListeItem | null>(null);
  const [silOnayId, setSilOnayId] = useState<string | null>(null);
  const [siliniyor, setSiliniyor] = useState(false);
  const [ciftciKaldirOnayId, setCiftciKaldirOnayId] = useState<string | null>(null);
  const [ciftciKaldiriliyor, setCiftciKaldiriliyor] = useState(false);
  const [fotografModalTarla, setFotografModalTarla] = useState<TarlaListeItem | null>(null);
  const [galeriyiYenile, setGaleriyiYenile] = useState(0);
  const [qrTarlaId, setQrTarlaId] = useState<string | null>(null);

  const tralariGetir = useCallback(async () => {
    setYukleniyor(true);
    try {
      const yanit = await fetch('/api/tarlalar?tumunu=true');
      const veri = await yanit.json();
      setTarlalar(Array.isArray(veri) ? veri : []);
    } finally {
      setYukleniyor(false);
    }
  }, []);

  useEffect(() => {
    tralariGetir();
  }, [tralariGetir]);

  function yeniEkle() {
    setSeciliTarla(null);
    setFormAcik(true);
  }

  function duzenle(tarla: TarlaListeItem) {
    setSeciliTarla(tarla);
    setFormAcik(true);
  }

  async function sil(id: string) {
    setSiliniyor(true);
    try {
      await fetch(`/api/tarlalar/${id}`, { method: 'DELETE' });
      setSilOnayId(null);
      await tralariGetir();
    } finally {
      setSiliniyor(false);
    }
  }

  async function ciftciKaldir(id: string) {
    setCiftciKaldiriliyor(true);
    try {
      await fetch(`/api/tarlalar/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ciftciId: null, kiraciCiftciId: null }),
      });
      setCiftciKaldirOnayId(null);
      await tralariGetir();
    } finally {
      setCiftciKaldiriliyor(false);
    }
  }

  function formKaydedildi() {
    setFormAcik(false);
    setSeciliTarla(null);
    tralariGetir();
  }

  const filtrelenmis = tarlalar.filter((t) => {
    const metin = aramaMetni.toLowerCase();
    return (
      t.tarlaAdi.toLowerCase().includes(metin) ||
      (t.ciftci?.adSoyad ?? '').toLowerCase().includes(metin) ||
      t.konumIl.toLowerCase().includes(metin)
    );
  });

  return (
    <div className="p-6">
      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm text-gray-500">{tarlalar.length} tarla kayıtlı</p>
        <button
          onClick={yeniEkle}
          className="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 transition-colors"
        >
          + Yeni Tarla
        </button>
      </div>

      <div>
        {/* Arama */}
        <div className="mb-4">
          <input
            type="text"
            value={aramaMetni}
            onChange={(e) => setAramaMetni(e.target.value)}
            placeholder="Tarla adı, çiftçi adı veya il ile ara..."
            className="w-full max-w-md rounded-lg border border-gray-300 px-4 py-2 text-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
          />
        </div>

        {/* Tablo */}
        {yukleniyor ? (
          <div className="flex items-center justify-center py-20 text-gray-400">Yükleniyor...</div>
        ) : filtrelenmis.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-gray-400">
            <p className="text-lg">
              {aramaMetni ? 'Arama sonucu bulunamadı.' : 'Henüz tarla kaydı yok.'}
            </p>
            {!aramaMetni && (
              <button onClick={yeniEkle} className="mt-3 text-sm text-green-600 hover:underline">
                İlk tarlayı ekle →
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border bg-white shadow-sm">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-gray-50 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                  <th className="px-4 py-3">Tarla Adı</th>
                  <th className="px-4 py-3">Çiftçi</th>
                  <th className="px-4 py-3">Konum</th>
                  <th className="px-4 py-3">Dönüm</th>
                  <th className="px-4 py-3">Mülkiyet</th>
                  <th className="px-4 py-3">Sulama</th>
                  <th className="px-4 py-3">Durum</th>
                  <th className="px-4 py-3 text-right">İşlem</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filtrelenmis.map((tarla) => (
                  <tr key={tarla.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 font-medium text-gray-800">{tarla.tarlaAdi}</td>
                    <td className="px-4 py-3 text-gray-600">
                      {tarla.ciftci?.adSoyad ?? (
                        <span className="text-gray-400 italic">Atanmamış</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {[tarla.konumIl, tarla.konumIlce, tarla.konumKoy].filter(Boolean).join(' / ') || '—'}
                    </td>
                    <td className="px-4 py-3 text-gray-600">{Number(tarla.donum).toFixed(2)}</td>
                    <td className="px-4 py-3">
                      {tarla.mulkiyetDurumu === 'kiralik' ? (
                        <span className="inline-flex rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-700">
                          Kiralık
                        </span>
                      ) : (
                        <span className="inline-flex rounded-full bg-blue-50 px-2 py-0.5 text-xs font-semibold text-blue-600">
                          Kendi Mülkü
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {sulamaDurumuEtiket[tarla.sulamaDurumu] ?? tarla.sulamaDurumu}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${
                          tarla.durum === 'aktif'
                            ? 'bg-green-100 text-green-700'
                            : 'bg-gray-100 text-gray-500'
                        }`}
                      >
                        {tarla.durum === 'aktif' ? 'Aktif' : 'Pasif'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => setFotografModalTarla(tarla)}
                        className="mr-2 rounded px-2 py-1 text-xs font-medium text-purple-600 hover:bg-purple-50"
                      >
                        Fotoğraflar
                      </button>
                      <button
                        onClick={() => setQrTarlaId(tarla.id)}
                        className="mr-2 rounded px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 text-gray-600"
                        title="QR Kod"
                      >
                        QR
                      </button>
                      {tarla.ciftci && (
                        ciftciKaldirOnayId === tarla.id ? (
                          <span className="inline-flex gap-1 mr-2">
                            <button
                              onClick={() => ciftciKaldir(tarla.id)}
                              disabled={ciftciKaldiriliyor}
                              className="rounded px-2 py-1 text-xs font-medium text-orange-600 hover:bg-orange-50 disabled:opacity-50"
                            >
                              {ciftciKaldiriliyor ? '...' : 'Evet, Kaldır'}
                            </button>
                            <button
                              onClick={() => setCiftciKaldirOnayId(null)}
                              className="rounded px-2 py-1 text-xs font-medium text-gray-500 hover:bg-gray-100"
                            >
                              İptal
                            </button>
                          </span>
                        ) : (
                          <button
                            onClick={() => setCiftciKaldirOnayId(tarla.id)}
                            className="mr-2 rounded px-2 py-1 text-xs font-medium text-orange-500 hover:bg-orange-50"
                            title="Çiftçi atamasını kaldır"
                          >
                            Çiftçi Kaldır
                          </button>
                        )
                      )}
                      <button
                        onClick={() => duzenle(tarla)}
                        className="mr-2 rounded px-2 py-1 text-xs font-medium text-blue-600 hover:bg-blue-50"
                      >
                        Düzenle
                      </button>
                      {silOnayId === tarla.id ? (
                        <span className="inline-flex gap-1">
                          <button
                            onClick={() => sil(tarla.id)}
                            disabled={siliniyor}
                            className="rounded px-2 py-1 text-xs font-medium text-red-600 hover:bg-red-50 disabled:opacity-50"
                          >
                            {siliniyor ? '...' : 'Evet, Sil'}
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
                          onClick={() => setSilOnayId(tarla.id)}
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
      </div>

      {/* Tarla Form Modalı */}
      {formAcik && (
        <TarlaFormu
          seciliTarla={seciliTarla}
          onKapat={() => { setFormAcik(false); setSeciliTarla(null); }}
          onKaydet={formKaydedildi}
        />
      )}

      {/* QR Kod Modalı */}
      {qrTarlaId && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 shadow-xl flex flex-col items-center gap-4">
            <h3 className="font-semibold text-gray-700">QR Kod</h3>
            <TarlaQrKodu tarlaId={qrTarlaId} tarlaAdi={tarlalar.find(t => t.id === qrTarlaId)?.tarlaAdi ?? ''} />
            <button onClick={() => setQrTarlaId(null)} className="text-sm text-gray-500 hover:text-gray-700">Kapat</button>
          </div>
        </div>
      )}

      {/* Fotoğraf Modalı */}
      {fotografModalTarla && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-lg rounded-xl bg-white shadow-xl">
            {/* Modal Başlık */}
            <div className="flex items-center justify-between border-b px-6 py-4">
              <div>
                <h2 className="text-base font-semibold text-gray-800">Tarla Fotoğrafları</h2>
                <p className="text-xs text-gray-500">{fotografModalTarla.tarlaAdi}</p>
              </div>
              <button
                onClick={() => { setFotografModalTarla(null); setGaleriyiYenile(0); }}
                className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Modal İçerik */}
            <div className="space-y-4 p-6">
              <FotografYukleyici
                modul="tarla"
                kayitId={fotografModalTarla.id}
                onChange={() => setGaleriyiYenile((s) => s + 1)}
              />
              <FotografGalerisi
                key={galeriyiYenile}
                modul="tarla"
                kayitId={fotografModalTarla.id}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
