'use client';

import { useState, useEffect, useCallback } from 'react';
import MalzemeFormu from '@/components/envanter/MalzemeFormu';
import StokHareketiModal from '@/components/envanter/StokHareketiModal';
import EkipmanFormu from '@/components/envanter/EkipmanFormu';
import EkipmanGiderGelirModal from '@/components/envanter/EkipmanGiderGelirModal';
import EkipmanBakimModal from '@/components/envanter/EkipmanBakimModal';

// ---- Tipler ----

type Malzeme = {
  id: string;
  malzemeAdi: string;
  kategori: string;
  altKategori: string | null;
  birim: string;
  mevcutStok: number;
  minimumStok: number;
  birimFiyat: number;
  depoKonumu: string | null;
  durum: string;
  notlar: string | null;
  dusukStok: boolean;
};

type StokHareketi = {
  id: string;
  malzemeId: string;
  hareketTipi: string;
  miktar: number;
  birimFiyat: number | null;
  toplamTutar: number | null;
  tarlaId: string | null;
  tedarikci: string | null;
  faturaNo: string | null;
  tarih: string;
  notlar: string | null;
  malzeme: Malzeme;
};

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
  bakimYaklasan: boolean;
};

type RaporItem = {
  id: string;
  ekipmanAdi: string;
  kategori: string;
  plaka: string | null;
  marka: string | null;
  model: string | null;
  durum: string;
  toplamGider: number;
  toplamGelir: number;
  netKar: number;
  giderKirilim: Record<string, number>;
  gelirKirilim: Record<string, number>;
  toplamMesafe: number;
  toplamYakit: number;
  giderSayisi: number;
  gelirSayisi: number;
};

// ---- Yardımcı Sabitler ----

const KATEGORI_ETIKETLERI: Record<string, string> = {
  gubre: 'Gübre',
  tarim_ilaci: 'Tarım İlacı',
  alet_makine: 'Alet/Makine',
  yakit_sarf: 'Yakıt/Sarf',
  yedek_parca: 'Yedek Parça',
  diger: 'Diğer',
};

const BIRIM_ETIKETLERI: Record<string, string> = {
  adet: 'Adet',
  kg: 'Kg',
  litre: 'Litre',
  paket: 'Paket',
  cuval: 'Çuval',
};

const HAREKET_RENKLERI: Record<string, string> = {
  giris: 'bg-green-100 text-green-700',
  cikis: 'bg-red-100 text-red-700',
  fire: 'bg-orange-100 text-orange-700',
  iade: 'bg-blue-100 text-blue-700',
};

const HAREKET_ETIKETLERI: Record<string, string> = {
  giris: 'Giriş',
  cikis: 'Çıkış',
  fire: 'Fire',
  iade: 'İade',
};

const EKIPMAN_DURUM_RENKLERI: Record<string, string> = {
  aktif: 'bg-green-100 text-green-700',
  bakimda: 'bg-yellow-100 text-yellow-700',
  arizali: 'bg-red-100 text-red-700',
  hurda: 'bg-gray-100 text-gray-700',
};

const EKIPMAN_DURUM_ETIKETLERI: Record<string, string> = {
  aktif: 'Aktif',
  bakimda: 'Bakımda',
  arizali: 'Arızalı',
  hurda: 'Hurda',
};

const EKIPMAN_KATEGORI_ETIKETLERI: Record<string, string> = {
  arac: 'Araç',
  traktor: 'Traktör',
  motorlu_alet: 'Motorlu Alet',
  sarjli_alet: 'Şarjlı Alet',
  el_aleti: 'El Aleti',
  sulama: 'Sulama',
  diger: 'Diğer',
};

const ARAC_KATEGORILER = new Set(['arac', 'traktor']);

const GIDER_TIPI_ETIKETLERI: Record<string, string> = {
  yakit: 'Yakıt',
  bakim: 'Bakım',
  onarim: 'Onarım',
  lastik: 'Lastik',
  sigorta: 'Sigorta',
  vergi: 'Vergi',
  muayene: 'Muayene',
  yedek_parca: 'Yedek Parça',
  yikama: 'Yıkama',
  diger: 'Diğer',
};

const GELIR_TIPI_ETIKETLERI: Record<string, string> = {
  nakliye: 'Nakliye',
  kiralama: 'Kiralama',
  hizmet: 'Hizmet',
  diger: 'Diğer',
};

// ---- Bileşen ----

export default function EnvanterSayfasi() {
  const [aktifSekme, setAktifSekme] = useState<'malzemeler' | 'hareketler' | 'ekipmanlar' | 'rapor'>(
    'malzemeler'
  );

  // Malzeme state
  const [malzemeler, setMalzemeler] = useState<Malzeme[]>([]);
  const [malzemeYukleniyor, setMalzemeYukleniyor] = useState(true);
  const [malzemeFormuAcik, setMalzemeFormuAcik] = useState(false);
  const [duzenlenenMalzeme, setDuzenlenenMalzeme] = useState<Malzeme | undefined>();

  // Stok hareketi state
  const [stokHareketleri, setStokHareketleri] = useState<StokHareketi[]>([]);
  const [hareketYukleniyor, setHareketYukleniyor] = useState(true);
  const [stokModalAcik, setStokModalAcik] = useState(false);
  const [secilenMalzeme, setSecilenMalzeme] = useState<Malzeme | null>(null);
  const [stokTipi, setStokTipi] = useState<'giris' | 'cikis'>('giris');
  const [malzemeFiltre, setMalzemeFiltre] = useState('');
  const [stokUyarisi, setStokUyarisi] = useState('');

  // Ekipman state
  const [ekipmanlar, setEkipmanlar] = useState<Ekipman[]>([]);
  const [ekipmanYukleniyor, setEkipmanYukleniyor] = useState(true);
  const [ekipmanFormuAcik, setEkipmanFormuAcik] = useState(false);
  const [duzenlenenEkipman, setDuzenlenenEkipman] = useState<Ekipman | undefined>();

  // Gider/Gelir modal state
  const [giderGelirModalAcik, setGiderGelirModalAcik] = useState(false);
  const [secilenEkipman, setSecilenEkipman] = useState<Ekipman | null>(null);
  const [giderGelirMod, setGiderGelirMod] = useState<'gider' | 'gelir'>('gider');
  const [bakimModalAcik, setBakimModalAcik] = useState(false);

  // Rapor state
  const [raporlar, setRaporlar] = useState<RaporItem[]>([]);
  const [raporYukleniyor, setRaporYukleniyor] = useState(false);

  const malzemeleriGetir = useCallback(async () => {
    setMalzemeYukleniyor(true);
    try {
      const yanit = await fetch('/api/malzemeler');
      const veri = await yanit.json();
      setMalzemeler(Array.isArray(veri) ? veri : []);
    } catch {
      console.error('Malzemeler getirilemedi');
    } finally {
      setMalzemeYukleniyor(false);
    }
  }, []);

  const hareketleriGetir = useCallback(async () => {
    setHareketYukleniyor(true);
    try {
      const sorgu = malzemeFiltre ? `?malzemeId=${malzemeFiltre}` : '';
      const yanit = await fetch(`/api/stok-hareketleri${sorgu}`);
      const veri = await yanit.json();
      setStokHareketleri(Array.isArray(veri) ? veri : []);
    } catch {
      console.error('Stok hareketleri getirilemedi');
    } finally {
      setHareketYukleniyor(false);
    }
  }, [malzemeFiltre]);

  const ekipmanlariGetir = useCallback(async () => {
    setEkipmanYukleniyor(true);
    try {
      const yanit = await fetch('/api/ekipmanlar');
      const veri = await yanit.json();
      setEkipmanlar(Array.isArray(veri) ? veri : []);
    } catch {
      console.error('Ekipmanlar getirilemedi');
    } finally {
      setEkipmanYukleniyor(false);
    }
  }, []);

  const raporlariGetir = useCallback(async () => {
    setRaporYukleniyor(true);
    try {
      const yanit = await fetch('/api/ekipmanlar/rapor');
      const veri = await yanit.json();
      setRaporlar(Array.isArray(veri) ? veri : []);
    } catch {
      console.error('Raporlar getirilemedi');
    } finally {
      setRaporYukleniyor(false);
    }
  }, []);

  useEffect(() => {
    malzemeleriGetir();
  }, [malzemeleriGetir]);

  useEffect(() => {
    if (aktifSekme === 'hareketler') hareketleriGetir();
  }, [aktifSekme, hareketleriGetir]);

  useEffect(() => {
    if (aktifSekme === 'ekipmanlar') ekipmanlariGetir();
  }, [aktifSekme, ekipmanlariGetir]);

  useEffect(() => {
    if (aktifSekme === 'rapor') raporlariGetir();
  }, [aktifSekme, raporlariGetir]);

  const stokHareketiAc = (malzeme: Malzeme, tip: 'giris' | 'cikis') => {
    setSecilenMalzeme(malzeme);
    setStokTipi(tip);
    setStokModalAcik(true);
  };

  const giderGelirAc = (ekipman: Ekipman, mod: 'gider' | 'gelir') => {
    setSecilenEkipman(ekipman);
    setGiderGelirMod(mod);
    setGiderGelirModalAcik(true);
  };

  const malzemeSil = async (id: string) => {
    if (!confirm('Bu malzemeyi silmek istediğinize emin misiniz?')) return;
    const yanit = await fetch(`/api/malzemeler/${id}`, { method: 'DELETE' });
    if (yanit.ok) {
      malzemeleriGetir();
    } else {
      const hata = await yanit.json();
      alert(hata.hata || 'Silme işlemi başarısız');
    }
  };

  const hareketSil = async (id: string) => {
    if (!confirm('Bu stok hareketini silmek istediğinize emin misiniz? Stok geri alınacaktır.')) return;
    const yanit = await fetch(`/api/stok-hareketleri/${id}`, { method: 'DELETE' });
    if (yanit.ok) {
      hareketleriGetir();
      malzemeleriGetir();
    } else {
      const hata = await yanit.json();
      alert(hata.hata || 'Silme işlemi başarısız');
    }
  };

  const ekipmanSil = async (id: string) => {
    if (!confirm('Bu ekipmanı silmek istediğinize emin misiniz?')) return;
    const yanit = await fetch(`/api/ekipmanlar/${id}`, { method: 'DELETE' });
    if (yanit.ok) {
      ekipmanlariGetir();
    } else {
      const hata = await yanit.json();
      alert(hata.hata || 'Silme işlemi başarısız');
    }
  };

  // bakimYapildi: masaüstü tabloda tutulur, gerekirse çağrılabilir
  const bakimYapildi = async (ekipman: Ekipman) => {
    const bugun = new Date().toISOString().split('T')[0];
    const yanit = await fetch(`/api/ekipmanlar/${ekipman.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...ekipman,
        sonBakimTarihi: bugun,
        sonrakiBakimTarihi: null,
      }),
    });
    if (yanit.ok) {
      ekipmanlariGetir();
    } else {
      alert('Bakım güncellemesi başarısız');
    }
  };

  const dusukStokSayisi = malzemeler.filter((m) => m.dusukStok).length;
  const bakimYaklasanSayisi = ekipmanlar.filter((e) => e.bakimYaklasan).length;

  const toplamRapor = raporlar.reduce(
    (acc, r) => ({
      gider: acc.gider + r.toplamGider,
      gelir: acc.gelir + r.toplamGelir,
      net: acc.net + r.netKar,
    }),
    { gider: 0, gelir: 0, net: 0 }
  );

  // Sekme tanımları — mobilde 'hareketler' gizlenir
  const sekmeler = [
    { key: 'malzemeler', label: 'Malzemeler', mobil: true },
    { key: 'hareketler', label: 'Stok Hareketleri', mobil: false },
    { key: 'ekipmanlar', label: 'Ekipmanlar', mobil: true },
    { key: 'rapor', label: 'Araç Raporu', mobil: true },
  ] as const;

  return (
    <div className="min-h-full bg-gray-50">
      {/* ===== STICKY ÜST BAR ===== */}
      <div className="sticky top-0 z-20 bg-white border-b border-gray-200 shadow-sm">
        {/* Başlık + Ekle butonu */}
        <div className="flex items-center justify-between px-4 pt-3 pb-2">
          <div>
            <h1 className="text-lg font-bold text-gray-800 leading-tight">Envanter</h1>
            <p className="text-xs text-gray-500">Malzeme, stok ve ekipman takibi</p>
          </div>
          {aktifSekme === 'malzemeler' && (
            <button
              onClick={() => { setDuzenlenenMalzeme(undefined); setMalzemeFormuAcik(true); }}
              className="rounded-xl bg-green-600 px-3 py-2 text-sm font-semibold text-white shadow-sm active:bg-green-700"
            >
              + Ekle
            </button>
          )}
          {aktifSekme === 'ekipmanlar' && (
            <button
              onClick={() => { setDuzenlenenEkipman(undefined); setEkipmanFormuAcik(true); }}
              className="rounded-xl bg-green-600 px-3 py-2 text-sm font-semibold text-white shadow-sm active:bg-green-700"
            >
              + Ekle
            </button>
          )}
        </div>

        {/* Sekme navigasyonu — mobil: 3 sekme, masaüstü: 4 sekme */}
        <div className="flex">
          {sekmeler.map((sekme) => (
            <button
              key={sekme.key}
              onClick={() => setAktifSekme(sekme.key)}
              className={`flex-1 py-2.5 text-xs font-semibold border-b-2 transition-colors
                ${!sekme.mobil ? 'hidden md:block' : ''}
                ${aktifSekme === sekme.key
                  ? 'border-green-600 text-green-700'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
            >
              {sekme.label}
            </button>
          ))}
        </div>
      </div>

      {/* ===== İÇERİK ===== */}
      <div className="px-4 py-4 md:px-6">

        {/* ============ SEKME: MALZEMELER ============ */}
        {aktifSekme === 'malzemeler' && (
          <div>
            {/* Düşük stok uyarısı */}
            {dusukStokSayisi > 0 && (
              <div className="mb-4 flex items-center gap-3 rounded-2xl border border-yellow-200 bg-yellow-50 p-4">
                <span className="text-yellow-600 text-xl">⚠️</span>
                <div>
                  <p className="font-semibold text-yellow-800 text-sm">Düşük Stok Uyarısı</p>
                  <p className="text-xs text-yellow-700">
                    {dusukStokSayisi} malzemenin stoku minimum seviyenin altında.
                  </p>
                </div>
              </div>
            )}

            {/* Stok hareketi sonrası uyarı */}
            {stokUyarisi && (
              <div className="mb-4 flex items-center justify-between rounded-2xl border border-yellow-200 bg-yellow-50 p-4">
                <div className="flex items-center gap-3">
                  <span className="text-yellow-600 text-xl">⚠️</span>
                  <p className="text-sm text-yellow-700">{stokUyarisi}</p>
                </div>
                <button onClick={() => setStokUyarisi('')} className="text-yellow-500 hover:text-yellow-700 ml-2">✕</button>
              </div>
            )}

            {/* Masaüstü: ekle butonu */}
            <div className="hidden md:flex justify-end mb-4">
              <button
                onClick={() => { setDuzenlenenMalzeme(undefined); setMalzemeFormuAcik(true); }}
                className="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700"
              >
                + Yeni Malzeme
              </button>
            </div>

            {/* === MOBİL: Kart Listesi === */}
            <div className="md:hidden space-y-3">
              {malzemeYukleniyor ? (
                <div className="py-16 text-center">
                  <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-green-500 border-t-transparent" />
                  <p className="mt-3 text-sm text-gray-400">Yükleniyor...</p>
                </div>
              ) : malzemeler.length === 0 ? (
                <div className="py-16 text-center">
                  <p className="text-4xl mb-3">📦</p>
                  <p className="text-sm text-gray-500">Henüz malzeme eklenmemiş</p>
                </div>
              ) : (
                malzemeler.map((malzeme) => {
                  const stokYuzdesi = malzeme.minimumStok > 0
                    ? Math.min((malzeme.mevcutStok / (malzeme.minimumStok * 2)) * 100, 100)
                    : 100;
                  const dusuk = malzeme.dusukStok;
                  return (
                    <div key={malzeme.id} className="rounded-2xl bg-white border border-gray-100 shadow-sm overflow-hidden">
                      <div className="px-4 pt-4 pb-3">
                        {/* Üst: isim + kategori badge */}
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <span className="text-base font-bold text-gray-800 leading-snug">{malzeme.malzemeAdi}</span>
                          <span className="shrink-0 rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-600">
                            {KATEGORI_ETIKETLERI[malzeme.kategori] || malzeme.kategori}
                          </span>
                        </div>

                        {/* Birim + Durum + Fiyat */}
                        <div className="flex items-center gap-2 mb-3">
                          <span className="text-xs text-gray-500">{BIRIM_ETIKETLERI[malzeme.birim] || malzeme.birim}</span>
                          <span className="text-gray-300">·</span>
                          <span className={`text-xs font-medium ${malzeme.durum === 'aktif' ? 'text-green-600' : 'text-gray-400'}`}>
                            {malzeme.durum === 'aktif' ? 'Aktif' : 'Pasif'}
                          </span>
                          <span className="text-gray-300">·</span>
                          <span className="text-xs text-gray-500">
                            ₺{malzeme.birimFiyat.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
                          </span>
                        </div>

                        {/* Stok göstergesi */}
                        <div className="mb-1 flex items-center justify-between">
                          <span className="text-xs text-gray-500">Stok</span>
                          <span className={`text-sm font-bold ${dusuk ? 'text-red-600' : 'text-gray-800'}`}>
                            {malzeme.mevcutStok.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
                            {dusuk && <span className="ml-1 text-xs">⚠️</span>}
                          </span>
                        </div>
                        <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all ${dusuk ? 'bg-red-500' : 'bg-green-500'}`}
                            style={{ width: `${stokYuzdesi}%` }}
                          />
                        </div>
                        <p className="mt-0.5 text-right text-xs text-gray-400">
                          Min: {malzeme.minimumStok.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
                        </p>
                      </div>

                      {/* Alt aksiyon butonları */}
                      <div className="grid grid-cols-4 border-t border-gray-100">
                        <button
                          onClick={() => stokHareketiAc(malzeme, 'giris')}
                          className="py-2.5 text-xs font-semibold text-green-700 active:bg-green-50 border-r border-gray-100"
                        >
                          Giriş
                        </button>
                        <button
                          onClick={() => stokHareketiAc(malzeme, 'cikis')}
                          className="py-2.5 text-xs font-semibold text-red-700 active:bg-red-50 border-r border-gray-100"
                        >
                          Çıkış
                        </button>
                        <button
                          onClick={() => { setDuzenlenenMalzeme(malzeme); setMalzemeFormuAcik(true); }}
                          className="py-2.5 text-xs font-semibold text-blue-700 active:bg-blue-50 border-r border-gray-100"
                        >
                          Düzenle
                        </button>
                        <button
                          onClick={() => malzemeSil(malzeme.id)}
                          className="py-2.5 text-xs font-semibold text-gray-500 active:bg-gray-50"
                        >
                          Sil
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* === MASAÜSTÜ: Tablo === */}
            <div className="hidden md:block overflow-hidden rounded-lg border border-gray-200 bg-white">
              {malzemeYukleniyor ? (
                <div className="py-12 text-center text-gray-400">Yükleniyor...</div>
              ) : malzemeler.length === 0 ? (
                <div className="py-12 text-center text-gray-400">Henüz malzeme eklenmemiş</div>
              ) : (
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 text-xs font-medium uppercase text-gray-500">
                    <tr>
                      <th className="px-4 py-3 text-left">Malzeme Adı</th>
                      <th className="px-4 py-3 text-left">Kategori</th>
                      <th className="px-4 py-3 text-left">Birim</th>
                      <th className="px-4 py-3 text-right">Mevcut Stok</th>
                      <th className="px-4 py-3 text-right">Min. Stok</th>
                      <th className="px-4 py-3 text-right">Birim Fiyat</th>
                      <th className="px-4 py-3 text-center">Durum</th>
                      <th className="px-4 py-3 text-center">İşlem</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {malzemeler.map((malzeme) => (
                      <tr key={malzeme.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 font-medium text-gray-800">{malzeme.malzemeAdi}</td>
                        <td className="px-4 py-3">
                          <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600">
                            {KATEGORI_ETIKETLERI[malzeme.kategori] || malzeme.kategori}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-gray-600">
                          {BIRIM_ETIKETLERI[malzeme.birim] || malzeme.birim}
                        </td>
                        <td className={`px-4 py-3 text-right font-semibold ${malzeme.dusukStok ? 'text-red-600' : 'text-gray-800'}`}>
                          {malzeme.mevcutStok.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
                          {malzeme.dusukStok && <span className="ml-1 text-xs">⚠️</span>}
                        </td>
                        <td className="px-4 py-3 text-right text-gray-500">
                          {malzeme.minimumStok.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
                        </td>
                        <td className="px-4 py-3 text-right text-gray-600">
                          ₺{malzeme.birimFiyat.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${malzeme.durum === 'aktif' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                            {malzeme.durum === 'aktif' ? 'Aktif' : 'Pasif'}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-center gap-1">
                            <button
                              onClick={() => stokHareketiAc(malzeme, 'giris')}
                              className="rounded bg-green-50 px-2 py-1 text-xs font-medium text-green-700 hover:bg-green-100"
                            >
                              Giriş
                            </button>
                            <button
                              onClick={() => stokHareketiAc(malzeme, 'cikis')}
                              className="rounded bg-red-50 px-2 py-1 text-xs font-medium text-red-700 hover:bg-red-100"
                            >
                              Çıkış
                            </button>
                            <button
                              onClick={() => { setDuzenlenenMalzeme(malzeme); setMalzemeFormuAcik(true); }}
                              className="rounded bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700 hover:bg-blue-100"
                            >
                              Düzenle
                            </button>
                            <button
                              onClick={() => malzemeSil(malzeme.id)}
                              className="rounded bg-gray-50 px-2 py-1 text-xs font-medium text-gray-600 hover:bg-gray-100"
                            >
                              Sil
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}

        {/* ============ SEKME: STOK HAREKETLERİ (yalnızca masaüstü) ============ */}
        {aktifSekme === 'hareketler' && (
          <div className="hidden md:block">
            <div className="mb-4">
              <label className="mb-1 block text-sm font-medium text-gray-700">Malzeme Filtrele</label>
              <select
                value={malzemeFiltre}
                onChange={(e) => setMalzemeFiltre(e.target.value)}
                className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
              >
                <option value="">Tüm Malzemeler</option>
                {malzemeler.map((m) => (
                  <option key={m.id} value={m.id}>{m.malzemeAdi}</option>
                ))}
              </select>
            </div>

            <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
              {hareketYukleniyor ? (
                <div className="py-12 text-center text-gray-400">Yükleniyor...</div>
              ) : stokHareketleri.length === 0 ? (
                <div className="py-12 text-center text-gray-400">Stok hareketi bulunamadı</div>
              ) : (
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 text-xs font-medium uppercase text-gray-500">
                    <tr>
                      <th className="px-4 py-3 text-left">Tarih</th>
                      <th className="px-4 py-3 text-left">Malzeme</th>
                      <th className="px-4 py-3 text-center">Hareket Tipi</th>
                      <th className="px-4 py-3 text-right">Miktar</th>
                      <th className="px-4 py-3 text-right">Birim Fiyat</th>
                      <th className="px-4 py-3 text-right">Toplam</th>
                      <th className="px-4 py-3 text-left">Tedarikçi</th>
                      <th className="px-4 py-3 text-center">İşlem</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {stokHareketleri.map((hareket) => (
                      <tr key={hareket.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-gray-600">
                          {new Date(hareket.tarih).toLocaleDateString('tr-TR')}
                        </td>
                        <td className="px-4 py-3 font-medium text-gray-800">
                          {hareket.malzeme.malzemeAdi}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${HAREKET_RENKLERI[hareket.hareketTipi] || 'bg-gray-100 text-gray-600'}`}>
                            {HAREKET_ETIKETLERI[hareket.hareketTipi] || hareket.hareketTipi}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right text-gray-800">
                          {hareket.miktar.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}{' '}
                          {BIRIM_ETIKETLERI[hareket.malzeme.birim] || hareket.malzeme.birim}
                        </td>
                        <td className="px-4 py-3 text-right text-gray-600">
                          {hareket.birimFiyat !== null
                            ? `₺${hareket.birimFiyat.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}`
                            : '-'}
                        </td>
                        <td className="px-4 py-3 text-right text-gray-800">
                          {hareket.toplamTutar !== null
                            ? `₺${hareket.toplamTutar.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}`
                            : '-'}
                        </td>
                        <td className="px-4 py-3 text-gray-600">{hareket.tedarikci || '-'}</td>
                        <td className="px-4 py-3 text-center">
                          <button
                            onClick={() => hareketSil(hareket.id)}
                            className="rounded bg-gray-50 px-2 py-1 text-xs font-medium text-gray-600 hover:bg-gray-100"
                          >
                            Sil
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}

        {/* ============ SEKME: EKİPMANLAR ============ */}
        {aktifSekme === 'ekipmanlar' && (
          <div>
            {/* Bakım yaklaşan uyarısı */}
            {bakimYaklasanSayisi > 0 && (
              <div className="mb-4 flex items-center gap-3 rounded-2xl border border-yellow-200 bg-yellow-50 p-4">
                <span className="text-yellow-600 text-xl">🔧</span>
                <div>
                  <p className="font-semibold text-yellow-800 text-sm">Bakım Uyarısı</p>
                  <p className="text-xs text-yellow-700">
                    {bakimYaklasanSayisi} ekipmanın bakım tarihi yaklaşıyor (7 gün içinde).
                  </p>
                </div>
              </div>
            )}

            {/* Masaüstü: ekle butonu */}
            <div className="hidden md:flex justify-end mb-4">
              <button
                onClick={() => { setDuzenlenenEkipman(undefined); setEkipmanFormuAcik(true); }}
                className="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700"
              >
                + Yeni Ekipman
              </button>
            </div>

            {/* === MOBİL: Kart Listesi === */}
            <div className="md:hidden space-y-3">
              {ekipmanYukleniyor ? (
                <div className="py-16 text-center">
                  <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-green-500 border-t-transparent" />
                  <p className="mt-3 text-sm text-gray-400">Yükleniyor...</p>
                </div>
              ) : ekipmanlar.length === 0 ? (
                <div className="py-16 text-center">
                  <p className="text-4xl mb-3">🚜</p>
                  <p className="text-sm text-gray-500">Henüz ekipman eklenmemiş</p>
                </div>
              ) : (
                ekipmanlar.map((ekipman) => {
                  const aracMi = ARAC_KATEGORILER.has(ekipman.kategori);
                  return (
                    <div key={ekipman.id} className="rounded-2xl bg-white border border-gray-100 shadow-sm overflow-hidden">
                      <div className="px-4 pt-4 pb-3">
                        {/* Üst: isim + durum badge */}
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <span className="text-base font-bold text-gray-800 leading-snug">
                            {ekipman.ekipmanAdi}
                            {ekipman.bakimYaklasan && <span className="ml-1.5 text-sm">⚠️</span>}
                          </span>
                          <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-semibold ${EKIPMAN_DURUM_RENKLERI[ekipman.durum] || 'bg-gray-100 text-gray-600'}`}>
                            {EKIPMAN_DURUM_ETIKETLERI[ekipman.durum] || ekipman.durum}
                          </span>
                        </div>

                        {/* Plaka + Kategori + Marka */}
                        <div className="flex items-center gap-2 flex-wrap mb-3">
                          {ekipman.plaka && (
                            <span className="font-mono text-xs bg-gray-100 text-gray-700 rounded px-1.5 py-0.5">
                              {ekipman.plaka}
                            </span>
                          )}
                          <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600">
                            {EKIPMAN_KATEGORI_ETIKETLERI[ekipman.kategori] || ekipman.kategori}
                          </span>
                          {ekipman.marka && (
                            <span className="text-xs text-gray-400">{ekipman.marka}</span>
                          )}
                        </div>

                        {/* Son Bakım */}
                        <div className="flex items-center justify-between text-xs text-gray-500">
                          <span>Son Bakım</span>
                          <span className="font-medium text-gray-700">
                            {ekipman.sonBakimTarihi
                              ? new Date(ekipman.sonBakimTarihi).toLocaleDateString('tr-TR')
                              : 'Yok'}
                          </span>
                        </div>
                        {ekipman.sonrakiBakimTarihi && (
                          <div className="flex items-center justify-between text-xs mt-0.5">
                            <span className="text-gray-500">Sonraki Bakım</span>
                            <span className={`font-medium ${ekipman.bakimYaklasan ? 'text-yellow-600' : 'text-gray-700'}`}>
                              {new Date(ekipman.sonrakiBakimTarihi).toLocaleDateString('tr-TR')}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Alt aksiyon butonları */}
                      <div className={`grid border-t border-gray-100 ${aracMi ? 'grid-cols-5' : 'grid-cols-4'}`}>
                        <button
                          onClick={() => { setSecilenEkipman(ekipman); setBakimModalAcik(true); }}
                          className="py-2.5 text-xs font-semibold text-yellow-700 active:bg-yellow-50 border-r border-gray-100"
                        >
                          Bakım
                        </button>
                        <button
                          onClick={() => giderGelirAc(ekipman, 'gider')}
                          className="py-2.5 text-xs font-semibold text-red-700 active:bg-red-50 border-r border-gray-100"
                        >
                          Gider
                        </button>
                        {aracMi && (
                          <button
                            onClick={() => giderGelirAc(ekipman, 'gelir')}
                            className="py-2.5 text-xs font-semibold text-green-700 active:bg-green-50 border-r border-gray-100"
                          >
                            Gelir
                          </button>
                        )}
                        <button
                          onClick={() => { setDuzenlenenEkipman(ekipman); setEkipmanFormuAcik(true); }}
                          className="py-2.5 text-xs font-semibold text-blue-700 active:bg-blue-50 border-r border-gray-100"
                        >
                          Düzenle
                        </button>
                        <button
                          onClick={() => ekipmanSil(ekipman.id)}
                          className="py-2.5 text-xs font-semibold text-gray-500 active:bg-gray-50"
                        >
                          Sil
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* === MASAÜSTÜ: Tablo === */}
            <div className="hidden md:block overflow-hidden rounded-lg border border-gray-200 bg-white">
              {ekipmanYukleniyor ? (
                <div className="py-12 text-center text-gray-400">Yükleniyor...</div>
              ) : ekipmanlar.length === 0 ? (
                <div className="py-12 text-center text-gray-400">Henüz ekipman eklenmemiş</div>
              ) : (
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 text-xs font-medium uppercase text-gray-500">
                    <tr>
                      <th className="px-4 py-3 text-left">Ekipman Adı</th>
                      <th className="px-4 py-3 text-left">Kategori</th>
                      <th className="px-4 py-3 text-left">Plaka / Seri</th>
                      <th className="px-4 py-3 text-left">Marka/Model</th>
                      <th className="px-4 py-3 text-center">Durum</th>
                      <th className="px-4 py-3 text-center">Son Bakım</th>
                      <th className="px-4 py-3 text-center">Sonraki Bakım</th>
                      <th className="px-4 py-3 text-center">İşlem</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {ekipmanlar.map((ekipman) => {
                      const aracMi = ARAC_KATEGORILER.has(ekipman.kategori);
                      return (
                        <tr key={ekipman.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3 font-medium text-gray-800">
                            {ekipman.ekipmanAdi}
                            {ekipman.bakimYaklasan && (
                              <span className="ml-2 text-xs text-yellow-600">⚠️ Bakım</span>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600">
                              {EKIPMAN_KATEGORI_ETIKETLERI[ekipman.kategori] || ekipman.kategori}
                            </span>
                          </td>
                          <td className="px-4 py-3 font-mono text-sm text-gray-700">
                            {ekipman.plaka || ekipman.seriNo || '-'}
                          </td>
                          <td className="px-4 py-3 text-gray-600">
                            {[ekipman.marka, ekipman.model].filter(Boolean).join(' / ') || '-'}
                          </td>
                          <td className="px-4 py-3 text-center">
                            <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${EKIPMAN_DURUM_RENKLERI[ekipman.durum] || 'bg-gray-100 text-gray-600'}`}>
                              {EKIPMAN_DURUM_ETIKETLERI[ekipman.durum] || ekipman.durum}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-center text-gray-600">
                            {ekipman.sonBakimTarihi
                              ? new Date(ekipman.sonBakimTarihi).toLocaleDateString('tr-TR')
                              : '-'}
                          </td>
                          <td className={`px-4 py-3 text-center font-medium ${ekipman.bakimYaklasan ? 'text-yellow-600' : 'text-gray-600'}`}>
                            {ekipman.sonrakiBakimTarihi
                              ? new Date(ekipman.sonrakiBakimTarihi).toLocaleDateString('tr-TR')
                              : '-'}
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center justify-center gap-1 flex-wrap">
                              <button
                                onClick={() => giderGelirAc(ekipman, 'gider')}
                                className="rounded bg-red-50 px-2 py-1 text-xs font-medium text-red-700 hover:bg-red-100"
                              >
                                Gider
                              </button>
                              {aracMi && (
                                <button
                                  onClick={() => giderGelirAc(ekipman, 'gelir')}
                                  className="rounded bg-green-50 px-2 py-1 text-xs font-medium text-green-700 hover:bg-green-100"
                                >
                                  Gelir
                                </button>
                              )}
                              <button
                                onClick={() => { setSecilenEkipman(ekipman); setBakimModalAcik(true); }}
                                className="rounded bg-yellow-50 px-2 py-1 text-xs font-medium text-yellow-700 hover:bg-yellow-100"
                              >
                                Bakım
                              </button>
                              <button
                                onClick={() => { setDuzenlenenEkipman(ekipman); setEkipmanFormuAcik(true); }}
                                className="rounded bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700 hover:bg-blue-100"
                              >
                                Düzenle
                              </button>
                              <button
                                onClick={() => ekipmanSil(ekipman.id)}
                                className="rounded bg-gray-50 px-2 py-1 text-xs font-medium text-gray-600 hover:bg-gray-100"
                              >
                                Sil
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}

        {/* ============ SEKME: ARAÇ RAPORU ============ */}
        {aktifSekme === 'rapor' && (
          <div>
            {raporYukleniyor ? (
              <div className="py-16 text-center">
                <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-green-500 border-t-transparent" />
                <p className="mt-3 text-sm text-gray-400">Yükleniyor...</p>
              </div>
            ) : raporlar.length === 0 ? (
              <div className="py-16 text-center">
                <p className="text-4xl mb-3">📊</p>
                <p className="text-sm text-gray-500">Henüz ekipman/araç kaydı yok</p>
              </div>
            ) : (
              <>
                {/* Özet kartlar */}
                <div className="mb-5 grid grid-cols-3 gap-3">
                  <div className="rounded-2xl border border-red-100 bg-red-50 p-3 md:p-4">
                    <p className="text-xs text-red-500 font-medium">Toplam Gider</p>
                    <p className="text-lg md:text-xl font-bold text-red-700 mt-1">
                      ₺{toplamRapor.gider.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                  <div className="rounded-2xl border border-green-100 bg-green-50 p-3 md:p-4">
                    <p className="text-xs text-green-600 font-medium">Toplam Gelir</p>
                    <p className="text-lg md:text-xl font-bold text-green-700 mt-1">
                      ₺{toplamRapor.gelir.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                  <div className={`rounded-2xl border p-3 md:p-4 ${toplamRapor.net >= 0 ? 'border-blue-100 bg-blue-50' : 'border-orange-100 bg-orange-50'}`}>
                    <p className={`text-xs font-medium ${toplamRapor.net >= 0 ? 'text-blue-500' : 'text-orange-500'}`}>Net Kar/Zarar</p>
                    <p className={`text-lg md:text-xl font-bold mt-1 ${toplamRapor.net >= 0 ? 'text-blue-700' : 'text-orange-700'}`}>
                      ₺{toplamRapor.net.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                </div>

                {/* Per-ekipman kartlar */}
                <div className="space-y-4">
                  {raporlar.map((rapor) => (
                    <div key={rapor.id} className="rounded-2xl border border-gray-200 bg-white overflow-hidden shadow-sm">
                      {/* Başlık */}
                      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 bg-gray-50">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-semibold text-gray-800 text-sm">{rapor.ekipmanAdi}</span>
                          {rapor.plaka && (
                            <span className="font-mono text-xs bg-gray-200 text-gray-700 rounded px-1.5 py-0.5">{rapor.plaka}</span>
                          )}
                          <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-500">
                            {EKIPMAN_KATEGORI_ETIKETLERI[rapor.kategori] || rapor.kategori}
                          </span>
                          {rapor.marka && (
                            <span className="text-xs text-gray-400">{rapor.marka} {rapor.model}</span>
                          )}
                        </div>
                        <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${EKIPMAN_DURUM_RENKLERI[rapor.durum] || 'bg-gray-100 text-gray-600'}`}>
                          {EKIPMAN_DURUM_ETIKETLERI[rapor.durum] || rapor.durum}
                        </span>
                      </div>

                      <div className="px-4 py-4">
                        {/* Özet rakamlar */}
                        <div className="grid grid-cols-3 gap-3 mb-4">
                          <div className="text-center">
                            <p className="text-xs text-gray-500">Toplam Gider</p>
                            <p className="text-sm md:text-base font-bold text-red-600">
                              ₺{rapor.toplamGider.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
                            </p>
                            <p className="text-xs text-gray-400">{rapor.giderSayisi} kayıt</p>
                          </div>
                          <div className="text-center">
                            <p className="text-xs text-gray-500">Toplam Gelir</p>
                            <p className="text-sm md:text-base font-bold text-green-600">
                              ₺{rapor.toplamGelir.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
                            </p>
                            <p className="text-xs text-gray-400">{rapor.gelirSayisi} kayıt</p>
                          </div>
                          <div className="text-center">
                            <p className="text-xs text-gray-500">Net Kar/Zarar</p>
                            <p className={`text-sm md:text-base font-bold ${rapor.netKar >= 0 ? 'text-blue-600' : 'text-orange-600'}`}>
                              ₺{rapor.netKar.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
                            </p>
                            {rapor.toplamMesafe > 0 && (
                              <p className="text-xs text-gray-400">{rapor.toplamMesafe.toLocaleString('tr-TR')} km</p>
                            )}
                          </div>
                        </div>

                        {/* Gider kırılımı */}
                        {Object.keys(rapor.giderKirilim).length > 0 && (
                          <div className="mb-3">
                            <p className="text-xs font-medium text-gray-500 mb-2">Gider Kırılımı</p>
                            <div className="flex flex-wrap gap-2">
                              {Object.entries(rapor.giderKirilim)
                                .sort((a, b) => b[1] - a[1])
                                .map(([tip, tutar]) => (
                                  <div key={tip} className="flex items-center gap-1 rounded-full bg-red-50 border border-red-100 px-2 py-1">
                                    <span className="text-xs text-red-600 font-medium">
                                      {GIDER_TIPI_ETIKETLERI[tip] || tip}
                                    </span>
                                    <span className="text-xs text-red-500">
                                      ₺{tutar.toLocaleString('tr-TR', { maximumFractionDigits: 0 })}
                                    </span>
                                  </div>
                                ))}
                            </div>
                            {rapor.toplamYakit > 0 && (
                              <p className="text-xs text-gray-400 mt-1">
                                Yakıt: {rapor.toplamYakit.toLocaleString('tr-TR', { maximumFractionDigits: 1 })} litre
                              </p>
                            )}
                          </div>
                        )}

                        {/* Gelir kırılımı */}
                        {Object.keys(rapor.gelirKirilim).length > 0 && (
                          <div>
                            <p className="text-xs font-medium text-gray-500 mb-2">Gelir Kırılımı</p>
                            <div className="flex flex-wrap gap-2">
                              {Object.entries(rapor.gelirKirilim)
                                .sort((a, b) => b[1] - a[1])
                                .map(([tip, tutar]) => (
                                  <div key={tip} className="flex items-center gap-1 rounded-full bg-green-50 border border-green-100 px-2 py-1">
                                    <span className="text-xs text-green-600 font-medium">
                                      {GELIR_TIPI_ETIKETLERI[tip] || tip}
                                    </span>
                                    <span className="text-xs text-green-500">
                                      ₺{tutar.toLocaleString('tr-TR', { maximumFractionDigits: 0 })}
                                    </span>
                                  </div>
                                ))}
                            </div>
                          </div>
                        )}

                        {rapor.giderSayisi === 0 && rapor.gelirSayisi === 0 && (
                          <p className="text-xs text-gray-400 text-center py-2">Henüz gider/gelir kaydı yok</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* ===== MODALLER ===== */}
      {malzemeFormuAcik && (
        <MalzemeFormu
          malzeme={duzenlenenMalzeme}
          onKapat={() => setMalzemeFormuAcik(false)}
          onBasarili={() => malzemeleriGetir()}
        />
      )}

      {stokModalAcik && secilenMalzeme && (
        <StokHareketiModal
          malzemeId={secilenMalzeme.id}
          malzemeAdi={secilenMalzeme.malzemeAdi}
          birim={secilenMalzeme.birim}
          mevcutStok={secilenMalzeme.mevcutStok}
          mevcutBirimFiyat={secilenMalzeme.birimFiyat}
          varsayilanTip={stokTipi}
          onKapat={() => setStokModalAcik(false)}
          onBasarili={(uyari) => {
            malzemeleriGetir();
            if (uyari) setStokUyarisi(uyari);
          }}
        />
      )}

      {ekipmanFormuAcik && (
        <EkipmanFormu
          ekipman={duzenlenenEkipman}
          onKapat={() => setEkipmanFormuAcik(false)}
          onBasarili={() => ekipmanlariGetir()}
        />
      )}

      {giderGelirModalAcik && secilenEkipman && (
        <EkipmanGiderGelirModal
          ekipmanId={secilenEkipman.id}
          ekipmanAdi={secilenEkipman.ekipmanAdi}
          plaka={secilenEkipman.plaka}
          aracMi={ARAC_KATEGORILER.has(secilenEkipman.kategori)}
          mod={giderGelirMod}
          onKapat={() => setGiderGelirModalAcik(false)}
          onKaydet={() => {
            ekipmanlariGetir();
            if (aktifSekme === 'rapor') raporlariGetir();
          }}
        />
      )}

      {bakimModalAcik && secilenEkipman && (
        <EkipmanBakimModal
          ekipmanId={secilenEkipman.id}
          ekipmanAdi={secilenEkipman.ekipmanAdi}
          plaka={secilenEkipman.plaka}
          onKapat={() => setBakimModalAcik(false)}
          onKaydet={() => {
            ekipmanlariGetir();
            malzemeleriGetir();
            if (aktifSekme === 'rapor') raporlariGetir();
          }}
        />
      )}
    </div>
  );
}
