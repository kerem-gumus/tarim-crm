'use client';

import { useCallback, useEffect, useState } from 'react';
import OdemeModal from '@/components/finans/OdemeModal';
import ManuelBorcFormu from '@/components/finans/ManuelBorcFormu';

// =====================================================
// Tipler
// =====================================================

interface AyKaydi {
  id: string;
  ay: number | null;
  yil: number | null;
  toplamKg: number;
  birimFiyat: number;
  toplamTutar: number;
  odenenTutar: number;
  kalanTutar: number;
  odemeDurumu: string;
}

interface MusteriBilgisi {
  musteriId: string | null;
  musteriAdi: string;
  fiyatTuru: string | null;
  aylar: AyKaydi[];
  toplamTutar: number;
  odenenTutar: number;
  kalanTutar: number;
  odemeDurumu: string;
}

interface SurgunBilgisi {
  id: string;
  surgunNo: number;
  surgunAdi: string;
  durum: string;
  musteriler: MusteriBilgisi[];
  toplamAlacak: number;
  odenenTutar: number;
  kalanTutar: number;
  odemeDurumu: string;
}

interface BudamaKalemi {
  id: string;
  hasatDonemiId: string;
  ciftciId: string;
  ciftciAdi: string;
  cayKurNo: string | null;
  hesaplananTutar: number;
  odenenTutar: number;
  kalanTutar: number;
  odemeDurumu: string;
  budananDonum: number;
  budananM2: number;
}

interface DesteklemeBilgisi {
  alacakTutar: number;
  odenenTutar: number;
  kalanTutar: number;
  odemeDurumu: string;
}

interface DonemAlacak {
  id: string;
  donemAdi: string;
  yil: number;
  durum: string;
  odemeDurumu: string;
  toplamAlacak: number;
  odenenTutar: number;
  kalanTutar: number;
  budamaKalemleri: BudamaKalemi[];
  budamaToplamAlacak: number;
  budamaToplamKalan: number;
  surgunler: SurgunBilgisi[];
  destekleme: DesteklemeBilgisi | null;
}

interface OdemeKaydi {
  id: string;
  kategori: string;
  aciklama: string;
  tutar: number;
  odemeDurumu: string;
  odenenTutar: number;
  odemeTarihi: string | null;
  olusturmaTarihi: string;
}

interface BankaHesabi {
  id: string;
  hesapAdi: string;
  bankaAdi: string | null;
  tur: string;
  bakiye: number;
  kmhLimiti: boolean;
  alarmDurumu: boolean;
}

interface FinansOzet {
  toplamAlacak: number;
  odenmeBekleniyor: number;
  toplamBorc: number;
  netDurum: number;
}

// =====================================================
// Sabitler ve yardımcılar
// =====================================================

const AY_UZUN = ['', 'Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'];

function paraFormat(sayi: number) {
  return sayi.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' ₺';
}

function odemeDurumuBadge(durum: string) {
  const cls: Record<string, string> = {
    odeme_bekleniyor: 'bg-yellow-100 text-yellow-800',
    kismi_odendi: 'bg-blue-100 text-blue-800',
    odendi: 'bg-green-100 text-green-800',
  };
  const etiket: Record<string, string> = {
    odeme_bekleniyor: 'Ödeme Bekliyor',
    kismi_odendi: 'Kısmi Ödendi',
    odendi: 'Ödendi',
  };
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${cls[durum] ?? 'bg-gray-100 text-gray-600'}`}>
      {etiket[durum] ?? durum}
    </span>
  );
}

function kategoriBadge(kategori: string) {
  const cls: Record<string, string> = {
    iscilik: 'bg-purple-100 text-purple-800',
    yemek: 'bg-pink-100 text-pink-800',
    malzeme: 'bg-orange-100 text-orange-800',
    yakit: 'bg-red-100 text-red-800',
    gubre: 'bg-lime-100 text-lime-800',
    diger: 'bg-gray-100 text-gray-800',
  };
  const etiket: Record<string, string> = {
    iscilik: 'İşçilik', yemek: 'Yemek', malzeme: 'Malzeme',
    yakit: 'Yakıt', gubre: 'Gübre', diger: 'Diğer',
  };
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${cls[kategori] ?? 'bg-gray-100 text-gray-600'}`}>
      {etiket[kategori] ?? kategori}
    </span>
  );
}

// =====================================================
// Budama Ödeme Modalı
// =====================================================

function BudamaOdemeModal({
  budamaId,
  hasatDonemiId,
  ciftciAdi,
  kalanTutar,
  onKaydet,
  onKapat,
}: {
  budamaId: string;
  hasatDonemiId: string;
  ciftciAdi: string;
  kalanTutar: number;
  onKaydet: () => void;
  onKapat: () => void;
}) {
  const [tutar, setTutar] = useState<string>(kalanTutar.toFixed(2));
  const [tarih, setTarih] = useState<string>(new Date().toISOString().split('T')[0]);
  const [aciklama, setAciklama] = useState<string>('');
  const [bankaHesabiId, setBankaHesabiId] = useState<string>('');
  const [bankaHesaplari, setBankaHesaplari] = useState<BankaHesabi[]>([]);
  const [yukleniyor, setYukleniyor] = useState(false);
  const [hata, setHata] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/banka-hesaplari')
      .then((r) => r.json())
      .then((veri) => {
        if (Array.isArray(veri)) setBankaHesaplari(veri.filter((h: BankaHesabi) => h.tur !== 'fark_hesabi'));
      })
      .catch(() => {});
  }, []);

  async function handleKaydet() {
    const tutarSayi = parseFloat(tutar);
    if (!tutarSayi || tutarSayi <= 0) { setHata('Geçerli bir tutar giriniz'); return; }
    setYukleniyor(true); setHata(null);
    try {
      const yanit = await fetch(`/api/hasat-donemleri/${hasatDonemiId}/budama/${budamaId}/odeme`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tutar: tutarSayi, tarih, aciklama, bankaHesabiId: bankaHesabiId || null }),
      });
      if (!yanit.ok) { const v = await yanit.json(); setHata(v.hata ?? 'Hata'); return; }
      onKaydet();
    } catch { setHata('Bağlantı hatası'); } finally { setYukleniyor(false); }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-sm rounded-xl bg-white shadow-xl">
        <div className="border-b px-5 py-4">
          <h3 className="text-base font-semibold text-gray-800">Budama Ödemesi Al</h3>
          <p className="text-xs text-gray-500 mt-0.5">{ciftciAdi}</p>
        </div>
        <div className="p-5 space-y-4">
          <div className="rounded-lg bg-green-50 border border-green-100 px-4 py-3 flex justify-between">
            <p className="text-xs text-green-600 font-medium">Kalan Tutar</p>
            <p className="text-lg font-bold text-green-800">{paraFormat(kalanTutar)}</p>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Ödeme Tutarı (₺)</label>
            <input type="number" value={tutar} onChange={(e) => setTutar(e.target.value)} step={0.01} min={0.01}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Ödeme Tarihi</label>
            <input type="date" value={tarih} onChange={(e) => setTarih(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Banka Hesabı (opsiyonel)</label>
            <select value={bankaHesabiId} onChange={(e) => setBankaHesabiId(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500">
              <option value="">— Nakit / Seçme —</option>
              {bankaHesaplari.map((h) => (
                <option key={h.id} value={h.id}>{h.hesapAdi}{h.bankaAdi ? ` (${h.bankaAdi})` : ''} — {paraFormat(h.bakiye)}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Açıklama (opsiyonel)</label>
            <input type="text" value={aciklama} onChange={(e) => setAciklama(e.target.value)} placeholder="Not..."
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
          </div>
          {hata && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{hata}</p>}
        </div>
        <div className="border-t px-5 py-4 flex justify-end gap-3">
          <button onClick={onKapat} disabled={yukleniyor}
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-60">
            İptal
          </button>
          <button onClick={handleKaydet} disabled={yukleniyor}
            className="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-60">
            {yukleniyor ? 'Kaydediliyor...' : 'Kaydet'}
          </button>
        </div>
      </div>
    </div>
  );
}

// =====================================================
// Destekleme Ödeme Modalı
// =====================================================

function DesteklemeOdemeModal({
  hasatDonemiId,
  donemAdi,
  kalanTutar,
  onKaydet,
  onKapat,
}: {
  hasatDonemiId: string;
  donemAdi: string;
  kalanTutar: number;
  onKaydet: () => void;
  onKapat: () => void;
}) {
  const [tutar, setTutar] = useState<string>(kalanTutar.toFixed(2));
  const [tarih, setTarih] = useState<string>(new Date().toISOString().split('T')[0]);
  const [aciklama, setAciklama] = useState<string>('');
  const [yukleniyor, setYukleniyor] = useState(false);
  const [hata, setHata] = useState<string | null>(null);

  async function handleKaydet() {
    const tutarSayi = parseFloat(tutar);
    if (!tutarSayi || tutarSayi <= 0) { setHata('Geçerli bir tutar giriniz'); return; }
    setYukleniyor(true); setHata(null);
    try {
      const yanit = await fetch(`/api/hasat-donemleri/${hasatDonemiId}/destekleme-odeme`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tutar: tutarSayi, tarih, aciklama }),
      });
      if (!yanit.ok) { const v = await yanit.json(); setHata(v.hata ?? 'Hata'); return; }
      onKaydet();
    } catch { setHata('Bağlantı hatası'); } finally { setYukleniyor(false); }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-sm rounded-xl bg-white shadow-xl">
        <div className="border-b px-5 py-4">
          <h3 className="text-base font-semibold text-gray-800">Destekleme Ödemesi Al</h3>
          <p className="text-xs text-gray-500 mt-0.5">{donemAdi}</p>
        </div>
        <div className="p-5 space-y-4">
          <div className="rounded-lg bg-blue-50 border border-blue-100 px-4 py-3 flex justify-between">
            <p className="text-xs text-blue-600 font-medium">Kalan Destekleme</p>
            <p className="text-lg font-bold text-blue-800">{paraFormat(kalanTutar)}</p>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Ödeme Tutarı (₺)</label>
            <input type="number" value={tutar} onChange={(e) => setTutar(e.target.value)} step={0.01} min={0.01}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Ödeme Tarihi</label>
            <input type="date" value={tarih} onChange={(e) => setTarih(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Açıklama (opsiyonel)</label>
            <input type="text" value={aciklama} onChange={(e) => setAciklama(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
          </div>
          {hata && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{hata}</p>}
        </div>
        <div className="border-t px-5 py-4 flex justify-end gap-3">
          <button onClick={onKapat} disabled={yukleniyor}
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-60">
            İptal
          </button>
          <button onClick={handleKaydet} disabled={yukleniyor}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60">
            {yukleniyor ? 'Kaydediliyor...' : 'Kaydet'}
          </button>
        </div>
      </div>
    </div>
  );
}

// =====================================================
// Toplu Ödeme Modalı (Borçlar)
// =====================================================

function TopluOdemeModal({
  seciliKayitlar,
  toplamTutar,
  onKaydet,
  onKapat,
}: {
  seciliKayitlar: OdemeKaydi[];
  toplamTutar: number;
  onKaydet: () => void;
  onKapat: () => void;
}) {
  const [gercekTutar, setGercekTutar] = useState<string>(toplamTutar.toFixed(2));
  const [tamOdeme, setTamOdeme] = useState<boolean>(true);
  const [odemeYontemi, setOdemeYontemi] = useState<string>('nakit');
  const [bankaHesabiId, setBankaHesabiId] = useState<string>('');
  const [odemeTarihi, setOdemeTarihi] = useState<string>(new Date().toISOString().split('T')[0]);
  const [bankaHesaplari, setBankaHesaplari] = useState<BankaHesabi[]>([]);
  const [yukleniyor, setYukleniyor] = useState(false);
  const [hata, setHata] = useState<string | null>(null);
  const [kmhUyari, setKmhUyari] = useState<{ bakiye: number; kmhLimiti: boolean } | null>(null);

  useEffect(() => {
    fetch('/api/banka-hesaplari')
      .then((r) => r.json())
      .then((veri) => {
        if (Array.isArray(veri)) setBankaHesaplari(veri.filter((h: BankaHesabi) => h.tur !== 'fark_hesabi'));
      })
      .catch(() => {});
  }, []);

  const gercekSayi = Number(gercekTutar) || 0;
  const farkTutar = toplamTutar - gercekSayi;
  const farkPozitif = farkTutar > 0.005;  // az ödedik
  const farkNegatif = farkTutar < -0.005; // fazla ödedik

  async function handleKaydet(kmhOnayi = false) {
    if (gercekSayi <= 0) { setHata('Geçerli bir ödeme tutarı giriniz'); return; }
    if (odemeYontemi === 'banka' && !bankaHesabiId) {
      setHata('Lütfen bir banka hesabı seçiniz'); return;
    }
    setYukleniyor(true); setHata(null);
    try {
      const yanit = await fetch('/api/odeme-kayitlari/toplu-odeme', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          kayitIds: seciliKayitlar.map((k) => k.id),
          gercekTutar: gercekSayi,
          tamOdeme,
          odemeYontemi,
          odemeTarihi,
          bankaHesabiId: odemeYontemi === 'banka' ? bankaHesabiId : undefined,
          kmhOnayi,
        }),
      });
      if (yanit.status === 409) {
        const v = await yanit.json();
        if (v.hata === 'yetersiz_bakiye') {
          setKmhUyari({ bakiye: v.bakiye, kmhLimiti: v.kmhLimiti });
          return;
        }
        setHata(v.mesaj ?? 'Hata'); return;
      }
      if (!yanit.ok) { const v = await yanit.json(); setHata(v.hata ?? 'Hata'); return; }
      onKaydet();
    } catch { setHata('Bağlantı hatası'); } finally { setYukleniyor(false); }
  }

  const seciliBankaHesap = bankaHesaplari.find((h) => h.id === bankaHesabiId);

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
        <div className="w-full max-w-md rounded-xl bg-white shadow-xl max-h-[90vh] flex flex-col">
          <div className="border-b px-5 py-4 shrink-0">
            <h3 className="text-base font-semibold text-gray-800">Toplu Ödeme Yap</h3>
            <p className="text-xs text-gray-500 mt-0.5">{seciliKayitlar.length} kayıt seçildi</p>
          </div>
          <div className="p-5 space-y-4 overflow-y-auto">

            {/* Seçili kayıtlar özeti */}
            <div className="rounded-lg bg-red-50 border border-red-100 divide-y divide-red-100 max-h-36 overflow-y-auto">
              {seciliKayitlar.map((k) => {
                const kalan = Number(k.tutar) - Number(k.odenenTutar);
                return (
                  <div key={k.id} className="flex justify-between items-center px-3 py-2">
                    <span className="text-xs text-red-800 font-medium truncate flex-1 mr-2">{k.aciklama}</span>
                    <span className="text-xs font-bold text-red-700 shrink-0">{paraFormat(kalan)}</span>
                  </div>
                );
              })}
            </div>

            {/* Hesaplanan toplam */}
            <div className="rounded-lg bg-red-50 border border-red-100 px-4 py-3 flex justify-between items-center">
              <div>
                <p className="text-xs font-medium text-red-600">Hesaplanan Toplam Borç</p>
                <p className="text-xs text-red-400">{seciliKayitlar.length} kayıt</p>
              </div>
              <p className="text-xl font-bold text-red-800">{paraFormat(toplamTutar)}</p>
            </div>

            {/* Gerçek ödeme tutarı */}
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Gerçek Ödeme Tutarı (₺) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                value={gercekTutar}
                onChange={(e) => setGercekTutar(e.target.value)}
                step={0.01}
                min={0.01}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
              />
              <p className="text-xs text-gray-400 mt-1">Gerçekte yaptığınız ödeme (küsürat farkı oluşabilir)</p>
            </div>

            {/* Fark göstergesi */}
            {(farkPozitif || farkNegatif) && (
              <div className={`rounded-lg px-4 py-2.5 border ${farkPozitif ? 'bg-amber-50 border-amber-200' : 'bg-purple-50 border-purple-200'}`}>
                <div className="flex justify-between items-center">
                  <span className={`text-xs font-medium ${farkPozitif ? 'text-amber-700' : 'text-purple-700'}`}>
                    {farkPozitif ? 'Az Ödeme (Fark Elimizde Kaldı)' : 'Fazla Ödeme (Fark)'}
                  </span>
                  <span className={`text-sm font-bold ${farkPozitif ? 'text-amber-800' : 'text-purple-800'}`}>
                    {farkPozitif ? '+' : '-'}{paraFormat(Math.abs(farkTutar))}
                  </span>
                </div>
                <p className={`text-xs mt-0.5 ${farkPozitif ? 'text-amber-600' : 'text-purple-600'}`}>
                  Otomatik olarak Fark Hesabı&apos;na yansıtılacak
                </p>
              </div>
            )}

            {/* Tam ödeme checkbox */}
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={tamOdeme}
                onChange={(e) => setTamOdeme(e.target.checked)}
                className="accent-green-600"
              />
              <span className="text-sm text-gray-700">Ödemeyi tam yapıldı olarak işaretle (kalanı sıfırla)</span>
            </label>

            {/* Ödeme yöntemi */}
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Ödeme Yöntemi</label>
              <select value={odemeYontemi} onChange={(e) => { setOdemeYontemi(e.target.value); setBankaHesabiId(''); }}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500">
                <option value="nakit">Nakit</option>
                <option value="banka">Banka</option>
                <option value="eft">EFT</option>
              </select>
            </div>

            {/* Banka seçimi */}
            {odemeYontemi === 'banka' && (
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">Hangi Hesaptan? <span className="text-red-500">*</span></label>
                {bankaHesaplari.length === 0 ? (
                  <p className="text-sm text-gray-400 italic">Tanımlı banka hesabı bulunamadı</p>
                ) : (
                  bankaHesaplari.map((h) => (
                    <label key={h.id} className={`flex items-center justify-between gap-3 rounded-lg border px-3 py-2.5 cursor-pointer transition-colors ${
                      bankaHesabiId === h.id ? 'border-green-500 bg-green-50' : 'border-gray-200 hover:border-gray-300'
                    } ${h.alarmDurumu ? 'border-red-300 bg-red-50' : ''}`}>
                      <div className="flex items-center gap-2">
                        <input type="radio" name="topluBankaHesabi" value={h.id} checked={bankaHesabiId === h.id}
                          onChange={() => setBankaHesabiId(h.id)} className="accent-green-600" />
                        <div>
                          <p className="text-sm font-medium text-gray-800">
                            {h.hesapAdi}
                            {h.alarmDurumu && <span className="ml-1.5 text-xs text-red-600 font-semibold">⚠️ Alarm</span>}
                            {h.kmhLimiti && <span className="ml-1 text-xs text-orange-600">(KMH)</span>}
                          </p>
                          {h.bankaAdi && <p className="text-xs text-gray-400">{h.bankaAdi}</p>}
                        </div>
                      </div>
                      <p className={`text-sm font-semibold ${Number(h.bakiye) <= 0 ? 'text-red-600' : 'text-green-700'}`}>
                        {paraFormat(Number(h.bakiye))}
                      </p>
                    </label>
                  ))
                )}
                {seciliBankaHesap && Number(seciliBankaHesap.bakiye) < gercekSayi && (
                  <div className="rounded-lg bg-amber-50 border border-amber-200 px-3 py-2">
                    <p className="text-xs font-medium text-amber-700">
                      ⚠️ Hesap bakiyesi ödeme miktarından düşük
                      {seciliBankaHesap.kmhLimiti ? ' — KMH devreye girecek' : ' — onay gerekecek'}
                    </p>
                  </div>
                )}
              </div>
            )}

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Ödeme Tarihi</label>
              <input type="date" value={odemeTarihi} onChange={(e) => setOdemeTarihi(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
            </div>

            {hata && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{hata}</p>}
          </div>
          <div className="border-t px-5 py-4 flex justify-end gap-3 shrink-0">
            <button onClick={onKapat} disabled={yukleniyor}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-60">
              İptal
            </button>
            <button onClick={() => handleKaydet(false)} disabled={yukleniyor}
              className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-60">
              {yukleniyor ? 'Kaydediliyor...' : `${seciliKayitlar.length} Kaydı Öde`}
            </button>
          </div>
        </div>
      </div>

      {kmhUyari && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-sm rounded-xl bg-white shadow-2xl">
            <div className="border-b border-red-100 bg-red-50 px-5 py-4 rounded-t-xl">
              <h3 className="text-base font-semibold text-red-800">⚠️ Hesap Bakiyesi Yetersiz</h3>
            </div>
            <div className="p-5 space-y-3">
              <div className="rounded-lg bg-amber-50 border border-amber-200 px-4 py-3 space-y-1">
                <div className="flex justify-between text-sm">
                  <span className="text-amber-700">Mevcut Bakiye</span>
                  <span className="font-semibold text-amber-800">{paraFormat(kmhUyari.bakiye)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-amber-700">Yapılacak Ödeme</span>
                  <span className="font-semibold text-amber-800">{paraFormat(gercekSayi)}</span>
                </div>
                <div className="flex justify-between text-sm border-t border-amber-200 pt-1">
                  <span className="text-red-700 font-medium">Eksik Tutar</span>
                  <span className="font-bold text-red-800">{paraFormat(gercekSayi - kmhUyari.bakiye)}</span>
                </div>
              </div>
              {kmhUyari.kmhLimiti ? (
                <p className="text-sm text-orange-700 bg-orange-50 border border-orange-200 rounded-lg px-4 py-3">
                  KMH devreye girecek — hesap eksi bakiyeye düşecek.
                </p>
              ) : (
                <p className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-4 py-3">
                  Yeterli bakiye yok ve KMH tanımlı değil. Devam ederseniz hesap alarm durumuna geçer.
                </p>
              )}
            </div>
            <div className="border-t px-5 py-4 flex gap-3">
              <button onClick={() => setKmhUyari(null)}
                className="flex-1 rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">
                İptal
              </button>
              <button onClick={() => { setKmhUyari(null); handleKaydet(true); }}
                className="flex-1 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700">
                Evet, Devam Et
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// =====================================================
// Alacaklar Sekmesi — Dönem bazlı accordion
// =====================================================

function AlacaklarSekmesi({
  donemler,
  yukleniyor,
  onGelirOdemeAl,
  onBudamaOdemeAl,
  onDesteklemeOdemeAl,
}: {
  donemler: DonemAlacak[];
  yukleniyor: boolean;
  onGelirOdemeAl: (gelirKaydiId: string, kalanTutar: number, toplamTutar: number, musteriAdi: string) => void;
  onBudamaOdemeAl: (budamaId: string, hasatDonemiId: string, ciftciAdi: string, kalanTutar: number) => void;
  onDesteklemeOdemeAl: (hasatDonemiId: string, donemAdi: string, kalanTutar: number) => void;
}) {
  const [acikDonemler, setAcikDonemler] = useState<Set<string>>(new Set());
  const [acikSurgunler, setAcikSurgunler] = useState<Set<string>>(new Set());
  const [acikMusteriler, setAcikMusteriler] = useState<Set<string>>(new Set());
  const [acikBudama, setAcikBudama] = useState<Set<string>>(new Set());

  if (yukleniyor) return <div className="flex items-center justify-center py-20 text-gray-400">Yükleniyor...</div>;
  if (donemler.length === 0) return <div className="flex items-center justify-center py-20 text-gray-400">Alacak kaydı bulunamadı.</div>;

  function toggle(set: Set<string>, setSet: (s: Set<string>) => void, key: string) {
    const yeni = new Set(set);
    if (yeni.has(key)) { yeni.delete(key) } else { yeni.add(key) }
    setSet(yeni);
  }

  const aktifDonemler = donemler.filter((d) => d.odemeDurumu !== 'odendi');

  return (
    <div className="space-y-3">
      {aktifDonemler.map((donem) => {
        const donemAcik = acikDonemler.has(donem.id);

        return (
          <div key={donem.id} className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
            {/* Dönem başlık */}
            <button
              onClick={() => toggle(acikDonemler, setAcikDonemler, donem.id)}
              className="w-full flex items-center justify-between px-5 py-4 hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <span className={`text-sm transition-transform inline-block ${donemAcik ? 'rotate-90' : ''}`}>▶</span>
                <div className="text-left">
                  <p className="text-sm font-bold text-gray-800">{donem.donemAdi}</p>
                  <p className="text-xs text-gray-400">{donem.yil} • {donem.durum === 'aktif' ? 'Aktif Dönem' : 'Kapalı Dönem'}</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <p className="text-xs text-gray-400">Toplam</p>
                  <p className="text-sm font-bold text-gray-800">{paraFormat(donem.toplamAlacak)}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-gray-400">Kalan</p>
                  <p className="text-sm font-bold text-red-600">{paraFormat(donem.kalanTutar)}</p>
                </div>
              </div>
            </button>

            {donemAcik && (
              <div className="border-t border-gray-100">

                {/* Budama bölümü */}
                {donem.budamaKalemleri.length > 0 && (
                  <div className="border-b border-gray-100">
                    <button
                      onClick={() => toggle(acikBudama, setAcikBudama, donem.id + '_budama')}
                      className="w-full flex items-center justify-between px-6 py-3 bg-amber-50/60 hover:bg-amber-50 transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        <span className={`text-xs transition-transform inline-block text-amber-600 ${acikBudama.has(donem.id + '_budama') ? 'rotate-90' : ''}`}>▶</span>
                        <span className="text-sm font-semibold text-amber-800">Budama Gelir Kaybı Ücreti</span>
                        <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">{donem.budamaKalemleri.length} çiftçi</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-xs text-amber-600">{paraFormat(donem.budamaToplamAlacak)} toplam</span>
                        {donem.budamaToplamKalan > 0.01 && (
                          <span className="text-xs font-bold text-red-600">{paraFormat(donem.budamaToplamKalan)} kalan</span>
                        )}
                      </div>
                    </button>

                    {acikBudama.has(donem.id + '_budama') && (
                      <div className="divide-y divide-amber-50">
                        {donem.budamaKalemleri.map((b) => (
                          <div key={b.id} className="px-8 py-3 flex items-center gap-4 bg-white hover:bg-amber-50/30">
                            <div className="flex-1">
                              <p className="text-sm font-medium text-gray-800">{b.ciftciAdi}</p>
                              <p className="text-xs text-gray-400">
                                {b.budananDonum.toFixed(2)} dönüm budandı — {b.budananM2.toLocaleString('tr-TR')} m²
                              </p>
                            </div>
                            <div className="text-right w-28 shrink-0">
                              <p className="text-sm font-semibold">{paraFormat(b.hesaplananTutar)}</p>
                              {b.odenenTutar > 0 && (
                                <p className="text-xs text-green-600">+{paraFormat(b.odenenTutar)} ödendi</p>
                              )}
                            </div>
                            <div className="w-24 shrink-0 text-right">
                              {b.odemeDurumu !== 'odendi' && (
                                <p className="text-sm font-bold text-red-600">{paraFormat(b.kalanTutar)}</p>
                              )}
                            </div>
                            <div className="w-32 shrink-0 flex flex-col items-end gap-1">
                              {odemeDurumuBadge(b.odemeDurumu)}
                              {b.odemeDurumu !== 'odendi' && (
                                <button
                                  onClick={() => onBudamaOdemeAl(b.id, b.hasatDonemiId, b.ciftciAdi, b.kalanTutar)}
                                  className="mt-1 rounded-lg bg-amber-600 px-3 py-1 text-xs font-medium text-white hover:bg-amber-700"
                                >
                                  Ödeme Al
                                </button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Sürgünler */}
                {donem.surgunler.map((surgun) => {
                  if (surgun.musteriler.length === 0) return null;
                  const surgunKey = surgun.id;
                  const surgunAcik = acikSurgunler.has(surgunKey);

                  return (
                    <div key={surgun.id} className="border-b border-gray-100 last:border-0">
                      <button
                        onClick={() => toggle(acikSurgunler, setAcikSurgunler, surgunKey)}
                        className="w-full flex items-center justify-between px-6 py-3 bg-green-50/50 hover:bg-green-50 transition-colors"
                      >
                        <div className="flex items-center gap-2">
                          <span className={`text-xs transition-transform inline-block text-green-700 ${surgunAcik ? 'rotate-90' : ''}`}>▶</span>
                          <span className="text-sm font-semibold text-green-900">{surgun.surgunAdi}</span>
                          <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">{surgun.surgunNo}. sürgün</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-xs text-green-700">{paraFormat(surgun.toplamAlacak)} toplam</span>
                          {surgun.kalanTutar > 0.01 && (
                            <span className="text-xs font-bold text-red-600">{paraFormat(surgun.kalanTutar)} kalan</span>
                          )}
                          {surgun.kalanTutar <= 0.01 && surgun.toplamAlacak > 0 && (
                            <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">Tümü Ödendi</span>
                          )}
                        </div>
                      </button>

                      {surgunAcik && (
                        <div className="divide-y divide-gray-50">
                          {surgun.musteriler.map((musteri) => {
                            const musteriKey = surgun.id + '_' + (musteri.musteriId ?? musteri.musteriAdi);
                            const musteriAcik = acikMusteriler.has(musteriKey);

                            return (
                              <div key={musteriKey} className="bg-gray-50/40">
                                <button
                                  onClick={() => toggle(acikMusteriler, setAcikMusteriler, musteriKey)}
                                  className="w-full flex items-center justify-between px-8 py-3 hover:bg-gray-100/60 transition-colors"
                                >
                                  <div className="flex items-center gap-2">
                                    <span className={`text-xs transition-transform inline-block text-gray-400 ${musteriAcik ? 'rotate-90' : ''}`}>▶</span>
                                    <span className="text-sm font-medium text-gray-800">{musteri.musteriAdi}</span>
                                    {musteri.fiyatTuru && (
                                      <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${musteri.fiyatTuru === 'devlet_fiyati' ? 'bg-blue-100 text-blue-700' : 'bg-amber-100 text-amber-700'}`}>
                                        {musteri.fiyatTuru === 'devlet_fiyati' ? 'Devlet' : 'Özel'}
                                      </span>
                                    )}
                                  </div>
                                  <div className="flex items-center gap-3">
                                    <span className="text-xs text-gray-500">{paraFormat(musteri.toplamTutar)} toplam</span>
                                    {musteri.kalanTutar > 0.01 && (
                                      <span className="text-xs font-semibold text-red-600">{paraFormat(musteri.kalanTutar)} kalan</span>
                                    )}
                                  </div>
                                </button>

                                {musteriAcik && (
                                  <div className="divide-y divide-gray-100">
                                    {musteri.aylar
                                      .sort((a, b) => ((a.yil ?? 0) * 100 + (a.ay ?? 0)) - ((b.yil ?? 0) * 100 + (b.ay ?? 0)))
                                      .map((kayit) => (
                                        <div key={kayit.id} className="px-10 py-3 flex items-center gap-4 bg-white hover:bg-green-50/30 transition-colors">
                                          <div className="w-20 shrink-0">
                                            <p className="text-sm font-medium text-gray-800">{kayit.ay ? AY_UZUN[kayit.ay] : '—'}</p>
                                            <p className="text-xs text-gray-400">{kayit.yil}</p>
                                          </div>
                                          <div className="flex-1">
                                            <div className="flex items-baseline gap-1.5">
                                              <span className="text-sm text-gray-700 font-medium">{Number(kayit.toplamKg).toLocaleString('tr-TR')} kg</span>
                                              <span className="text-xs text-gray-400">×</span>
                                              <span className="text-xs text-gray-500">₺{Number(kayit.birimFiyat).toFixed(4)}/kg</span>
                                            </div>
                                          </div>
                                          <div className="text-right w-28 shrink-0">
                                            <p className="text-sm font-semibold text-gray-800">{paraFormat(Number(kayit.toplamTutar))}</p>
                                            {Number(kayit.odenenTutar) > 0 && (
                                              <p className="text-xs text-green-600">+{paraFormat(Number(kayit.odenenTutar))} ödendi</p>
                                            )}
                                          </div>
                                          <div className="w-24 shrink-0 text-right">
                                            {kayit.odemeDurumu !== 'odendi' && (
                                              <p className="text-sm font-bold text-red-600">{paraFormat(Number(kayit.kalanTutar))}</p>
                                            )}
                                          </div>
                                          <div className="w-32 shrink-0 flex flex-col items-end gap-1">
                                            {odemeDurumuBadge(kayit.odemeDurumu)}
                                            {kayit.odemeDurumu !== 'odendi' && (
                                              <button
                                                onClick={() => onGelirOdemeAl(kayit.id, kayit.kalanTutar, kayit.toplamTutar, musteri.musteriAdi)}
                                                className="mt-1 rounded-lg bg-green-600 px-3 py-1 text-xs font-medium text-white hover:bg-green-700"
                                              >
                                                Ödeme Al
                                              </button>
                                            )}
                                          </div>
                                        </div>
                                      ))}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}

                {/* Destekleme ücreti */}
                {donem.destekleme && (
                  <div className="px-6 py-3 flex items-center justify-between bg-blue-50/50 border-t border-gray-100">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-blue-800">Destekleme Ücreti</span>
                      <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">Devlet</span>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="text-xs text-blue-600">{paraFormat(donem.destekleme.alacakTutar)} toplam</span>
                      {donem.destekleme.odenenTutar > 0 && (
                        <span className="text-xs text-green-600">+{paraFormat(donem.destekleme.odenenTutar)} ödendi</span>
                      )}
                      {donem.destekleme.kalanTutar > 0.01 && (
                        <span className="text-sm font-bold text-red-600">{paraFormat(donem.destekleme.kalanTutar)}</span>
                      )}
                      {odemeDurumuBadge(donem.destekleme.odemeDurumu)}
                      {donem.destekleme.odemeDurumu !== 'odendi' && (
                        <button
                          onClick={() => onDesteklemeOdemeAl(donem.id, donem.donemAdi, donem.destekleme!.kalanTutar)}
                          className="rounded-lg bg-blue-600 px-3 py-1 text-xs font-medium text-white hover:bg-blue-700"
                        >
                          Ödeme Al
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// =====================================================
// Ana sayfa
// =====================================================

type SekmeAdi = 'dashboard' | 'alacaklar' | 'borclar' | 'odenenler';

export default function FinansSayfasi() {
  const [aktifSekme, setAktifSekme] = useState<SekmeAdi>('dashboard');
  const [ozet, setOzet] = useState<FinansOzet | null>(null);
  const [donemAlacaklar, setDonemAlacaklar] = useState<DonemAlacak[]>([]);
  const [odemeKayitlari, setOdemeKayitlari] = useState<OdemeKaydi[]>([]);
  const [yukleniyor, setYukleniyor] = useState(true);

  // Ödeme modal state'leri
  const [secilenGelirOdeme, setSecilenGelirOdeme] = useState<{ id: string; kalanTutar: number; toplamTutar: number; musteriAdi: string } | null>(null);
  const [secilenBudamaOdeme, setSecilenBudamaOdeme] = useState<{ budamaId: string; hasatDonemiId: string; ciftciAdi: string; kalanTutar: number } | null>(null);
  const [secilenDesteklemeOdeme, setSecilenDesteklemeOdeme] = useState<{ hasatDonemiId: string; donemAdi: string; kalanTutar: number } | null>(null);
  const [secilenBorcOdeme, setSecilenBorcOdeme] = useState<OdemeKaydi | null>(null);
  const [borcFormuAcik, setBorcFormuAcik] = useState(false);

  // Borçlar çoklu seçim
  const [seciliBorcIds, setSeciliBorcIds] = useState<Set<string>>(new Set());
  const [topluOdemeAcik, setTopluOdemeAcik] = useState(false);

  // Ödenenler filtreler
  const [odenenlerDonemFiltre, setOdenenlerDonemFiltre] = useState<string>('');
  const [odenenlerKategoriFiltre, setOdenenlerKategoriFiltre] = useState<string>('');
  const [odenenlerBaslangic, setOdenenlerBaslangic] = useState<string>('');
  const [odenenlerBitis, setOdenenlerBitis] = useState<string>('');

  const ozetGetir = useCallback(async () => {
    try {
      const yanit = await fetch('/api/finans/ozet');
      if (yanit.ok) setOzet(await yanit.json());
    } catch { /* sessiz */ }
  }, []);

  const alacaklarGetir = useCallback(async () => {
    try {
      const yanit = await fetch('/api/finans/alacaklar');
      if (yanit.ok) setDonemAlacaklar(await yanit.json());
    } catch { /* sessiz */ }
  }, []);

  const odemeKayitlariGetir = useCallback(async () => {
    try {
      const yanit = await fetch('/api/odeme-kayitlari');
      if (yanit.ok) setOdemeKayitlari(await yanit.json());
    } catch { /* sessiz */ }
  }, []);

  const hepsiniYenile = useCallback(async () => {
    setYukleniyor(true);
    await Promise.all([ozetGetir(), alacaklarGetir(), odemeKayitlariGetir()]);
    setYukleniyor(false);
  }, [ozetGetir, alacaklarGetir, odemeKayitlariGetir]);

  useEffect(() => { hepsiniYenile(); }, [hepsiniYenile]);

  const sekmeler: { id: SekmeAdi; etiket: string }[] = [
    { id: 'dashboard', etiket: 'Genel Bakış' },
    { id: 'alacaklar', etiket: 'Alacaklar' },
    { id: 'borclar', etiket: 'Borçlar' },
    { id: 'odenenler', etiket: 'Ödenenler' },
  ];

  // Borçlar: sadece ödenmemiş
  const aktifBorclar = odemeKayitlari.filter((k) => k.odemeDurumu !== 'odendi');
  // Ödenenler
  const odenmisOdemeler = odemeKayitlari.filter((k) => k.odemeDurumu === 'odendi');

  // Çoklu seçim hesapları
  const seciliBorclar = aktifBorclar.filter((k) => seciliBorcIds.has(k.id));
  const seciliToplamTutar = seciliBorclar.reduce((s, k) => s + (Number(k.tutar) - Number(k.odenenTutar)), 0);

  function borcSecToggle(id: string) {
    setSeciliBorcIds((prev) => {
      const yeni = new Set(prev);
      if (yeni.has(id)) { yeni.delete(id) } else { yeni.add(id) }
      return yeni;
    });
  }

  function tumunuSec() {
    if (seciliBorcIds.size === aktifBorclar.length) {
      setSeciliBorcIds(new Set());
    } else {
      setSeciliBorcIds(new Set(aktifBorclar.map((k) => k.id)));
    }
  }

  // Ödenenler filtresi
  const filtreliOdenenler = odenmisOdemeler.filter((k) => {
    if (odenenlerKategoriFiltre && k.kategori !== odenenlerKategoriFiltre) return false;
    if (odenenlerBaslangic && k.odemeTarihi && k.odemeTarihi < odenenlerBaslangic) return false;
    if (odenenlerBitis && k.odemeTarihi && k.odemeTarihi > odenenlerBitis) return false;
    return true;
  });

  // Alacaklar: tüm dönemler (ödendi dahil) - ödenenler için
  const odenmisDonemler = donemAlacaklar.filter((d) => d.odemeDurumu === 'odendi');
  const filtreliOdenmisDonemler = odenmisDonemler.filter((d) => {
    if (odenenlerDonemFiltre && d.id !== odenenlerDonemFiltre) return false;
    return true;
  });

  return (
    <div className="min-h-full bg-gray-50">
      {/* Başlık */}
      <div className="px-4 pt-4 pb-2">
        <h1 className="text-lg font-bold text-gray-800">Finans ve Ödemeler</h1>
        <p className="text-xs text-gray-500">Gelir alacakları ve gider borçları</p>
      </div>

      {/* Sticky sekme navigasyonu — mobilde yatay scroll */}
      <div className="sticky top-0 z-10 bg-white border-b border-gray-200 shadow-sm">
        <div className="overflow-x-auto">
          <div className="flex min-w-max px-3 py-2 gap-1">
            {sekmeler.map((sekme) => (
              <button
                key={sekme.id}
                onClick={() => setAktifSekme(sekme.id)}
                className={`whitespace-nowrap rounded-lg px-4 py-2 text-sm font-medium transition-colors active:scale-95 ${
                  aktifSekme === sekme.id
                    ? 'bg-green-600 text-white shadow-sm'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {sekme.etiket}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="px-4 py-4 space-y-4">

      {/* Genel Bakış */}
      {aktifSekme === 'dashboard' && (
        <div className="space-y-4">
          {yukleniyor ? (
            <div className="flex items-center justify-center py-20 text-gray-400">Yükleniyor...</div>
          ) : ozet ? (
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-2xl border border-gray-100 bg-white shadow-sm p-4">
                <p className="text-xs font-medium text-green-600">Toplam Alacak</p>
                <p className="mt-1 text-lg font-bold text-green-700">{paraFormat(ozet.toplamAlacak)}</p>
                <p className="mt-1 text-xs text-green-500">Tahsil edilmemiş</p>
              </div>
              <div className="rounded-2xl border border-gray-100 bg-white shadow-sm p-4">
                <p className="text-xs font-medium text-red-600">Toplam Borç</p>
                <p className="mt-1 text-lg font-bold text-red-700">{paraFormat(ozet.toplamBorc)}</p>
                <p className="mt-1 text-xs text-red-500">Ödenmemiş borçlar</p>
              </div>
              <div className="rounded-2xl border border-gray-100 bg-white shadow-sm p-4">
                <p className={`text-xs font-medium ${ozet.netDurum >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>Net Durum</p>
                <p className={`mt-1 text-lg font-bold ${ozet.netDurum >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
                  {ozet.netDurum >= 0 ? '+' : ''}{paraFormat(ozet.netDurum)}
                </p>
              </div>
              <div className="rounded-2xl border border-gray-100 bg-white shadow-sm p-4">
                <p className="text-xs font-medium text-yellow-600">Ödeme Bekleyen</p>
                <p className="mt-1 text-lg font-bold text-yellow-700">{paraFormat(ozet.odenmeBekleniyor)}</p>
              </div>
            </div>
          ) : null}
        </div>
      )}

      {/* Alacaklar */}
      {aktifSekme === 'alacaklar' && (
        <AlacaklarSekmesi
          donemler={donemAlacaklar}
          yukleniyor={yukleniyor}
          onGelirOdemeAl={(id, kalanTutar, toplamTutar, musteriAdi) =>
            setSecilenGelirOdeme({ id, kalanTutar, toplamTutar, musteriAdi })
          }
          onBudamaOdemeAl={(budamaId, hasatDonemiId, ciftciAdi, kalanTutar) =>
            setSecilenBudamaOdeme({ budamaId, hasatDonemiId, ciftciAdi, kalanTutar })
          }
          onDesteklemeOdemeAl={(hasatDonemiId, donemAdi, kalanTutar) =>
            setSecilenDesteklemeOdeme({ hasatDonemiId, donemAdi, kalanTutar })
          }
        />
      )}

      {/* Borçlar */}
      {aktifSekme === 'borclar' && (
        <div className="space-y-4">
          {/* Üst aksiyon bar */}
          <div className="flex items-center justify-between flex-wrap gap-2">
            {seciliBorcIds.size > 0 ? (
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm font-medium text-gray-700">{seciliBorcIds.size} seçildi</span>
                <span className="text-sm font-bold text-red-600">{paraFormat(seciliToplamTutar)}</span>
                <button
                  onClick={() => setTopluOdemeAcik(true)}
                  className="rounded-lg bg-red-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-red-700 active:scale-95 transition-transform"
                >
                  Toplu Öde
                </button>
                <button
                  onClick={() => setSeciliBorcIds(new Set())}
                  className="text-sm text-gray-500 hover:text-gray-700 active:scale-95 transition-transform"
                >
                  Temizle
                </button>
              </div>
            ) : (
              <div />
            )}
            <button
              onClick={() => setBorcFormuAcik(true)}
              className="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 active:scale-95 transition-transform"
            >
              + Yeni Borç
            </button>
          </div>

          {/* Masaüstü tablo */}
          <div className="hidden md:block rounded-xl border border-gray-200 bg-white">
            <div className="border-b border-gray-100 px-4 py-3">
              <h3 className="text-sm font-semibold text-gray-700">
                Bekleyen Borçlar
                <span className="ml-2 text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full font-medium">
                  {aktifBorclar.length} kayıt
                </span>
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    <th className="px-4 py-2 w-10">
                      <input
                        type="checkbox"
                        checked={aktifBorclar.length > 0 && seciliBorcIds.size === aktifBorclar.length}
                        onChange={tumunuSec}
                        className="accent-red-600"
                      />
                    </th>
                    <th className="px-4 py-2">Kategori</th>
                    <th className="px-4 py-2">Açıklama</th>
                    <th className="px-4 py-2">Tutar</th>
                    <th className="px-4 py-2">Ödenen</th>
                    <th className="px-4 py-2">Kalan</th>
                    <th className="px-4 py-2">Durum</th>
                    <th className="px-4 py-2"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {yukleniyor ? (
                    <tr><td colSpan={8} className="px-4 py-8 text-center text-gray-400">Yükleniyor...</td></tr>
                  ) : aktifBorclar.length === 0 ? (
                    <tr><td colSpan={8} className="px-4 py-8 text-center text-gray-400">Bekleyen borç kaydı bulunamadı</td></tr>
                  ) : (
                    aktifBorclar.map((kayit) => {
                      const kalan = Number(kayit.tutar) - Number(kayit.odenenTutar);
                      const secili = seciliBorcIds.has(kayit.id);
                      return (
                        <tr key={kayit.id} className={`hover:bg-gray-50 ${secili ? 'bg-red-50' : ''}`}>
                          <td className="px-4 py-2.5">
                            <input type="checkbox" checked={secili} onChange={() => borcSecToggle(kayit.id)} className="accent-red-600" />
                          </td>
                          <td className="px-4 py-2.5">{kategoriBadge(kayit.kategori)}</td>
                          <td className="px-4 py-2.5 font-medium text-gray-800">{kayit.aciklama}</td>
                          <td className="px-4 py-2.5 text-gray-600">{paraFormat(Number(kayit.tutar))}</td>
                          <td className="px-4 py-2.5 text-green-600">{paraFormat(Number(kayit.odenenTutar))}</td>
                          <td className="px-4 py-2.5 font-medium text-red-600">{paraFormat(kalan)}</td>
                          <td className="px-4 py-2.5">{odemeDurumuBadge(kayit.odemeDurumu)}</td>
                          <td className="px-4 py-2.5">
                            <button
                              onClick={() => setSecilenBorcOdeme(kayit)}
                              className="rounded-lg bg-red-600 px-3 py-1 text-xs font-medium text-white hover:bg-red-700 active:scale-95 transition-transform"
                            >
                              Ödeme Yap
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Mobil kart listesi */}
          <div className="md:hidden">
            {aktifBorclar.length > 0 && (
              <div className="flex items-center gap-2 px-1 pb-2">
                <input
                  type="checkbox"
                  checked={aktifBorclar.length > 0 && seciliBorcIds.size === aktifBorclar.length}
                  onChange={tumunuSec}
                  className="accent-red-600"
                />
                <span className="text-xs text-gray-500">Tümünü Seç</span>
                <span className="ml-auto text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full font-medium">
                  {aktifBorclar.length} kayıt
                </span>
              </div>
            )}
            {yukleniyor ? (
              <div className="flex items-center justify-center py-12 text-gray-400 text-sm">Yükleniyor...</div>
            ) : aktifBorclar.length === 0 ? (
              <div className="flex items-center justify-center py-12 text-gray-400 text-sm">Bekleyen borç kaydı bulunamadı</div>
            ) : (
              <div className="space-y-3">
                {aktifBorclar.map((kayit) => {
                  const kalan = Number(kayit.tutar) - Number(kayit.odenenTutar);
                  const secili = seciliBorcIds.has(kayit.id);
                  return (
                    <div
                      key={kayit.id}
                      className={`rounded-2xl bg-white border shadow-sm overflow-hidden ${secili ? 'border-red-300' : 'border-gray-100'}`}
                    >
                      <div className="px-4 pt-4 pb-3">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2 min-w-0">
                            <input
                              type="checkbox"
                              checked={secili}
                              onChange={() => borcSecToggle(kayit.id)}
                              className="accent-red-600 shrink-0 mt-0.5"
                            />
                            <div className="min-w-0">
                              <p className="text-sm font-semibold text-gray-800 truncate">{kayit.aciklama}</p>
                              <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                                {kategoriBadge(kayit.kategori)}
                                {odemeDurumuBadge(kayit.odemeDurumu)}
                              </div>
                            </div>
                          </div>
                          <div className="text-right shrink-0">
                            <p className="text-xs text-gray-400">Kalan</p>
                            <p className="text-base font-bold text-red-600">{paraFormat(kalan)}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4 mt-3 text-xs text-gray-500">
                          <span>Toplam: <span className="font-medium text-gray-700">{paraFormat(Number(kayit.tutar))}</span></span>
                          <span>Ödenen: <span className="font-medium text-green-600">{paraFormat(Number(kayit.odenenTutar))}</span></span>
                        </div>
                      </div>
                      <div className="border-t border-gray-100 flex divide-x divide-gray-100">
                        <button
                          onClick={() => setSecilenBorcOdeme(kayit)}
                          className="flex-1 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50 active:scale-95 transition-transform"
                        >
                          Ödeme Yap
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Ödenenler */}
      {aktifSekme === 'odenenler' && (
        <div className="space-y-4">
          {/* Kompakt filtre bar */}
          <div className="rounded-xl border border-gray-200 bg-white p-3 space-y-2">
            <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Filtreler</p>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Hasat Dönemi</label>
                <select
                  value={odenenlerDonemFiltre}
                  onChange={(e) => setOdenenlerDonemFiltre(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  <option value="">Tümü</option>
                  {donemAlacaklar.map((d) => (
                    <option key={d.id} value={d.id}>{d.donemAdi} ({d.yil})</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Kategori</label>
                <select
                  value={odenenlerKategoriFiltre}
                  onChange={(e) => setOdenenlerKategoriFiltre(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  <option value="">Tümü</option>
                  <option value="iscilik">İşçilik</option>
                  <option value="yemek">Yemek</option>
                  <option value="malzeme">Malzeme</option>
                  <option value="yakit">Yakıt</option>
                  <option value="gubre">Gübre</option>
                  <option value="diger">Diğer</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Başlangıç</label>
                <input
                  type="date"
                  value={odenenlerBaslangic}
                  onChange={(e) => setOdenenlerBaslangic(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Bitiş</label>
                <input
                  type="date"
                  value={odenenlerBitis}
                  onChange={(e) => setOdenenlerBitis(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
            </div>
          </div>

          {/* Ödenmiş alacak dönemleri */}
          {filtreliOdenmisDonemler.length > 0 && (
            <div>
              <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Alacak Dönemleri — Tümü Ödendi</h4>
              <div className="space-y-2">
                {filtreliOdenmisDonemler.map((donem) => (
                  <div key={donem.id} className="rounded-2xl border border-gray-100 bg-white shadow-sm p-4 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold text-green-800">{donem.donemAdi}</p>
                      <p className="text-xs text-green-600">{donem.yil} • Tüm alacaklar tahsil edildi</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-green-700">{paraFormat(donem.toplamAlacak)}</p>
                      <span className="text-xs bg-green-200 text-green-800 px-2 py-0.5 rounded-full">Tümü Ödendi</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Ödenmiş borçlar */}
          <div>
            {filtreliOdenmisDonemler.length > 0 && (
              <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Ödenmiş Borç Kayıtları</h4>
            )}

            {/* Masaüstü tablo */}
            <div className="hidden md:block rounded-xl border border-gray-200 bg-white">
              <div className="border-b border-gray-100 px-4 py-3 flex items-center justify-between">
                <h3 className="text-sm font-semibold text-gray-700">Ödenmiş Borçlar</h3>
                <span className="text-xs bg-green-50 text-green-700 px-2 py-0.5 rounded-full font-medium">
                  {filtreliOdenenler.length} kayıt
                </span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100 bg-gray-50 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                      <th className="px-4 py-2">Kategori</th>
                      <th className="px-4 py-2">Açıklama</th>
                      <th className="px-4 py-2">Tutar</th>
                      <th className="px-4 py-2">Ödenen</th>
                      <th className="px-4 py-2">Ödeme Tarihi</th>
                      <th className="px-4 py-2">Durum</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {yukleniyor ? (
                      <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-400">Yükleniyor...</td></tr>
                    ) : filtreliOdenenler.length === 0 ? (
                      <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-400">Henüz ödenmiş borç kaydı yok</td></tr>
                    ) : (
                      filtreliOdenenler.map((kayit) => (
                        <tr key={kayit.id} className="hover:bg-green-50/30">
                          <td className="px-4 py-2.5">{kategoriBadge(kayit.kategori)}</td>
                          <td className="px-4 py-2.5 font-medium text-gray-800">{kayit.aciklama}</td>
                          <td className="px-4 py-2.5 text-gray-600">{paraFormat(Number(kayit.tutar))}</td>
                          <td className="px-4 py-2.5 text-green-600 font-medium">{paraFormat(Number(kayit.odenenTutar))}</td>
                          <td className="px-4 py-2.5 text-gray-400 text-xs">
                            {kayit.odemeTarihi ? new Date(kayit.odemeTarihi).toLocaleDateString('tr-TR') : '—'}
                          </td>
                          <td className="px-4 py-2.5">{odemeDurumuBadge(kayit.odemeDurumu)}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Mobil kart listesi */}
            <div className="md:hidden">
              <div className="flex items-center justify-between px-1 pb-2">
                <p className="text-sm font-semibold text-gray-700">Ödenmiş Borçlar</p>
                <span className="text-xs bg-green-50 text-green-700 px-2 py-0.5 rounded-full font-medium">
                  {filtreliOdenenler.length} kayıt
                </span>
              </div>
              {yukleniyor ? (
                <div className="flex items-center justify-center py-12 text-gray-400 text-sm">Yükleniyor...</div>
              ) : filtreliOdenenler.length === 0 ? (
                <div className="flex items-center justify-center py-12 text-gray-400 text-sm">Henüz ödenmiş borç kaydı yok</div>
              ) : (
                <div className="space-y-3">
                  {filtreliOdenenler.map((kayit) => (
                    <div key={kayit.id} className="rounded-2xl bg-white border border-gray-100 shadow-sm px-4 py-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-gray-800 truncate">{kayit.aciklama}</p>
                          <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                            {kategoriBadge(kayit.kategori)}
                            {odemeDurumuBadge(kayit.odemeDurumu)}
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="text-xs text-gray-400">Ödenen</p>
                          <p className="text-base font-bold text-green-600">{paraFormat(Number(kayit.odenenTutar))}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                        <span>Tutar: <span className="font-medium text-gray-700">{paraFormat(Number(kayit.tutar))}</span></span>
                        <span>Tarih: <span className="font-medium text-gray-600">{kayit.odemeTarihi ? new Date(kayit.odemeTarihi).toLocaleDateString('tr-TR') : '—'}</span></span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      </div>{/* /px-4 py-4 */}

      {/* Modaller */}
      {secilenGelirOdeme && (
        <OdemeModal
          tip="gelir"
          kayitId={secilenGelirOdeme.id}
          kalanTutar={secilenGelirOdeme.kalanTutar}
          toplamTutar={secilenGelirOdeme.toplamTutar}
          musteriAdi={secilenGelirOdeme.musteriAdi}
          onKaydet={() => { setSecilenGelirOdeme(null); hepsiniYenile(); }}
          onKapat={() => setSecilenGelirOdeme(null)}
        />
      )}

      {secilenBudamaOdeme && (
        <BudamaOdemeModal
          budamaId={secilenBudamaOdeme.budamaId}
          hasatDonemiId={secilenBudamaOdeme.hasatDonemiId}
          ciftciAdi={secilenBudamaOdeme.ciftciAdi}
          kalanTutar={secilenBudamaOdeme.kalanTutar}
          onKaydet={() => { setSecilenBudamaOdeme(null); hepsiniYenile(); }}
          onKapat={() => setSecilenBudamaOdeme(null)}
        />
      )}

      {secilenDesteklemeOdeme && (
        <DesteklemeOdemeModal
          hasatDonemiId={secilenDesteklemeOdeme.hasatDonemiId}
          donemAdi={secilenDesteklemeOdeme.donemAdi}
          kalanTutar={secilenDesteklemeOdeme.kalanTutar}
          onKaydet={() => { setSecilenDesteklemeOdeme(null); hepsiniYenile(); }}
          onKapat={() => setSecilenDesteklemeOdeme(null)}
        />
      )}

      {secilenBorcOdeme && (
        <OdemeModal
          tip="borc"
          kayitId={secilenBorcOdeme.id}
          kalanTutar={Number(secilenBorcOdeme.tutar) - Number(secilenBorcOdeme.odenenTutar)}
          onKaydet={() => { setSecilenBorcOdeme(null); hepsiniYenile(); }}
          onKapat={() => setSecilenBorcOdeme(null)}
        />
      )}

      {topluOdemeAcik && seciliBorclar.length > 0 && (
        <TopluOdemeModal
          seciliKayitlar={seciliBorclar}
          toplamTutar={seciliToplamTutar}
          onKaydet={() => { setTopluOdemeAcik(false); setSeciliBorcIds(new Set()); hepsiniYenile(); }}
          onKapat={() => setTopluOdemeAcik(false)}
        />
      )}

      {borcFormuAcik && (
        <ManuelBorcFormu
          onKaydet={() => { setBorcFormuAcik(false); hepsiniYenile(); }}
          onKapat={() => setBorcFormuAcik(false)}
        />
      )}
    </div>
  );
}
