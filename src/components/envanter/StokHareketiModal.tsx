'use client';

import { useState, useEffect } from 'react';

type Tarla = { id: string; tarlaAdi: string };
type BankaHesabi = { id: string; hesapAdi: string; bakiye: number; tur: string; aktif?: boolean };

type Props = {
  malzemeId: string;
  malzemeAdi: string;
  birim: string;
  mevcutStok?: number;
  mevcutBirimFiyat?: number;
  varsayilanTip?: 'giris' | 'cikis';
  onKapat: () => void;
  onBasarili: (uyari?: string) => void;
};

export default function StokHareketiModal({
  malzemeId,
  malzemeAdi,
  birim,
  mevcutStok = 0,
  mevcutBirimFiyat = 0,
  varsayilanTip = 'giris',
  onKapat,
  onBasarili,
}: Props) {
  const [yukleniyor, setYukleniyor] = useState(false);
  const [hata, setHata] = useState('');
  const [tarlalar, setTarlalar] = useState<Tarla[]>([]);
  const [bankaHesaplari, setBankaHesaplari] = useState<BankaHesabi[]>([]);
  const [form, setForm] = useState({
    hareketTipi: varsayilanTip as 'giris' | 'cikis' | 'fire' | 'iade',
    miktar: '',
    birimFiyat: '',
    toplamTutar: '',
    tarih: new Date().toISOString().split('T')[0],
    tarlaId: '',
    tedarikci: '',
    faturaNo: '',
    bankaHesabiId: '',
    notlar: '',
  });

  useEffect(() => {
    Promise.all([
      fetch('/api/tarlalar').then((r) => r.json()),
      fetch('/api/banka-hesaplari').then((r) => r.json()),
    ])
      .then(([t, b]) => {
        setTarlalar(Array.isArray(t) ? t : []);
        setBankaHesaplari(
          Array.isArray(b) ? b.filter((h: BankaHesabi) => h.aktif !== false && h.tur !== 'fark_hesabi') : []
        );
      })
      .catch(console.error);
  }, []);

  // Çıkış modunda: mevcut birim fiyatı otomatik doldur
  useEffect(() => {
    if (form.hareketTipi === 'cikis' && mevcutBirimFiyat > 0 && !form.birimFiyat) {
      setForm((p) => ({ ...p, birimFiyat: mevcutBirimFiyat.toFixed(2) }));
    }
    // Giriş/iade'de birim fiyatı sıfırla
    if ((form.hareketTipi === 'giris' || form.hareketTipi === 'iade') && form.birimFiyat === String(mevcutBirimFiyat.toFixed(2))) {
      setForm((p) => ({ ...p, birimFiyat: '' }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.hareketTipi]);

  // Toplam tutarı otomatik hesapla
  useEffect(() => {
    const miktar = parseFloat(form.miktar) || 0;
    const birimFiyat = parseFloat(form.birimFiyat) || 0;
    if (miktar > 0 && birimFiyat > 0) {
      setForm((p) => ({ ...p, toplamTutar: (miktar * birimFiyat).toFixed(2) }));
    }
  }, [form.miktar, form.birimFiyat]);

  const handleDegistir = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    setForm((p) => ({ ...p, [e.target.name]: e.target.value }));
  };

  const bankaGerekli = form.hareketTipi === 'giris' || form.hareketTipi === 'iade';
  const miktarSayi = parseFloat(form.miktar) || 0;
  const stokUyarisi = form.hareketTipi === 'cikis' && miktarSayi > mevcutStok && mevcutStok > 0;

  const handleGonder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (stokUyarisi) {
      setHata(`Mevcut stok yetersiz (${mevcutStok.toLocaleString('tr-TR')} ${birim})`);
      return;
    }
    if (bankaGerekli && !form.bankaHesabiId && parseFloat(form.toplamTutar) > 0) {
      setHata('Para hareketi için banka hesabı seçiniz');
      return;
    }
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
          bankaHesabiId: form.bankaHesabiId || null,
          notlar: form.notlar || null,
        }),
      });

      if (!yanit.ok) {
        const v = await yanit.json();
        setHata(v.hata || 'Bir hata oluştu');
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
      <div className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-xl bg-white shadow-xl">
        <div className="border-b border-gray-200 px-6 py-4">
          <h2 className="text-lg font-semibold text-gray-800">
            Stok Hareketi — {malzemeAdi}
          </h2>
          {mevcutStok > 0 && (
            <p className="text-xs text-gray-500 mt-0.5">
              Mevcut stok: <span className="font-semibold text-gray-700">{mevcutStok.toLocaleString('tr-TR')} {birim}</span>
            </p>
          )}
        </div>

        <form onSubmit={handleGonder} className="space-y-4 p-6">
          {hata && <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{hata}</div>}
          {stokUyarisi && (
            <div className="rounded-lg bg-orange-50 border border-orange-200 p-3 text-sm text-orange-800">
              Girilen miktar ({miktarSayi.toLocaleString('tr-TR')} {birim}) mevcut stoku ({mevcutStok.toLocaleString('tr-TR')} {birim}) aşıyor.
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Hareket Tipi <span className="text-red-500">*</span>
              </label>
              <select name="hareketTipi" value={form.hareketTipi} onChange={handleDegistir} required
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500">
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
              <input type="date" name="tarih" value={form.tarih} onChange={handleDegistir} required
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500" />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Miktar ({birim}) <span className="text-red-500">*</span>
              </label>
              <input type="number" name="miktar" value={form.miktar} onChange={handleDegistir}
                required min="0.001" step="0.001" placeholder="0.000"
                className={`w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-1 ${stokUyarisi ? 'border-orange-400 focus:border-orange-500 focus:ring-orange-400' : 'border-gray-300 focus:border-green-500 focus:ring-green-500'}`} />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Birim Fiyat (₺)
                {form.hareketTipi === 'cikis' && mevcutBirimFiyat > 0 && (
                  <span className="ml-1 text-xs text-gray-400">son fiyat: ₺{mevcutBirimFiyat.toFixed(2)}</span>
                )}
                {form.hareketTipi === 'giris' && (
                  <span className="ml-1 text-xs text-blue-600">yeni kayıt fiyat günceller</span>
                )}
              </label>
              <input type="number" name="birimFiyat" value={form.birimFiyat} onChange={handleDegistir}
                min="0" step="0.01" placeholder="0.00"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500" />
            </div>

            <div className="col-span-2">
              <label className="mb-1 block text-sm font-medium text-gray-700">Toplam Tutar (₺)</label>
              <input type="number" name="toplamTutar" value={form.toplamTutar} onChange={handleDegistir}
                min="0" step="0.01" placeholder="Otomatik hesaplanır"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500 bg-gray-50" />
            </div>

            {/* Banka hesabı — giriş veya iade tipinde */}
            {bankaGerekli && (
              <div className="col-span-2">
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  {form.hareketTipi === 'iade' ? 'Para Giren Banka Hesabı' : 'Para Çıkan Banka Hesabı'}
                  {parseFloat(form.toplamTutar) > 0 && <span className="text-red-500 ml-1">*</span>}
                </label>
                <select name="bankaHesabiId" value={form.bankaHesabiId} onChange={handleDegistir}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500">
                  <option value="">— Banka seçin —</option>
                  {bankaHesaplari.map((h) => (
                    <option key={h.id} value={h.id}>
                      {h.hesapAdi} (₺{Number(h.bakiye).toLocaleString('tr-TR', { minimumFractionDigits: 2 })})
                    </option>
                  ))}
                </select>
                <p className="text-xs text-gray-400 mt-0.5">
                  {form.hareketTipi === 'iade'
                    ? 'İade tutarı seçilen hesaba giriş olarak kaydedilir'
                    : 'Alım tutarı seçilen hesaptan çıkış olarak kaydedilir'}
                </p>
              </div>
            )}

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Tarla (İsteğe Bağlı)</label>
              <select name="tarlaId" value={form.tarlaId} onChange={handleDegistir}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500">
                <option value="">Seçiniz...</option>
                {tarlalar.map((t) => <option key={t.id} value={t.id}>{t.tarlaAdi}</option>)}
              </select>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Tedarikçi</label>
              <input type="text" name="tedarikci" value={form.tedarikci} onChange={handleDegistir}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
                placeholder="Tedarikçi adı" />
            </div>

            <div className="col-span-2">
              <label className="mb-1 block text-sm font-medium text-gray-700">Fatura No</label>
              <input type="text" name="faturaNo" value={form.faturaNo} onChange={handleDegistir}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
                placeholder="Fatura numarası" />
            </div>

            <div className="col-span-2">
              <label className="mb-1 block text-sm font-medium text-gray-700">Notlar</label>
              <textarea name="notlar" value={form.notlar} onChange={handleDegistir} rows={2}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
                placeholder="İsteğe bağlı notlar" />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onKapat}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">
              İptal
            </button>
            <button type="submit" disabled={yukleniyor || stokUyarisi}
              className="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50">
              {yukleniyor ? 'Kaydediliyor...' : 'Kaydet'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
