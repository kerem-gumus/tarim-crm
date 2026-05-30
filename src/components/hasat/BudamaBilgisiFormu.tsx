'use client';

import { useState, useEffect } from 'react';

type DonemCiftci = {
  id: string; // donemCiftciId
  ciftciId: string;
  ciftci: { adSoyad: string; cayKurNo: string | null };
  ciftciToplamDonum: number;
  kisiselDonum: number;
  kiraliDonum: number;
  budamaBilgisi: { id: string } | null;
};

type Props = {
  hasatDonemiId: string;
  brutFiyat: number | null;
  onKapat: () => void;
  onKaydet: () => void;
};

export default function BudamaBilgisiFormu({ hasatDonemiId, brutFiyat, onKapat, onKaydet }: Props) {
  const [donemCiftciler, setDonemCiftciler] = useState<DonemCiftci[]>([]);
  const [yukleniyor, setYukleniyor] = useState(true);
  const [secilenDonemCiftciId, setSecilenDonemCiftciId] = useState('');
  const [form, setForm] = useState({
    herKacDonum: '',   // Devlet kuralı: "Her ___ dönüme..."
    kesilenDonum: '',  // "...___ dönüm budanır"
    notlar: '',
  });
  const [budamaciTuru, setBudamaciTuru] = useState<'sahip' | 'kiraci'>('sahip');
  const [kaydediliyor, setKaydediliyor] = useState(false);
  const [hata, setHata] = useState('');

  useEffect(() => {
    async function getir() {
      try {
        const yanit = await fetch(`/api/hasat-donemleri/${hasatDonemiId}/ciftciler`);
        const veri = await yanit.json();
        setDonemCiftciler(
          (Array.isArray(veri) ? veri : []).filter((dc: DonemCiftci) => !dc.budamaBilgisi)
        );
      } finally {
        setYukleniyor(false);
      }
    }
    getir();
  }, [hasatDonemiId]);

  const secilenCiftci = donemCiftciler.find((dc) => dc.id === secilenDonemCiftciId);
  const kiraliDonum = secilenCiftci ? Number(secilenCiftci.kiraliDonum) : 0;
  const kisiselDonum = secilenCiftci ? Number(secilenCiftci.kisiselDonum) : 0;
  // Kiracı budadıysa kendi + kiralık toplam, sahip yaptıysa sadece sahip dönümü
  const toplamDonum = secilenCiftci
    ? (kiraliDonum > 0 && budamaciTuru === 'kiraci'
        ? Number(secilenCiftci.ciftciToplamDonum)
        : kisiselDonum)
    : 0;

  // Devlet oranına göre budanan dönüm ve m² hesabı
  const herKacDonumSayi = parseFloat(form.herKacDonum) || 0;
  const kesilenDonumSayi = parseFloat(form.kesilenDonum) || 0;

  const hesaplananBudananDonum =
    toplamDonum > 0 && herKacDonumSayi > 0 && kesilenDonumSayi > 0
      ? (toplamDonum / herKacDonumSayi) * kesilenDonumSayi
      : 0;

  const hesaplananM2 = hesaplananBudananDonum * 1000;
  const brutFiyatSayi = Number(brutFiyat ?? 0);
  const hesaplananTutar = hesaplananM2 * brutFiyatSayi;

  async function kaydet(e: React.FormEvent) {
    e.preventDefault();
    setHata('');

    if (!secilenDonemCiftciId) { setHata('Çiftçi seçin'); return; }
    if (!brutFiyat) { setHata('Hasat dönemine brüt fiyat girilmemiş. Önce dönemi düzenleyin.'); return; }
    if (herKacDonumSayi <= 0 || kesilenDonumSayi <= 0) {
      setHata('Devlet kesim kuralını girin');
      return;
    }
    if (hesaplananBudananDonum <= 0) {
      setHata('Hesaplanan budanan dönüm 0. Toplam dönümü ve oranı kontrol edin.');
      return;
    }

    setKaydediliyor(true);
    try {
      const yanit = await fetch(`/api/hasat-donemleri/${hasatDonemiId}/budama`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          donemCiftciId: secilenDonemCiftciId,
          budananDonum: hesaplananBudananDonum,
          notlar: form.notlar || null,
        }),
      });
      const veri = await yanit.json();
      if (!yanit.ok) { setHata(veri.hata); return; }
      onKaydet();
      onKapat();
    } catch {
      setHata('Bir hata oluştu');
    } finally {
      setKaydediliyor(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-xl bg-white shadow-xl">
        <div className="border-b px-5 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-base font-semibold text-gray-800">Budama Bilgisi Gir</h2>
            <p className="text-xs text-gray-400 mt-0.5">
              {brutFiyat
                ? `Brüt fiyat: ₺${Number(brutFiyat).toFixed(4)}/kg`
                : <span className="text-orange-500">Brüt fiyat girilmemiş!</span>}
            </p>
          </div>
          <button onClick={onKapat} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
        </div>

        <form onSubmit={kaydet} className="p-5 space-y-4">
          {hata && (
            <div className="rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-700">{hata}</div>
          )}

          {/* Çiftçi seçimi */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Çiftçi <span className="text-red-500">*</span>
            </label>
            {yukleniyor ? (
              <p className="text-sm text-gray-400">Yükleniyor...</p>
            ) : donemCiftciler.length === 0 ? (
              <p className="text-sm text-orange-600">
                Tüm dönem çiftçilerinin budama kaydı mevcut veya dönemde çiftçi yok.
              </p>
            ) : (
              <select
                value={secilenDonemCiftciId}
                onChange={(e) => { setSecilenDonemCiftciId(e.target.value); setBudamaciTuru('sahip'); }}
                required
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                <option value="">Çiftçi seçin...</option>
                {donemCiftciler.map((dc) => (
                  <option key={dc.id} value={dc.id}>
                    {dc.ciftci.adSoyad}
                    {dc.ciftci.cayKurNo ? ` (${dc.ciftci.cayKurNo})` : ''}
                    {' — '}
                    {Number(dc.ciftciToplamDonum).toFixed(2)} dönüm
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Kiralık tarla varsa budamacı seçimi */}
          {secilenCiftci && kiraliDonum > 0 && (
            <div className="rounded-lg bg-amber-50 border border-amber-200 px-4 py-3 space-y-2">
              <p className="text-xs text-amber-800 font-semibold">
                Bu çiftçinin {kiraliDonum.toFixed(2)} dönüm kiralık arazisi var — budamayı kim yaptı?
              </p>
              <div className="flex gap-4">
                <label className="flex items-center gap-1.5 text-sm text-amber-900 cursor-pointer">
                  <input
                    type="radio"
                    name="budamaciTuru"
                    value="sahip"
                    checked={budamaciTuru === 'sahip'}
                    onChange={() => setBudamaciTuru('sahip')}
                    className="accent-amber-600"
                  />
                  Tarla sahibi yaptı
                </label>
                <label className="flex items-center gap-1.5 text-sm text-amber-900 cursor-pointer">
                  <input
                    type="radio"
                    name="budamaciTuru"
                    value="kiraci"
                    checked={budamaciTuru === 'kiraci'}
                    onChange={() => setBudamaciTuru('kiraci')}
                    className="accent-amber-600"
                  />
                  Kiracı yaptı
                </label>
              </div>
              {budamaciTuru === 'kiraci' && (
                <p className="text-xs text-amber-600">
                  Kiracı yaptığı için kendi ({kisiselDonum.toFixed(2)} dön) + kiralık ({kiraliDonum.toFixed(2)} dön) toplam kullanılır.
                </p>
              )}
              {budamaciTuru === 'sahip' && (
                <p className="text-xs text-amber-600">
                  Tarla sahibi yaptığı için sadece kendi arazisi ({kisiselDonum.toFixed(2)} dön) kullanılır.
                </p>
              )}
            </div>
          )}

          {/* Toplam dönüm (bilgi) */}
          {secilenCiftci && (
            <div className="rounded-lg bg-blue-50 border border-blue-100 px-4 py-3">
              <p className="text-xs text-blue-600 font-medium">Budamaya Esas Toplam Arazi</p>
              <div className="flex items-baseline gap-3 mt-0.5">
                <p className="text-xl font-bold text-blue-800">
                  {toplamDonum.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} dönüm
                </p>
                <p className="text-sm text-blue-600">
                  = {(toplamDonum * 1000).toLocaleString('tr-TR')} m²
                </p>
              </div>
            </div>
          )}

          {/* Devlet Kesim Kuralı */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-2">
              Devlet Kesim Kuralı <span className="text-red-500">*</span>
            </label>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500 whitespace-nowrap">Her</span>
              <input
                type="number"
                value={form.herKacDonum}
                onChange={(e) => setForm((p) => ({ ...p, herKacDonum: e.target.value }))}
                required
                min="0.01"
                step="0.01"
                placeholder="7"
                className="w-20 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
              />
              <span className="text-sm text-gray-500 whitespace-nowrap">dönüme</span>
              <input
                type="number"
                value={form.kesilenDonum}
                onChange={(e) => setForm((p) => ({ ...p, kesilenDonum: e.target.value }))}
                required
                min="0.01"
                step="0.01"
                placeholder="1"
                className="w-20 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
              />
              <span className="text-sm text-gray-500 whitespace-nowrap">dönüm</span>
            </div>
            <p className="text-xs text-gray-400 mt-1">
              Örn: Her 7 dönüme 1 dönüm budama
            </p>
          </div>

          {/* Hesaplama sonucu */}
          {hesaplananM2 > 0 && (
            <div className="rounded-lg bg-amber-50 border border-amber-200 px-4 py-3 space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-xs text-amber-700 font-medium">Budanacak Alan</span>
                <div className="text-right">
                  <p className="text-lg font-bold text-amber-900">
                    {hesaplananM2.toLocaleString('tr-TR', { maximumFractionDigits: 0 })} m²
                  </p>
                  <p className="text-xs text-amber-600">
                    ({hesaplananBudananDonum.toFixed(4)} dönüm)
                  </p>
                </div>
              </div>
              <p className="text-xs text-amber-600">
                {toplamDonum.toFixed(2)} ÷ {form.herKacDonum} × {form.kesilenDonum} × 1000
              </p>

              {brutFiyat && (
                <div className="border-t border-amber-200 pt-2 space-y-1">
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>Brüt Fiyat</span>
                    <span className="font-medium text-gray-700">₺{Number(brutFiyat).toFixed(4)}</span>
                  </div>
                  <div className="flex justify-between text-sm font-semibold">
                    <span className="text-gray-700">Kesilecek Tutar</span>
                    <span className="text-red-600">
                      ₺{hesaplananTutar.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                  <p className="text-xs text-gray-400">
                    {hesaplananM2.toLocaleString('tr-TR', { maximumFractionDigits: 0 })} m² × ₺{Number(brutFiyat).toFixed(4)}
                  </p>
                </div>
              )}
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Notlar</label>
            <input
              type="text"
              value={form.notlar}
              onChange={(e) => setForm((p) => ({ ...p, notlar: e.target.value }))}
              placeholder="İsteğe bağlı"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>

          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={onKapat}
              className="flex-1 rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              İptal
            </button>
            <button
              type="submit"
              disabled={kaydediliyor || !brutFiyat || hesaplananM2 === 0}
              className="flex-1 rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50"
            >
              {kaydediliyor ? 'Kaydediliyor...' : 'Budama Kaydet'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
