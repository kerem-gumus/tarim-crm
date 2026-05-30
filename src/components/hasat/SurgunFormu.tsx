'use client';

import { useState } from 'react';

type Props = {
  hasatDonemiId: string;
  onKapat: () => void;
  onKaydet: () => void;
};

const bugunStr = () => new Date().toISOString().split('T')[0];

export default function SurgunFormu({ hasatDonemiId, onKapat, onKaydet }: Props) {
  const [baslangicTarihi, setBaslangicTarihi] = useState(bugunStr());
  const [yukleniyor, setYukleniyor] = useState(false);
  const [hata, setHata] = useState('');

  async function kaydet(e: React.FormEvent) {
    e.preventDefault();
    setHata('');
    setYukleniyor(true);

    try {
      const yanit = await fetch('/api/surgunler', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ hasatDonemiId, baslangicTarihi }),
      });

      if (!yanit.ok) {
        const veri = await yanit.json();
        throw new Error(veri.hata ?? 'Kayıt başarısız');
      }

      onKaydet();
    } catch (err) {
      setHata(err instanceof Error ? err.message : 'Bir hata oluştu');
    } finally {
      setYukleniyor(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="relative w-full max-w-sm rounded-xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b px-6 py-4">
          <h2 className="text-lg font-semibold text-gray-800">Yeni Sürgün Aç</h2>
          <button onClick={onKapat} className="text-xl font-bold text-gray-400 hover:text-gray-600">
            ✕
          </button>
        </div>

        <form onSubmit={kaydet} className="space-y-4 px-6 py-5">
          {hata && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {hata}
            </div>
          )}

          <p className="text-sm text-gray-500">
            Sürgün numarası ve adı otomatik atanacaktır.
          </p>

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

          <div className="flex justify-end gap-3 border-t pt-4">
            <button
              type="button"
              onClick={onKapat}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              İptal
            </button>
            <button
              type="submit"
              disabled={yukleniyor}
              className="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50"
            >
              {yukleniyor ? 'Açılıyor...' : 'Sürgün Aç'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
