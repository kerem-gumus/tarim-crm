'use client';

import { useState, useEffect } from 'react';

type Tarla = {
  id: string;
  tarlaAdi: string;
};

type Props = {
  malzemeId: string;
  malzemeAdi: string;
  birim: string;
  varsayilanTip?: 'giris' | 'cikis';
  onKapat: () => void;
  onBasarili: (uyari?: string) => void;
};

export default function StokHareketiModal({
  malzemeId,
  malzemeAdi,
  birim,
  varsayilanTip = 'giris',
  onKapat,
  onBasarili,
}: Props) {
  const [yukleniyor, setYukleniyor] = useState(false);
  const [hata, setHata] = useState('');
  const [tarlalar, setTarlalar] = useState<Tarla[]>([]);
  const [form, setForm] = useState({
    hareketTipi: varsayilanTip,
    miktar: '',
    birimFiyat: '',
    toplamTutar: '',
    tarih: new Date().toISOString().split('T')[0],
    tarlaId: '',
    tedarikci: '',
    faturaNo: '',
    notlar: '',
  });

  useEffect(() => {
    fetch('/api/tarlalar')
      .then((r) => r.json())
      .then(setTarlalar)
      .catch(console.error);
  }, []);

  // Toplam tutarı otomatik hesapla
  useEffect(() => {
    const miktar = parseFloat(form.miktar) || 0;
    const birimFiyat = parseFloat(form.birimFiyat) || 0;
    if (miktar > 0 && birimFiyat > 0) {
      setForm((onceki) => ({
        ...onceki,
        toplamTutar: (miktar * birimFiyat).toFixed(2),
      }));
    }
  }, [form.miktar, form.birimFiyat]);

  const handleDegistir = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    setForm((onceki) => ({ ...onceki, [e.target.name]: e.target.value }));
  };

  const handleGonder = async (e: React.FormEvent) => {
    e.preventDefault();
    setHata('');
    setYukleniyor(true);

    try {
      const yanit = await fetch('/api/stok-hareketleri', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          malzemeId,
          hareketTipi: form.hareketTipi,
          miktar: parseFloat(form.miktar),
          birimFiyat: form.birimFiyat ? parseFloat(form.birimFiyat) : null,
          toplamTutar: form.toplamTutar ? parseFloat(form.toplamTutar) : null,
          tarih: form.tarih,
          tarlaId: form.tarlaId || null,
          tedarikci: form.tedarikci || null,
          faturaNo: form.faturaNo || null,
          notlar: form.notlar || null,
        }),
      });

      if (!yanit.ok) {
        const hataVerisi = await yanit.json();
        setHata(hataVerisi.hata || 'Bir hata oluştu');
        return;
      }

      const veri = await yanit.json();
      onBasarili(veri.uyari);
      onKapat();
    } catch {
      setHata('Sunucu bağlantı hatası');
    } finally {
      setYukleniyor(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-lg rounded-xl bg-white shadow-xl">
        <div className="border-b border-gray-200 px-6 py-4">
          <h2 className="text-lg font-semibold text-gray-800">
            Stok Hareketi — {malzemeAdi}
          </h2>
        </div>

        <form onSubmit={handleGonder} className="space-y-4 p-6">
          {hata && (
            <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{hata}</div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Hareket Tipi <span className="text-red-500">*</span>
              </label>
              <select
                name="hareketTipi"
                value={form.hareketTipi}
                onChange={handleDegistir}
                required
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
              >
                <option value="giris">Giriş</option>
                <option value="cikis">Çıkış</option>
                <option value="fire">Fire</option>
                <option value="iade">İade</option>
              </select>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Tarih <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                name="tarih"
                value={form.tarih}
                onChange={handleDegistir}
                required
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Miktar ({birim}) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                name="miktar"
                value={form.miktar}
                onChange={handleDegistir}
                required
                min="0.001"
                step="0.001"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
                placeholder="0.000"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Birim Fiyat (₺)
              </label>
              <input
                type="number"
                name="birimFiyat"
                value={form.birimFiyat}
                onChange={handleDegistir}
                min="0"
                step="0.01"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
                placeholder="0.00"
              />
            </div>

            <div className="col-span-2">
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Toplam Tutar (₺)
              </label>
              <input
                type="number"
                name="toplamTutar"
                value={form.toplamTutar}
                onChange={handleDegistir}
                min="0"
                step="0.01"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500 bg-gray-50"
                placeholder="Otomatik hesaplanır"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Tarla (İsteğe Bağlı)</label>
              <select
                name="tarlaId"
                value={form.tarlaId}
                onChange={handleDegistir}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
              >
                <option value="">Seçiniz...</option>
                {tarlalar.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.tarlaAdi}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Tedarikçi</label>
              <input
                type="text"
                name="tedarikci"
                value={form.tedarikci}
                onChange={handleDegistir}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
                placeholder="Tedarikçi adı"
              />
            </div>

            <div className="col-span-2">
              <label className="mb-1 block text-sm font-medium text-gray-700">Fatura No</label>
              <input
                type="text"
                name="faturaNo"
                value={form.faturaNo}
                onChange={handleDegistir}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
                placeholder="Fatura numarası"
              />
            </div>

            <div className="col-span-2">
              <label className="mb-1 block text-sm font-medium text-gray-700">Notlar</label>
              <textarea
                name="notlar"
                value={form.notlar}
                onChange={handleDegistir}
                rows={2}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
                placeholder="İsteğe bağlı notlar"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
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
              {yukleniyor ? 'Kaydediliyor...' : 'Kaydet'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
