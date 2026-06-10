'use client';

import { useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';

interface CariHareketSatir {
  id: string;
  tarih: string;
  islemTipi: 'satis_kaynakli' | 'odesme';
  yon: 'bana_borclu' | 'ben_borcluyum';
  miktarKg: number;
  kumBakiyeKg: number;
  aciklama: string | null;
  hasatGirisi: { id: string; tarih: string; satisMiktariKg: number } | null;
}

interface EkstreVerisi {
  kullanici: { id: string; ad: string; telefon: string | null; durum: string };
  hareketler: CariHareketSatir[];
  netKg: number;
  ozet: { aciklama: string };
}

function kgFormat(kg: number) {
  return Math.abs(kg).toLocaleString('tr-TR', { minimumFractionDigits: 0, maximumFractionDigits: 1 }) + ' kg';
}

function OdesmeFormu({
  cuzdanKullaniciId,
  ad,
  netKg,
  onKaydet,
  onKapat,
}: {
  cuzdanKullaniciId: string;
  ad: string;
  netKg: number;
  onKaydet: () => void;
  onKapat: () => void;
}) {
  const [miktarKg, setMiktarKg] = useState('');
  const [aciklama, setAciklama] = useState('');
  const [tarih, setTarih] = useState(new Date().toISOString().split('T')[0]);
  const [kaydediliyor, setKaydediliyor] = useState(false);
  const [hata, setHata] = useState('');

  // Ödeşme yönü: netKg > 0 → "o bana borçlu, o bana çay satıyor → ben_borcluyum kaydı azaltır"
  // netKg < 0 → "ben borçluyum, ben ona çay satıyorum → bana_borclu kaydı azaltır"
  const odesmeYonu = netKg >= 0 ? 'ben_borcluyum' : 'bana_borclu';

  async function kaydet() {
    const kg = Number(miktarKg);
    if (!kg || kg <= 0) { setHata('Geçerli kg girin'); return; }
    setKaydediliyor(true); setHata('');
    try {
      const yanit = await fetch('/api/cari-hesap/odesme', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cuzdanKullaniciId, miktarKg: kg, yon: odesmeYonu, aciklama, tarih }),
      });
      if (!yanit.ok) { const v = await yanit.json(); setHata(v.hata ?? 'Hata'); return; }
      onKaydet();
    } catch { setHata('Bağlantı hatası'); } finally { setKaydediliyor(false); }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-sm rounded-xl bg-white p-6 shadow-xl space-y-4">
        <h3 className="text-base font-semibold text-gray-800">Ödeşme Kaydı — {ad}</h3>

        <div className="rounded-lg border border-blue-100 bg-blue-50 px-3 py-2 text-sm text-blue-800">
          {netKg > 0
            ? `${ad} sana ${kgFormat(netKg)} borçlu. O sana çay satarak öder.`
            : netKg < 0
              ? `Sen ${ad}'a ${kgFormat(netKg)} borçlusun. Sen ona çay satarak ödersin.`
              : 'Hesap sıfır durumda.'}
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Ödeşme Miktarı (kg) *</label>
          <input type="number" value={miktarKg} onChange={(e) => setMiktarKg(e.target.value)}
            min={0.1} step={0.1} placeholder="0.0"
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Tarih</label>
          <input type="date" value={tarih} onChange={(e) => setTarih(e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Açıklama</label>
          <input type="text" value={aciklama} onChange={(e) => setAciklama(e.target.value)}
            placeholder="Ödeşme notu..."
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>

        {hata && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{hata}</p>}

        <div className="flex gap-3 pt-1">
          <button onClick={onKapat} className="flex-1 rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">İptal</button>
          <button onClick={kaydet} disabled={kaydediliyor}
            className="flex-1 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50">
            {kaydediliyor ? 'Kaydediliyor...' : 'Ödeşmeyi Kaydet'}
          </button>
        </div>
      </div>
    </div>
  );
}

function CariHesapIc() {
  const searchParams = useSearchParams();
  const cuzdanId = searchParams.get('id');

  const [ekstre, setEkstre] = useState<EkstreVerisi | null>(null);
  const [ozet, setOzet] = useState<{ kullanicilar: { cuzdanKullaniciId: string; ad: string; netKg: number }[] } | null>(null);
  const [yukleniyor, setYukleniyor] = useState(true);
  const [odesmeAcik, setOdesmeAcik] = useState(false);

  const getir = useCallback(async () => {
    setYukleniyor(true);
    try {
      const url = cuzdanId
        ? `/api/cari-hesap?cuzdanKullaniciId=${cuzdanId}`
        : '/api/cari-hesap';
      const yanit = await fetch(url);
      const veri = await yanit.json();
      if (cuzdanId) setEkstre(veri);
      else setOzet(veri);
    } finally { setYukleniyor(false); }
  }, [cuzdanId]);

  useEffect(() => { getir(); }, [getir]);

  if (yukleniyor) {
    return <p className="text-center text-gray-400 py-12">Yükleniyor...</p>;
  }

  // Ekstre modu
  if (cuzdanId && ekstre) {
    return (
      <div className="min-h-full bg-gray-50">
        <div className="flex items-center justify-between px-4 pt-4 pb-2 flex-wrap gap-2">
          <div>
            <div className="flex items-center gap-2">
              <a href="/cari-hesap" className="text-sm text-blue-600 hover:underline">← Geri</a>
              <h1 className="text-lg font-bold text-gray-800">{ekstre.kullanici.ad} — Cari Hesap</h1>
            </div>
            <p className={`text-sm font-semibold mt-0.5 ${ekstre.netKg > 0 ? 'text-green-700' : ekstre.netKg < 0 ? 'text-red-600' : 'text-gray-500'}`}>
              {ekstre.ozet.aciklama}
            </p>
          </div>
          {ekstre.netKg !== 0 && (
            <button onClick={() => setOdesmeAcik(true)}
              className="rounded-lg bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700">
              + Ödeşme Kaydı
            </button>
          )}
        </div>

        <div className="px-4 py-4">
          {ekstre.hareketler.length === 0 ? (
            <p className="text-center text-gray-400 py-12">Henüz cari hareket yok.</p>
          ) : (
            <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
              <table className="w-full text-sm hidden md:table">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    <th className="px-4 py-3">Tarih</th>
                    <th className="px-4 py-3">Tür</th>
                    <th className="px-4 py-3">Yön</th>
                    <th className="px-4 py-3 text-right">Miktar (kg)</th>
                    <th className="px-4 py-3 text-right">Kümülatif Bakiye</th>
                    <th className="px-4 py-3">Açıklama</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {ekstre.hareketler.map((h) => (
                    <tr key={h.id} className="hover:bg-gray-50">
                      <td className="px-4 py-2.5 text-gray-600 whitespace-nowrap">
                        {new Date(h.tarih).toLocaleDateString('tr-TR')}
                      </td>
                      <td className="px-4 py-2.5">
                        <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${h.islemTipi === 'odesme' ? 'bg-blue-100 text-blue-700' : 'bg-amber-100 text-amber-700'}`}>
                          {h.islemTipi === 'odesme' ? 'Ödeşme' : 'Satış'}
                        </span>
                      </td>
                      <td className="px-4 py-2.5">
                        <span className={`text-xs font-medium ${h.yon === 'bana_borclu' ? 'text-green-700' : 'text-red-600'}`}>
                          {h.yon === 'bana_borclu' ? 'Alacak' : 'Borç'}
                        </span>
                      </td>
                      <td className="px-4 py-2.5 text-right font-semibold">
                        {kgFormat(h.miktarKg)}
                      </td>
                      <td className={`px-4 py-2.5 text-right font-semibold ${h.kumBakiyeKg > 0 ? 'text-green-700' : h.kumBakiyeKg < 0 ? 'text-red-600' : 'text-gray-500'}`}>
                        {h.kumBakiyeKg > 0 ? '+' : ''}{kgFormat(h.kumBakiyeKg)}
                        {h.kumBakiyeKg !== 0 && <span className="text-xs font-normal ml-1 opacity-70">{h.kumBakiyeKg > 0 ? 'alacak' : 'borç'}</span>}
                      </td>
                      <td className="px-4 py-2.5 text-gray-600 text-xs">{h.aciklama ?? '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Mobil */}
              <div className="md:hidden divide-y divide-gray-100">
                {ekstre.hareketler.map((h) => (
                  <div key={h.id} className="px-4 py-3 flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${h.islemTipi === 'odesme' ? 'bg-blue-100 text-blue-700' : 'bg-amber-100 text-amber-700'}`}>
                          {h.islemTipi === 'odesme' ? 'Ödeşme' : 'Satış'}
                        </span>
                        <span className={`text-xs font-medium ${h.yon === 'bana_borclu' ? 'text-green-700' : 'text-red-600'}`}>
                          {h.yon === 'bana_borclu' ? 'Alacak' : 'Borç'}
                        </span>
                        <span className="text-xs text-gray-400">{new Date(h.tarih).toLocaleDateString('tr-TR')}</span>
                      </div>
                      {h.aciklama && <p className="text-xs text-gray-500 mt-1">{h.aciklama}</p>}
                    </div>
                    <div className="text-right shrink-0">
                      <p className="font-semibold text-sm">{kgFormat(h.miktarKg)}</p>
                      <p className={`text-xs ${h.kumBakiyeKg > 0 ? 'text-green-700' : h.kumBakiyeKg < 0 ? 'text-red-600' : 'text-gray-400'}`}>
                        Bakiye: {h.kumBakiyeKg > 0 ? '+' : ''}{kgFormat(h.kumBakiyeKg)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {odesmeAcik && (
          <OdesmeFormu
            cuzdanKullaniciId={cuzdanId}
            ad={ekstre.kullanici.ad}
            netKg={ekstre.netKg}
            onKaydet={() => { setOdesmeAcik(false); getir(); }}
            onKapat={() => setOdesmeAcik(false)}
          />
        )}
      </div>
    );
  }

  // Özet modu — tüm kullanıcılar
  return (
    <div className="min-h-full bg-gray-50">
      <div className="px-4 pt-4 pb-2 flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold text-gray-800">Cari Hesap</h1>
          <p className="text-xs text-gray-500">Cüzdan kullandırma borç/alacak özeti</p>
        </div>
        <a href="/cuzdan-kullanicilari"
          className="rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50">
          Kullanıcıları Yönet
        </a>
      </div>

      <div className="px-4 py-4">
        {!ozet || ozet.kullanicilar.length === 0 ? (
          <p className="text-center text-gray-400 py-12 text-sm">Henüz cari hareket yok.</p>
        ) : (
          <div className="space-y-3">
            {ozet.kullanicilar.map((k) => (
              <a key={k.cuzdanKullaniciId} href={`/cari-hesap?id=${k.cuzdanKullaniciId}`}
                className="block rounded-2xl border border-gray-100 bg-white shadow-sm p-4 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between gap-2">
                  <p className="font-semibold text-gray-800">{k.ad}</p>
                  <div className="text-right">
                    {k.netKg === 0 ? (
                      <span className="text-sm text-gray-400">Sıfır</span>
                    ) : k.netKg > 0 ? (
                      <span className="text-sm font-bold text-green-700">{kgFormat(k.netKg)} alacak</span>
                    ) : (
                      <span className="text-sm font-bold text-red-600">{kgFormat(k.netKg)} borç</span>
                    )}
                    <p className="text-xs text-gray-400 mt-0.5">
                      {k.netKg > 0 ? 'Bana borçlu' : k.netKg < 0 ? 'Ben borçluyum' : ''}
                    </p>
                  </div>
                </div>
              </a>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function CariHesapSayfasi() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center h-64 text-gray-400">Yükleniyor...</div>}>
      <CariHesapIc />
    </Suspense>
  );
}
