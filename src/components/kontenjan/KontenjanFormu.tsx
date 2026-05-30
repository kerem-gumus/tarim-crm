'use client';

import { useEffect, useState } from 'react';
import type { Kontenjan, Surgun, Musteri } from '@prisma/client';

type KontenjanDetay = Kontenjan & {
  surgun: Surgun;
  musteri: Musteri;
};

type Props = {
  seciliKontenjan: KontenjanDetay | null;
  onKapat: () => void;
  onKaydet: () => void;
};

export default function KontenjanFormu({ seciliKontenjan, onKapat, onKaydet }: Props) {
  const [surgunler, setSurgunler] = useState<Surgun[]>([]);
  const [musteriler, setMusteriler] = useState<Musteri[]>([]);
  const [yukleniyor, setYukleniyor] = useState(true);
  const [kaydediliyor, setKaydediliyor] = useState(false);
  const [hata, setHata] = useState('');

  const [surgunId, setSurgunId] = useState(seciliKontenjan?.surgunId ?? '');
  const [musteriId, setMusteriId] = useState(seciliKontenjan?.musteriId ?? '');
  const [gunlukKontenjanKg, setGunlukKontenjanKg] = useState(
    seciliKontenjan ? String(seciliKontenjan.gunlukKontenjanKg) : ''
  );
  const [baslangicTarihi, setBaslangicTarihi] = useState(
    seciliKontenjan
      ? new Date(seciliKontenjan.baslangicTarihi).toISOString().split('T')[0]
      : new Date().toISOString().split('T')[0]
  );
  const [bitisTarihi, setBitisTarihi] = useState(
    seciliKontenjan?.bitisTarihi
      ? new Date(seciliKontenjan.bitisTarihi).toISOString().split('T')[0]
      : ''
  );

  useEffect(() => {
    async function veriGetir() {
      setYukleniyor(true);
      try {
        const [surgunYanit, musteriYanit] = await Promise.all([
          fetch('/api/surgunler'),
          fetch('/api/musteriler'),
        ]);
        const surgunVerisi = await surgunYanit.json();
        const musteriVerisi = await musteriYanit.json();
        setSurgunler(surgunVerisi);
        // Kontenjan müşterilerini önce göster (devletMi veya kontenjanVarMi)
        const sirali = [...musteriVerisi].sort((a: Musteri, b: Musteri) => {
          const aOnce = a.devletMi || a.kontenjanVarMi ? 1 : 0;
          const bOnce = b.devletMi || b.kontenjanVarMi ? 1 : 0;
          return bOnce - aOnce;
        });
        setMusteriler(sirali);
      } finally {
        setYukleniyor(false);
      }
    }
    veriGetir();
  }, []);

  async function handleGonder(e: React.FormEvent) {
    e.preventDefault();
    setHata('');
    setKaydediliyor(true);

    try {
      const govde = {
        surgunId,
        musteriId,
        gunlukKontenjanKg: Number(gunlukKontenjanKg),
        baslangicTarihi,
        bitisTarihi: bitisTarihi || undefined,
      };

      const yanit = seciliKontenjan
        ? await fetch(`/api/kontenjanlar/${seciliKontenjan.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(govde),
          })
        : await fetch('/api/kontenjanlar', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(govde),
          });

      const veri = await yanit.json();

      if (!yanit.ok) {
        setHata(veri.hata ?? 'Bir hata oluştu');
        return;
      }

      onKaydet();
    } catch {
      setHata('Sunucuya bağlanılamadı');
    } finally {
      setKaydediliyor(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-lg rounded-2xl bg-white shadow-xl">
        {/* Başlık */}
        <div className="flex items-center justify-between border-b px-6 py-4">
          <h2 className="text-base font-semibold text-gray-800">
            {seciliKontenjan ? 'Kontenjan Düzenle' : 'Yeni Kontenjan Tanımla'}
          </h2>
          <button
            onClick={onKapat}
            className="rounded-full p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleGonder} className="space-y-4 px-6 py-5">
          {yukleniyor ? (
            <div className="py-8 text-center text-sm text-gray-400">Yükleniyor...</div>
          ) : (
            <>
              {/* Sürgün */}
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Sürgün <span className="text-red-500">*</span>
                </label>
                <select
                  value={surgunId}
                  onChange={(e) => setSurgunId(e.target.value)}
                  required
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
                >
                  <option value="">Sürgün seçin...</option>
                  {surgunler
                    .filter((s) => s.durum === 'aktif')
                    .map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.surgunAdi}
                      </option>
                    ))}
                </select>
              </div>

              {/* Müşteri */}
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Müşteri <span className="text-red-500">*</span>
                </label>
                <select
                  value={musteriId}
                  onChange={(e) => setMusteriId(e.target.value)}
                  required
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
                >
                  <option value="">Müşteri seçin...</option>
                  {musteriler.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.musteriAdi}
                      {m.devletMi ? ' (Devlet)' : m.kontenjanVarMi ? ' (Kontenjan)' : ''}
                    </option>
                  ))}
                </select>
              </div>

              {/* Günlük Kontenjan */}
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Günlük Kontenjan (kg) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  value={gunlukKontenjanKg}
                  onChange={(e) => setGunlukKontenjanKg(e.target.value)}
                  required
                  min="0"
                  step="0.01"
                  placeholder="örn. 650.00"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
                />
              </div>

              {/* Başlangıç Tarihi */}
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Başlangıç Tarihi <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={baslangicTarihi}
                  onChange={(e) => setBaslangicTarihi(e.target.value)}
                  required
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
                />
              </div>

              {/* Bitiş Tarihi */}
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Bitiş Tarihi <span className="text-xs text-gray-400">(opsiyonel)</span>
                </label>
                <input
                  type="date"
                  value={bitisTarihi}
                  onChange={(e) => setBitisTarihi(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
                />
              </div>

              {/* Hata */}
              {hata && (
                <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{hata}</div>
              )}

              {/* Butonlar */}
              <div className="flex gap-3 pt-1">
                <button
                  type="button"
                  onClick={onKapat}
                  className="flex-1 rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  disabled={kaydediliyor}
                  className="flex-1 rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-60 transition-colors"
                >
                  {kaydediliyor ? 'Kaydediliyor...' : seciliKontenjan ? 'Güncelle' : 'Kaydet'}
                </button>
              </div>
            </>
          )}
        </form>
      </div>
    </div>
  );
}
