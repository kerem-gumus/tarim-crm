'use client';

import { useEffect, useState } from 'react';

type CiftciSecim = {
  id: string;
  adSoyad: string;
};

type TarlaDetay = {
  id: string;
  tarlaAdi: string;
  konumIl: string;
  konumIlce: string;
  konumKoy: string;
  adaNo: string | null;
  parselNo: string | null;
  donum: string | number;
  metrekare: string | number | null;
  rakim: number | null;
  cayCesidi: string | null;
  dikimYili: number | null;
  topraktipi: string | null;
  sulamaDurumu: 'dogal' | 'sulamali' | 'karma';
  ciftciId: string;
  mulkiyetDurumu: 'sahip' | 'kiralik';
  kiraciCiftciId: string | null;
  koordinatLat: string | number | null;
  koordinatLng: string | number | null;
  durum: 'aktif' | 'pasif';
  notlar: string | null;
};

type TarlaFormVerisi = {
  tarlaAdi: string;
  konumIl: string;
  konumIlce: string;
  konumKoy: string;
  adaNo: string;
  parselNo: string;
  donum: string;
  metrekare: string;
  rakim: string;
  cayCesidi: string;
  dikimYili: string;
  topraktipi: string;
  sulamaDurumu: 'dogal' | 'sulamali' | 'karma';
  ciftciId: string;
  mulkiyetDurumu: 'sahip' | 'kiralik';
  kiraciCiftciId: string;
  koordinatLat: string;
  koordinatLng: string;
  durum: 'aktif' | 'pasif';
  notlar: string;
};

const bosForm: TarlaFormVerisi = {
  tarlaAdi: '',
  konumIl: '',
  konumIlce: '',
  konumKoy: '',
  adaNo: '',
  parselNo: '',
  donum: '',
  metrekare: '',
  rakim: '',
  cayCesidi: '',
  dikimYili: '',
  topraktipi: '',
  sulamaDurumu: 'dogal',
  ciftciId: '',
  mulkiyetDurumu: 'sahip',
  kiraciCiftciId: '',
  koordinatLat: '',
  koordinatLng: '',
  durum: 'aktif',
  notlar: '',
};

type Props = {
  seciliTarla: TarlaDetay | null;
  onKapat: () => void;
  onKaydet: () => void;
};

export default function TarlaFormu({ seciliTarla, onKapat, onKaydet }: Props) {
  const [form, setForm] = useState<TarlaFormVerisi>(bosForm);
  const [yukleniyor, setYukleniyor] = useState(false);
  const [hata, setHata] = useState('');
  const [ciftciler, setCiftciler] = useState<CiftciSecim[]>([]);
  const [ciftcilerYukleniyor, setCiftcilerYukleniyor] = useState(true);

  useEffect(() => {
    async function ciftcileriGetir() {
      try {
        const yanit = await fetch('/api/ciftciler');
        const veri = await yanit.json();
        setCiftciler(veri);
      } catch {
        // Çiftçiler yüklenemedi, boş bırak
      } finally {
        setCiftcilerYukleniyor(false);
      }
    }
    ciftcileriGetir();
  }, []);

  useEffect(() => {
    if (seciliTarla) {
      setForm({
        tarlaAdi: seciliTarla.tarlaAdi,
        konumIl: seciliTarla.konumIl,
        konumIlce: seciliTarla.konumIlce,
        konumKoy: seciliTarla.konumKoy,
        adaNo: seciliTarla.adaNo ?? '',
        parselNo: seciliTarla.parselNo ?? '',
        donum: String(seciliTarla.donum),
        metrekare: seciliTarla.metrekare != null ? String(seciliTarla.metrekare) : '',
        rakim: seciliTarla.rakim != null ? String(seciliTarla.rakim) : '',
        cayCesidi: seciliTarla.cayCesidi ?? '',
        dikimYili: seciliTarla.dikimYili != null ? String(seciliTarla.dikimYili) : '',
        topraktipi: seciliTarla.topraktipi ?? '',
        sulamaDurumu: seciliTarla.sulamaDurumu,
        ciftciId: seciliTarla.ciftciId ?? '',
        mulkiyetDurumu: seciliTarla.mulkiyetDurumu ?? 'sahip',
        kiraciCiftciId: seciliTarla.kiraciCiftciId ?? '',
        koordinatLat: seciliTarla.koordinatLat != null ? String(seciliTarla.koordinatLat) : '',
        koordinatLng: seciliTarla.koordinatLng != null ? String(seciliTarla.koordinatLng) : '',
        durum: seciliTarla.durum,
        notlar: seciliTarla.notlar ?? '',
      });
    } else {
      setForm(bosForm);
    }
    setHata('');
  }, [seciliTarla]);

  function guncelle(alan: keyof TarlaFormVerisi, deger: string) {
    setForm((onceki) => ({ ...onceki, [alan]: deger }));
  }

  async function kaydet(e: React.FormEvent) {
    e.preventDefault();
    setHata('');
    setYukleniyor(true);

    try {
      const url = seciliTarla ? `/api/tarlalar/${seciliTarla.id}` : '/api/tarlalar';
      const metod = seciliTarla ? 'PUT' : 'POST';

      const yanit = await fetch(url, {
        method: metod,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          donum: form.donum,
          metrekare: form.metrekare || null,
          rakim: form.rakim || null,
          dikimYili: form.dikimYili || null,
          koordinatLat: form.koordinatLat || null,
          koordinatLng: form.koordinatLng || null,
          adaNo: form.adaNo || null,
          parselNo: form.parselNo || null,
          cayCesidi: form.cayCesidi || null,
          topraktipi: form.topraktipi || null,
          notlar: form.notlar || null,
          kiraciCiftciId: form.mulkiyetDurumu === 'kiralik' ? (form.kiraciCiftciId || null) : null,
          ciftciId: form.ciftciId || null,
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
      <div className="relative w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-xl bg-white shadow-2xl">
        <div className="sticky top-0 flex items-center justify-between border-b bg-white px-6 py-4">
          <h2 className="text-lg font-semibold text-gray-800">
            {seciliTarla ? 'Tarla Düzenle' : 'Yeni Tarla Ekle'}
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
                  Tarla Adı <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={form.tarlaAdi}
                  onChange={(e) => guncelle('tarlaAdi', e.target.value)}
                  required
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
                  placeholder="Tarla adı"
                />
              </div>
              <div className="col-span-2">
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Çiftçi
                </label>
                <select
                  value={form.ciftciId}
                  onChange={(e) => guncelle('ciftciId', e.target.value)}
                  disabled={ciftcilerYukleniyor}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500 disabled:bg-gray-50"
                >
                  <option value="">
                    {ciftcilerYukleniyor ? 'Çiftçiler yükleniyor...' : '— Çiftçi Yok (Boş Tarla) —'}
                  </option>
                  {ciftciler.map((ciftci) => (
                    <option key={ciftci.id} value={ciftci.id}>
                      {ciftci.adSoyad}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            {/* Mülkiyet Durumu */}
            <div className="col-span-2">
              <label className="mb-1 block text-sm font-medium text-gray-700">Mülkiyet Durumu</label>
              <div className="flex gap-4 mt-1">
                <label className="flex cursor-pointer items-center gap-2 text-sm">
                  <input
                    type="radio"
                    name="mulkiyetDurumu"
                    value="sahip"
                    checked={form.mulkiyetDurumu === 'sahip'}
                    onChange={(e) => guncelle('mulkiyetDurumu', e.target.value)}
                    className="text-green-600"
                  />
                  <span className="font-medium text-gray-700">Kendi Mülkü</span>
                </label>
                <label className="flex cursor-pointer items-center gap-2 text-sm">
                  <input
                    type="radio"
                    name="mulkiyetDurumu"
                    value="kiralik"
                    checked={form.mulkiyetDurumu === 'kiralik'}
                    onChange={(e) => guncelle('mulkiyetDurumu', e.target.value)}
                    className="text-green-600"
                  />
                  <span className="font-medium text-gray-700">Kiralık</span>
                </label>
              </div>
              {form.mulkiyetDurumu === 'kiralik' && (
                <div className="mt-3 rounded-lg border border-amber-100 bg-amber-50 p-3 space-y-2">
                  <p className="text-xs text-amber-700 font-medium">
                    Bu tarla kiralık — yukarıda seçilen çiftçi <strong>asıl sahibi</strong>, aşağıda seçilecek çiftçi <strong>kiracı</strong>.
                  </p>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">
                      Kiracı Çiftçi <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={form.kiraciCiftciId}
                      onChange={(e) => guncelle('kiraciCiftciId', e.target.value)}
                      required={form.mulkiyetDurumu === 'kiralik'}
                      className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
                    >
                      <option value="">Kiracıyı seçin...</option>
                      {ciftciler
                        .filter((c) => c.id !== form.ciftciId)
                        .map((ciftci) => (
                          <option key={ciftci.id} value={ciftci.id}>
                            {ciftci.adSoyad}
                          </option>
                        ))}
                    </select>
                  </div>
                </div>
              )}
            </div>
          </fieldset>

          {/* Konum */}
          <fieldset className="space-y-3">
            <legend className="text-xs font-semibold uppercase tracking-wider text-gray-400">Konum</legend>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">İl</label>
                <input
                  type="text"
                  value={form.konumIl}
                  onChange={(e) => guncelle('konumIl', e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
                  placeholder="İl"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">İlçe</label>
                <input
                  type="text"
                  value={form.konumIlce}
                  onChange={(e) => guncelle('konumIlce', e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
                  placeholder="İlçe"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Köy / Mahalle</label>
                <input
                  type="text"
                  value={form.konumKoy}
                  onChange={(e) => guncelle('konumKoy', e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
                  placeholder="Köy"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Ada No</label>
                <input
                  type="text"
                  value={form.adaNo}
                  onChange={(e) => guncelle('adaNo', e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
                  placeholder="Ada no"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Parsel No</label>
                <input
                  type="text"
                  value={form.parselNo}
                  onChange={(e) => guncelle('parselNo', e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
                  placeholder="Parsel no"
                />
              </div>
            </div>
          </fieldset>

          {/* Arazi Bilgileri */}
          <fieldset className="space-y-3">
            <legend className="text-xs font-semibold uppercase tracking-wider text-gray-400">Arazi Bilgileri</legend>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Dönüm <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  value={form.donum}
                  onChange={(e) => guncelle('donum', e.target.value)}
                  required
                  min="0"
                  step="0.01"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
                  placeholder="0.00"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Metrekare</label>
                <input
                  type="number"
                  value={form.metrekare}
                  onChange={(e) => guncelle('metrekare', e.target.value)}
                  min="0"
                  step="0.01"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
                  placeholder="m²"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Rakım (m)</label>
                <input
                  type="number"
                  value={form.rakim}
                  onChange={(e) => guncelle('rakim', e.target.value)}
                  min="0"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
                  placeholder="Metre"
                />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Çay Çeşidi</label>
                <input
                  type="text"
                  value={form.cayCesidi}
                  onChange={(e) => guncelle('cayCesidi', e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
                  placeholder="Çay çeşidi"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Dikim Yılı</label>
                <input
                  type="number"
                  value={form.dikimYili}
                  onChange={(e) => guncelle('dikimYili', e.target.value)}
                  min="1900"
                  max="2100"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
                  placeholder="Yıl"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Toprak Tipi</label>
                <input
                  type="text"
                  value={form.topraktipi}
                  onChange={(e) => guncelle('topraktipi', e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
                  placeholder="Toprak tipi"
                />
              </div>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Sulama Durumu</label>
              <select
                value={form.sulamaDurumu}
                onChange={(e) => guncelle('sulamaDurumu', e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
              >
                <option value="dogal">Doğal</option>
                <option value="sulamali">Sulamalı</option>
                <option value="karma">Karma</option>
              </select>
            </div>
          </fieldset>

          {/* Koordinatlar */}
          <fieldset className="space-y-3">
            <legend className="text-xs font-semibold uppercase tracking-wider text-gray-400">Koordinatlar</legend>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Enlem (Lat)</label>
                <input
                  type="number"
                  value={form.koordinatLat}
                  onChange={(e) => guncelle('koordinatLat', e.target.value)}
                  step="0.0000001"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
                  placeholder="41.0000000"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Boylam (Lng)</label>
                <input
                  type="number"
                  value={form.koordinatLng}
                  onChange={(e) => guncelle('koordinatLng', e.target.value)}
                  step="0.0000001"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
                  placeholder="40.5000000"
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
              {yukleniyor ? 'Kaydediliyor...' : seciliTarla ? 'Güncelle' : 'Kaydet'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
