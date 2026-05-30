'use client';

import { useEffect, useState } from 'react';
import type { Ciftci } from '@prisma/client';

type CiftciFormVerisi = {
  adSoyad: string;
  tcNo: string;
  telefon: string;
  telefon2: string;
  adres: string;
  il: string;
  ilce: string;
  koy: string;
  cayKurNo: string;
  bankaIban: string;
  vergiNo: string;
  durum: 'aktif' | 'pasif';
  notlar: string;
};

const bosForm: CiftciFormVerisi = {
  adSoyad: '',
  tcNo: '',
  telefon: '',
  telefon2: '',
  adres: '',
  il: '',
  ilce: '',
  koy: '',
  cayKurNo: '',
  bankaIban: '',
  vergiNo: '',
  durum: 'aktif',
  notlar: '',
};

type Props = {
  seciliCiftci: Ciftci | null;
  onKapat: () => void;
  onKaydet: () => void;
};

export default function CiftciFormu({ seciliCiftci, onKapat, onKaydet }: Props) {
  const [form, setForm] = useState<CiftciFormVerisi>(bosForm);
  const [yukleniyor, setYukleniyor] = useState(false);
  const [hata, setHata] = useState('');

  useEffect(() => {
    if (seciliCiftci) {
      setForm({
        adSoyad: seciliCiftci.adSoyad,
        tcNo: seciliCiftci.tcNo ?? '',
        telefon: seciliCiftci.telefon,
        telefon2: seciliCiftci.telefon2 ?? '',
        adres: seciliCiftci.adres ?? '',
        il: seciliCiftci.il ?? '',
        ilce: seciliCiftci.ilce ?? '',
        koy: seciliCiftci.koy ?? '',
        cayKurNo: seciliCiftci.cayKurNo ?? '',
        bankaIban: seciliCiftci.bankaIban ?? '',
        vergiNo: seciliCiftci.vergiNo ?? '',
        durum: seciliCiftci.durum,
        notlar: seciliCiftci.notlar ?? '',
      });
    } else {
      setForm(bosForm);
    }
    setHata('');
  }, [seciliCiftci]);

  function guncelle(alan: keyof CiftciFormVerisi, deger: string) {
    setForm((onceki) => ({ ...onceki, [alan]: deger }));
  }

  async function kaydet(e: React.FormEvent) {
    e.preventDefault();
    setHata('');
    setYukleniyor(true);

    try {
      const url = seciliCiftci ? `/api/ciftciler/${seciliCiftci.id}` : '/api/ciftciler';
      const metod = seciliCiftci ? 'PUT' : 'POST';

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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-xl bg-white shadow-2xl">
        <div className="sticky top-0 flex items-center justify-between border-b bg-white px-6 py-4">
          <h2 className="text-lg font-semibold text-gray-800">
            {seciliCiftci ? 'Çiftçi Düzenle' : 'Yeni Çiftçi Ekle'}
          </h2>
          <button onClick={onKapat} className="text-gray-400 hover:text-gray-600 text-xl font-bold">
            ✕
          </button>
        </div>

        <form onSubmit={kaydet} className="px-6 py-4 space-y-5">
          {hata && (
            <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">{hata}</div>
          )}

          {/* Kimlik Bilgileri */}
          <fieldset className="space-y-3">
            <legend className="text-xs font-semibold uppercase tracking-wider text-gray-400">Kimlik Bilgileri</legend>
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Ad Soyad <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={form.adSoyad}
                  onChange={(e) => guncelle('adSoyad', e.target.value)}
                  required
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
                  placeholder="Ad Soyad"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">TC Kimlik No</label>
                <input
                  type="text"
                  value={form.tcNo}
                  onChange={(e) => guncelle('tcNo', e.target.value)}
                  maxLength={11}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
                  placeholder="11 haneli TC No"
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
          </fieldset>

          {/* İletişim */}
          <fieldset className="space-y-3">
            <legend className="text-xs font-semibold uppercase tracking-wider text-gray-400">İletişim</legend>
            <div className="grid grid-cols-2 gap-3">
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
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Telefon 2</label>
                <input
                  type="tel"
                  value={form.telefon2}
                  onChange={(e) => guncelle('telefon2', e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
                  placeholder="Alternatif telefon"
                />
              </div>
            </div>
          </fieldset>

          {/* Adres */}
          <fieldset className="space-y-3">
            <legend className="text-xs font-semibold uppercase tracking-wider text-gray-400">Adres</legend>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">İl</label>
                <input
                  type="text"
                  value={form.il}
                  onChange={(e) => guncelle('il', e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
                  placeholder="İl"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">İlçe</label>
                <input
                  type="text"
                  value={form.ilce}
                  onChange={(e) => guncelle('ilce', e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
                  placeholder="İlçe"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Köy / Mahalle</label>
                <input
                  type="text"
                  value={form.koy}
                  onChange={(e) => guncelle('koy', e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
                  placeholder="Köy"
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

          {/* Çay-Kur & Banka */}
          <fieldset className="space-y-3">
            <legend className="text-xs font-semibold uppercase tracking-wider text-gray-400">Çay-Kur & Banka</legend>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Çay-Kur No</label>
                <input
                  type="text"
                  value={form.cayKurNo}
                  onChange={(e) => guncelle('cayKurNo', e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
                  placeholder="Çay-Kur kayıt no"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">IBAN</label>
                <input
                  type="text"
                  value={form.bankaIban}
                  onChange={(e) => guncelle('bankaIban', e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
                  placeholder="TR00 0000 0000 0000 0000 00"
                />
              </div>
            </div>
          </fieldset>

          {/* Durum & Notlar */}
          <fieldset className="space-y-3">
            <legend className="text-xs font-semibold uppercase tracking-wider text-gray-400">Diğer</legend>
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
              {yukleniyor ? 'Kaydediliyor...' : seciliCiftci ? 'Güncelle' : 'Kaydet'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
