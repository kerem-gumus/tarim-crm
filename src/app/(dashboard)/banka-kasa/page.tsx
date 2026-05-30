'use client';

import { useCallback, useEffect, useState } from 'react';

// =====================================================
// Tipler
// =====================================================

interface BankaHesabi {
  id: string;
  hesapAdi: string;
  bankaAdi: string | null;
  hesapNo: string | null;
  iban: string | null;
  tur: 'banka' | 'kasa' | 'fark_hesabi';
  bakiye: number;
  kmhLimiti: boolean;
  alarmDurumu: boolean;
  aktif: boolean;
}

// =====================================================
// Yardımcılar
// =====================================================

function paraFormat(sayi: number) {
  return sayi.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' ₺';
}

function turRenk(tur: string) {
  if (tur === 'kasa') return { bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-700', badge: 'bg-amber-100 text-amber-800' };
  if (tur === 'fark_hesabi') return { bg: 'bg-purple-50', border: 'border-purple-200', text: 'text-purple-700', badge: 'bg-purple-100 text-purple-800' };
  return { bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-700', badge: 'bg-blue-100 text-blue-800' };
}

function turEtiket(tur: string) {
  if (tur === 'kasa') return 'Kasa';
  if (tur === 'fark_hesabi') return 'Fark Hesabı';
  return 'Banka';
}

// =====================================================
// Fark Hesabı Sıfırlama Modalı
// =====================================================

function FarkHesabiSifirlaFormu({
  hesap,
  onKaydet,
  onKapat,
}: {
  hesap: BankaHesabi;
  onKaydet: () => void;
  onKapat: () => void;
}) {
  const [tarih, setTarih] = useState(new Date().toISOString().split('T')[0]);
  const [notlar, setNotlar] = useState('');
  const [kaydediliyor, setKaydediliyor] = useState(false);
  const [hata, setHata] = useState('');

  async function kaydet() {
    setKaydediliyor(true); setHata('');
    try {
      const yanit = await fetch(`/api/banka-hesaplari/${hesap.id}/sifirla`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tarih, notlar: notlar.trim() || undefined }),
      });
      if (!yanit.ok) { const v = await yanit.json(); setHata(v.hata ?? 'Hata'); return; }
      onKaydet();
    } catch { setHata('Bağlantı hatası'); } finally { setKaydediliyor(false); }
  }

  const bakiye = Number(hesap.bakiye);
  const isaret = bakiye > 0 ? '+' : '';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-sm rounded-xl bg-white p-6 shadow-xl space-y-4">
        <div>
          <h3 className="text-base font-semibold text-gray-800">Fark Hesabı Sıfırla</h3>
          <p className="text-xs text-gray-500 mt-1">{hesap.hesapAdi}</p>
        </div>

        <div className="rounded-lg border border-purple-200 bg-purple-50 px-4 py-3">
          <p className="text-xs text-purple-600 font-medium">Mevcut Bakiye</p>
          <p className={`text-xl font-bold mt-0.5 ${bakiye >= 0 ? 'text-gray-800' : 'text-red-600'}`}>
            {isaret}{paraFormat(bakiye)}
          </p>
          <p className="text-xs text-purple-500 mt-1">
            {bakiye > 0
              ? 'Sıfırlama kaydı: çıkış hareketi oluşturulacak'
              : 'Sıfırlama kaydı: giriş hareketi oluşturulacak'}
          </p>
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Sıfırlama Tarihi</label>
          <input
            type="date"
            value={tarih}
            onChange={(e) => setTarih(e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Not (opsiyonel)</label>
          <input
            type="text"
            value={notlar}
            onChange={(e) => setNotlar(e.target.value)}
            placeholder="Yıl sonu kapanışı, Mayıs ayı sıfırlama..."
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
        </div>

        {hata && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{hata}</p>}

        <div className="flex gap-3 pt-1">
          <button onClick={onKapat} className="flex-1 rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">İptal</button>
          <button
            onClick={kaydet}
            disabled={kaydediliyor}
            className="flex-1 rounded-lg bg-purple-600 px-4 py-2 text-sm font-medium text-white hover:bg-purple-700 disabled:opacity-50"
          >
            {kaydediliyor ? 'Sıfırlanıyor...' : 'Sıfırla'}
          </button>
        </div>
      </div>
    </div>
  );
}

// =====================================================
// Hesap Formu Modalı
// =====================================================

function HesapFormu({
  mevcut,
  onKaydet,
  onKapat,
}: {
  mevcut?: BankaHesabi;
  onKaydet: () => void;
  onKapat: () => void;
}) {
  const [form, setForm] = useState({
    hesapAdi: mevcut?.hesapAdi ?? '',
    bankaAdi: mevcut?.bankaAdi ?? '',
    hesapNo: mevcut?.hesapNo ?? '',
    iban: mevcut?.iban ?? '',
    tur: mevcut?.tur ?? 'banka',
    kmhLimiti: mevcut?.kmhLimiti ?? false,
    alarmDurumu: mevcut?.alarmDurumu ?? false,
  });
  const [kaydediliyor, setKaydediliyor] = useState(false);
  const [hata, setHata] = useState('');

  async function kaydet() {
    if (!form.hesapAdi.trim()) { setHata('Hesap adı zorunludur'); return; }
    setKaydediliyor(true); setHata('');
    try {
      const url = mevcut ? `/api/banka-hesaplari/${mevcut.id}` : '/api/banka-hesaplari';
      const method = mevcut ? 'PUT' : 'POST';
      const yanit = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (!yanit.ok) { const v = await yanit.json(); setHata(v.hata ?? 'Hata'); return; }
      onKaydet();
    } catch { setHata('Bağlantı hatası'); } finally { setKaydediliyor(false); }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-sm rounded-xl bg-white p-6 shadow-xl space-y-4">
        <h3 className="text-base font-semibold text-gray-800">{mevcut ? 'Hesap Düzenle' : 'Yeni Hesap Ekle'}</h3>

        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Hesap Adı *</label>
          <input
            value={form.hesapAdi}
            onChange={(e) => setForm((p) => ({ ...p, hesapAdi: e.target.value }))}
            placeholder="Ziraat Ana Hesap, Kasa, vb."
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Hesap Türü</label>
          <select
            value={form.tur}
            onChange={(e) => setForm((p) => ({ ...p, tur: e.target.value as BankaHesabi['tur'] }))}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="banka">Banka Hesabı</option>
            <option value="kasa">Kasa</option>
            <option value="fark_hesabi">Fark Hesabı (Otomatik — ödeme farklarını tutar)</option>
          </select>
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Banka Adı</label>
          <input
            value={form.bankaAdi}
            onChange={(e) => setForm((p) => ({ ...p, bankaAdi: e.target.value }))}
            placeholder="Ziraat Bankası, Halkbank..."
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Hesap No</label>
            <input
              value={form.hesapNo}
              onChange={(e) => setForm((p) => ({ ...p, hesapNo: e.target.value }))}
              placeholder="12345678"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">IBAN</label>
            <input
              value={form.iban}
              onChange={(e) => setForm((p) => ({ ...p, iban: e.target.value }))}
              placeholder="TR..."
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* KMH Limiti */}
        <div className="rounded-lg border border-gray-200 px-3 py-3 space-y-2">
          <label className="flex items-center justify-between gap-3 cursor-pointer">
            <div>
              <p className="text-sm font-medium text-gray-700">KMH Limiti</p>
              <p className="text-xs text-gray-400">Kredili Mevduat Hesabı — bakiye eksiye düşebilir, faiz işler</p>
            </div>
            <div
              onClick={() => setForm((p) => ({ ...p, kmhLimiti: !p.kmhLimiti }))}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer ${form.kmhLimiti ? 'bg-orange-500' : 'bg-gray-300'}`}
            >
              <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${form.kmhLimiti ? 'translate-x-6' : 'translate-x-1'}`} />
            </div>
          </label>

          {/* Alarm sıfırlama — sadece düzenleme modunda ve alarm açıksa */}
          {mevcut && form.alarmDurumu && (
            <div className="border-t border-red-100 pt-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={!form.alarmDurumu}
                  onChange={(e) => setForm((p) => ({ ...p, alarmDurumu: !e.target.checked }))}
                  className="accent-red-600"
                />
                <span className="text-xs text-red-700 font-medium">⚠️ Alarm durumunu sıfırla (hesap normale döndü)</span>
              </label>
            </div>
          )}
        </div>

        {hata && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{hata}</p>}

        <div className="flex gap-3 pt-1">
          <button onClick={onKapat} className="flex-1 rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">İptal</button>
          <button onClick={kaydet} disabled={kaydediliyor} className="flex-1 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50">
            {kaydediliyor ? 'Kaydediliyor...' : 'Kaydet'}
          </button>
        </div>
      </div>
    </div>
  );
}

// =====================================================
// İşlem Formu Modalı
// =====================================================

function IslemFormu({
  hesaplar,
  baslangicHesapId,
  onKaydet,
  onKapat,
}: {
  hesaplar: BankaHesabi[];
  baslangicHesapId?: string;
  onKaydet: () => void;
  onKapat: () => void;
}) {
  const [islemTipi, setIslemTipi] = useState<'giris' | 'cikis' | 'transfer'>('giris');
  const [hesapId, setHesapId] = useState(baslangicHesapId ?? '');
  const [kaynakId, setKaynakId] = useState(baslangicHesapId ?? '');
  const [hedefId, setHedefId] = useState('');
  const [tutar, setTutar] = useState('');
  const [aciklama, setAciklama] = useState('');
  const [tarih, setTarih] = useState(new Date().toISOString().split('T')[0]);
  const [kaydediliyor, setKaydediliyor] = useState(false);
  const [hata, setHata] = useState('');

  const aktifHesaplar = hesaplar.filter((h) => h.aktif && h.tur !== 'fark_hesabi');

  async function kaydet() {
    const tutarSayi = Number(tutar);
    if (!tutarSayi || tutarSayi <= 0) { setHata('Geçerli bir tutar giriniz'); return; }
    if (!aciklama.trim()) { setHata('Açıklama zorunludur'); return; }

    setKaydediliyor(true); setHata('');
    try {
      const govde =
        islemTipi === 'transfer'
          ? { tip: 'transfer', kaynakId, hedefId, tutar: tutarSayi, aciklama, tarih }
          : { tip: islemTipi, hesapId, tutar: tutarSayi, aciklama, tarih };

      const yanit = await fetch('/api/banka-hesaplari/transfer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(govde),
      });
      if (!yanit.ok) { const v = await yanit.json(); setHata(v.hata ?? 'Hata'); return; }
      onKaydet();
    } catch { setHata('Bağlantı hatası'); } finally { setKaydediliyor(false); }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-sm rounded-xl bg-white p-6 shadow-xl space-y-4">
        <h3 className="text-base font-semibold text-gray-800">Yeni İşlem</h3>

        {/* İşlem tipi */}
        <div className="flex gap-1 rounded-lg bg-gray-100 p-1">
          {(['giris', 'cikis', 'transfer'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setIslemTipi(t)}
              className={`flex-1 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${islemTipi === t ? 'bg-white shadow-sm text-gray-800' : 'text-gray-500 hover:text-gray-700'}`}
            >
              {t === 'giris' ? 'Para Girişi' : t === 'cikis' ? 'Para Çıkışı' : 'Transfer'}
            </button>
          ))}
        </div>

        {/* Hesap seçimi */}
        {islemTipi === 'transfer' ? (
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Kaynak Hesap</label>
              <select value={kaynakId} onChange={(e) => setKaynakId(e.target.value)} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="">Seçin...</option>
                {aktifHesaplar.map((h) => <option key={h.id} value={h.id}>{h.hesapAdi}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Hedef Hesap</label>
              <select value={hedefId} onChange={(e) => setHedefId(e.target.value)} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="">Seçin...</option>
                {aktifHesaplar.filter((h) => h.id !== kaynakId).map((h) => <option key={h.id} value={h.id}>{h.hesapAdi}</option>)}
              </select>
            </div>
          </div>
        ) : (
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              {islemTipi === 'giris' ? 'Para Giren Hesap' : 'Para Çıkan Hesap'}
            </label>
            <select value={hesapId} onChange={(e) => setHesapId(e.target.value)} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="">Seçin...</option>
              {aktifHesaplar.map((h) => <option key={h.id} value={h.id}>{h.hesapAdi} ({paraFormat(Number(h.bakiye))})</option>)}
            </select>
          </div>
        )}

        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Tutar (₺) *</label>
          <input type="number" value={tutar} onChange={(e) => setTutar(e.target.value)} min={0.01} step={0.01} placeholder="0.00"
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Açıklama *</label>
          <input type="text" value={aciklama} onChange={(e) => setAciklama(e.target.value)} placeholder="İşlem açıklaması"
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Tarih</label>
          <input type="date" value={tarih} onChange={(e) => setTarih(e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>

        {hata && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{hata}</p>}

        <div className="flex gap-3 pt-1">
          <button onClick={onKapat} className="flex-1 rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">İptal</button>
          <button onClick={kaydet} disabled={kaydediliyor} className={`flex-1 rounded-lg px-4 py-2 text-sm font-medium text-white disabled:opacity-50 ${islemTipi === 'giris' ? 'bg-green-600 hover:bg-green-700' : islemTipi === 'cikis' ? 'bg-red-600 hover:bg-red-700' : 'bg-blue-600 hover:bg-blue-700'}`}>
            {kaydediliyor ? 'Kaydediliyor...' : 'Kaydet'}
          </button>
        </div>
      </div>
    </div>
  );
}

// =====================================================
// Sayfa Kontrol Bileşeni
// =====================================================

function SayfaKontrol({ mevcutSayfa, sayfaSayisi, toplam, onDegis, yukleniyor }: {
  mevcutSayfa: number;
  sayfaSayisi: number;
  toplam: number;
  onDegis: (sayfa: number) => void;
  yukleniyor?: boolean;
}) {
  if (sayfaSayisi <= 1 && toplam === 0) return null;
  return (
    <div className="flex items-center justify-between px-4 py-2.5 border-t border-gray-100 bg-gray-50/50">
      <span className="text-xs text-gray-400">
        {toplam} hareket · Sayfa {mevcutSayfa}/{Math.max(1, sayfaSayisi)}
      </span>
      <div className="flex gap-1.5">
        <button
          onClick={() => onDegis(mevcutSayfa - 1)}
          disabled={mevcutSayfa <= 1 || yukleniyor}
          className="rounded-lg border border-gray-300 px-3 py-1 text-xs font-medium text-gray-600 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          ← Önceki
        </button>
        <button
          onClick={() => onDegis(mevcutSayfa + 1)}
          disabled={mevcutSayfa >= sayfaSayisi || yukleniyor}
          className="rounded-lg border border-gray-300 px-3 py-1 text-xs font-medium text-gray-600 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Sonraki →
        </button>
      </div>
    </div>
  );
}

// =====================================================
// Ana Sayfa
// =====================================================

type SekmeAdi = 'dashboard' | 'hesaplar' | 'islemler' | 'hareketler';

type HareketSatir = {
  id: string; bankaHesabiId: string; hesapAdi: string;
  tip: 'giris' | 'cikis'; tutar: number; aciklama: string;
  tarih: string; referansTipi: string | null; referansId: string | null;
  dekontUrl: string | null;
  olusturmaTarihi: string;
};

// =====================================================
// Dekont Görüntüleyici Modal
// =====================================================
function DekontGoruntuleyici({ url, onKapat }: { url: string; onKapat: () => void }) {
  const isPdf = url.toLowerCase().endsWith('.pdf');
  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/70 p-4" onClick={onKapat}>
      <div className="relative w-full max-w-3xl max-h-[90vh] rounded-xl bg-white shadow-2xl overflow-hidden flex flex-col" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 shrink-0">
          <p className="text-sm font-semibold text-gray-800 truncate">Dekont</p>
          <div className="flex items-center gap-2 shrink-0">
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700"
            >
              Yeni Sekmede Aç
            </a>
            <button onClick={onKapat} className="rounded-lg border border-gray-300 px-3 py-1.5 text-xs text-gray-600 hover:bg-gray-50">
              Kapat
            </button>
          </div>
        </div>
        <div className="flex-1 overflow-auto min-h-0">
          {isPdf ? (
            <iframe src={url} className="w-full h-full min-h-[70vh]" title="Dekont" />
          ) : (
            <div className="flex items-center justify-center p-4 min-h-[50vh]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={url} alt="Dekont" className="max-w-full max-h-[75vh] object-contain rounded-lg shadow" />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function hareketlerUrlOlustur(params: Record<string, string | number>) {
  const p = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => { if (v !== '' && v !== 0) p.set(k, String(v)); });
  return `/api/banka-hareketleri?${p}`;
}

export default function BankaKasaSayfasi() {
  const [aktifSekme, setAktifSekme] = useState<SekmeAdi>('dashboard');
  const [hesaplar, setHesaplar] = useState<BankaHesabi[]>([]);
  const [yukleniyor, setYukleniyor] = useState(true);
  const [hesapFormuAcik, setHesapFormuAcik] = useState(false);
  const [duzenlenecekHesap, setDuzenlenecekHesap] = useState<BankaHesabi | undefined>();
  const [islemFormuAcik, setIslemFormuAcik] = useState(false);
  const [islemBaslangicHesapId, setIslemBaslangicHesapId] = useState<string | undefined>();
  const [sifirlaHesap, setSifirlaHesap] = useState<BankaHesabi | undefined>();
  const [dekontGoruntulenecek, setDekontGoruntulenecek] = useState<string | null>(null);

  // ── Dashboard "Son Hareketler" ──
  const [dashHareketler, setDashHareketler] = useState<HareketSatir[]>([]);
  const [dashToplam, setDashToplam] = useState(0);
  const [dashSayfa, setDashSayfa] = useState(1);
  const [dashYukleniyor, setDashYukleniyor] = useState(false);
  const [toplamGiris, setToplamGiris] = useState(0);
  const [toplamCikis, setToplamCikis] = useState(0);
  const [dashTip, setDashTip] = useState<'tumu' | 'giris' | 'cikis'>('tumu');
  const [dashBaslangic, setDashBaslangic] = useState('');
  const [dashBitis, setDashBitis] = useState('');

  // ── İşlemler "Son İşlemler" ──
  const [islemHareketler, setIslemHareketler] = useState<HareketSatir[]>([]);
  const [islemToplam, setIslemToplam] = useState(0);
  const [islemSayfa, setIslemSayfa] = useState(1);
  const [islemYukleniyor, setIslemYukleniyor] = useState(false);
  const [sonIslemTip, setSonIslemTip] = useState<'tumu' | 'giris' | 'cikis'>('tumu');
  const [sonIslemBaslangic, setSonIslemBaslangic] = useState('');
  const [sonIslemBitis, setSonIslemBitis] = useState('');

  // ── Hareketler tab ──
  const [harHareketler, setHarHareketler] = useState<HareketSatir[]>([]);
  const [harToplam, setHarToplam] = useState(0);
  const [harSayfa, setHarSayfa] = useState(1);
  const [harToplamGiris, setHarToplamGiris] = useState(0);
  const [harToplamCikis, setHarToplamCikis] = useState(0);
  const [harYukleniyor, setHarYukleniyor] = useState(false);
  const [harArama, setHarArama] = useState('');
  const [harTip, setHarTip] = useState<'tumu' | 'giris' | 'cikis'>('tumu');
  const [harBaslangic, setHarBaslangic] = useState('');
  const [harBitis, setHarBitis] = useState('');
  const [harHesapId, setHarHesapId] = useState('');

  // Filtre değişince sayfa sıfırla
  useEffect(() => { setDashSayfa(1); }, [dashTip, dashBaslangic, dashBitis]);
  useEffect(() => { setIslemSayfa(1); }, [sonIslemTip, sonIslemBaslangic, sonIslemBitis]);
  useEffect(() => { setHarSayfa(1); }, [harTip, harBaslangic, harBitis, harHesapId, harArama]);

  // ── Fetch fonksiyonları ──
  const dashGetir = useCallback(async () => {
    setDashYukleniyor(true);
    try {
      const r = await fetch(hareketlerUrlOlustur({ sayfa: dashSayfa, limit: 15, tip: dashTip !== 'tumu' ? dashTip : '', baslangic: dashBaslangic, bitis: dashBitis }));
      const v = await r.json();
      setDashHareketler(v.hareketler ?? []);
      setDashToplam(v.toplam ?? 0);
      setToplamGiris(v.toplamGiris ?? 0);
      setToplamCikis(v.toplamCikis ?? 0);
    } finally { setDashYukleniyor(false); }
  }, [dashSayfa, dashTip, dashBaslangic, dashBitis]);

  const islemGetir = useCallback(async () => {
    setIslemYukleniyor(true);
    try {
      const r = await fetch(hareketlerUrlOlustur({ sayfa: islemSayfa, limit: 15, tip: sonIslemTip !== 'tumu' ? sonIslemTip : '', baslangic: sonIslemBaslangic, bitis: sonIslemBitis }));
      const v = await r.json();
      setIslemHareketler(v.hareketler ?? []);
      setIslemToplam(v.toplam ?? 0);
    } finally { setIslemYukleniyor(false); }
  }, [islemSayfa, sonIslemTip, sonIslemBaslangic, sonIslemBitis]);

  const harGetir = useCallback(async () => {
    setHarYukleniyor(true);
    try {
      const r = await fetch(hareketlerUrlOlustur({ sayfa: harSayfa, limit: 15, tip: harTip !== 'tumu' ? harTip : '', baslangic: harBaslangic, bitis: harBitis, hesapId: harHesapId, arama: harArama }));
      const v = await r.json();
      setHarHareketler(v.hareketler ?? []);
      setHarToplam(v.toplam ?? 0);
      setHarToplamGiris(v.toplamGiris ?? 0);
      setHarToplamCikis(v.toplamCikis ?? 0);
    } finally { setHarYukleniyor(false); }
  }, [harSayfa, harTip, harBaslangic, harBitis, harHesapId, harArama]);

  const hesaplariGetir = useCallback(async () => {
    try {
      const yanit = await fetch('/api/banka-hesaplari');
      const veri = await yanit.json();
      if (Array.isArray(veri)) setHesaplar(veri);
    } finally {
      setYukleniyor(false);
    }
  }, []);

  const tumunuYenile = useCallback(() => {
    hesaplariGetir();
    dashGetir();
    if (aktifSekme === 'islemler') islemGetir();
    if (aktifSekme === 'hareketler') harGetir();
  }, [hesaplariGetir, dashGetir, islemGetir, harGetir, aktifSekme]);

  useEffect(() => { hesaplariGetir(); }, [hesaplariGetir]);
  useEffect(() => { dashGetir(); }, [dashGetir]);
  useEffect(() => { if (aktifSekme === 'islemler') islemGetir(); }, [aktifSekme, islemGetir]);
  useEffect(() => { if (aktifSekme === 'hareketler') harGetir(); }, [aktifSekme, harGetir]);

  const aktifHesaplar = hesaplar.filter((h) => h.tur !== 'fark_hesabi');
  const farkHesabi = hesaplar.find((h) => h.tur === 'fark_hesabi');
  const toplamBakiye = aktifHesaplar.reduce((s, h) => s + Number(h.bakiye), 0);

  const sekmeler: { id: SekmeAdi; etiket: string; ikon: string }[] = [
    { id: 'dashboard', etiket: 'Genel Bakış', ikon: '📊' },
    { id: 'hesaplar', etiket: 'Hesaplar', ikon: '🏦' },
    { id: 'islemler', etiket: 'İşlemler', ikon: '💸' },
    { id: 'hareketler', etiket: 'Hareketler', ikon: '📋' },
  ];

  if (yukleniyor) {
    return <div className="flex items-center justify-center h-64 text-gray-400">Yükleniyor...</div>;
  }

  return (
    <div className="min-h-full bg-gray-50">
      {/* Başlık + Yeni İşlem */}
      <div className="flex items-center justify-between px-4 pt-4 pb-2">
        <div>
          <h1 className="text-lg font-bold text-gray-800">Banka / Kasa</h1>
          <p className="text-xs text-gray-500">Hesap yönetimi ve para hareketleri</p>
        </div>
        <button
          onClick={() => { setIslemBaslangicHesapId(undefined); setIslemFormuAcik(true); }}
          className="rounded-lg bg-green-600 px-3 py-2 text-sm font-medium text-white hover:bg-green-700 active:scale-95 transition-transform"
        >
          + Yeni İşlem
        </button>
      </div>

      {/* Sticky sekme navigasyonu — mobilde yatay scroll */}
      <div className="sticky top-0 z-10 bg-white border-b border-gray-200 shadow-sm">
        <div className="overflow-x-auto">
          <div className="flex min-w-max px-3 py-2 gap-1">
            {sekmeler.map((s) => (
              <button
                key={s.id}
                onClick={() => setAktifSekme(s.id)}
                className={`whitespace-nowrap rounded-lg px-4 py-2 text-sm font-medium transition-colors active:scale-95 ${
                  aktifSekme === s.id
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                <span className="mr-1">{s.ikon}</span>{s.etiket}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="px-4 py-4 space-y-4">

      {/* ==================== DASHBOARD ==================== */}
      {aktifSekme === 'dashboard' && (
        <div className="space-y-4">
          {/* Özet kartlar */}
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2 rounded-2xl border border-gray-100 bg-white shadow-sm p-4">
              <p className="text-xs font-medium text-blue-600">Toplam Bakiye</p>
              <p className="mt-1 text-2xl font-bold text-blue-800">{paraFormat(toplamBakiye)}</p>
              <p className="mt-0.5 text-xs text-blue-400">{aktifHesaplar.length} aktif hesap</p>
            </div>
            <div className="rounded-2xl border border-gray-100 bg-white shadow-sm p-4">
              <p className="text-xs font-medium text-green-600">Toplam Giriş</p>
              <p className="mt-1 text-lg font-bold text-green-700">{paraFormat(toplamGiris)}</p>
            </div>
            <div className="rounded-2xl border border-gray-100 bg-white shadow-sm p-4">
              <p className="text-xs font-medium text-red-600">Toplam Çıkış</p>
              <p className="mt-1 text-lg font-bold text-red-700">{paraFormat(toplamCikis)}</p>
            </div>
          </div>

          {/* Hesap özetleri */}
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {hesaplar.map((h) => {
              const stil = turRenk(h.tur);
              return (
                <div key={h.id} className={`rounded-2xl border shadow-sm p-4 bg-white ${h.alarmDurumu ? 'border-red-300' : 'border-gray-100'}`}>
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <p className="text-sm font-semibold text-gray-800">
                        {h.hesapAdi}
                        {h.kmhLimiti && <span className="ml-1.5 text-xs text-orange-600 font-normal">(KMH)</span>}
                      </p>
                      {h.bankaAdi && <p className="text-xs text-gray-500">{h.bankaAdi}</p>}
                    </div>
                    <div className="flex items-center gap-1.5">
                      {h.alarmDurumu && (
                        <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-red-100 text-red-700">⚠️ Alarm</span>
                      )}
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${stil.badge}`}>
                        {turEtiket(h.tur)}
                      </span>
                    </div>
                  </div>
                  <p className={`text-2xl font-bold ${Number(h.bakiye) >= 0 ? 'text-gray-800' : 'text-red-600'}`}>
                    {paraFormat(Number(h.bakiye))}
                  </p>
                  {h.alarmDurumu && (
                    <p className="text-xs text-red-600 mt-1">KMH devreye girdi — bakiyeyi düzeltin</p>
                  )}
                  {!h.alarmDurumu && h.iban && <p className="text-xs text-gray-400 mt-1">{h.iban}</p>}
                  <div className="border-t border-gray-100 mt-3 pt-3 flex divide-x divide-gray-100">
                    {h.tur === 'fark_hesabi' ? (
                      <button
                        onClick={() => setSifirlaHesap(h)}
                        disabled={Number(h.bakiye) === 0}
                        className="flex-1 text-xs font-medium text-purple-600 hover:text-purple-700 active:scale-95 transition-transform disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        Bakiyeyi Sıfırla
                      </button>
                    ) : (
                      <button
                        onClick={() => { setIslemBaslangicHesapId(h.id); setIslemFormuAcik(true); }}
                        className="flex-1 text-xs font-medium text-green-700 hover:text-green-800 active:scale-95 transition-transform"
                      >
                        İşlem Yap
                      </button>
                    )}
                    <button
                      onClick={() => setAktifSekme('hareketler')}
                      className="flex-1 text-xs font-medium text-blue-600 hover:text-blue-700 active:scale-95 transition-transform"
                    >
                      Hareketler
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Fark hesabı uyarısı */}
          {!farkHesabi && (
            <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 flex items-start gap-3">
              <span className="text-amber-500 text-lg shrink-0 mt-0.5">⚠️</span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-amber-800">Fark Hesabı Tanımlanmamış</p>
                <p className="text-xs text-amber-600 mt-0.5">Ödeme farkları otomatik kaydedilemez. Hesaplar sekmesinden Fark Hesabı türünde bir hesap ekleyin.</p>
              </div>
              <button onClick={() => setAktifSekme('hesaplar')} className="shrink-0 rounded-lg bg-amber-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-amber-700 active:scale-95 transition-transform">
                Ekle
              </button>
            </div>
          )}

          {/* Son Hareketler */}
          <div className="rounded-2xl border border-gray-100 bg-white shadow-sm overflow-hidden">
            <div className="border-b border-gray-100 px-4 py-3 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-gray-700">Son Hareketler</h3>
              <button onClick={() => setAktifSekme('hareketler')} className="text-xs text-blue-600 hover:underline">Tümünü Gör</button>
            </div>

            {/* Kompakt filtre bar */}
            <div className="border-b border-gray-100 px-3 py-2 flex flex-wrap items-center gap-2">
              <div className="flex gap-0.5 rounded-lg bg-gray-100 p-0.5">
                {(['tumu', 'giris', 'cikis'] as const).map((t) => (
                  <button key={t} onClick={() => setDashTip(t)}
                    className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors whitespace-nowrap ${dashTip === t ? 'bg-white shadow-sm text-gray-800' : 'text-gray-500 hover:text-gray-700'}`}>
                    {t === 'tumu' ? 'Tümü' : t === 'giris' ? 'Gelir' : 'Gider'}
                  </button>
                ))}
              </div>
              <input type="date" value={dashBaslangic} onChange={(e) => setDashBaslangic(e.target.value)}
                className="rounded-lg border border-gray-300 px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-blue-400" />
              <input type="date" value={dashBitis} onChange={(e) => setDashBitis(e.target.value)}
                className="rounded-lg border border-gray-300 px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-blue-400" />
              {(dashTip !== 'tumu' || dashBaslangic || dashBitis) && (
                <button onClick={() => { setDashTip('tumu'); setDashBaslangic(''); setDashBitis(''); }}
                  className="text-xs text-gray-400 hover:text-gray-600 underline">Temizle</button>
              )}
              <span className="ml-auto text-xs text-gray-400">{dashToplam} hareket</span>
            </div>

            <div className="divide-y divide-gray-50">
              {dashYukleniyor && dashHareketler.length === 0 ? (
                <p className="px-4 py-8 text-center text-sm text-gray-400">Yükleniyor...</p>
              ) : dashHareketler.length === 0 ? (
                <p className="px-4 py-8 text-center text-sm text-gray-400">
                  {dashToplam === 0 && !dashBaslangic && !dashBitis && dashTip === 'tumu' ? 'Henüz hareket yok' : 'Filtre sonucu bulunamadı'}
                </p>
              ) : (
                dashHareketler.map((h) => (
                  <div key={h.id} className={`flex items-center gap-3 px-4 py-3 hover:bg-gray-50 ${dashYukleniyor ? 'opacity-50' : ''}`}>
                    <span className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${h.tip === 'giris' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                      {h.tip === 'giris' ? '↓' : '↑'}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-800 truncate">{h.aciklama}</p>
                      <p className="text-xs text-gray-400">{h.hesapAdi} — {new Date(h.tarih).toLocaleDateString('tr-TR')}</p>
                    </div>
                    <p className={`text-sm font-semibold whitespace-nowrap ${h.tip === 'giris' ? 'text-green-700' : 'text-red-600'}`}>
                      {h.tip === 'giris' ? '+' : '-'}{paraFormat(Number(h.tutar))}
                    </p>
                    {h.dekontUrl && (
                      <button
                        onClick={() => setDekontGoruntulenecek(h.dekontUrl!)}
                        className="shrink-0 rounded px-2 py-1 text-xs font-medium text-blue-600 hover:bg-blue-50 active:scale-95 transition-transform"
                        title="Dekontu görüntüle"
                      >
                        📎
                      </button>
                    )}
                  </div>
                ))
              )}
            </div>
            <SayfaKontrol
              mevcutSayfa={dashSayfa}
              sayfaSayisi={Math.ceil(dashToplam / 15)}
              toplam={dashToplam}
              onDegis={setDashSayfa}
              yukleniyor={dashYukleniyor}
            />
          </div>
        </div>
      )}

      {/* ==================== HESAPLAR ==================== */}
      {aktifSekme === 'hesaplar' && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <button
              onClick={() => { setDuzenlenecekHesap(undefined); setHesapFormuAcik(true); }}
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 active:scale-95 transition-transform"
            >
              + Hesap Ekle
            </button>
          </div>

          {/* Masaüstü tablo */}
          <div className="hidden md:block rounded-xl border border-gray-200 bg-white overflow-hidden">
            <div className="border-b border-gray-100 px-4 py-3">
              <h3 className="text-sm font-semibold text-gray-700">Hesap Listesi</h3>
            </div>
            {hesaplar.length === 0 ? (
              <p className="px-4 py-12 text-center text-sm text-gray-400">
                Henüz hesap yok. "Hesap Ekle" ile banka hesabı, kasa veya fark hesabı oluşturun.
              </p>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    <th className="px-4 py-2.5">Hesap</th>
                    <th className="px-4 py-2.5">Tür</th>
                    <th className="px-4 py-2.5">Banka</th>
                    <th className="px-4 py-2.5">IBAN</th>
                    <th className="px-4 py-2.5 text-right">Bakiye</th>
                    <th className="px-4 py-2.5"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {hesaplar.map((h) => {
                    const stil = turRenk(h.tur);
                    return (
                      <tr key={h.id} className={`hover:bg-gray-50 ${h.alarmDurumu ? 'bg-red-50' : ''}`}>
                        <td className="px-4 py-3">
                          <p className="font-medium text-gray-800">
                            {h.hesapAdi}
                            {h.kmhLimiti && <span className="ml-1 text-xs text-orange-600">(KMH)</span>}
                          </p>
                          {h.alarmDurumu && <p className="text-xs text-red-600">⚠️ Alarm — KMH devreye girdi</p>}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${stil.badge}`}>
                            {turEtiket(h.tur)}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-gray-600">{h.bankaAdi ?? '—'}</td>
                        <td className="px-4 py-3 text-gray-500 font-mono text-xs">{h.iban ?? '—'}</td>
                        <td className={`px-4 py-3 text-right font-bold ${Number(h.bakiye) >= 0 ? 'text-green-700' : 'text-red-600'}`}>
                          {paraFormat(Number(h.bakiye))}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <button
                            onClick={() => { setDuzenlenecekHesap(h); setHesapFormuAcik(true); }}
                            className="rounded px-2 py-1 text-xs text-blue-600 hover:bg-blue-50"
                          >
                            Düzenle
                          </button>
                          {h.tur === 'fark_hesabi' ? (
                            <button
                              onClick={() => setSifirlaHesap(h)}
                              disabled={Number(h.bakiye) === 0}
                              className="ml-1 rounded px-2 py-1 text-xs text-purple-600 hover:bg-purple-50 disabled:opacity-40 disabled:cursor-not-allowed"
                            >
                              Sıfırla
                            </button>
                          ) : (
                            <button
                              onClick={() => { setIslemBaslangicHesapId(h.id); setIslemFormuAcik(true); }}
                              className="ml-1 rounded px-2 py-1 text-xs text-green-600 hover:bg-green-50"
                            >
                              İşlem Yap
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>

          {/* Mobil kart listesi */}
          <div className="md:hidden">
            {hesaplar.length === 0 ? (
              <div className="flex items-center justify-center py-12 text-gray-400 text-sm">
                Henüz hesap yok. Hesap Ekle ile başlayın.
              </div>
            ) : (
              <div className="space-y-3">
                {hesaplar.map((h) => {
                  const stil = turRenk(h.tur);
                  return (
                    <div key={h.id} className={`rounded-2xl bg-white border shadow-sm overflow-hidden ${h.alarmDurumu ? 'border-red-300' : 'border-gray-100'}`}>
                      <div className="px-4 pt-4 pb-3">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <p className="text-sm font-semibold text-gray-800">
                                {h.hesapAdi}
                                {h.kmhLimiti && <span className="ml-1 text-xs text-orange-600">(KMH)</span>}
                              </p>
                              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${stil.badge}`}>
                                {turEtiket(h.tur)}
                              </span>
                              {h.alarmDurumu && <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-red-100 text-red-700">⚠️ Alarm</span>}
                            </div>
                            {h.bankaAdi && <p className="text-xs text-gray-500 mt-0.5">{h.bankaAdi}</p>}
                            {h.iban && <p className="text-xs text-gray-400 font-mono mt-0.5">{h.iban}</p>}
                          </div>
                          <div className="text-right shrink-0">
                            <p className={`text-lg font-bold ${Number(h.bakiye) >= 0 ? 'text-gray-800' : 'text-red-600'}`}>
                              {paraFormat(Number(h.bakiye))}
                            </p>
                          </div>
                        </div>
                        {h.alarmDurumu && (
                          <p className="text-xs text-red-600 mt-2">KMH devreye girdi — bakiyeyi düzeltin</p>
                        )}
                      </div>
                      <div className="border-t border-gray-100 flex divide-x divide-gray-100">
                        <button
                          onClick={() => { setDuzenlenecekHesap(h); setHesapFormuAcik(true); }}
                          className="flex-1 py-2.5 text-sm font-medium text-blue-600 hover:bg-blue-50 active:scale-95 transition-transform"
                        >
                          Düzenle
                        </button>
                        {h.tur === 'fark_hesabi' ? (
                          <button
                            onClick={() => setSifirlaHesap(h)}
                            disabled={Number(h.bakiye) === 0}
                            className="flex-1 py-2.5 text-sm font-medium text-purple-600 hover:bg-purple-50 active:scale-95 transition-transform disabled:opacity-40 disabled:cursor-not-allowed"
                          >
                            Sıfırla
                          </button>
                        ) : (
                          <button
                            onClick={() => { setIslemBaslangicHesapId(h.id); setIslemFormuAcik(true); }}
                            className="flex-1 py-2.5 text-sm font-medium text-green-600 hover:bg-green-50 active:scale-95 transition-transform"
                          >
                            İşlem Yap
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ==================== İŞLEMLER (kısayol) ==================== */}
      {aktifSekme === 'islemler' && (
        <div className="space-y-4">
          <p className="text-sm text-gray-500">Para girişi, çıkışı veya hesaplar arası transfer yapın.</p>
          <div className="grid gap-3 sm:grid-cols-3">
            {[
              { tip: 'giris', label: 'Para Girişi', desc: 'Hesaba para ekle (nakit tahsilat, vb.)', butonRenk: 'bg-green-600 hover:bg-green-700', ikon: '↓' },
              { tip: 'cikis', label: 'Para Çıkışı', desc: 'Hesaptan para çıkar (nakit ödeme, vb.)', butonRenk: 'bg-red-600 hover:bg-red-700', ikon: '↑' },
              { tip: 'transfer', label: 'Transfer', desc: 'Hesaplar arası para transfer et', butonRenk: 'bg-blue-600 hover:bg-blue-700', ikon: '⇄' },
            ].map((item) => (
              <div key={item.tip} className="rounded-2xl border border-gray-100 bg-white shadow-sm p-4">
                <div className="text-2xl mb-2">{item.ikon}</div>
                <h3 className="text-sm font-semibold text-gray-800">{item.label}</h3>
                <p className="text-xs text-gray-500 mt-1 mb-3">{item.desc}</p>
                <button
                  onClick={() => { setIslemBaslangicHesapId(undefined); setIslemFormuAcik(true); }}
                  className={`w-full rounded-lg px-4 py-2 text-sm font-medium text-white active:scale-95 transition-transform ${item.butonRenk}`}
                >
                  {item.label} Yap
                </button>
              </div>
            ))}
          </div>

          {/* Son İşlemler */}
          <div className="rounded-2xl border border-gray-100 bg-white shadow-sm overflow-hidden">
            <div className="border-b border-gray-100 px-4 py-3 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-gray-700">Son İşlemler</h3>
              <button onClick={() => setAktifSekme('hareketler')} className="text-xs text-blue-600 hover:underline">Tümünü Gör</button>
            </div>

            {/* Kompakt filtre bar */}
            <div className="border-b border-gray-100 px-3 py-2 flex flex-wrap items-center gap-2">
              <div className="flex gap-0.5 rounded-lg bg-gray-100 p-0.5">
                {(['tumu', 'giris', 'cikis'] as const).map((t) => (
                  <button key={t} onClick={() => setSonIslemTip(t)}
                    className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors whitespace-nowrap ${sonIslemTip === t ? 'bg-white shadow-sm text-gray-800' : 'text-gray-500 hover:text-gray-700'}`}>
                    {t === 'tumu' ? 'Tümü' : t === 'giris' ? 'Gelir' : 'Gider'}
                  </button>
                ))}
              </div>
              <input type="date" value={sonIslemBaslangic} onChange={(e) => setSonIslemBaslangic(e.target.value)}
                className="rounded-lg border border-gray-300 px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-blue-400" />
              <input type="date" value={sonIslemBitis} onChange={(e) => setSonIslemBitis(e.target.value)}
                className="rounded-lg border border-gray-300 px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-blue-400" />
              {(sonIslemTip !== 'tumu' || sonIslemBaslangic || sonIslemBitis) && (
                <button onClick={() => { setSonIslemTip('tumu'); setSonIslemBaslangic(''); setSonIslemBitis(''); }}
                  className="text-xs text-gray-400 hover:text-gray-600 underline">Temizle</button>
              )}
              <span className="ml-auto text-xs text-gray-400">{islemToplam} işlem</span>
            </div>

            <div className="divide-y divide-gray-50">
              {islemYukleniyor && islemHareketler.length === 0 ? (
                <p className="px-4 py-8 text-center text-sm text-gray-400">Yükleniyor...</p>
              ) : islemHareketler.length === 0 ? (
                <p className="px-4 py-8 text-center text-sm text-gray-400">
                  {islemToplam === 0 && !sonIslemBaslangic && !sonIslemBitis && sonIslemTip === 'tumu' ? 'Henüz işlem yok' : 'Filtre sonucu bulunamadı'}
                </p>
              ) : (
                islemHareketler.map((h) => (
                  <div key={h.id} className={`flex items-center gap-3 px-4 py-3 hover:bg-gray-50 ${islemYukleniyor ? 'opacity-50' : ''}`}>
                    <span className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${h.tip === 'giris' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                      {h.tip === 'giris' ? '↓' : '↑'}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-800 truncate">{h.aciklama}</p>
                      <p className="text-xs text-gray-400">{h.hesapAdi} — {new Date(h.tarih).toLocaleDateString('tr-TR')}</p>
                    </div>
                    <p className={`text-sm font-semibold whitespace-nowrap ${h.tip === 'giris' ? 'text-green-700' : 'text-red-600'}`}>
                      {h.tip === 'giris' ? '+' : '-'}{paraFormat(Number(h.tutar))}
                    </p>
                    {h.dekontUrl && (
                      <button
                        onClick={() => setDekontGoruntulenecek(h.dekontUrl!)}
                        className="shrink-0 rounded px-2 py-1 text-xs font-medium text-blue-600 hover:bg-blue-50 active:scale-95 transition-transform"
                        title="Dekontu görüntüle"
                      >
                        📎
                      </button>
                    )}
                  </div>
                ))
              )}
            </div>
            <SayfaKontrol
              mevcutSayfa={islemSayfa}
              sayfaSayisi={Math.ceil(islemToplam / 15)}
              toplam={islemToplam}
              onDegis={setIslemSayfa}
              yukleniyor={islemYukleniyor}
            />
          </div>
        </div>
      )}

      {/* ==================== HAREKETLER ==================== */}
      {aktifSekme === 'hareketler' && (
        <div className="space-y-4">
          {/* Kompakt filtre bar */}
          <div className="rounded-xl border border-gray-200 bg-white px-3 py-3 space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <input
                type="text"
                value={harArama}
                onChange={(e) => setHarArama(e.target.value)}
                placeholder="Açıklama veya hesap adı..."
                className="rounded-lg border border-gray-300 px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 min-w-0 flex-1"
              />
              <div className="flex gap-0.5 rounded-lg bg-gray-100 p-0.5">
                {(['tumu', 'giris', 'cikis'] as const).map((t) => (
                  <button key={t} onClick={() => setHarTip(t)}
                    className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors whitespace-nowrap ${harTip === t ? 'bg-white shadow-sm text-gray-800' : 'text-gray-500 hover:text-gray-700'}`}>
                    {t === 'tumu' ? 'Tümü' : t === 'giris' ? 'Gelir' : 'Gider'}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <select value={harHesapId} onChange={(e) => setHarHesapId(e.target.value)}
                className="rounded-lg border border-gray-300 px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 flex-1 min-w-0">
                <option value="">Tüm Hesaplar</option>
                {hesaplar.map((h) => <option key={h.id} value={h.id}>{h.hesapAdi}</option>)}
              </select>
              <input type="date" value={harBaslangic} onChange={(e) => setHarBaslangic(e.target.value)}
                className="rounded-lg border border-gray-300 px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-blue-400" />
              <input type="date" value={harBitis} onChange={(e) => setHarBitis(e.target.value)}
                className="rounded-lg border border-gray-300 px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-blue-400" />
            </div>
            <div className="flex items-center justify-between">
              {(harTip !== 'tumu' || harBaslangic || harBitis || harArama || harHesapId) && (
                <button onClick={() => { setHarTip('tumu'); setHarBaslangic(''); setHarBitis(''); setHarArama(''); setHarHesapId(''); }}
                  className="text-xs text-gray-400 hover:text-gray-600 underline">Filtreleri Temizle</button>
              )}
              <span className="ml-auto text-xs text-gray-500 font-medium">{harToplam} hareket</span>
            </div>
            {harToplam > 0 && (harTip !== 'tumu' || harBaslangic || harBitis || harHesapId || harArama) && (
              <div className="flex gap-3 text-xs text-gray-500 border-t border-gray-100 pt-2">
                <span>Gelir: <span className="font-semibold text-green-700">{paraFormat(harToplamGiris)}</span></span>
                <span>Gider: <span className="font-semibold text-red-600">{paraFormat(harToplamCikis)}</span></span>
              </div>
            )}
          </div>

          {/* Masaüstü tablo */}
          <div className="hidden md:block rounded-xl border border-gray-200 bg-white overflow-hidden">
            <table className={`w-full text-sm ${harYukleniyor ? 'opacity-60' : ''}`}>
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  <th className="px-4 py-3">Tarih</th>
                  <th className="px-4 py-3">Hesap</th>
                  <th className="px-4 py-3">Açıklama</th>
                  <th className="px-4 py-3">Kaynak</th>
                  <th className="px-4 py-3">Tür</th>
                  <th className="px-4 py-3 text-right">Tutar</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {harYukleniyor && harHareketler.length === 0 ? (
                  <tr><td colSpan={6} className="px-4 py-10 text-center text-gray-400">Yükleniyor...</td></tr>
                ) : harHareketler.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-10 text-center text-gray-400">
                      {harToplam === 0 && !harArama && harTip === 'tumu' && !harBaslangic && !harBitis && !harHesapId ? 'Henüz hareket yok' : 'Filtre sonucu bulunamadı'}
                    </td>
                  </tr>
                ) : (
                  harHareketler.map((h) => (
                    <tr key={h.id} className="hover:bg-gray-50">
                      <td className="px-4 py-2.5 text-gray-600 whitespace-nowrap">
                        {new Date(h.tarih).toLocaleDateString('tr-TR')}
                      </td>
                      <td className="px-4 py-2.5 text-gray-700 font-medium">{h.hesapAdi}</td>
                      <td className="px-4 py-2.5 text-gray-800">{h.aciklama}</td>
                      <td className="px-4 py-2.5">
                        {h.referansTipi && (
                          <span className="inline-flex rounded px-1.5 py-0.5 text-xs bg-gray-100 text-gray-600">
                            {h.referansTipi === 'gelir_kaydi' ? 'Alacak' :
                              h.referansTipi === 'odeme_kaydi' ? 'Borç' :
                              h.referansTipi === 'transfer' ? 'Transfer' :
                              h.referansTipi === 'sifirla' ? 'Sıfırlama' : 'Manuel'}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-2.5">
                        <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${h.tip === 'giris' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                          {h.tip === 'giris' ? 'Giriş' : 'Çıkış'}
                        </span>
                      </td>
                      <td className={`px-4 py-2.5 text-right font-semibold ${h.tip === 'giris' ? 'text-green-700' : 'text-red-600'}`}>
                        {h.tip === 'giris' ? '+' : '-'}{paraFormat(Number(h.tutar))}
                      </td>
                      <td className="px-3 py-2.5 text-right">
                        {h.dekontUrl && (
                          <button
                            onClick={() => setDekontGoruntulenecek(h.dekontUrl!)}
                            className="inline-flex items-center gap-1 rounded px-2 py-1 text-xs font-medium text-blue-600 hover:bg-blue-50"
                            title="Dekontu görüntüle"
                          >
                            📎 Dekont
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
            <SayfaKontrol
              mevcutSayfa={harSayfa}
              sayfaSayisi={Math.ceil(harToplam / 15)}
              toplam={harToplam}
              onDegis={setHarSayfa}
              yukleniyor={harYukleniyor}
            />
          </div>

          {/* Mobil kart listesi */}
          <div className="md:hidden">
            {harYukleniyor && harHareketler.length === 0 ? (
              <div className="flex items-center justify-center py-12 text-gray-400 text-sm">Yükleniyor...</div>
            ) : harHareketler.length === 0 ? (
              <div className="flex items-center justify-center py-12 text-gray-400 text-sm">
                {harToplam === 0 && !harArama && harTip === 'tumu' && !harBaslangic && !harBitis && !harHesapId ? 'Henüz hareket yok' : 'Filtre sonucu bulunamadı'}
              </div>
            ) : (
              <div className={`space-y-3 ${harYukleniyor ? 'opacity-60' : ''}`}>
                {harHareketler.map((h) => (
                  <div key={h.id} className="rounded-2xl bg-white border border-gray-100 shadow-sm overflow-hidden">
                    <div className="px-4 pt-3 pb-3 flex items-start gap-3">
                      <span className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 mt-0.5 ${h.tip === 'giris' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        {h.tip === 'giris' ? '↓' : '↑'}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-800 truncate">{h.aciklama}</p>
                        <div className="flex items-center gap-2 mt-1 flex-wrap">
                          <span className="text-xs text-gray-500">{h.hesapAdi}</span>
                          <span className="text-xs text-gray-400">{new Date(h.tarih).toLocaleDateString('tr-TR')}</span>
                          {h.referansTipi && (
                            <span className="inline-flex rounded px-1.5 py-0.5 text-xs bg-gray-100 text-gray-600">
                              {h.referansTipi === 'gelir_kaydi' ? 'Alacak' :
                                h.referansTipi === 'odeme_kaydi' ? 'Borç' :
                                h.referansTipi === 'transfer' ? 'Transfer' :
                                h.referansTipi === 'sifirla' ? 'Sıfırlama' : 'Manuel'}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <p className={`text-base font-bold ${h.tip === 'giris' ? 'text-green-700' : 'text-red-600'}`}>
                          {h.tip === 'giris' ? '+' : '-'}{paraFormat(Number(h.tutar))}
                        </p>
                        <span className={`text-xs font-medium ${h.tip === 'giris' ? 'text-green-600' : 'text-red-500'}`}>
                          {h.tip === 'giris' ? 'Giriş' : 'Çıkış'}
                        </span>
                      </div>
                    </div>
                    {h.dekontUrl && (
                      <div className="border-t border-gray-100 flex">
                        <button
                          onClick={() => setDekontGoruntulenecek(h.dekontUrl!)}
                          className="flex-1 py-2.5 text-sm font-medium text-blue-600 hover:bg-blue-50 active:scale-95 transition-transform"
                        >
                          📎 Dekontu Görüntüle
                        </button>
                      </div>
                    )}
                  </div>
                ))}
                <SayfaKontrol
                  mevcutSayfa={harSayfa}
                  sayfaSayisi={Math.ceil(harToplam / 15)}
                  toplam={harToplam}
                  onDegis={setHarSayfa}
                  yukleniyor={harYukleniyor}
                />
              </div>
            )}
          </div>
        </div>
      )}

      </div>{/* /px-4 py-4 */}

      {/* Modaller */}
      {hesapFormuAcik && (
        <HesapFormu
          mevcut={duzenlenecekHesap}
          onKaydet={() => { setHesapFormuAcik(false); setDuzenlenecekHesap(undefined); hesaplariGetir(); }}
          onKapat={() => { setHesapFormuAcik(false); setDuzenlenecekHesap(undefined); }}
        />
      )}

      {islemFormuAcik && (
        <IslemFormu
          hesaplar={hesaplar}
          baslangicHesapId={islemBaslangicHesapId}
          onKaydet={() => { setIslemFormuAcik(false); tumunuYenile(); }}
          onKapat={() => setIslemFormuAcik(false)}
        />
      )}

      {sifirlaHesap && (
        <FarkHesabiSifirlaFormu
          hesap={sifirlaHesap}
          onKaydet={() => { setSifirlaHesap(undefined); tumunuYenile(); }}
          onKapat={() => setSifirlaHesap(undefined)}
        />
      )}

      {dekontGoruntulenecek && (
        <DekontGoruntuleyici
          url={dekontGoruntulenecek}
          onKapat={() => setDekontGoruntulenecek(null)}
        />
      )}
    </div>
  );
}
