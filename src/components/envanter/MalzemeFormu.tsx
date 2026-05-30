'use client';

import { useState } from 'react';

type Malzeme = {
  id: string;
  malzemeAdi: string;
  kategori: string;
  altKategori: string | null;
  birim: string;
  mevcutStok: number;
  minimumStok: number;
  birimFiyat: number;
  depoKonumu: string | null;
  durum: string;
  notlar: string | null;
};

type Props = {
  malzeme?: Malzeme;
  onKapat: () => void;
  onBasarili: () => void;
};

const KATEGORI_SECENEKLERI = [
  { deger: 'gubre', etiket: 'Gübre' },
  { deger: 'tarim_ilaci', etiket: 'Tarım İlacı' },
  { deger: 'alet_makine', etiket: 'Alet/Makine' },
  { deger: 'yakit_sarf', etiket: 'Yakıt/Sarf' },
  { deger: 'yag', etiket: 'Yağ' },
  { deger: 'yedek_parca', etiket: 'Yedek Parça' },
  { deger: 'diger', etiket: 'Diğer' },
];

const BIRIM_SECENEKLERI = [
  { deger: 'adet', etiket: 'Adet' },
  { deger: 'kg', etiket: 'Kg' },
  { deger: 'litre', etiket: 'Litre' },
  { deger: 'paket', etiket: 'Paket' },
  { deger: 'cuval', etiket: 'Çuval' },
];

export default function MalzemeFormu({ malzeme, onKapat, onBasarili }: Props) {
  const [yukleniyor, setYukleniyor] = useState(false);
  const [hata, setHata] = useState('');
  const [form, setForm] = useState({
    malzemeAdi: malzeme?.malzemeAdi || '',
    kategori: malzeme?.kategori || 'gubre',
    altKategori: malzeme?.altKategori || '',
    birim: malzeme?.birim || 'kg',
    minimumStok: malzeme?.minimumStok?.toString() || '0',
    birimFiyat: malzeme?.birimFiyat?.toString() || '0',
    depoKonumu: malzeme?.depoKonumu || '',
    durum: malzeme?.durum || 'aktif',
    notlar: malzeme?.notlar || '',
  });

  const handleDegistir = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>,
  ) => {
    setForm((onceki) => ({ ...onceki, [e.target.name]: e.target.value }));
  };

  const handleGonder = async (e: React.FormEvent) => {
    e.preventDefault();
    setHata('');
    setYukleniyor(true);

    try {
      const url = malzeme ? `/api/malzemeler/${malzeme.id}` : '/api/malzemeler';
      const yontem = malzeme ? 'PUT' : 'POST';

      const yanit = await fetch(url, {
        method: yontem,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          minimumStok: parseFloat(form.minimumStok) || 0,
          birimFiyat: parseFloat(form.birimFiyat) || 0,
          altKategori: form.altKategori || null,
          depoKonumu: form.depoKonumu || null,
          notlar: form.notlar || null,
        }),
      });

      if (!yanit.ok) {
        const hataVerisi = await yanit.json();
        setHata(hataVerisi.hata || 'Bir hata oluştu');
        return;
      }

      onBasarili();
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
            {malzeme ? 'Malzeme Düzenle' : 'Yeni Malzeme'}
          </h2>
        </div>

        <form onSubmit={handleGonder} className="space-y-4 p-6">
          {hata && <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{hata}</div>}

          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Malzeme Adı <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="malzemeAdi"
                value={form.malzemeAdi}
                onChange={handleDegistir}
                required
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
                placeholder="Malzeme adını girin"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Kategori <span className="text-red-500">*</span>
              </label>
              <select
                name="kategori"
                value={form.kategori}
                onChange={handleDegistir}
                required
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
              >
                {KATEGORI_SECENEKLERI.map((s) => (
                  <option key={s.deger} value={s.deger}>
                    {s.etiket}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Birim <span className="text-red-500">*</span>
              </label>
              <select
                name="birim"
                value={form.birim}
                onChange={handleDegistir}
                required
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
              >
                {BIRIM_SECENEKLERI.map((s) => (
                  <option key={s.deger} value={s.deger}>
                    {s.etiket}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Alt Kategori</label>
              <input
                type="text"
                name="altKategori"
                value={form.altKategori}
                onChange={handleDegistir}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
                placeholder="İsteğe bağlı"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Depo Konumu</label>
              <input
                type="text"
                name="depoKonumu"
                value={form.depoKonumu}
                onChange={handleDegistir}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
                placeholder="Depo / raf no"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Minimum Stok</label>
              <input
                type="number"
                name="minimumStok"
                value={form.minimumStok}
                onChange={handleDegistir}
                min="0"
                step="0.001"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
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
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Durum</label>
              <select
                name="durum"
                value={form.durum}
                onChange={handleDegistir}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
              >
                <option value="aktif">Aktif</option>
                <option value="pasif">Pasif</option>
              </select>
            </div>

            <div className="col-span-2">
              <label className="mb-1 block text-sm font-medium text-gray-700">Notlar</label>
              <textarea
                name="notlar"
                value={form.notlar}
                onChange={handleDegistir}
                rows={3}
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
              {yukleniyor ? 'Kaydediliyor...' : malzeme ? 'Güncelle' : 'Kaydet'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
