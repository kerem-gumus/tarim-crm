'use client';

import { useEffect, useState } from 'react';
import type { IsciEkibi, Isci } from '@prisma/client';

type EkipFormVerisi = {
  ekipAdi: string;
  ekipBasiId: string;
  durum: 'aktif' | 'pasif';
};

const bosForm: EkipFormVerisi = {
  ekipAdi: '',
  ekipBasiId: '',
  durum: 'aktif',
};

type Props = {
  seciliEkip: IsciEkibi | null;
  isciler: Pick<Isci, 'id' | 'adSoyad'>[];
  onKapat: () => void;
  onKaydet: () => void;
};

export default function EkipFormu({ seciliEkip, isciler, onKapat, onKaydet }: Props) {
  const [form, setForm] = useState<EkipFormVerisi>(bosForm);
  const [yukleniyor, setYukleniyor] = useState(false);
  const [hata, setHata] = useState('');

  useEffect(() => {
    if (seciliEkip) {
      setForm({
        ekipAdi: seciliEkip.ekipAdi,
        ekipBasiId: seciliEkip.ekipBasiId ?? '',
        durum: seciliEkip.durum,
      });
    } else {
      setForm(bosForm);
    }
    setHata('');
  }, [seciliEkip]);

  function guncelle(alan: keyof EkipFormVerisi, deger: string) {
    setForm((onceki) => ({ ...onceki, [alan]: deger }));
  }

  async function kaydet(e: React.FormEvent) {
    e.preventDefault();
    setHata('');
    setYukleniyor(true);

    try {
      const url = seciliEkip ? `/api/ekipler/${seciliEkip.id}` : '/api/ekipler';
      const metod = seciliEkip ? 'PUT' : 'POST';

      const yanit = await fetch(url, {
        method: metod,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ekipAdi: form.ekipAdi,
          ekipBasiId: form.ekipBasiId || null,
          durum: form.durum,
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-xl bg-white shadow-2xl">
        <div className="sticky top-0 flex items-center justify-between border-b bg-white px-6 py-4">
          <h2 className="text-lg font-semibold text-gray-800">
            {seciliEkip ? 'Ekip Düzenle' : 'Yeni Ekip Oluştur'}
          </h2>
          <button onClick={onKapat} className="text-gray-400 hover:text-gray-600 text-xl font-bold">
            ✕
          </button>
        </div>

        <form onSubmit={kaydet} className="px-6 py-4 space-y-4">
          {hata && (
            <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">{hata}</div>
          )}

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Ekip Adı <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={form.ekipAdi}
              onChange={(e) => guncelle('ekipAdi', e.target.value)}
              required
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
              placeholder="Ekip adı"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Ekip Başı</label>
            <select
              value={form.ekipBasiId}
              onChange={(e) => guncelle('ekipBasiId', e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
            >
              <option value="">— Ekip başı seçin —</option>
              {isciler.map((isci) => (
                <option key={isci.id} value={isci.id}>
                  {isci.adSoyad}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Durum</label>
            <select
              value={form.durum}
              onChange={(e) => guncelle('durum', e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
            >
              <option value="aktif">Aktif</option>
              <option value="pasif">Pasif</option>
            </select>
          </div>

          <div className="sticky bottom-0 flex justify-end gap-3 border-t bg-white py-4">
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
              {yukleniyor ? 'Kaydediliyor...' : seciliEkip ? 'Güncelle' : 'Kaydet'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
