'use client';

import { useState } from 'react';

type Ekipman = {
  id: string;
  ekipmanAdi: string;
  kategori: string;
  marka: string | null;
  model: string | null;
  seriNo: string | null;
  plaka: string | null;
  kmSayaci: number | null;
  satinAlmaTarihi: string | null;
  satinAlmaFiyati: number | null;
  garantiBitis: string | null;
  sonBakimTarihi: string | null;
  sonrakiBakimTarihi: string | null;
  durum: string;
  calismaSaati: number | null;
  notlar: string | null;
};

type Props = {
  ekipman?: Ekipman;
  onKapat: () => void;
  onBasarili: () => void;
};

const KATEGORILER = [
  { deger: 'arac', etiket: 'Araç (Araba / Kamyonet / Kamyon)', aracMi: true },
  { deger: 'traktor', etiket: 'Traktör', aracMi: true },
  { deger: 'motorlu_alet', etiket: 'Motorlu Alet (Testere, Çim Biçme vb.)', aracMi: false },
  { deger: 'sarjli_alet', etiket: 'Şarjlı / Elektrikli Alet', aracMi: false },
  { deger: 'el_aleti', etiket: 'El Aleti', aracMi: false },
  { deger: 'sulama', etiket: 'Sulama Ekipmanı', aracMi: false },
  { deger: 'diger', etiket: 'Diğer', aracMi: false },
];

const tarihFormatla = (tarih: string | null | undefined): string => {
  if (!tarih) return '';
  return new Date(tarih).toISOString().split('T')[0];
};

export default function EkipmanFormu({ ekipman, onKapat, onBasarili }: Props) {
  const [yukleniyor, setYukleniyor] = useState(false);
  const [hata, setHata] = useState('');
  const [form, setForm] = useState({
    ekipmanAdi: ekipman?.ekipmanAdi || '',
    kategori: ekipman?.kategori || 'diger',
    marka: ekipman?.marka || '',
    model: ekipman?.model || '',
    seriNo: ekipman?.seriNo || '',
    plaka: ekipman?.plaka || '',
    kmSayaci: ekipman?.kmSayaci?.toString() || '',
    satinAlmaTarihi: tarihFormatla(ekipman?.satinAlmaTarihi),
    satinAlmaFiyati: ekipman?.satinAlmaFiyati?.toString() || '',
    garantiBitis: tarihFormatla(ekipman?.garantiBitis),
    sonBakimTarihi: tarihFormatla(ekipman?.sonBakimTarihi),
    sonrakiBakimTarihi: tarihFormatla(ekipman?.sonrakiBakimTarihi),
    durum: ekipman?.durum || 'aktif',
    calismaSaati: ekipman?.calismaSaati?.toString() || '',
    notlar: ekipman?.notlar || '',
  });

  const secilenKategori = KATEGORILER.find((k) => k.deger === form.kategori);
  const aracMi = secilenKategori?.aracMi ?? false;

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
      const url = ekipman ? `/api/ekipmanlar/${ekipman.id}` : '/api/ekipmanlar';
      const yontem = ekipman ? 'PUT' : 'POST';

      const yanit = await fetch(url, {
        method: yontem,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ekipmanAdi: form.ekipmanAdi,
          kategori: form.kategori,
          marka: form.marka || null,
          model: form.model || null,
          seriNo: form.seriNo || null,
          plaka: aracMi ? (form.plaka.toUpperCase() || null) : null,
          kmSayaci: aracMi && form.kmSayaci ? parseInt(form.kmSayaci) : null,
          satinAlmaTarihi: form.satinAlmaTarihi || null,
          satinAlmaFiyati: form.satinAlmaFiyati ? parseFloat(form.satinAlmaFiyati) : null,
          garantiBitis: form.garantiBitis || null,
          sonBakimTarihi: form.sonBakimTarihi || null,
          sonrakiBakimTarihi: form.sonrakiBakimTarihi || null,
          durum: form.durum,
          calismaSaati: form.calismaSaati ? parseFloat(form.calismaSaati) : null,
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
      <div className="w-full max-w-2xl rounded-xl bg-white shadow-xl max-h-[90vh] overflow-y-auto">
        <div className="border-b border-gray-200 px-6 py-4 sticky top-0 bg-white">
          <h2 className="text-lg font-semibold text-gray-800">
            {ekipman ? 'Ekipman Düzenle' : 'Yeni Ekipman'}
          </h2>
        </div>

        <form onSubmit={handleGonder} className="space-y-4 p-6">
          {hata && (
            <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{hata}</div>
          )}

          <div className="grid grid-cols-2 gap-4">
            {/* Kategori — TAM GENİŞLİK */}
            <div className="col-span-2">
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
                {KATEGORILER.map((k) => (
                  <option key={k.deger} value={k.deger}>{k.etiket}</option>
                ))}
              </select>
            </div>

            {/* Ekipman Adı */}
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Ekipman Adı <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="ekipmanAdi"
                value={form.ekipmanAdi}
                onChange={handleDegistir}
                required
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
                placeholder="örn. Ford Transit, Husqvarna testere"
              />
            </div>

            {/* Plaka — sadece araç/traktör */}
            {aracMi ? (
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Plaka
                </label>
                <input
                  type="text"
                  name="plaka"
                  value={form.plaka}
                  onChange={handleDegistir}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm font-mono tracking-widest uppercase focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
                  placeholder="53 AB 001"
                />
              </div>
            ) : (
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Seri No</label>
                <input
                  type="text"
                  name="seriNo"
                  value={form.seriNo}
                  onChange={handleDegistir}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
                />
              </div>
            )}

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Marka</label>
              <input
                type="text"
                name="marka"
                value={form.marka}
                onChange={handleDegistir}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Model</label>
              <input
                type="text"
                name="model"
                value={form.model}
                onChange={handleDegistir}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
              />
            </div>

            {/* KM Sayacı — araç */}
            {aracMi && (
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">KM Sayacı</label>
                <input
                  type="number"
                  name="kmSayaci"
                  value={form.kmSayaci}
                  onChange={handleDegistir}
                  min="0"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
                  placeholder="Mevcut KM"
                />
              </div>
            )}

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Durum</label>
              <select
                name="durum"
                value={form.durum}
                onChange={handleDegistir}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
              >
                <option value="aktif">Aktif</option>
                <option value="bakimda">Bakımda</option>
                <option value="arizali">Arızalı</option>
                <option value="hurda">Hurda</option>
              </select>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Satın Alma Tarihi</label>
              <input
                type="date"
                name="satinAlmaTarihi"
                value={form.satinAlmaTarihi}
                onChange={handleDegistir}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Satın Alma Fiyatı (₺)</label>
              <input
                type="number"
                name="satinAlmaFiyati"
                value={form.satinAlmaFiyati}
                onChange={handleDegistir}
                min="0"
                step="0.01"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Garanti Bitiş</label>
              <input
                type="date"
                name="garantiBitis"
                value={form.garantiBitis}
                onChange={handleDegistir}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
              />
            </div>

            {!aracMi && (
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Çalışma Saati</label>
                <input
                  type="number"
                  name="calismaSaati"
                  value={form.calismaSaati}
                  onChange={handleDegistir}
                  min="0"
                  step="0.1"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
                />
              </div>
            )}

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Son Bakım</label>
              <input
                type="date"
                name="sonBakimTarihi"
                value={form.sonBakimTarihi}
                onChange={handleDegistir}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Sonraki Bakım</label>
              <input
                type="date"
                name="sonrakiBakimTarihi"
                value={form.sonrakiBakimTarihi}
                onChange={handleDegistir}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
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
              {yukleniyor ? 'Kaydediliyor...' : ekipman ? 'Güncelle' : 'Kaydet'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
