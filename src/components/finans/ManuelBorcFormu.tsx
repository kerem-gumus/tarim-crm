'use client';

import { useEffect, useState } from 'react';

interface Ekip {
  id: string;
  ekipAdi: string;
}

interface ManuelBorcFormuProps {
  onKaydet: () => void;
  onKapat: () => void;
}

const kategoriler = [
  { deger: 'iscilik', etiket: 'İşçilik (Yevmiye / Ton Ücreti)' },
  { deger: 'yemek', etiket: 'Yemek (Kahvaltı / Akşam Yemeği)' },
  { deger: 'malzeme', etiket: 'Malzeme / İşçi Alışverişi' },
  { deger: 'yakit', etiket: 'Yakıt / Araç' },
  { deger: 'gubre', etiket: 'Gübre / İlaç' },
  { deger: 'diger', etiket: 'Diğer' },
];

export default function ManuelBorcFormu({ onKaydet, onKapat }: ManuelBorcFormuProps) {
  const [kategori, setKategori] = useState<string>('diger');
  const [aciklama, setAciklama] = useState<string>('');
  const [tutar, setTutar] = useState<string>('');
  const [odemeTarihi, setOdemeTarihi] = useState<string>(new Date().toISOString().split('T')[0]);
  const [ilgiliEkipId, setIlgiliEkipId] = useState<string>('');
  const [ekipler, setEkipler] = useState<Ekip[]>([]);
  const [yukleniyor, setYukleniyor] = useState(false);
  const [hata, setHata] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/ekipler')
      .then((y) => y.json())
      .then((veri) => {
        if (Array.isArray(veri)) setEkipler(veri);
      })
      .catch(() => {});
  }, []);

  async function handleKaydet() {
    if (!aciklama.trim()) {
      setHata('Açıklama zorunludur');
      return;
    }
    const tutarSayi = Number(tutar);
    if (!tutarSayi || tutarSayi <= 0) {
      setHata('Geçerli bir tutar giriniz');
      return;
    }

    setYukleniyor(true);
    setHata(null);

    try {
      const yanit = await fetch('/api/odeme-kayitlari', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          kategori,
          aciklama: aciklama.trim(),
          tutar: tutarSayi,
          odemeTarihi: odemeTarihi || null,
          ilgiliEkipId: ilgiliEkipId || null,
        }),
      });

      if (!yanit.ok) {
        const veri = await yanit.json();
        setHata(veri.hata ?? 'Borç kaydı oluşturulamadı');
        return;
      }

      onKaydet();
    } catch {
      setHata('Bağlantı hatası oluştu');
    } finally {
      setYukleniyor(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
        <h3 className="mb-4 text-base font-semibold text-gray-800">Yeni Borç Kaydı</h3>

        <div className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Kategori <span className="text-red-500">*</span>
            </label>
            <select
              value={kategori}
              onChange={(e) => setKategori(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
            >
              {kategoriler.map((k) => (
                <option key={k.deger} value={k.deger}>
                  {k.etiket}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Açıklama <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={aciklama}
              onChange={(e) => setAciklama(e.target.value)}
              placeholder="Ödeme açıklaması"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Tutar (₺) <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              value={tutar}
              onChange={(e) => setTutar(e.target.value)}
              min={0.01}
              step={0.01}
              placeholder="0.00"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Tarih <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              value={odemeTarihi}
              onChange={(e) => setOdemeTarihi(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              İlgili Ekip (opsiyonel)
            </label>
            <select
              value={ilgiliEkipId}
              onChange={(e) => setIlgiliEkipId(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
            >
              <option value="">— Seçiniz —</option>
              {ekipler.map((ekip) => (
                <option key={ekip.id} value={ekip.id}>
                  {ekip.ekipAdi}
                </option>
              ))}
            </select>
          </div>

          {hata && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{hata}</p>
          )}
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <button
            onClick={onKapat}
            disabled={yukleniyor}
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-60"
          >
            İptal
          </button>
          <button
            onClick={handleKaydet}
            disabled={yukleniyor}
            className="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-60"
          >
            {yukleniyor ? 'Kaydediliyor...' : 'Kaydet'}
          </button>
        </div>
      </div>
    </div>
  );
}
