'use client';

import { useState, useEffect } from 'react';

interface Malzeme {
  id: string;
  malzemeAdi: string;
  kategori: string;
  birim: string;
  mevcutStok: number;
  birimFiyat: number;
}

interface MalzemeSatir {
  malzemeId: string;
  ad: string;
  birim: string;
  mevcutStok: number;
  miktar: string;
  birimFiyat: number;
}

interface BankaHesabi {
  id: string;
  hesapAdi: string;
  bankaAdi: string | null;
  tur: string;
  bakiye: number;
}

interface Props {
  ekipmanId: string;
  ekipmanAdi: string;
  plaka: string | null;
  onKapat: () => void;
  onKaydet: () => void;
}

function paraFormat(sayi: number) {
  return new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(sayi);
}

export default function EkipmanBakimModal({ ekipmanId, ekipmanAdi, plaka, onKapat, onKaydet }: Props) {
  const [kaydediliyor, setKaydediliyor] = useState(false);
  const [hata, setHata] = useState('');
  const [malzemeler, setMalzemeler] = useState<Malzeme[]>([]);
  const [bankaHesaplari, setBankaHesaplari] = useState<BankaHesabi[]>([]);
  const [belgNoYukleniyor, setBelgNoYukleniyor] = useState(false);
  const [satirlar, setSatirlar] = useState<MalzemeSatir[]>([]);
  const [malzemeArama, setMalzemeArama] = useState('');
  const [malzemeAcik, setMalzemeAcik] = useState(false);

  const [form, setForm] = useState({
    tarih: new Date().toISOString().split('T')[0],
    aciklama: '',
    belgNo: '',
    kilometre: '',
    ekstraTutar: '', // Malzeme dışı ek gider (işçilik, servis ücreti vb.)
    bankaHesabiId: '',
  });

  useEffect(() => {
    Promise.all([
      fetch('/api/malzemeler').then((r) => r.json()),
      fetch('/api/banka-hesaplari').then((r) => r.json()),
    ]).then(([malzemeVeri, bankaVeri]) => {
      if (Array.isArray(malzemeVeri)) setMalzemeler(malzemeVeri.filter((m: Malzeme) => m.mevcutStok > 0));
      if (Array.isArray(bankaVeri)) setBankaHesaplari(bankaVeri.filter((h: BankaHesabi) => h.tur !== 'fark_hesabi'));
    }).catch(() => {});
  }, []);

  useEffect(() => {
    setBelgNoYukleniyor(true);
    fetch('/api/fatura-no?prefix=BAK')
      .then((r) => r.json())
      .then((v) => { if (v.belgNo) setForm((p) => ({ ...p, belgNo: v.belgNo })); })
      .catch(() => {})
      .finally(() => setBelgNoYukleniyor(false));
  }, []);

  const malzemeToplami = satirlar.reduce((s, satir) => {
    const miktar = parseFloat(satir.miktar || '0');
    return s + miktar * satir.birimFiyat;
  }, 0);

  const toplamTutar = malzemeToplami + parseFloat(form.ekstraTutar || '0');

  const filtreliMalzemeler = malzemeler.filter((m) =>
    m.malzemeAdi.toLowerCase().includes(malzemeArama.toLowerCase())
  );

  function malzemeEkle(malzeme: Malzeme) {
    if (satirlar.find((s) => s.malzemeId === malzeme.id)) return;
    setSatirlar((p) => [...p, {
      malzemeId: malzeme.id,
      ad: malzeme.malzemeAdi,
      birim: malzeme.birim,
      mevcutStok: malzeme.mevcutStok,
      miktar: '1',
      birimFiyat: malzeme.birimFiyat,
    }]);
    setMalzemeAcik(false);
    setMalzemeArama('');
  }

  function satirCikar(malzemeId: string) {
    setSatirlar((p) => p.filter((s) => s.malzemeId !== malzemeId));
  }

  function miktarDegistir(malzemeId: string, miktar: string) {
    setSatirlar((p) => p.map((s) => s.malzemeId === malzemeId ? { ...s, miktar } : s));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setHata('');

    // Stok kontrolü
    for (const satir of satirlar) {
      const miktar = parseFloat(satir.miktar || '0');
      if (miktar <= 0) { setHata(`${satir.ad} için geçerli miktar giriniz`); return; }
      if (miktar > satir.mevcutStok) {
        setHata(`${satir.ad} için yeterli stok yok (mevcut: ${satir.mevcutStok} ${satir.birim})`); return;
      }
    }

    setKaydediliyor(true);
    try {
      const kullanilanMalzemeler = satirlar.map((s) => ({
        malzemeId: s.malzemeId,
        ad: s.ad,
        miktar: parseFloat(s.miktar),
        birim: s.birim,
        birimFiyat: s.birimFiyat,
      }));

      const yanit = await fetch(`/api/ekipmanlar/${ekipmanId}/giderler`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tarih: form.tarih,
          giderTipi: 'bakim',
          tutar: toplamTutar,
          aciklama: form.aciklama || 'Bakım',
          belgNo: form.belgNo || null,
          kilometre: form.kilometre ? parseInt(form.kilometre) : null,
          bankaHesabiId: form.bankaHesabiId || null,
          kullanilanMalzemeler: kullanilanMalzemeler.length > 0 ? kullanilanMalzemeler : null,
        }),
      });
      const veri = await yanit.json();
      if (!yanit.ok) { setHata(veri.hata ?? 'Hata oluştu'); return; }
      onKaydet();
      onKapat();
    } catch {
      setHata('Bağlantı hatası');
    } finally {
      setKaydediliyor(false);
    }
  }

  const seciliBanka = bankaHesaplari.find((h) => h.id === form.bankaHesabiId);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-xl rounded-xl bg-white shadow-xl max-h-[90vh] flex flex-col">
        <div className="border-b px-5 py-4 shrink-0">
          <h2 className="text-base font-semibold text-gray-800">🔧 Bakım Kaydı</h2>
          <p className="text-xs text-gray-400 mt-0.5">{ekipmanAdi}{plaka ? ` — ${plaka}` : ''}</p>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4 overflow-y-auto flex-1">
          {hata && <div className="rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-700">{hata}</div>}

          {/* Tarih + KM */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Tarih *</label>
              <input type="date" value={form.tarih} onChange={(e) => setForm((p) => ({ ...p, tarih: e.target.value }))} required
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">KM (Sayaç)</label>
              <input type="number" value={form.kilometre} onChange={(e) => setForm((p) => ({ ...p, kilometre: e.target.value }))}
                min="0" placeholder="Opsiyonel"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
          </div>

          {/* Kullanılan malzemeler */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-medium text-gray-600">Kullanılan Malzemeler (Stoktan Düşer)</label>
              <button type="button" onClick={() => setMalzemeAcik(true)}
                className="text-xs bg-blue-50 text-blue-700 border border-blue-200 rounded-lg px-3 py-1 hover:bg-blue-100">
                + Malzeme Ekle
              </button>
            </div>

            {satirlar.length > 0 ? (
              <div className="rounded-lg border border-gray-200 divide-y divide-gray-100">
                {satirlar.map((satir) => {
                  const miktar = parseFloat(satir.miktar || '0');
                  const satirTutar = miktar * satir.birimFiyat;
                  const asimMi = miktar > satir.mevcutStok;
                  return (
                    <div key={satir.malzemeId} className={`flex items-center gap-2 px-3 py-2.5 ${asimMi ? 'bg-red-50' : ''}`}>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-800 truncate">{satir.ad}</p>
                        <p className="text-xs text-gray-500">Stok: {satir.mevcutStok} {satir.birim}</p>
                      </div>
                      <div className="flex items-center gap-1">
                        <input type="number" value={satir.miktar}
                          onChange={(e) => miktarDegistir(satir.malzemeId, e.target.value)}
                          min="0.01" step="0.01" className={`w-20 rounded border px-2 py-1 text-sm text-center focus:outline-none ${asimMi ? 'border-red-400 bg-red-50' : 'border-gray-300'}`} />
                        <span className="text-xs text-gray-500">{satir.birim}</span>
                      </div>
                      <div className="text-right w-24">
                        <p className="text-xs font-semibold text-gray-700">{paraFormat(satirTutar)}</p>
                        <p className="text-xs text-gray-400">{satir.birimFiyat.toFixed(2)} ₺/{satir.birim}</p>
                      </div>
                      <button type="button" onClick={() => satirCikar(satir.malzemeId)}
                        className="text-red-400 hover:text-red-600 text-lg leading-none ml-1">×</button>
                    </div>
                  );
                })}
                <div className="flex justify-between px-3 py-2 bg-gray-50 text-sm font-semibold">
                  <span>Malzeme Toplamı</span>
                  <span>{paraFormat(malzemeToplami)}</span>
                </div>
              </div>
            ) : (
              <div className="rounded-lg border border-dashed border-gray-300 py-6 text-center text-sm text-gray-400">
                Malzeme eklenmedi — stoktan düşmek için ekleyin
              </div>
            )}
          </div>

          {/* Ekstra tutar */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Ek Maliyet (₺) — İşçilik, servis ücreti vb.</label>
            <input type="number" value={form.ekstraTutar}
              onChange={(e) => setForm((p) => ({ ...p, ekstraTutar: e.target.value }))}
              min="0" step="0.01" placeholder="0.00"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>

          {/* Toplam */}
          <div className="rounded-lg bg-blue-50 border border-blue-200 px-4 py-3 flex justify-between items-center">
            <span className="text-sm font-medium text-blue-700">Toplam Bakım Maliyeti</span>
            <span className="text-xl font-bold text-blue-800">{paraFormat(toplamTutar)}</span>
          </div>

          {/* Banka hesabı */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Ödeme Yapılan Hesap</label>
            <select value={form.bankaHesabiId} onChange={(e) => setForm((p) => ({ ...p, bankaHesabiId: e.target.value }))}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="">— Nakit / Seçme —</option>
              {bankaHesaplari.map((h) => (
                <option key={h.id} value={h.id}>
                  {h.hesapAdi}{h.bankaAdi ? ` (${h.bankaAdi})` : ''} — {paraFormat(h.bakiye)}
                </option>
              ))}
            </select>
            {seciliBanka && toplamTutar > 0 && (
              <p className="text-xs mt-1">
                <span className="text-gray-500">Bakiye sonrası: </span>
                <span className={seciliBanka.bakiye - toplamTutar < 0 ? 'text-red-600 font-semibold' : 'text-gray-700'}>
                  {paraFormat(seciliBanka.bakiye - toplamTutar)}
                </span>
              </p>
            )}
          </div>

          {/* Açıklama + Belge No */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Açıklama</label>
              <input type="text" value={form.aciklama} onChange={(e) => setForm((p) => ({ ...p, aciklama: e.target.value }))}
                placeholder="Yapılan işlem..."
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Belge No
                {belgNoYukleniyor && <span className="ml-1 text-gray-400 text-xs">(yükleniyor...)</span>}
              </label>
              <input type="text" value={form.belgNo} onChange={(e) => setForm((p) => ({ ...p, belgNo: e.target.value }))}
                placeholder="Otomatik"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
          </div>

          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onKapat}
              className="flex-1 rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">
              İptal
            </button>
            <button type="submit" disabled={kaydediliyor || (satirlar.length === 0 && !form.ekstraTutar)}
              className="flex-1 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60">
              {kaydediliyor ? 'Kaydediliyor...' : 'Bakımı Kaydet'}
            </button>
          </div>
        </form>
      </div>

      {/* Malzeme seçim dropdown */}
      {malzemeAcik && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-sm rounded-xl bg-white shadow-2xl">
            <div className="border-b px-4 py-3 flex items-center gap-2">
              <input type="text" value={malzemeArama} onChange={(e) => setMalzemeArama(e.target.value)}
                placeholder="Malzeme ara..." autoFocus
                className="flex-1 text-sm outline-none" />
              <button onClick={() => { setMalzemeAcik(false); setMalzemeArama(''); }}
                className="text-gray-400 hover:text-gray-600 text-xl leading-none">×</button>
            </div>
            <div className="max-h-72 overflow-y-auto divide-y divide-gray-100">
              {filtreliMalzemeler.length === 0 ? (
                <div className="py-8 text-center text-sm text-gray-400">Aktif stoklu malzeme bulunamadı</div>
              ) : filtreliMalzemeler.map((m) => {
                const eklendi = satirlar.some((s) => s.malzemeId === m.id);
                return (
                  <button key={m.id} type="button" onClick={() => malzemeEkle(m)} disabled={eklendi}
                    className={`w-full text-left px-4 py-3 hover:bg-gray-50 flex justify-between items-center ${eklendi ? 'opacity-40' : ''}`}>
                    <div>
                      <p className="text-sm font-medium text-gray-800">{m.malzemeAdi}</p>
                      <p className="text-xs text-gray-500">{m.kategori} · Stok: {m.mevcutStok} {m.birim}</p>
                    </div>
                    <span className="text-xs text-gray-500">{m.birimFiyat.toFixed(2)} ₺/{m.birim}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
