'use client';

import { useCallback, useEffect, useState } from 'react';
import HasatDonemiFormu from '@/components/hasat/HasatDonemiFormu';
import SurgunFormu from '@/components/hasat/SurgunFormu';
import HasatGirisFormu from '@/components/hasat/HasatGirisFormu';
import HasatCiftciSecimModal from '@/components/hasat/HasatCiftciSecimModal';
import BudamaBilgisiFormu from '@/components/hasat/BudamaBilgisiFormu';
import BudamaOdemeModal from '@/components/hasat/BudamaOdemeModal';
import DesteklemeOdemeModal from '@/components/hasat/DesteklemeOdemeModal';

// ---- Tipler ----

type Surgun = {
  id: string;
  surgunNo: number;
  surgunAdi: string;
  baslangicTarihi: string;
  bitisTarihi: string | null;
  durum: 'aktif' | 'kapali';
  toplamHasatKg: string;
  toplamTutar: string;
};

type HasatDonemKesinti = {
  id: string;
  kesintiAdi: string;
  yuzde: number;
};

type HasatDonemi = {
  id: string;
  donemAdi: string;
  yil: number;
  baslangicTarihi: string;
  bitisTarihi: string | null;
  durum: 'aktif' | 'kapali';
  brutFiyat: number | null;
  netFiyat: number | null;
  desteklemeMiktari: number | null;
  toplamHasatKg: number | null;
  desteklemeAlacakTutar: number | null;
  desteklemeOdemeDurumu: string | null;
  desteklemeOdenenTutar: number;
  desteklemeKalanTutar: number | null;
  desteklemeOdemeler: { id: string; tutar: number; tarih: string; aciklama: string | null }[];
  surgunler: Surgun[];
  kesintiler: HasatDonemKesinti[];
};

type Tarla = {
  id: string;
  tarlaAdi: string;
  ciftci: { id: string; adSoyad: string };
};

type Ekip = {
  id: string;
  ekipAdi: string;
};

type Musteri = {
  id: string;
  musteriAdi: string;
};

type HasatGirisi = {
  id: string;
  surgunId: string;
  tarih: string;
  tartimMiktariKg: string;
  satisMiktariKg: string;
  toplanmaTuru: 'tarla_sahibi' | 'isci';
  iscilikToplamTutar: string | null;
  odemeTuru: string | null;
  notlar: string | null;
  aciklama: string | null;
  cuzdanKullaniciId: string | null;
  satisBenimMi: boolean | null;
  cuzdanKullanici?: { id: string; ad: string } | null;
  tarla: Tarla;
  isciEkip: Ekip | null;
  musteri: Musteri;
};

type DonemCiftci = {
  id: string;
  ciftciId: string;
  ciftci: { adSoyad: string; cayKurNo: string | null };
  ciftciToplamDonum: number;
  toplamDonum: number | null;
  budamaBilgisi: BudamaKayit | null;
};

type BudamaOdeme = {
  id: string;
  tutar: number;
  tarih: string;
  aciklama: string | null;
};

type BudamaKayit = {
  id: string;
  ciftciId: string;
  toplamDonum: number;
  budananDonum: number;
  budananM2: number;
  brutFiyat: number;
  hesaplananTutar: number;
  odemeDurumu: string;
  odenenTutar: number;
  kalanTutar: number;
  notlar: string | null;
  ciftci: { adSoyad: string; cayKurNo: string | null };
  odemeler: BudamaOdeme[];
};

// ---- Yardımcı ----

const ODEME_DURUM_RENK: Record<string, string> = {
  odeme_bekleniyor: 'bg-orange-100 text-orange-700',
  kismi_odendi: 'bg-blue-100 text-blue-700',
  odendi: 'bg-green-100 text-green-700',
};
const ODEME_DURUM_ETIKET: Record<string, string> = {
  odeme_bekleniyor: 'Bekliyor',
  kismi_odendi: 'Kısmi Ödendi',
  odendi: 'Ödendi',
};

// ---- Ana Bileşen ----

export default function HasatSayfasi() {
  const [aktifSekme, setAktifSekme] = useState<'donemler' | 'girisler' | 'budama' | 'eskiDonemler'>('donemler');
  const [donemler, setDonemler] = useState<HasatDonemi[]>([]);
  const [yukleniyor, setYukleniyor] = useState(true);
  const [acikSurgunId, setAcikSurgunId] = useState<string | null>(null);
  const [surgunGirisleri, setSurgunGirisleri] = useState<Record<string, HasatGirisi[]>>({});
  const [girisYukleniyor, setGirisYukleniyor] = useState<Record<string, boolean>>({});

  const [donemFormuAcik, setDonemFormuAcik] = useState(false);
  const [surgunFormuAcik, setSurgunFormuAcik] = useState(false);
  const [girisFormuAcik, setGirisFormuAcik] = useState(false);
  const [islemYapiliyor, setIslemYapiliyor] = useState(false);
  const [silOnayId, setSilOnayId] = useState<string | null>(null);
  const [siliniyor, setSiliniyor] = useState(false);

  // Kesinti yönetimi
  const [kesintiDuzenleAcik, setKesintiDuzenleAcik] = useState(false);
  const [kesintiForm, setKesintiForm] = useState({ kesintiAdi: '', yuzde: '' });
  const [kesintiKaydediliyor, setKesintiKaydediliyor] = useState(false);

  // Çiftçi seçim
  const [ciftciSecimAcik, setCiftciSecimAcik] = useState(false);
  const [donemCiftciler, setDonemCiftciler] = useState<DonemCiftci[]>([]);
  const [ciftcilerYukleniyor, setCiftcilerYukleniyor] = useState(false);

  // Budama
  const [budamaFormuAcik, setBudamaFormuAcik] = useState(false);
  const [budamalar, setBudamalar] = useState<BudamaKayit[]>([]);
  const [budamaYukleniyor, setBudamaYukleniyor] = useState(false);
  const [budamaOdemeModal, setBudamaOdemeModal] = useState<{
    budamaId: string;
    ciftciAdi: string;
    kalanTutar: number;
  } | null>(null);
  const [desteklemeOdemeModal, setDesteklemeOdemeModal] = useState<{
    donemId: string;
    donemAdi: string;
    kalanTutar: number;
  } | null>(null);

  const donemleriGetir = useCallback(async () => {
    setYukleniyor(true);
    try {
      const yanit = await fetch('/api/hasat-donemleri');
      const veri = await yanit.json();
      setDonemler(Array.isArray(veri) ? veri : []);
    } finally {
      setYukleniyor(false);
    }
  }, []);

  useEffect(() => {
    donemleriGetir();
  }, [donemleriGetir]);

  const aktifDonem = donemler.find((d) => d.durum === 'aktif');
  const aktifSurgun = aktifDonem?.surgunler.find((s) => s.durum === 'aktif');
  const kapaliDonemler = donemler.filter((d) => d.durum === 'kapali');

  // Dönem çiftçilerini yükle
  const donemCiftcileriniGetir = useCallback(async (donemId: string) => {
    setCiftcilerYukleniyor(true);
    try {
      const yanit = await fetch(`/api/hasat-donemleri/${donemId}/ciftciler`);
      const veri = await yanit.json();
      setDonemCiftciler(Array.isArray(veri) ? veri : []);
    } finally {
      setCiftcilerYukleniyor(false);
    }
  }, []);

  // Budama kayıtlarını yükle
  const budamalariGetir = useCallback(async (donemId: string) => {
    setBudamaYukleniyor(true);
    try {
      const yanit = await fetch(`/api/hasat-donemleri/${donemId}/budama`);
      const veri = await yanit.json();
      setBudamalar(Array.isArray(veri) ? veri : []);
    } finally {
      setBudamaYukleniyor(false);
    }
  }, []);

  // Budama sekmesine geçince yükle
  useEffect(() => {
    if (aktifSekme === 'budama' && aktifDonem) {
      donemCiftcileriniGetir(aktifDonem.id);
      budamalariGetir(aktifDonem.id);
    }
  }, [aktifSekme, aktifDonem, donemCiftcileriniGetir, budamalariGetir]);

  async function surgunGirisleriniGetir(surgunId: string) {
    setGirisYukleniyor((onceki) => ({ ...onceki, [surgunId]: true }));
    try {
      const yanit = await fetch(`/api/hasat-girisleri?surgunId=${surgunId}`);
      const veri = await yanit.json();
      setSurgunGirisleri((onceki) => ({ ...onceki, [surgunId]: veri }));
    } finally {
      setGirisYukleniyor((onceki) => ({ ...onceki, [surgunId]: false }));
    }
  }

  function surgunToggle(surgunId: string) {
    if (acikSurgunId === surgunId) {
      setAcikSurgunId(null);
    } else {
      setAcikSurgunId(surgunId);
      if (!surgunGirisleri[surgunId]) surgunGirisleriniGetir(surgunId);
    }
  }

  async function donemiKapat(donemId: string) {
    if (!confirm('Dönemi kapatmak istediğinizden emin misiniz? Tüm aktif sürgünler de kapatılacaktır.')) return;
    setIslemYapiliyor(true);
    try {
      const yanit = await fetch(`/api/hasat-donemleri/${donemId}/kapat`, { method: 'POST' });
      if (!yanit.ok) { const v = await yanit.json(); alert(v.hata ?? 'Dönem kapatılamadı'); return; }
      await donemleriGetir();
    } finally {
      setIslemYapiliyor(false);
    }
  }

  async function surgunuKapat(surgunId: string) {
    if (!confirm('Sürgünü kapatmak istediğinizden emin misiniz?')) return;
    setIslemYapiliyor(true);
    try {
      const yanit = await fetch(`/api/surgunler/${surgunId}/kapat`, { method: 'POST' });
      if (!yanit.ok) { const v = await yanit.json(); alert(v.hata ?? 'Sürgün kapatılamadı'); return; }
      await donemleriGetir();
    } finally {
      setIslemYapiliyor(false);
    }
  }

  async function girisiniSil(girisId: string, surgunId: string) {
    setSiliniyor(true);
    try {
      const yanit = await fetch(`/api/hasat-girisleri/${girisId}`, { method: 'DELETE' });
      if (!yanit.ok) { const v = await yanit.json(); alert(v.hata ?? 'Giriş silinemedi'); return; }
      setSilOnayId(null);
      await surgunGirisleriniGetir(surgunId);
      await donemleriGetir();
    } finally {
      setSiliniyor(false);
    }
  }

  async function kesintiEkle() {
    if (!aktifDonem || !kesintiForm.kesintiAdi || !kesintiForm.yuzde) return;
    setKesintiKaydediliyor(true);
    try {
      const yanit = await fetch(`/api/hasat-donemleri/${aktifDonem.id}/kesintiler`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(kesintiForm),
      });
      if (yanit.ok) {
        setKesintiForm({ kesintiAdi: '', yuzde: '' });
        setKesintiDuzenleAcik(false);
        await donemleriGetir();
      }
    } finally {
      setKesintiKaydediliyor(false);
    }
  }

  async function kesintiSil(kesintiId: string) {
    if (!aktifDonem) return;
    await fetch(`/api/hasat-donemleri/${aktifDonem.id}/kesintiler/${kesintiId}`, {
      method: 'DELETE',
    });
    await donemleriGetir();
  }

  async function ciftciCikar(donemCiftciId: string) {
    if (!confirm('Bu çiftçiyi dönemden çıkarmak istiyor musunuz?')) return;
    if (!aktifDonem) return;
    await fetch(`/api/hasat-donemleri/${aktifDonem.id}/ciftciler?donemCiftciId=${donemCiftciId}`, {
      method: 'DELETE',
    });
    donemCiftcileriniGetir(aktifDonem.id);
  }

  async function budamaKaydiSil(budamaId: string) {
    if (!confirm('Bu budama kaydını silmek istiyor musunuz?')) return;
    if (!aktifDonem) return;
    await fetch(`/api/hasat-donemleri/${aktifDonem.id}/budama`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ budamaId }),
    });
    budamalariGetir(aktifDonem.id);
  }

  function formKaydedildi() {
    setDonemFormuAcik(false);
    setSurgunFormuAcik(false);
    setGirisFormuAcik(false);
    donemleriGetir();
    if (acikSurgunId) surgunGirisleriniGetir(acikSurgunId);
  }

  function tarihFormati(tarih: string) {
    return new Date(tarih).toLocaleDateString('tr-TR');
  }

  function sayiFormati(sayi: string | number) {
    return Number(sayi).toLocaleString('tr-TR', { minimumFractionDigits: 2 });
  }

  const budamaToplamTutar = budamalar.reduce((s, b) => s + b.hesaplananTutar, 0);
  const budamaToplamOdenen = budamalar.reduce((s, b) => s + b.odenenTutar, 0);
  const budamaToplamKalan = budamalar.reduce((s, b) => s + b.kalanTutar, 0);

  // Sekme tanımları
  const sekmeler = [
    { key: 'donemler', label: 'Aktif Dönem' },
    { key: 'girisler', label: 'Hasat Girişleri' },
    ...(aktifDonem ? [{ key: 'budama', label: 'Budama Takibi' }] : []),
    ...(kapaliDonemler.length > 0 ? [{ key: 'eskiDonemler', label: `Eski Dönemler (${kapaliDonemler.length})` }] : []),
  ] as { key: 'donemler' | 'girisler' | 'budama' | 'eskiDonemler'; label: string }[];

  return (
    <div className="min-h-full bg-gray-50">

      {/* ── Sticky üst bar ── */}
      <div className="sticky top-0 z-20 bg-white border-b border-gray-200 shadow-sm">
        {/* Başlık satırı */}
        <div className="flex items-center justify-between px-4 pt-4 pb-3">
          <div>
            <h1 className="text-xl font-bold text-gray-900 leading-tight">Hasat Yönetimi</h1>
            <p className="text-xs text-gray-500 mt-0.5">
              {aktifDonem ? `Aktif: ${aktifDonem.donemAdi}` : kapaliDonemler.length > 0 ? 'Aktif dönem yok' : 'Henüz hasat dönemi yok'}
            </p>
          </div>

          {/* Sağ taraf — sekmeye göre hızlı eylem butonu */}
          <div className="flex gap-2">
            {aktifSekme === 'budama' && aktifDonem && (
              <>
                <button
                  onClick={() => setCiftciSecimAcik(true)}
                  className="flex items-center justify-center min-h-[44px] rounded-xl border border-green-300 bg-green-50 px-3 text-sm font-medium text-green-700 active:bg-green-100"
                >
                  + Çiftçi
                </button>
                <button
                  onClick={() => setBudamaFormuAcik(true)}
                  className="flex items-center justify-center min-h-[44px] rounded-xl bg-green-600 px-3 text-sm font-medium text-white active:bg-green-700"
                >
                  + Budama
                </button>
              </>
            )}
            {aktifSekme === 'girisler' && (
              <>
                {aktifSurgun && (
                  <button
                    onClick={() => setGirisFormuAcik(true)}
                    className="flex items-center justify-center min-h-[44px] rounded-xl bg-green-600 px-4 text-sm font-medium text-white active:bg-green-700"
                  >
                    + Giriş
                  </button>
                )}
                {aktifDonem && !aktifSurgun && (
                  <button
                    onClick={() => setSurgunFormuAcik(true)}
                    className="flex items-center justify-center min-h-[44px] rounded-xl bg-amber-600 px-4 text-sm font-medium text-white active:bg-amber-700"
                  >
                    + Sürgün
                  </button>
                )}
              </>
            )}
            {aktifSekme === 'donemler' && !aktifDonem && (
              <button
                onClick={() => setDonemFormuAcik(true)}
                className="flex items-center justify-center min-h-[44px] rounded-xl bg-green-600 px-4 text-sm font-medium text-white active:bg-green-700"
              >
                + Dönem
              </button>
            )}
          </div>
        </div>

        {/* Sekme navigasyonu — mobilde yatay scroll, masaüstünde normal */}
        <div className="overflow-x-auto">
          <div className="flex min-w-max border-t border-gray-100 md:min-w-0">
            {sekmeler.map((s) => (
              <button
                key={s.key}
                onClick={() => setAktifSekme(s.key)}
                className={`flex-1 min-w-[120px] md:min-w-0 py-3 px-4 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                  aktifSekme === s.key
                    ? 'border-green-600 text-green-700 bg-green-50'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── İçerik ── */}
      <div className="px-4 py-5 space-y-4 pb-20">

        {/* ============================================================
            SEKME: HASAT DÖNEMLERİ
        ============================================================ */}
        {aktifSekme === 'donemler' && (
          <>
            {yukleniyor ? (
              <div className="flex flex-col items-center justify-center py-24 gap-3">
                <div className="w-8 h-8 border-4 border-green-500 border-t-transparent rounded-full animate-spin" />
                <p className="text-sm text-gray-400">Yükleniyor...</p>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Aktif dönem — öne çıkarılmış */}
                {aktifDonem && (
                  <div className="rounded-2xl border-2 border-green-300 bg-green-50 overflow-hidden">
                    <div className="px-4 pt-4 pb-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="inline-flex rounded-full bg-green-500 px-2 py-0.5 text-xs font-bold text-white">Aktif</span>
                            <h2 className="text-base font-bold text-gray-900 truncate">{aktifDonem.donemAdi}</h2>
                            <span className="text-sm text-gray-500">({aktifDonem.yil})</span>
                          </div>
                          <p className="mt-1 text-xs text-gray-500">
                            Başlangıç: {tarihFormati(aktifDonem.baslangicTarihi)}
                            {' · '}{aktifDonem.surgunler.length} sürgün
                          </p>
                          {aktifSurgun && (
                            <p className="mt-0.5 text-xs font-medium text-green-700">Aktif Sürgün: {aktifSurgun.surgunAdi}</p>
                          )}
                        </div>
                        <div className="flex flex-col gap-1.5 shrink-0">
                          {!aktifSurgun && (
                            <button
                              onClick={() => setSurgunFormuAcik(true)}
                              className="flex items-center justify-center min-h-[36px] rounded-lg bg-amber-100 px-3 text-xs font-medium text-amber-700 active:bg-amber-200"
                            >
                              + Sürgün Aç
                            </button>
                          )}
                          <button
                            onClick={() => donemiKapat(aktifDonem.id)}
                            disabled={islemYapiliyor}
                            className="flex items-center justify-center min-h-[36px] rounded-lg bg-white px-3 text-xs font-medium text-red-600 ring-1 ring-red-200 active:bg-red-50 disabled:opacity-50"
                          >
                            Dönemi Kapat
                          </button>
                        </div>
                      </div>

                      {/* Fiyat etiketleri */}
                      <div className="mt-3 flex flex-wrap gap-2">
                        {aktifDonem.brutFiyat ? (
                          <span className="rounded-full bg-white border border-green-200 px-2 py-0.5 text-xs text-green-700 font-medium">
                            Brüt: ₺{Number(aktifDonem.brutFiyat).toFixed(4)}/kg
                          </span>
                        ) : (
                          <span className="rounded-full bg-orange-50 border border-orange-200 px-2 py-0.5 text-xs text-orange-600">
                            Brüt fiyat girilmemiş
                          </span>
                        )}
                        {aktifDonem.kesintiler.map((k) => (
                          <span
                            key={k.id}
                            className="group flex items-center gap-1 rounded-full bg-red-50 border border-red-200 px-2 py-0.5 text-xs text-red-600"
                          >
                            {k.kesintiAdi} %{Number(k.yuzde).toLocaleString('tr-TR', { maximumFractionDigits: 4 })}
                            <button
                              onClick={() => kesintiSil(k.id)}
                              className="ml-0.5 opacity-0 group-hover:opacity-100 hover:text-red-800 transition-opacity"
                              title="Kesinti sil"
                            >
                              ×
                            </button>
                          </span>
                        ))}
                        {aktifDonem.netFiyat && (
                          <span className="rounded-full bg-white border border-blue-200 px-2 py-0.5 text-xs text-blue-700 font-medium">
                            Net: ₺{Number(aktifDonem.netFiyat).toFixed(4)}/kg
                          </span>
                        )}
                        {aktifDonem.desteklemeMiktari && (
                          <span className="rounded-full bg-white border border-purple-200 px-2 py-0.5 text-xs text-purple-700 font-medium">
                            Destekleme: +₺{Number(aktifDonem.desteklemeMiktari).toFixed(4)}/kg
                          </span>
                        )}
                        {/* Kesinti ekle */}
                        {kesintiDuzenleAcik ? (
                          <div className="flex items-center gap-1.5 rounded-lg border border-gray-300 bg-white px-2 py-1">
                            <input
                              type="text"
                              value={kesintiForm.kesintiAdi}
                              onChange={(e) => setKesintiForm((p) => ({ ...p, kesintiAdi: e.target.value }))}
                              placeholder="Kesinti adı"
                              className="w-28 text-xs border-none outline-none"
                              autoFocus
                            />
                            <div className="relative w-14">
                              <input
                                type="number"
                                value={kesintiForm.yuzde}
                                onChange={(e) => setKesintiForm((p) => ({ ...p, yuzde: e.target.value }))}
                                placeholder="0.00"
                                min="0"
                                max="100"
                                step="0.0001"
                                className="w-full text-xs border-none outline-none pr-3"
                              />
                              <span className="absolute right-0 top-0 text-xs text-gray-400">%</span>
                            </div>
                            <button
                              onClick={kesintiEkle}
                              disabled={kesintiKaydediliyor}
                              className="rounded bg-green-600 px-1.5 py-0.5 text-xs text-white active:bg-green-700 disabled:opacity-50"
                            >
                              {kesintiKaydediliyor ? '...' : 'Ekle'}
                            </button>
                            <button
                              onClick={() => { setKesintiDuzenleAcik(false); setKesintiForm({ kesintiAdi: '', yuzde: '' }); }}
                              className="text-xs text-gray-400 hover:text-gray-600"
                            >
                              ✕
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setKesintiDuzenleAcik(true)}
                            className="rounded-full border border-dashed border-gray-300 px-2 py-0.5 text-xs text-gray-400 hover:border-green-400 hover:text-green-600 transition-colors"
                          >
                            + Kesinti
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Aktif sürgün özet kutusu */}
                    {aktifSurgun && (
                      <div className="mx-4 mb-4 rounded-xl border border-green-200 bg-white p-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-semibold text-gray-800 text-sm">{aktifSurgun.surgunAdi}</p>
                            <p className="text-xs text-gray-500 mt-0.5">Başlangıç: {tarihFormati(aktifSurgun.baslangicTarihi)}</p>
                          </div>
                          <div className="flex items-center gap-3">
                            <div className="text-right">
                              <p className="text-xs text-gray-400">Toplam Hasat</p>
                              <p className="text-sm font-bold text-gray-800">{sayiFormati(aktifSurgun.toplamHasatKg)} kg</p>
                            </div>
                            <button
                              onClick={() => surgunuKapat(aktifSurgun.id)}
                              disabled={islemYapiliyor}
                              className="flex items-center justify-center min-h-[36px] rounded-lg border border-gray-200 px-3 text-xs font-medium text-gray-600 active:bg-gray-100 disabled:opacity-50"
                            >
                              Sürgünü Kapat
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Aktif dönemler listesi — kapalılar gizli */}
                <div>
                  {!aktifDonem && (
                    <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-gray-200 py-12 text-center">
                      <span className="text-4xl mb-3">🌿</span>
                      <p className="text-base font-semibold text-gray-600">Aktif hasat dönemi yok</p>
                      <p className="mt-1 text-sm text-gray-400">Yeni bir dönem başlatın veya eski dönemlere göz atın</p>
                      <button
                        onClick={() => setDonemFormuAcik(true)}
                        className="mt-5 flex items-center justify-center min-h-[44px] rounded-xl bg-green-600 px-6 text-sm font-medium text-white active:bg-green-700"
                      >
                        + Yeni Dönem Başlat
                      </button>
                    </div>
                  )}
                  <div className="space-y-3">
                    {donemler.filter((d) => d.durum === 'aktif').map((donem) => (
                      <div key={donem.id} className="rounded-2xl border bg-white shadow-sm overflow-hidden">

                        {/* Dönem başlık */}
                        <div className="px-4 py-3">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${donem.durum === 'aktif' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                                  {donem.durum === 'aktif' ? 'Aktif' : 'Kapalı'}
                                </span>
                                <h3 className="font-semibold text-gray-800 text-sm">{donem.donemAdi}</h3>
                                <span className="text-xs text-gray-400">{donem.yil}</span>
                              </div>
                              <p className="mt-0.5 text-xs text-gray-500">
                                {tarihFormati(donem.baslangicTarihi)}
                                {donem.bitisTarihi && ` — ${tarihFormati(donem.bitisTarihi)}`}
                                {' · '}{donem.surgunler.length} sürgün
                                {donem.brutFiyat && ` · Brüt: ₺${Number(donem.brutFiyat).toFixed(4)}`}
                                {donem.netFiyat && ` · Net: ₺${Number(donem.netFiyat).toFixed(4)}`}
                                {donem.kesintiler?.length > 0 && ` · ${donem.kesintiler.length} kesinti`}
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* Destekleme alacak kartı — sadece kapalı dönem ve alacak varsa */}
                        {donem.durum === 'kapali' && donem.desteklemeAlacakTutar && (
                          <div className="border-t px-4 py-3 bg-purple-50">
                            <p className="text-xs font-bold text-purple-700 uppercase tracking-wide mb-2">
                              Devlet Destekleme Alacağı
                            </p>

                            {/* Mobil: dikey yığın */}
                            <div className="space-y-1 md:hidden">
                              <div className="flex justify-between text-sm">
                                <span className="text-gray-500">Toplam Hasat</span>
                                <span className="font-semibold text-gray-800">
                                  {donem.toplamHasatKg
                                    ? `${Number(donem.toplamHasatKg).toLocaleString('tr-TR', { minimumFractionDigits: 2 })} kg`
                                    : '—'}
                                </span>
                              </div>
                              <div className="flex justify-between text-sm">
                                <span className="text-gray-500">Birim</span>
                                <span className="font-semibold text-gray-800">₺{Number(donem.desteklemeMiktari).toFixed(4)}/kg</span>
                              </div>
                              <div className="flex justify-between text-sm">
                                <span className="text-purple-600 font-semibold">Toplam Alacak</span>
                                <span className="font-bold text-purple-700">
                                  ₺{Number(donem.desteklemeAlacakTutar).toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
                                </span>
                              </div>
                              <div className="flex justify-between text-xs">
                                <span className="text-green-600">Ödenen: ₺{Number(donem.desteklemeOdenenTutar).toLocaleString('tr-TR', { minimumFractionDigits: 2 })}</span>
                                <span className={donem.desteklemeKalanTutar && donem.desteklemeKalanTutar > 0 ? 'text-red-600 font-medium' : 'text-green-600 font-medium'}>
                                  Kalan: ₺{Number(donem.desteklemeKalanTutar ?? 0).toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
                                </span>
                              </div>
                              <div className="flex items-center justify-between mt-2">
                                <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                                  donem.desteklemeOdemeDurumu === 'odendi' ? 'bg-green-100 text-green-700' :
                                  donem.desteklemeOdemeDurumu === 'kismi_odendi' ? 'bg-blue-100 text-blue-700' :
                                  'bg-orange-100 text-orange-700'
                                }`}>
                                  {donem.desteklemeOdemeDurumu === 'odendi' ? 'Ödendi' :
                                   donem.desteklemeOdemeDurumu === 'kismi_odendi' ? 'Kısmi Ödendi' : 'Bekliyor'}
                                </span>
                                {donem.desteklemeOdemeDurumu !== 'odendi' && (
                                  <button
                                    onClick={() => setDesteklemeOdemeModal({
                                      donemId: donem.id,
                                      donemAdi: donem.donemAdi,
                                      kalanTutar: Number(donem.desteklemeKalanTutar ?? donem.desteklemeAlacakTutar),
                                    })}
                                    className="flex items-center justify-center min-h-[36px] rounded-lg bg-purple-600 px-4 text-xs font-medium text-white active:bg-purple-700"
                                  >
                                    Ödeme Kaydet
                                  </button>
                                )}
                              </div>
                            </div>

                            {/* Masaüstü: yatay yerleşim */}
                            <div className="hidden md:flex items-start justify-between gap-4">
                              <div className="flex-1">
                                <div className="flex flex-wrap gap-x-6 gap-y-1 text-sm">
                                  <span className="text-gray-600">
                                    Toplam Hasat: <strong>{donem.toplamHasatKg ? Number(donem.toplamHasatKg).toLocaleString('tr-TR', { minimumFractionDigits: 2 }) : '—'} kg</strong>
                                  </span>
                                  <span className="text-gray-600">
                                    Birim: <strong>₺{Number(donem.desteklemeMiktari).toFixed(4)}/kg</strong>
                                  </span>
                                  <span className="text-purple-700 font-semibold">
                                    Toplam Alacak: ₺{Number(donem.desteklemeAlacakTutar).toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
                                  </span>
                                </div>
                                <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs mt-1.5">
                                  <span className="text-green-600">
                                    Ödenen: ₺{Number(donem.desteklemeOdenenTutar).toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
                                  </span>
                                  <span className={donem.desteklemeKalanTutar && donem.desteklemeKalanTutar > 0 ? 'text-red-600 font-medium' : 'text-green-600 font-medium'}>
                                    Kalan: ₺{Number(donem.desteklemeKalanTutar ?? 0).toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
                                  </span>
                                  <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                                    donem.desteklemeOdemeDurumu === 'odendi' ? 'bg-green-100 text-green-700' :
                                    donem.desteklemeOdemeDurumu === 'kismi_odendi' ? 'bg-blue-100 text-blue-700' :
                                    'bg-orange-100 text-orange-700'
                                  }`}>
                                    {donem.desteklemeOdemeDurumu === 'odendi' ? 'Ödendi' :
                                     donem.desteklemeOdemeDurumu === 'kismi_odendi' ? 'Kısmi Ödendi' : 'Bekliyor'}
                                  </span>
                                </div>
                                {donem.desteklemeOdemeler?.length > 0 && (
                                  <div className="mt-2 space-y-0.5">
                                    {donem.desteklemeOdemeler.map((odeme) => (
                                      <div key={odeme.id} className="flex justify-between text-xs text-gray-500">
                                        <span>{new Date(odeme.tarih).toLocaleDateString('tr-TR')} — {odeme.aciklama || 'Devlet ödemesi'}</span>
                                        <span className="font-medium text-green-700">+₺{Number(odeme.tutar).toLocaleString('tr-TR', { minimumFractionDigits: 2 })}</span>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                              {donem.desteklemeOdemeDurumu !== 'odendi' && (
                                <button
                                  onClick={() => setDesteklemeOdemeModal({
                                    donemId: donem.id,
                                    donemAdi: donem.donemAdi,
                                    kalanTutar: Number(donem.desteklemeKalanTutar ?? donem.desteklemeAlacakTutar),
                                  })}
                                  className="flex-shrink-0 flex items-center justify-center min-h-[36px] rounded-lg bg-purple-600 px-3 text-xs font-medium text-white active:bg-purple-700"
                                >
                                  Ödeme Kaydet
                                </button>
                              )}
                            </div>
                          </div>
                        )}

                        {/* Sürgünler listesi */}
                        {donem.surgunler.length > 0 && (
                          <div className="border-t divide-y divide-gray-100">
                            {donem.surgunler.map((surgun) => (
                              <div
                                key={surgun.id}
                                onClick={() => surgunToggle(surgun.id)}
                                className="flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-gray-50 active:bg-gray-100 transition-colors"
                              >
                                <div className="flex items-center gap-2">
                                  <span className="text-gray-400 text-xs">{acikSurgunId === surgun.id ? '▼' : '▶'}</span>
                                  <div>
                                    <div className="flex items-center gap-1.5 flex-wrap">
                                      <span className={`inline-flex rounded-full px-1.5 py-0.5 text-xs font-semibold ${surgun.durum === 'aktif' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                                        {surgun.durum === 'aktif' ? 'Aktif' : 'Kapalı'}
                                      </span>
                                      <span className="text-sm font-medium text-gray-800">{surgun.surgunAdi}</span>
                                    </div>
                                    <p className="text-xs text-gray-400 mt-0.5">
                                      {tarihFormati(surgun.baslangicTarihi)}
                                      {surgun.bitisTarihi && ` — ${tarihFormati(surgun.bitisTarihi)}`}
                                    </p>
                                  </div>
                                </div>
                                <div className="flex items-center gap-3">
                                  <div className="text-right">
                                    <p className="text-xs text-gray-400">Toplam</p>
                                    <p className="text-sm font-bold text-gray-800">{sayiFormati(surgun.toplamHasatKg)} kg</p>
                                  </div>
                                  {surgun.durum === 'aktif' && donem.durum === 'aktif' && (
                                    <button
                                      onClick={(e) => { e.stopPropagation(); surgunuKapat(surgun.id); }}
                                      disabled={islemYapiliyor}
                                      className="flex items-center justify-center min-h-[36px] rounded-lg border border-gray-200 px-2 text-xs font-medium text-gray-500 active:bg-gray-100 disabled:opacity-50"
                                    >
                                      Kapat
                                    </button>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </>
        )}

        {/* ============================================================
            SEKME: HASAT GİRİŞLERİ
        ============================================================ */}
        {aktifSekme === 'girisler' && (
          <>
            {yukleniyor ? (
              <div className="flex flex-col items-center justify-center py-24 gap-3">
                <div className="w-8 h-8 border-4 border-green-500 border-t-transparent rounded-full animate-spin" />
                <p className="text-sm text-gray-400">Yükleniyor...</p>
              </div>
            ) : !aktifDonem ? (
              <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-gray-200 py-20 text-center">
                <span className="text-4xl mb-3">📋</span>
                <p className="text-base font-semibold text-gray-600">Aktif dönem yok</p>
                <p className="mt-1 text-sm text-gray-400">Hasat girişi için önce bir dönem başlatın</p>
                <button
                  onClick={() => { setAktifSekme('donemler'); setDonemFormuAcik(true); }}
                  className="mt-5 flex items-center justify-center min-h-[44px] rounded-xl bg-green-600 px-6 text-sm font-medium text-white active:bg-green-700"
                >
                  + Yeni Dönem Başlat
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {/* Aktif dönem bilgi çubuğu */}
                <div className="rounded-xl bg-green-50 border border-green-200 px-4 py-3 flex items-center justify-between gap-2">
                  <div>
                    <span className="text-xs font-semibold text-green-700">{aktifDonem.donemAdi}</span>
                    {aktifSurgun ? (
                      <p className="text-xs text-gray-500 mt-0.5">Aktif Sürgün: <strong>{aktifSurgun.surgunAdi}</strong></p>
                    ) : (
                      <p className="text-xs text-orange-500 mt-0.5">Aktif sürgün yok — yeni sürgün açın</p>
                    )}
                  </div>
                  {aktifSurgun && (
                    <button
                      onClick={() => setGirisFormuAcik(true)}
                      className="flex items-center justify-center min-h-[40px] rounded-xl bg-green-600 px-4 text-xs font-medium text-white active:bg-green-700 shrink-0"
                    >
                      + Giriş Ekle
                    </button>
                  )}
                  {!aktifSurgun && (
                    <button
                      onClick={() => setSurgunFormuAcik(true)}
                      className="flex items-center justify-center min-h-[40px] rounded-xl bg-amber-600 px-4 text-xs font-medium text-white active:bg-amber-700 shrink-0"
                    >
                      + Sürgün Aç
                    </button>
                  )}
                </div>

                {/* Sadece aktif dönemlerin sürgünleri ve girişleri */}
                {donemler.filter((d) => d.durum === 'aktif').map((donem) => (
                  donem.surgunler.length > 0 && (
                    <div key={donem.id} className="space-y-2">
                      <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 px-1 pt-2">{donem.donemAdi} · {donem.yil}</p>
                      {donem.surgunler.map((surgun) => (
                        <div key={surgun.id} className="rounded-2xl border bg-white shadow-sm overflow-hidden">
                          {/* Sürgün başlık — tıklanabilir */}
                          <button
                            onClick={() => surgunToggle(surgun.id)}
                            className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-gray-50 active:bg-gray-100 transition-colors"
                          >
                            <div className="flex items-center gap-2">
                              <span className="text-gray-400 text-xs">{acikSurgunId === surgun.id ? '▼' : '▶'}</span>
                              <div>
                                <div className="flex items-center gap-1.5">
                                  <span className={`inline-flex rounded-full px-1.5 py-0.5 text-xs font-semibold ${surgun.durum === 'aktif' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                                    {surgun.durum === 'aktif' ? 'Aktif' : 'Kapalı'}
                                  </span>
                                  <span className="text-sm font-semibold text-gray-800">{surgun.surgunAdi}</span>
                                </div>
                                <p className="text-xs text-gray-400 mt-0.5">{tarihFormati(surgun.baslangicTarihi)}{surgun.bitisTarihi && ` — ${tarihFormati(surgun.bitisTarihi)}`}</p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="text-xs text-gray-400">Toplam Hasat</p>
                              <p className="text-sm font-bold text-gray-800">{sayiFormati(surgun.toplamHasatKg)} kg</p>
                            </div>
                          </button>

                          {/* Girişler paneli */}
                          {acikSurgunId === surgun.id && (
                            <div className="border-t bg-gray-50">
                              {girisYukleniyor[surgun.id] ? (
                                <div className="flex flex-col items-center justify-center py-10 gap-2">
                                  <div className="w-6 h-6 border-2 border-green-500 border-t-transparent rounded-full animate-spin" />
                                  <p className="text-xs text-gray-400">Girişler yükleniyor...</p>
                                </div>
                              ) : !surgunGirisleri[surgun.id] || surgunGirisleri[surgun.id].length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-10 text-center gap-1">
                                  <span className="text-2xl">🌱</span>
                                  <p className="text-sm text-gray-400">Bu sürgüne ait hasat girişi yok.</p>
                                  {surgun.durum === 'aktif' && donem.durum === 'aktif' && (
                                    <button
                                      onClick={() => { setAcikSurgunId(surgun.id); setGirisFormuAcik(true); }}
                                      className="mt-2 flex items-center justify-center min-h-[40px] rounded-xl bg-green-600 px-5 text-sm font-medium text-white active:bg-green-700"
                                    >
                                      İlk Girişi Ekle
                                    </button>
                                  )}
                                </div>
                              ) : (
                                <>
                                  {/* Mobil kart listesi */}
                                  <div className="md:hidden divide-y divide-gray-100">
                                    {surgunGirisleri[surgun.id].map((giris) => (
                                      <div key={giris.id} className="bg-white">
                                        <div className="px-4 pt-3 pb-2">
                                          <div className="flex items-start justify-between gap-2">
                                            <div className="flex-1 min-w-0">
                                              <p className="text-base font-bold text-gray-900 truncate">
                                                {giris.tarla?.tarlaAdi ?? <span className="italic text-gray-400">Kontenjan</span>}
                                              </p>
                                              <p className="text-xs text-gray-500 mt-0.5">
                                                {giris.tarla?.ciftci.adSoyad ?? '—'} · {giris.musteri.musteriAdi}
                                              </p>
                                            </div>
                                            <div className="text-right shrink-0">
                                              <p className="text-xs text-gray-400">Tartım / Satış</p>
                                              <p className="text-sm font-bold text-gray-800">
                                                {sayiFormati(giris.tartimMiktariKg)} / {sayiFormati(giris.satisMiktariKg)} kg
                                              </p>
                                            </div>
                                          </div>
                                          <div className="flex items-center gap-2 mt-2 flex-wrap">
                                            <span className="text-xs text-gray-400">{tarihFormati(giris.tarih)}</span>
                                            {giris.toplanmaTuru === 'tarla_sahibi' ? (
                                              <span className="inline-flex rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700">Tarla Sahibi</span>
                                            ) : (
                                              <span className="inline-flex rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">
                                                İşçi{giris.isciEkip && ` · ${giris.isciEkip.ekipAdi}`}
                                              </span>
                                            )}
                                            {giris.cuzdanKullaniciId && (
                                              <span className="inline-flex rounded-full bg-orange-100 px-2 py-0.5 text-xs font-medium text-orange-700">
                                                {giris.satisBenimMi ? `+${giris.cuzdanKullanici?.ad ?? '?'}` : `${giris.cuzdanKullanici?.ad ?? '?'} yaptı`}
                                              </span>
                                            )}
                                            {giris.iscilikToplamTutar && (
                                              <span className="text-xs text-gray-500">İşçilik: ₺{sayiFormati(giris.iscilikToplamTutar)}</span>
                                            )}
                                          </div>
                                          {giris.aciklama && (
                                            <p className="text-xs text-gray-500 mt-1 truncate">{giris.aciklama}</p>
                                          )}
                                        </div>
                                        {/* Alt aksiyon çubuğu */}
                                        <div className="flex border-t divide-x divide-gray-100">
                                          {silOnayId === giris.id ? (
                                            <>
                                              <button
                                                onClick={() => girisiniSil(giris.id, surgun.id)}
                                                disabled={siliniyor}
                                                className="flex-1 flex items-center justify-center min-h-[44px] text-sm font-medium text-red-600 active:bg-red-50 disabled:opacity-50"
                                              >
                                                {siliniyor ? '...' : 'Evet, Sil'}
                                              </button>
                                              <button
                                                onClick={() => setSilOnayId(null)}
                                                className="flex-1 flex items-center justify-center min-h-[44px] text-sm font-medium text-gray-500 active:bg-gray-50"
                                              >
                                                İptal
                                              </button>
                                            </>
                                          ) : (
                                            <button
                                              onClick={() => setSilOnayId(giris.id)}
                                              className="flex-1 flex items-center justify-center min-h-[44px] text-sm font-medium text-red-500 active:bg-red-50"
                                            >
                                              Sil
                                            </button>
                                          )}
                                        </div>
                                      </div>
                                    ))}
                                    {/* Toplam özet */}
                                    <div className="px-4 py-3 bg-gray-100 flex justify-between text-xs font-semibold text-gray-600">
                                      <span>TOPLAM</span>
                                      <span>
                                        {sayiFormati(surgunGirisleri[surgun.id].reduce((t, g) => t + Number(g.tartimMiktariKg), 0))} / {sayiFormati(surgunGirisleri[surgun.id].reduce((t, g) => t + Number(g.satisMiktariKg), 0))} kg
                                      </span>
                                    </div>
                                  </div>

                                  {/* Masaüstü tablosu */}
                                  <div className="hidden md:block overflow-x-auto m-4 rounded-xl border bg-white">
                                    <table className="w-full text-sm">
                                      <thead>
                                        <tr className="border-b bg-gray-50 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                                          <th className="px-4 py-2">Tarih</th>
                                          <th className="px-4 py-2">Tarla</th>
                                          <th className="px-4 py-2">Çiftçi</th>
                                          <th className="px-4 py-2">Müşteri</th>
                                          <th className="px-4 py-2">Tartım (kg)</th>
                                          <th className="px-4 py-2">Satış (kg)</th>
                                          <th className="px-4 py-2">Toplanma</th>
                                          <th className="px-4 py-2">Açıklama</th>
                                          <th className="px-4 py-2">İşçilik</th>
                                          <th className="px-4 py-2 text-right">İşlem</th>
                                        </tr>
                                      </thead>
                                      <tbody className="divide-y">
                                        {surgunGirisleri[surgun.id].map((giris) => (
                                          <tr key={giris.id} className="hover:bg-gray-50">
                                            <td className="px-4 py-2 text-gray-600">{tarihFormati(giris.tarih)}</td>
                                            <td className="px-4 py-2 font-medium text-gray-800">{giris.tarla?.tarlaAdi ?? <span className="text-gray-400 italic">Kontenjan</span>}</td>
                                            <td className="px-4 py-2 text-gray-600">{giris.tarla?.ciftci.adSoyad ?? '—'}</td>
                                            <td className="px-4 py-2 text-gray-600">{giris.musteri.musteriAdi}</td>
                                            <td className="px-4 py-2 text-gray-800">{sayiFormati(giris.tartimMiktariKg)}</td>
                                            <td className="px-4 py-2 text-gray-800">{sayiFormati(giris.satisMiktariKg)}</td>
                                            <td className="px-4 py-2">
                                              <div className="flex flex-col gap-1">
                                                {giris.toplanmaTuru === 'tarla_sahibi' ? (
                                                  <span className="inline-flex rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700">Tarla Sahibi</span>
                                                ) : (
                                                  <span className="inline-flex rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">
                                                    İşçi{giris.isciEkip && ` — ${giris.isciEkip.ekipAdi}`}
                                                  </span>
                                                )}
                                                {giris.cuzdanKullaniciId && (
                                                  <span className="inline-flex rounded-full bg-orange-100 px-2 py-0.5 text-xs font-medium text-orange-700">
                                                    {giris.satisBenimMi ? `+${giris.cuzdanKullanici?.ad ?? '?'} adına` : `${giris.cuzdanKullanici?.ad ?? '?'} yaptı`}
                                                  </span>
                                                )}
                                              </div>
                                            </td>
                                            <td className="px-4 py-2 text-gray-600 text-xs max-w-[160px]">
                                              {giris.aciklama ? (
                                                <span title={giris.aciklama} className="truncate block">
                                                  {giris.aciklama.length > 40 ? giris.aciklama.slice(0, 40) + '…' : giris.aciklama}
                                                </span>
                                              ) : '—'}
                                            </td>
                                            <td className="px-4 py-2 text-gray-600">
                                              {giris.iscilikToplamTutar ? `₺${sayiFormati(giris.iscilikToplamTutar)}` : '—'}
                                            </td>
                                            <td className="px-4 py-2 text-right">
                                              {silOnayId === giris.id ? (
                                                <span className="inline-flex gap-1">
                                                  <button onClick={() => girisiniSil(giris.id, surgun.id)} disabled={siliniyor} className="rounded px-2 py-1 text-xs font-medium text-red-600 hover:bg-red-50 disabled:opacity-50">
                                                    {siliniyor ? '...' : 'Evet, Sil'}
                                                  </button>
                                                  <button onClick={() => setSilOnayId(null)} className="rounded px-2 py-1 text-xs font-medium text-gray-500 hover:bg-gray-100">İptal</button>
                                                </span>
                                              ) : (
                                                <button onClick={() => setSilOnayId(giris.id)} className="rounded px-2 py-1 text-xs font-medium text-red-500 hover:bg-red-50">Sil</button>
                                              )}
                                            </td>
                                          </tr>
                                        ))}
                                      </tbody>
                                      <tfoot className="border-t bg-gray-50">
                                        <tr>
                                          <td colSpan={4} className="px-4 py-2 text-xs font-semibold text-gray-500">TOPLAM</td>
                                          <td className="px-4 py-2 text-sm font-bold text-gray-800">
                                            {sayiFormati(surgunGirisleri[surgun.id].reduce((t, g) => t + Number(g.tartimMiktariKg), 0))} kg
                                          </td>
                                          <td className="px-4 py-2 text-sm font-bold text-gray-800">
                                            {sayiFormati(surgunGirisleri[surgun.id].reduce((t, g) => t + Number(g.satisMiktariKg), 0))} kg
                                          </td>
                                          <td />
                                          <td className="px-4 py-2 text-sm font-bold text-gray-800">
                                            ₺{sayiFormati(surgunGirisleri[surgun.id].reduce((t, g) => t + Number(g.iscilikToplamTutar ?? 0), 0))}
                                          </td>
                                          <td />
                                        </tr>
                                      </tfoot>
                                    </table>
                                  </div>
                                </>
                              )}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )
                ))}
              </div>
            )}
          </>
        )}

        {/* ============================================================
            SEKME: ESKİ DÖNEMLER (KAPALI)
        ============================================================ */}
        {aktifSekme === 'eskiDonemler' && (
          <div className="space-y-4">
            <div className="rounded-xl bg-amber-50 border border-amber-200 px-4 py-3 flex items-center gap-2">
              <span className="text-amber-600 text-lg">📁</span>
              <div>
                <p className="text-sm font-medium text-amber-800">Kapalı Hasat Dönemleri</p>
                <p className="text-xs text-amber-600">{kapaliDonemler.length} dönem — salt okunur arşiv</p>
              </div>
            </div>

            {kapaliDonemler.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-gray-400">
                <span className="text-4xl mb-3">📂</span>
                <p className="text-sm">Henüz kapalı dönem yok</p>
              </div>
            ) : (
              <div className="space-y-3">
                {kapaliDonemler.map((donem) => (
                  <div key={donem.id} className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden opacity-90">
                    {/* Dönem başlık */}
                    <div className="px-4 py-3 bg-gray-50">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="inline-flex rounded-full bg-gray-200 px-2 py-0.5 text-xs font-semibold text-gray-600">
                              📁 Kapalı
                            </span>
                            <h3 className="font-semibold text-gray-700 text-sm">{donem.donemAdi}</h3>
                            <span className="text-xs text-gray-400">{donem.yil}</span>
                          </div>
                          <p className="mt-0.5 text-xs text-gray-500">
                            {tarihFormati(donem.baslangicTarihi)}
                            {donem.bitisTarihi && ` — ${tarihFormati(donem.bitisTarihi)}`}
                            {' · '}{donem.surgunler.length} sürgün
                            {donem.toplamHasatKg && ` · ${sayiFormati(donem.toplamHasatKg)} kg toplam`}
                          </p>
                        </div>
                      </div>

                      {/* Özet bilgiler */}
                      <div className="mt-2 flex flex-wrap gap-2">
                        {donem.brutFiyat && (
                          <span className="rounded-full bg-white border border-gray-200 px-2 py-0.5 text-xs text-gray-600">
                            Brüt: ₺{Number(donem.brutFiyat).toFixed(4)}/kg
                          </span>
                        )}
                        {donem.netFiyat && (
                          <span className="rounded-full bg-white border border-blue-200 px-2 py-0.5 text-xs text-blue-600">
                            Net: ₺{Number(donem.netFiyat).toFixed(4)}/kg
                          </span>
                        )}
                        {donem.toplamHasatKg && (
                          <span className="rounded-full bg-green-50 border border-green-200 px-2 py-0.5 text-xs text-green-700 font-medium">
                            🍃 {sayiFormati(donem.toplamHasatKg)} kg
                          </span>
                        )}
                        {donem.kesintiler?.map((k) => (
                          <span key={k.id} className="rounded-full bg-red-50 border border-red-200 px-2 py-0.5 text-xs text-red-600">
                            {k.kesintiAdi} %{Number(k.yuzde).toLocaleString('tr-TR', { maximumFractionDigits: 4 })}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Sürgünler — tıklanınca girişleri açar */}
                    {donem.surgunler.length > 0 && (
                      <div className="divide-y divide-gray-100">
                        {donem.surgunler.map((surgun) => (
                          <div key={surgun.id}>
                            {/* Sürgün başlık — tıklanabilir */}
                            <button
                              onClick={() => surgunToggle(surgun.id)}
                              className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50 active:bg-gray-100 transition-colors text-left"
                            >
                              <div className="flex items-center gap-2">
                                <span className="text-gray-400 text-xs">{acikSurgunId === surgun.id ? '▼' : '▶'}</span>
                                <div>
                                  <div className="flex items-center gap-1.5">
                                    <span className="inline-flex rounded-full bg-gray-100 px-1.5 py-0.5 text-[10px] font-semibold text-gray-500">
                                      {surgun.surgunNo}. Sürgün
                                    </span>
                                    <span className="text-sm text-gray-700 font-medium">{surgun.surgunAdi}</span>
                                  </div>
                                  <p className="text-xs text-gray-400 mt-0.5">
                                    {tarihFormati(surgun.baslangicTarihi)}
                                    {surgun.bitisTarihi && ` — ${tarihFormati(surgun.bitisTarihi)}`}
                                  </p>
                                </div>
                              </div>
                              <div className="text-right shrink-0">
                                <p className="text-sm font-bold text-gray-700">{sayiFormati(surgun.toplamHasatKg)} kg</p>
                                <p className="text-xs text-gray-400">toplam hasat</p>
                              </div>
                            </button>

                            {/* Hasat girişleri — açıksa göster */}
                            {acikSurgunId === surgun.id && (
                              <div className="border-t border-gray-100 bg-gray-50">
                                {girisYukleniyor[surgun.id] ? (
                                  <div className="flex items-center justify-center py-6 gap-2">
                                    <div className="w-5 h-5 border-2 border-green-500 border-t-transparent rounded-full animate-spin" />
                                    <span className="text-xs text-gray-400">Yükleniyor...</span>
                                  </div>
                                ) : !surgunGirisleri[surgun.id] || surgunGirisleri[surgun.id].length === 0 ? (
                                  <div className="py-6 text-center text-xs text-gray-400">Bu sürgüne ait giriş yok</div>
                                ) : (
                                  <div>
                                    {/* Mobil kart listesi */}
                                    <div className="divide-y divide-gray-100 md:hidden">
                                      {surgunGirisleri[surgun.id].map((giris) => (
                                        <div key={giris.id} className="px-4 py-3">
                                          <div className="flex items-start justify-between gap-2">
                                            <div className="min-w-0">
                                              <p className="text-sm font-medium text-gray-700 truncate">{giris.tarla?.tarlaAdi ?? 'Kontenjan'}</p>
                                              <p className="text-xs text-gray-500">{giris.tarla?.ciftci?.adSoyad ?? ''}</p>
                                              <p className="text-xs text-gray-400 mt-0.5">{tarihFormati(giris.tarih)} · {giris.musteri?.musteriAdi}</p>
                                            </div>
                                            <div className="text-right shrink-0">
                                              <p className="text-sm font-bold text-gray-800">{sayiFormati(giris.tartimMiktariKg)} kg</p>
                                              <p className="text-xs text-gray-500">{giris.toplanmaTuru === 'isci' ? '👷 İşçi' : '🏠 Sahip'}</p>
                                            </div>
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                    {/* Masaüstü tablo */}
                                    <div className="hidden md:block overflow-x-auto">
                                      <table className="w-full text-sm">
                                        <thead>
                                          <tr className="text-left text-xs font-semibold uppercase tracking-wider text-gray-400 border-b border-gray-200">
                                            <th className="px-4 py-2">Tarih</th>
                                            <th className="px-4 py-2">Tarla / Çiftçi</th>
                                            <th className="px-4 py-2">Müşteri</th>
                                            <th className="px-4 py-2">Toplanma</th>
                                            <th className="px-4 py-2 text-right">Tartım (kg)</th>
                                          </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100">
                                          {surgunGirisleri[surgun.id].map((giris) => (
                                            <tr key={giris.id} className="hover:bg-white transition-colors">
                                              <td className="px-4 py-2 text-gray-600">{tarihFormati(giris.tarih)}</td>
                                              <td className="px-4 py-2">
                                                <p className="font-medium text-gray-700">{giris.tarla?.tarlaAdi ?? 'Kontenjan'}</p>
                                                <p className="text-xs text-gray-400">{giris.tarla?.ciftci?.adSoyad ?? ''}</p>
                                              </td>
                                              <td className="px-4 py-2 text-gray-600">{giris.musteri?.musteriAdi ?? '—'}</td>
                                              <td className="px-4 py-2 text-gray-500">{giris.toplanmaTuru === 'isci' ? '👷 İşçi' : '🏠 Tarla Sahibi'}</td>
                                              <td className="px-4 py-2 text-right font-semibold text-gray-800">{sayiFormati(giris.tartimMiktariKg)}</td>
                                            </tr>
                                          ))}
                                        </tbody>
                                        <tfoot>
                                          <tr className="border-t border-gray-200 bg-gray-100">
                                            <td colSpan={4} className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase">Toplam</td>
                                            <td className="px-4 py-2 text-right font-bold text-gray-800">
                                              {sayiFormati(surgunGirisleri[surgun.id].reduce((s, g) => s + Number(g.tartimMiktariKg), 0))}
                                            </td>
                                          </tr>
                                        </tfoot>
                                      </table>
                                    </div>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Destekleme (kapalı dönem) */}
                    {donem.desteklemeAlacakTutar && (
                      <div className="px-4 py-3 bg-purple-50 border-t border-purple-100">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-xs font-medium text-purple-700">Devlet Destekleme</p>
                            <p className="text-xs text-purple-500 mt-0.5">
                              {donem.desteklemeOdemeDurumu === 'odendi' ? '✓ Ödendi' :
                               donem.desteklemeOdemeDurumu === 'kismi_odendi' ? '◐ Kısmen Ödendi' : '⏳ Bekliyor'}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-bold text-purple-800">₺{sayiFormati(donem.desteklemeAlacakTutar)}</p>
                            {donem.desteklemeKalanTutar && donem.desteklemeKalanTutar > 0 && (
                              <p className="text-xs text-purple-500">Kalan: ₺{sayiFormati(donem.desteklemeKalanTutar)}</p>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ============================================================
            SEKME: BUDAMA TAKİBİ
        ============================================================ */}
        {aktifSekme === 'budama' && aktifDonem && (
          <div className="space-y-5">

            {/* Özet kartlar */}
            {budamalar.length > 0 && (
              <div className="grid grid-cols-3 gap-3">
                <div className="rounded-2xl border border-orange-100 bg-orange-50 p-3">
                  <p className="text-xs text-orange-500 font-medium leading-tight">Toplam Alacak</p>
                  <p className="text-lg font-bold text-orange-700 mt-1">₺{sayiFormati(budamaToplamTutar)}</p>
                </div>
                <div className="rounded-2xl border border-green-100 bg-green-50 p-3">
                  <p className="text-xs text-green-600 font-medium leading-tight">Ödenen</p>
                  <p className="text-lg font-bold text-green-700 mt-1">₺{sayiFormati(budamaToplamOdenen)}</p>
                </div>
                <div className="rounded-2xl border border-red-100 bg-red-50 p-3">
                  <p className="text-xs text-red-500 font-medium leading-tight">Kalan Alacak</p>
                  <p className="text-lg font-bold text-red-700 mt-1">₺{sayiFormati(budamaToplamKalan)}</p>
                </div>
              </div>
            )}

            {/* ── Dönem Çiftçileri ── */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-gray-700">
                  Dönem Çiftçileri <span className="text-gray-400 font-normal">({donemCiftciler.length})</span>
                </h3>
                <button
                  onClick={() => setCiftciSecimAcik(true)}
                  className="flex items-center justify-center min-h-[36px] rounded-lg border border-green-300 bg-green-50 px-3 text-xs font-medium text-green-700 active:bg-green-100"
                >
                  + Çiftçi Ekle
                </button>
              </div>

              {ciftcilerYukleniyor ? (
                <div className="flex items-center justify-center py-8 gap-2">
                  <div className="w-5 h-5 border-2 border-green-500 border-t-transparent rounded-full animate-spin" />
                  <p className="text-sm text-gray-400">Yükleniyor...</p>
                </div>
              ) : donemCiftciler.length === 0 ? (
                <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-gray-200 py-10 text-center">
                  <span className="text-3xl mb-2">👨‍🌾</span>
                  <p className="text-sm text-gray-400">Henüz çiftçi eklenmemiş</p>
                  <button
                    onClick={() => setCiftciSecimAcik(true)}
                    className="mt-3 flex items-center justify-center min-h-[40px] rounded-xl border border-green-300 px-5 text-sm font-medium text-green-700 active:bg-green-50"
                  >
                    Çiftçi Seç
                  </button>
                </div>
              ) : (
                <>
                  {/* Mobil kart listesi */}
                  <div className="md:hidden space-y-2">
                    {donemCiftciler.map((dc) => (
                      <div key={dc.id} className="rounded-2xl border bg-white overflow-hidden">
                        <div className="px-4 py-3">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <p className="font-semibold text-gray-800">{dc.ciftci.adSoyad}</p>
                              {dc.ciftci.cayKurNo && (
                                <p className="text-xs text-gray-400 mt-0.5">Çay-Kur: {dc.ciftci.cayKurNo}</p>
                              )}
                              <p className="text-xs text-gray-500 mt-0.5">
                                {dc.ciftciToplamDonum > 0
                                  ? `${dc.ciftciToplamDonum.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} dönüm`
                                  : 'Dönüm bilgisi yok'}
                              </p>
                            </div>
                            <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${dc.budamaBilgisi ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                              {dc.budamaBilgisi ? 'Girildi' : 'Girilmedi'}
                            </span>
                          </div>
                        </div>
                        <div className="flex border-t divide-x divide-gray-100">
                          <button
                            onClick={() => ciftciCikar(dc.id)}
                            className="flex-1 flex items-center justify-center min-h-[44px] text-sm font-medium text-red-500 active:bg-red-50"
                          >
                            Çıkar
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Masaüstü tablosu */}
                  <div className="hidden md:block overflow-hidden rounded-xl border border-gray-200 bg-white">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50 text-xs font-medium uppercase text-gray-500">
                        <tr>
                          <th className="px-4 py-3 text-left">Çiftçi</th>
                          <th className="px-4 py-3 text-left">Çay-Kur No</th>
                          <th className="px-4 py-3 text-right">Toplam Dönüm</th>
                          <th className="px-4 py-3 text-center">Budama</th>
                          <th className="px-4 py-3 text-center">İşlem</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {donemCiftciler.map((dc) => (
                          <tr key={dc.id} className="hover:bg-gray-50">
                            <td className="px-4 py-3 font-medium text-gray-800">{dc.ciftci.adSoyad}</td>
                            <td className="px-4 py-3 text-gray-500">{dc.ciftci.cayKurNo || '-'}</td>
                            <td className="px-4 py-3 text-right text-gray-700">
                              {dc.ciftciToplamDonum > 0
                                ? `${dc.ciftciToplamDonum.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} dönüm`
                                : '-'}
                            </td>
                            <td className="px-4 py-3 text-center">
                              {dc.budamaBilgisi ? (
                                <span className="inline-flex rounded-full bg-green-100 px-2 py-0.5 text-xs text-green-700">Girildi</span>
                              ) : (
                                <span className="inline-flex rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-500">Girilmedi</span>
                              )}
                            </td>
                            <td className="px-4 py-3 text-center">
                              <button
                                onClick={() => ciftciCikar(dc.id)}
                                className="rounded-lg bg-gray-50 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-100 border border-gray-200"
                              >
                                Çıkar
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </div>

            {/* ── Budama Kayıtları ── */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-gray-700">
                  Budama Kayıtları <span className="text-gray-400 font-normal">({budamalar.length})</span>
                </h3>
                <button
                  onClick={() => setBudamaFormuAcik(true)}
                  className="flex items-center justify-center min-h-[36px] rounded-lg bg-green-600 px-3 text-xs font-medium text-white active:bg-green-700"
                >
                  + Budama Girişi
                </button>
              </div>

              {budamaYukleniyor ? (
                <div className="flex items-center justify-center py-8 gap-2">
                  <div className="w-5 h-5 border-2 border-green-500 border-t-transparent rounded-full animate-spin" />
                  <p className="text-sm text-gray-400">Yükleniyor...</p>
                </div>
              ) : budamalar.length === 0 ? (
                <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-gray-200 py-10 text-center">
                  <span className="text-3xl mb-2">✂️</span>
                  <p className="text-sm text-gray-400">Henüz budama girişi yok</p>
                  {!aktifDonem.brutFiyat && (
                    <p className="text-xs text-orange-500 mt-1">Budama eklemek için önce brüt fiyat girin</p>
                  )}
                  <button
                    onClick={() => setBudamaFormuAcik(true)}
                    className="mt-3 flex items-center justify-center min-h-[40px] rounded-xl bg-green-600 px-5 text-sm font-medium text-white active:bg-green-700"
                  >
                    + Budama Girişi
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {budamalar.map((budama) => (
                    <div key={budama.id} className="rounded-2xl border border-gray-200 bg-white overflow-hidden">
                      {/* Başlık */}
                      <div className="flex items-center justify-between px-4 py-3 bg-gray-50 border-b">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-gray-800">{budama.ciftci.adSoyad}</span>
                          {budama.ciftci.cayKurNo && (
                            <span className="text-xs text-gray-400">{budama.ciftci.cayKurNo}</span>
                          )}
                          <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${ODEME_DURUM_RENK[budama.odemeDurumu] || 'bg-gray-100 text-gray-600'}`}>
                            {ODEME_DURUM_ETIKET[budama.odemeDurumu] || budama.odemeDurumu}
                          </span>
                        </div>
                      </div>

                      {/* Detaylar — mobil kart */}
                      <div className="px-4 py-4 md:hidden grid grid-cols-2 gap-x-6 gap-y-3">
                        <div>
                          <p className="text-xs text-gray-400">Toplam Arazi</p>
                          <p className="text-sm font-semibold text-gray-800 mt-0.5">{budama.toplamDonum.toFixed(2)} dönüm</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-400">Budanan Alan</p>
                          <p className="text-sm font-semibold text-gray-800 mt-0.5">
                            {budama.budananM2.toLocaleString('tr-TR', { maximumFractionDigits: 0 })} m²
                          </p>
                          <p className="text-xs text-gray-400">({budama.budananDonum.toFixed(4)} dönüm)</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-400">Brüt Fiyat</p>
                          <p className="text-sm font-semibold text-gray-800 mt-0.5">₺{Number(budama.brutFiyat).toFixed(4)}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-400">Toplam Alacak</p>
                          <p className="text-lg font-bold text-orange-700 mt-0.5">₺{sayiFormati(budama.hesaplananTutar)}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-400">Ödenen</p>
                          <p className="text-sm font-bold text-green-600 mt-0.5">₺{sayiFormati(budama.odenenTutar)}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-400">Kalan</p>
                          <p className={`text-sm font-bold mt-0.5 ${budama.kalanTutar > 0 ? 'text-red-600' : 'text-green-600'}`}>
                            ₺{sayiFormati(budama.kalanTutar)}
                          </p>
                        </div>
                      </div>

                      {/* Detaylar — masaüstü grid */}
                      <div className="hidden md:grid px-5 py-4 grid-cols-2 gap-x-8 gap-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-500">Toplam Arazi</span>
                          <span className="font-medium">{budama.toplamDonum.toFixed(2)} dönüm</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500">Budanan Alan</span>
                          <span className="font-medium">
                            {budama.budananM2.toLocaleString('tr-TR', { maximumFractionDigits: 0 })} m²
                          </span>
                        </div>
                        <div className="flex justify-between col-span-2 text-xs text-gray-400">
                          <span>({budama.budananDonum.toFixed(4)} dönüm)</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500">Brüt Fiyat</span>
                          <span className="font-medium">₺{Number(budama.brutFiyat).toFixed(4)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500">Toplam Alacak</span>
                          <span className="font-bold text-orange-700">₺{sayiFormati(budama.hesaplananTutar)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500">Ödenen</span>
                          <span className="font-medium text-green-600">₺{sayiFormati(budama.odenenTutar)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500">Kalan</span>
                          <span className={`font-bold ${budama.kalanTutar > 0 ? 'text-red-600' : 'text-green-600'}`}>
                            ₺{sayiFormati(budama.kalanTutar)}
                          </span>
                        </div>
                      </div>

                      {/* Ödemeler listesi */}
                      {budama.odemeler.length > 0 && (
                        <div className="border-t px-4 py-3">
                          <p className="text-xs font-semibold text-gray-500 mb-2">Ödemeler</p>
                          <div className="space-y-1">
                            {budama.odemeler.map((odeme) => (
                              <div key={odeme.id} className="flex justify-between text-xs text-gray-600">
                                <span>{new Date(odeme.tarih).toLocaleDateString('tr-TR')} — {odeme.aciklama || 'Ödeme'}</span>
                                <span className="font-medium text-green-700">+₺{sayiFormati(odeme.tutar)}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Alt aksiyon çubuğu */}
                      {budama.kalanTutar > 0 && (
                        <div className="flex border-t divide-x divide-gray-100">
                          <button
                            onClick={() => setBudamaOdemeModal({
                              budamaId: budama.id,
                              ciftciAdi: budama.ciftci.adSoyad,
                              kalanTutar: budama.kalanTutar,
                            })}
                            className="flex-1 flex items-center justify-center min-h-[44px] text-sm font-medium text-green-700 active:bg-green-50"
                          >
                            Ödeme Al
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ── Modaller ── */}
      {donemFormuAcik && (
        <HasatDonemiFormu onKapat={() => setDonemFormuAcik(false)} onKaydet={formKaydedildi} />
      )}

      {surgunFormuAcik && aktifDonem && (
        <SurgunFormu
          hasatDonemiId={aktifDonem.id}
          onKapat={() => setSurgunFormuAcik(false)}
          onKaydet={formKaydedildi}
        />
      )}

      {girisFormuAcik && aktifSurgun && (
        <HasatGirisFormu
          surgunId={aktifSurgun.id}
          netFiyat={aktifDonem?.netFiyat ? Number(aktifDonem.netFiyat) : null}
          onKapat={() => setGirisFormuAcik(false)}
          onKaydet={formKaydedildi}
        />
      )}

      {ciftciSecimAcik && aktifDonem && (
        <HasatCiftciSecimModal
          hasatDonemiId={aktifDonem.id}
          secilenCiftciIdler={donemCiftciler.map((dc) => dc.ciftciId)}
          onKapat={() => setCiftciSecimAcik(false)}
          onKaydet={() => {
            donemCiftcileriniGetir(aktifDonem.id);
          }}
        />
      )}

      {budamaFormuAcik && aktifDonem && (
        <BudamaBilgisiFormu
          hasatDonemiId={aktifDonem.id}
          brutFiyat={aktifDonem.brutFiyat ? Number(aktifDonem.brutFiyat) : null}
          onKapat={() => setBudamaFormuAcik(false)}
          onKaydet={() => {
            budamalariGetir(aktifDonem.id);
            donemCiftcileriniGetir(aktifDonem.id);
          }}
        />
      )}

      {budamaOdemeModal && aktifDonem && (
        <BudamaOdemeModal
          hasatDonemiId={aktifDonem.id}
          budamaId={budamaOdemeModal.budamaId}
          ciftciAdi={budamaOdemeModal.ciftciAdi}
          kalanTutar={budamaOdemeModal.kalanTutar}
          onKapat={() => setBudamaOdemeModal(null)}
          onKaydet={() => budamalariGetir(aktifDonem.id)}
        />
      )}

      {desteklemeOdemeModal && (
        <DesteklemeOdemeModal
          donemId={desteklemeOdemeModal.donemId}
          donemAdi={desteklemeOdemeModal.donemAdi}
          kalanTutar={desteklemeOdemeModal.kalanTutar}
          onKapat={() => setDesteklemeOdemeModal(null)}
          onKaydet={() => { setDesteklemeOdemeModal(null); donemleriGetir(); }}
        />
      )}
    </div>
  );
}
