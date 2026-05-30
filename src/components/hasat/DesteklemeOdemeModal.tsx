'use client';

import { useState } from 'react';

type Props = {
  donemId: string;
  donemAdi: string;
  kalanTutar: number;
  onKapat: () => void;
  onKaydet: () => void;
};

export default function DesteklemeOdemeModal({ donemId, donemAdi, kalanTutar, onKapat, onKaydet }: Props) {
  // Devlet genellikle Mart ayında ödeme yapar — gelecek yılın Mart'ını varsayılan yap
  const martTarihi = (() => {
    const simdi = new Date();
    const yil = simdi.getMonth() < 2 ? simdi.getFullYear() : simdi.getFullYear() + 1;
    return `${yil}-03-01`;
  })();

  const [form, setForm] = useState({
    tutar: kalanTutar.toFixed(2),
    tarih: martTarihi,
    aciklama: 'Devlet destekleme ödemesi',
  });
  const [kaydediliyor, setKaydediliyor] = useState(false);
  const [hata, setHata] = useState('');

  async function kaydet(e: React.FormEvent) {
    e.preventDefault();
    setHata('');
    setKaydediliyor(true);
    try {
      const yanit = await fetch(`/api/hasat-donemleri/${donemId}/destekleme-odeme`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const veri = await yanit.json();
      if (!yanit.ok) { setHata(veri.hata); return; }
      onKaydet();
    } catch {
      setHata('Bir hata oluştu');
    } finally {
      setKaydediliyor(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-sm rounded-xl bg-white shadow-xl">
        <div className="border-b px-5 py-4">
          <h2 className="text-base font-semibold text-gray-800">Destekleme Ödemesi Gir</h2>
          <p className="text-xs text-gray-400 mt-0.5">{donemAdi}</p>
        </div>

        <form onSubmit={kaydet} className="p-5 space-y-4">
          {hata && (
            <div className="rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-700">{hata}</div>
          )}

          <div className="rounded-lg bg-purple-50 border border-purple-100 px-4 py-2 flex justify-between text-sm">
            <span className="text-gray-600">Kalan Alacak</span>
            <span className="font-bold text-purple-700">
              ₺{kalanTutar.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
            </span>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Ödeme Tutarı (₺) <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              value={form.tutar}
              onChange={(e) => setForm((p) => ({ ...p, tutar: e.target.value }))}
              required
              min="0.01"
              step="0.01"
              max={kalanTutar}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Ödeme Tarihi <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              value={form.tarih}
              onChange={(e) => setForm((p) => ({ ...p, tarih: e.target.value }))}
              required
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
            <p className="text-xs text-gray-400 mt-0.5">Devlet genellikle bir sonraki yılın Mart ayında öder</p>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Açıklama</label>
            <input
              type="text"
              value={form.aciklama}
              onChange={(e) => setForm((p) => ({ ...p, aciklama: e.target.value }))}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>

          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={onKapat}
              className="flex-1 rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              İptal
            </button>
            <button
              type="submit"
              disabled={kaydediliyor}
              className="flex-1 rounded-lg bg-purple-600 px-4 py-2 text-sm font-medium text-white hover:bg-purple-700 disabled:opacity-50"
            >
              {kaydediliyor ? 'Kaydediliyor...' : 'Ödeme Kaydet'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
