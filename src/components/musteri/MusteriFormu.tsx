'use client';

import { useEffect, useState } from 'react';
import type { Musteri } from '@prisma/client';

type MusteriFormVerisi = {
  musteriAdi: string;
  musteriTipi: 'kurumsal' | 'pesincu';
  devletMi: boolean;
  kurumAdi: string;
  yetkiliKisi: string;
  telefon: string;
  email: string;
  adres: string;
  vergiDairesi: string;
  vergiNo: string;
  odemeVadeGun: number;
  kontenjanVarMi: boolean;
  durum: 'aktif' | 'pasif';
  notlar: string;
};

const bosForm: MusteriFormVerisi = {
  musteriAdi: '',
  musteriTipi: 'pesincu',
  devletMi: false,
  kurumAdi: '',
  yetkiliKisi: '',
  telefon: '',
  email: '',
  adres: '',
  vergiDairesi: '',
  vergiNo: '',
  odemeVadeGun: 0,
  kontenjanVarMi: false,
  durum: 'aktif',
  notlar: '',
};

type Props = {
  seciliMusteri: Musteri | null;
  onKapat: () => void;
  onKaydet: () => void;
};

export default function MusteriFormu({ seciliMusteri, onKapat, onKaydet }: Props) {
  const [form, setForm] = useState<MusteriFormVerisi>(bosForm);
  const [yukleniyor, setYukleniyor] = useState(false);
  const [hata, setHata] = useState('');

  useEffect(() => {
    if (seciliMusteri) {
      setForm({
        musteriAdi: seciliMusteri.musteriAdi,
        musteriTipi: seciliMusteri.musteriTipi,
        devletMi: seciliMusteri.devletMi,
        kurumAdi: seciliMusteri.kurumAdi ?? '',
        yetkiliKisi: seciliMusteri.yetkiliKisi ?? '',
        telefon: seciliMusteri.telefon,
        email: seciliMusteri.email ?? '',
        adres: seciliMusteri.adres ?? '',
        vergiDairesi: seciliMusteri.vergiDairesi ?? '',
        vergiNo: seciliMusteri.vergiNo ?? '',
        odemeVadeGun: seciliMusteri.odemeVadeGun,
        kontenjanVarMi: seciliMusteri.kontenjanVarMi,
        durum: seciliMusteri.durum,
        notlar: seciliMusteri.notlar ?? '',
      });
    } else {
      setForm(bosForm);
    }
    setHata('');
  }, [seciliMusteri]);

  function guncelle<K extends keyof MusteriFormVerisi>(alan: K, deger: MusteriFormVerisi[K]) {
    setForm((onceki) => {
      const yeni = { ...onceki, [alan]: deger };
      // musteriTipi pesincu'ya geçince kurumsal alanları temizle
      if (alan === 'musteriTipi' && deger === 'pesincu') {
        yeni.devletMi = false;
        yeni.kontenjanVarMi = false;
      }
      // devletMi false olunca kontenjanı kapat
      if (alan === 'devletMi' && deger === false) {
        yeni.kontenjanVarMi = false;
      }
      return yeni;
    });
  }

  async function kaydet(e: React.FormEvent) {
    e.preventDefault();
    setHata('');
    setYukleniyor(true);

    try {
      const url = seciliMusteri ? `/api/musteriler/${seciliMusteri.id}` : '/api/musteriler';
      const metod = seciliMusteri ? 'PUT' : 'POST';

      const yanit = await fetch(url, {
        method: metod,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
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

  const kurumsalMi = form.musteriTipi === 'kurumsal';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-xl bg-white shadow-2xl">
        <div className="sticky top-0 flex items-center justify-between border-b bg-white px-6 py-4">
          <h2 className="text-lg font-semibold text-gray-800">
            {seciliMusteri ? 'Müşteri Düzenle' : 'Yeni Müşteri Ekle'}
          </h2>
          <button onClick={onKapat} className="text-gray-400 hover:text-gray-600 text-xl font-bold">
            ✕
          </button>
        </div>

        <form onSubmit={kaydet} className="px-6 py-4 space-y-5">
          {hata && (
            <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">{hata}</div>
          )}

          {/* Temel Bilgiler */}
          <fieldset className="space-y-3">
            <legend className="text-xs font-semibold uppercase tracking-wider text-gray-400">Temel Bilgiler</legend>
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Müşteri Adı <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={form.musteriAdi}
                  onChange={(e) => guncelle('musteriAdi', e.target.value)}
                  required
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
                  placeholder="Müşteri adı veya ticari unvan"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Müşteri Tipi <span className="text-red-500">*</span>
                </label>
                <select
                  value={form.musteriTipi}
                  onChange={(e) => guncelle('musteriTipi', e.target.value as 'kurumsal' | 'pesincu')}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
                >
                  <option value="pesincu">Peşinci (Bireysel)</option>
                  <option value="kurumsal">Kurumsal</option>
                </select>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Telefon <span className="text-red-500">*</span>
                </label>
                <input
                  type="tel"
                  value={form.telefon}
                  onChange={(e) => guncelle('telefon', e.target.value)}
                  required
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
                  placeholder="05xx xxx xx xx"
                />
              </div>
            </div>
          </fieldset>

          {/* Kurumsal Bilgiler — sadece kurumsal tipinde göster */}
          {kurumsalMi && (
            <fieldset className="space-y-3 rounded-lg border border-blue-100 bg-blue-50/40 p-4">
              <legend className="text-xs font-semibold uppercase tracking-wider text-blue-500">Kurumsal Bilgiler</legend>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">Kurum Adı</label>
                  <input
                    type="text"
                    value={form.kurumAdi}
                    onChange={(e) => guncelle('kurumAdi', e.target.value)}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
                    placeholder="Kurum / şirket adı"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">Yetkili Kişi</label>
                  <input
                    type="text"
                    value={form.yetkiliKisi}
                    onChange={(e) => guncelle('yetkiliKisi', e.target.value)}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
                    placeholder="İletişim kurulacak kişi"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">Vergi Dairesi</label>
                  <input
                    type="text"
                    value={form.vergiDairesi}
                    onChange={(e) => guncelle('vergiDairesi', e.target.value)}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
                    placeholder="Vergi dairesi adı"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">Vergi No</label>
                  <input
                    type="text"
                    value={form.vergiNo}
                    onChange={(e) => guncelle('vergiNo', e.target.value)}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
                    placeholder="Vergi numarası"
                  />
                </div>
              </div>

              {/* Devlet mi checkbox */}
              <label className="flex cursor-pointer items-center gap-2">
                <input
                  type="checkbox"
                  checked={form.devletMi}
                  onChange={(e) => guncelle('devletMi', e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300 text-green-600 focus:ring-green-500"
                />
                <span className="text-sm font-medium text-gray-700">Devlet kurumu</span>
                <span className="text-xs text-gray-400">(Kontenjan sistemi aktif edilebilir)</span>
              </label>

              {/* Kontenjan — sadece devlet ise göster */}
              {form.devletMi && (
                <label className="flex cursor-pointer items-center gap-2 pl-6">
                  <input
                    type="checkbox"
                    checked={form.kontenjanVarMi}
                    onChange={(e) => guncelle('kontenjanVarMi', e.target.checked)}
                    className="h-4 w-4 rounded border-gray-300 text-green-600 focus:ring-green-500"
                  />
                  <span className="text-sm font-medium text-gray-700">Kontenjan sistemi aktif</span>
                </label>
              )}
            </fieldset>
          )}

          {/* İletişim & Ödeme */}
          <fieldset className="space-y-3">
            <legend className="text-xs font-semibold uppercase tracking-wider text-gray-400">İletişim & Ödeme</legend>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">E-posta</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => guncelle('email', e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
                  placeholder="ornek@firma.com"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Ödeme Vadesi (Gün)</label>
                <input
                  type="number"
                  min={0}
                  value={form.odemeVadeGun}
                  onChange={(e) => guncelle('odemeVadeGun', parseInt(e.target.value) || 0)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
                  placeholder="0"
                />
              </div>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Adres</label>
              <textarea
                value={form.adres}
                onChange={(e) => guncelle('adres', e.target.value)}
                rows={2}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
                placeholder="Açık adres"
              />
            </div>
          </fieldset>

          {/* Durum & Notlar */}
          <fieldset className="space-y-3">
            <legend className="text-xs font-semibold uppercase tracking-wider text-gray-400">Diğer</legend>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Durum</label>
              <select
                value={form.durum}
                onChange={(e) => guncelle('durum', e.target.value as 'aktif' | 'pasif')}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
              >
                <option value="aktif">Aktif</option>
                <option value="pasif">Pasif</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Notlar</label>
              <textarea
                value={form.notlar}
                onChange={(e) => guncelle('notlar', e.target.value)}
                rows={3}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
                placeholder="Ek notlar..."
              />
            </div>
          </fieldset>

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
              {yukleniyor ? 'Kaydediliyor...' : seciliMusteri ? 'Güncelle' : 'Kaydet'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
