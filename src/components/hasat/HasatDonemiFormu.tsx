'use client';

import { useState, useMemo } from 'react';

type Kesinti = {
  kesintiAdi: string;
  yuzde: string;
};

type FormVerisi = {
  donemAdi: string;
  yil: string;
  baslangicTarihi: string;
  brutFiyat: string;
  desteklemeMiktari: string;
};

const bugunStr = () => new Date().toISOString().split('T')[0];
const buYil = () => new Date().getFullYear().toString();

type Props = {
  onKapat: () => void;
  onKaydet: () => void;
};

export default function HasatDonemiFormu({ onKapat, onKaydet }: Props) {
  const [form, setForm] = useState<FormVerisi>({
    donemAdi: '',
    yil: buYil(),
    baslangicTarihi: bugunStr(),
    brutFiyat: '',
    desteklemeMiktari: '',
  });
  const [kesintiler, setKesintiler] = useState<Kesinti[]>([]);
  const [yukleniyor, setYukleniyor] = useState(false);
  const [hata, setHata] = useState('');

  function guncelle(alan: keyof FormVerisi, deger: string) {
    setForm((onceki) => ({ ...onceki, [alan]: deger }));
  }

  function kesintiEkle() {
    setKesintiler((onceki) => [...onceki, { kesintiAdi: '', yuzde: '' }]);
  }

  function kesintiGuncelle(idx: number, alan: keyof Kesinti, deger: string) {
    setKesintiler((onceki) =>
      onceki.map((k, i) => (i === idx ? { ...k, [alan]: deger } : k))
    );
  }

  function kesintiSil(idx: number) {
    setKesintiler((onceki) => onceki.filter((_, i) => i !== idx));
  }

  // Brüt fiyat ve kesintilerden net fiyatı otomatik hesapla
  const { toplamYuzde, hesaplananNet } = useMemo(() => {
    const toplam = kesintiler.reduce((s, k) => s + (parseFloat(k.yuzde) || 0), 0);
    const brut = parseFloat(form.brutFiyat) || 0;
    return {
      toplamYuzde: toplam,
      hesaplananNet: brut > 0 ? brut * (1 - toplam / 100) : 0,
    };
  }, [kesintiler, form.brutFiyat]);

  async function kaydet(e: React.FormEvent) {
    e.preventDefault();
    setHata('');

    // Kesinti validasyonu: boş isimli kesinti olmasın
    const gecersiz = kesintiler.some((k) => !k.kesintiAdi.trim() || !k.yuzde);
    if (gecersiz) { setHata('Kesinti adı ve yüzde doldurulmalıdır'); return; }

    setYukleniyor(true);
    try {
      const yanit = await fetch('/api/hasat-donemleri', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          donemAdi: form.donemAdi,
          yil: Number(form.yil),
          baslangicTarihi: form.baslangicTarihi,
          brutFiyat: form.brutFiyat || null,
          desteklemeMiktari: form.desteklemeMiktari || null,
          kesintiler: kesintiler.filter((k) => k.kesintiAdi && k.yuzde),
        }),
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="relative w-full max-w-lg rounded-xl bg-white shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b px-6 py-4 sticky top-0 bg-white">
          <h2 className="text-lg font-semibold text-gray-800">Yeni Hasat Dönemi Başlat</h2>
          <button onClick={onKapat} className="text-xl font-bold text-gray-400 hover:text-gray-600">✕</button>
        </div>

        <form onSubmit={kaydet} className="space-y-5 px-6 py-5">
          {hata && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{hata}</div>
          )}

          {/* Dönem Adı */}
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Dönem Adı <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={form.donemAdi}
              onChange={(e) => guncelle('donemAdi', e.target.value)}
              required
              placeholder="Örn: 2024 Çay Sezonu"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
            />
          </div>

          {/* Yıl + Başlangıç Tarihi */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Yıl <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                value={form.yil}
                onChange={(e) => guncelle('yil', e.target.value)}
                required
                min={2000}
                max={2100}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Başlangıç Tarihi <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={form.baslangicTarihi}
                onChange={(e) => guncelle('baslangicTarihi', e.target.value)}
                required
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
              />
            </div>
          </div>

          {/* Brüt Fiyat */}
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Brüt Fiyat (₺/kg)
            </label>
            <input
              type="number"
              value={form.brutFiyat}
              onChange={(e) => guncelle('brutFiyat', e.target.value)}
              min="0"
              step="0.0001"
              placeholder="örn: 12.5000"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
            />
            <p className="mt-0.5 text-xs text-gray-400">Budama hesabı ve net fiyat hesabında kullanılır</p>
          </div>

          {/* Destekleme Miktarı */}
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Devlet Destekleme Miktarı (₺/kg)
              <span className="ml-2 text-xs font-normal text-gray-400">— isteğe bağlı</span>
            </label>
            <input
              type="number"
              value={form.desteklemeMiktari}
              onChange={(e) => guncelle('desteklemeMiktari', e.target.value)}
              min="0"
              step="0.0001"
              placeholder="örn: 1.5000"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
            />
            <p className="mt-0.5 text-xs text-gray-400">
              Devlet bazen brüt fiyat üzerine ek destekleme açıklar. Girilirse hasat özetinde ayrıca gösterilir.
            </p>
          </div>

          {/* Kesintiler */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-gray-700">
                Kesintiler
                {kesintiler.length > 0 && (
                  <span className="ml-2 text-xs text-gray-400">
                    (toplam %{toplamYuzde.toLocaleString('tr-TR', { maximumFractionDigits: 4 })})
                  </span>
                )}
              </label>
              <button
                type="button"
                onClick={kesintiEkle}
                className="flex items-center gap-1 rounded-lg border border-green-300 bg-green-50 px-2.5 py-1 text-xs font-medium text-green-700 hover:bg-green-100"
              >
                + Kesinti Ekle
              </button>
            </div>

            {kesintiler.length === 0 ? (
              <div className="rounded-lg border-2 border-dashed border-gray-200 py-4 text-center">
                <p className="text-xs text-gray-400">Henüz kesinti eklenmedi</p>
                <button
                  type="button"
                  onClick={kesintiEkle}
                  className="mt-1 text-xs text-green-600 hover:underline"
                >
                  + Kesinti ekle
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                {kesintiler.map((kesinti, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <input
                      type="text"
                      value={kesinti.kesintiAdi}
                      onChange={(e) => kesintiGuncelle(idx, 'kesintiAdi', e.target.value)}
                      placeholder="Kesinti adı (örn: Çay-Kur Kesintisi)"
                      className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
                    />
                    <div className="relative w-28 flex-shrink-0">
                      <input
                        type="number"
                        value={kesinti.yuzde}
                        onChange={(e) => kesintiGuncelle(idx, 'yuzde', e.target.value)}
                        placeholder="0.00"
                        min="0"
                        max="100"
                        step="0.0001"
                        className="w-full rounded-lg border border-gray-300 py-2 pl-3 pr-7 text-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
                      />
                      <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-gray-400">%</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => kesintiSil(idx)}
                      className="flex-shrink-0 rounded-lg p-2 text-gray-400 hover:bg-red-50 hover:text-red-500"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Hesaplanan net fiyat göster */}
          {form.brutFiyat && kesintiler.length > 0 && (
            <div className="rounded-lg border border-blue-100 bg-blue-50 px-4 py-3 space-y-1.5">
              <div className="flex justify-between text-xs text-gray-500">
                <span>Brüt Fiyat</span>
                <span className="font-medium text-gray-700">
                  ₺{parseFloat(form.brutFiyat).toFixed(4)}/kg
                </span>
              </div>
              {kesintiler.filter((k) => k.kesintiAdi && k.yuzde).map((k, idx) => (
                <div key={idx} className="flex justify-between text-xs text-red-500">
                  <span>{k.kesintiAdi} ({k.yuzde}%)</span>
                  <span>
                    − ₺{((parseFloat(form.brutFiyat) || 0) * parseFloat(k.yuzde) / 100).toFixed(4)}/kg
                  </span>
                </div>
              ))}
              <div className="flex justify-between text-sm font-semibold border-t border-blue-200 pt-1.5 mt-1">
                <span className="text-gray-700">Hesaplanan Net Fiyat</span>
                <span className="text-green-700">
                  ₺{hesaplananNet.toFixed(4)}/kg
                </span>
              </div>
            </div>
          )}

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
              {yukleniyor ? 'Oluşturuluyor...' : 'Dönemi Başlat'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
