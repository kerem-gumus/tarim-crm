'use client';

import { useEffect, useState } from 'react';

type Tarla = {
  id: string;
  tarlaAdi: string;
  ciftci: { id: string; adSoyad: string };
};

type Ekip = {
  id: string;
  ekipAdi: string;
  uyeler: { isci: { id: string; adSoyad: string } }[];
};

type Musteri = {
  id: string;
  musteriAdi: string;
  devletMi: boolean;
  odemeVadeGun: number;
};

type AktifKontenjan = {
  id: string;
  surgunId: string;
  musteriId: string;
  musteriAdi: string;
  musteriDevletMi: boolean;
  gunlukKontenjanKg: number;
  baslangicTarihi: string;
  bitisTarihi: string | null;
  oncekiBakiyeKg: number;   // Önceki bakiye (negatif=borç, pozitif=alacak)
  sonTakipTarih: string | null;
};

type FormVerisi = {
  tarih: string;
  tarlaId: string;
  tartimMiktariKg: string;
  satisMiktariKg: string;
  toplanmaTuru: 'tarla_sahibi' | 'isci';
  isciEkipId: string;
  odemeTuru: 'yevmiye' | 'ton_isi' | '';
  tonFiyati: string;
  yevmiyeFiyati: string;
  musteriId: string;
  fiyatTuru: 'devlet_fiyati' | 'ozel_fiyat' | '';
  satisKgFiyati: string;
  odemeSekli: 'pesin' | 'vadeli' | '';
  odemeTarihi: string;
  notlar: string;
};

type Props = {
  surgunId: string;
  netFiyat: number | null;
  onKapat: () => void;
  onKaydet: () => void;
};

const bugunStr = () => new Date().toISOString().split('T')[0];

function sayiFormat(n: number) {
  return n.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export default function HasatGirisFormu({ surgunId, netFiyat, onKapat, onKaydet }: Props) {
  const [form, setForm] = useState<FormVerisi>({
    tarih: bugunStr(),
    tarlaId: '',
    tartimMiktariKg: '',
    satisMiktariKg: '',
    toplanmaTuru: 'tarla_sahibi',
    isciEkipId: '',
    odemeTuru: '',
    tonFiyati: '',
    yevmiyeFiyati: '',
    musteriId: '',
    fiyatTuru: '',
    satisKgFiyati: '',
    odemeSekli: '',
    odemeTarihi: '',
    notlar: '',
  });

  const [tarlalar, setTarlalar] = useState<Tarla[]>([]);
  const [ekipler, setEkipler] = useState<Ekip[]>([]);
  const [musteriler, setMusteriler] = useState<Musteri[]>([]);
  const [aktifKontenjan, setAktifKontenjan] = useState<AktifKontenjan | null>(null);
  const [kontenjanYukleniyor, setKontenjanYukleniyor] = useState(false);
  const [yukleniyor, setYukleniyor] = useState(false);
  const [veriYukleniyor, setVeriYukleniyor] = useState(true);
  const [hata, setHata] = useState('');

  useEffect(() => {
    async function verileriGetir() {
      try {
        const [tarlalarYanit, ekiplerYanit, musterilerYanit] = await Promise.all([
          fetch('/api/tarlalar?durum=aktif'),
          fetch('/api/ekipler'),
          fetch('/api/musteriler'),
        ]);
        const [tarlalarVerisi, ekiplerVerisi, musterilerVerisi] = await Promise.all([
          tarlalarYanit.json(),
          ekiplerYanit.json(),
          musterilerYanit.json(),
        ]);
        setTarlalar(Array.isArray(tarlalarVerisi) ? tarlalarVerisi : []);
        setEkipler(Array.isArray(ekiplerVerisi) ? ekiplerVerisi : []);
        setMusteriler(Array.isArray(musterilerVerisi) ? musterilerVerisi : []);
      } catch {
        setHata('Veriler yüklenemedi');
      } finally {
        setVeriYukleniyor(false);
      }
    }
    verileriGetir();
  }, []);

  const seciliMusteri = musteriler.find((m) => m.id === form.musteriId);
  const musteriDevletMi = aktifKontenjan?.musteriDevletMi ?? seciliMusteri?.devletMi ?? false;

  // Kontenjan otomatik algılama
  useEffect(() => {
    if (!form.musteriId || !form.tarih || !surgunId) {
      setAktifKontenjan(null);
      return;
    }
    const musteri = musteriler.find((m) => m.id === form.musteriId);
    if (!musteri?.devletMi) {
      setAktifKontenjan(null);
      return;
    }

    setKontenjanYukleniyor(true);
    fetch(`/api/kontenjanlar/aktif?surgunId=${surgunId}&musteriId=${form.musteriId}&tarih=${form.tarih}&tek=1`)
      .then((r) => r.json())
      .then((veri) => {
        setAktifKontenjan(veri ?? null);
        // Satış alanını boş bırak — kullanıcı doldurmadıysa günlük kontenjan varsayılan olarak kullanılır
      })
      .catch(() => setAktifKontenjan(null))
      .finally(() => setKontenjanYukleniyor(false));
  }, [form.musteriId, form.tarih, surgunId, musteriler]);

  function guncelle(alan: keyof FormVerisi, deger: string) {
    setForm((onceki) => {
      const yeni = { ...onceki, [alan]: deger };

      if (alan === 'tartimMiktariKg' && onceki.satisMiktariKg === onceki.tartimMiktariKg) {
        // Kontenjan modunda satışı otomatik değiştirme
        if (!aktifKontenjan) yeni.satisMiktariKg = deger;
      }
      if (alan === 'toplanmaTuru' && deger === 'tarla_sahibi') {
        yeni.isciEkipId = '';
        yeni.odemeTuru = '';
        yeni.tonFiyati = '';
        yeni.yevmiyeFiyati = '';
      }
      if (alan === 'odemeTuru') {
        yeni.tonFiyati = '';
        yeni.yevmiyeFiyati = '';
      }
      if (alan === 'musteriId') {
        yeni.fiyatTuru = '';
        yeni.satisKgFiyati = '';
        yeni.odemeSekli = '';
        yeni.odemeTarihi = '';
        yeni.satisMiktariKg = '';
      }
      if (alan === 'fiyatTuru') {
        yeni.satisKgFiyati = deger === 'devlet_fiyati' && netFiyat ? String(netFiyat) : '';
        yeni.odemeSekli = '';
        yeni.odemeTarihi = '';
      }
      if (alan === 'odemeSekli') {
        yeni.odemeTarihi = deger === 'pesin' ? bugunStr() : '';
      }
      return yeni;
    });
  }

  // Kontenjan bakiye hesabı
  const kontenjanBakiyeHesabi = (() => {
    if (!aktifKontenjan) return null;
    const tartim = Number(form.tartimMiktariKg) || 0;
    const oncekiBakiye = aktifKontenjan.oncekiBakiyeKg;  // negatif=borç, pozitif=alacak
    const etkiliTartim = tartim + oncekiBakiye;
    const gunlukKg = aktifKontenjan.gunlukKontenjanKg;
    // Boş bırakılmışsa günlük kontenjan varsayılan; 0 dahil elle yazılmışsa o değer
    const satisKg = form.satisMiktariKg !== ''
      ? Number(form.satisMiktariKg)
      : gunlukKg;
    const yeniBakiye = etkiliTartim - satisKg;
    return { tartim, oncekiBakiye, etkiliTartim, gunlukKg, satisKg, yeniBakiye };
  })();

  // İşçilik tutarı önizlemesi
  const iscilikOnizleme = (() => {
    if (form.toplanmaTuru !== 'isci' || !form.isciEkipId || !form.odemeTuru) return null;
    const tartim = Number(form.tartimMiktariKg) || 0;
    if (form.odemeTuru === 'ton_isi' && form.tonFiyati && tartim > 0) {
      return (tartim / 1000) * Number(form.tonFiyati);
    }
    if (form.odemeTuru === 'yevmiye' && form.yevmiyeFiyati && form.isciEkipId) {
      const seciliEkip = ekipler.find((e) => e.id === form.isciEkipId);
      if (seciliEkip) return Number(form.yevmiyeFiyati) * seciliEkip.uyeler.length;
    }
    return null;
  })();

  // Satış tutarı önizlemesi
  const satisTutarOnizleme = (() => {
    const kg = parseFloat(form.satisMiktariKg || form.tartimMiktariKg);
    const fiyat = parseFloat(form.satisKgFiyati);
    if (kg > 0 && fiyat > 0) return kg * fiyat;
    return null;
  })();

  async function kaydet(e: React.FormEvent) {
    e.preventDefault();
    setHata('');

    const tartim = Number(form.tartimMiktariKg) || 0;

    // Normal modda (kontenjan yok) tartım zorunlu ve > 0
    if (!aktifKontenjan && tartim <= 0) {
      setHata('Tartım miktarı 0\'dan büyük olmalıdır');
      return;
    }

    // Normal modda tarla zorunlu
    if (!aktifKontenjan && !form.tarlaId) {
      setHata('Tarla seçimi zorunludur');
      return;
    }

    // Devlet dışı müşteride fiyat zorunlu
    if (!musteriDevletMi && form.musteriId) {
      if (!form.fiyatTuru) { setHata('Fiyat türünü seçin'); return; }
      if (!form.satisKgFiyati) { setHata('Kg fiyatını girin'); return; }
      if (!form.odemeSekli) { setHata('Ödeme şeklini seçin'); return; }
      if (!form.odemeTarihi) { setHata('Ödeme tarihini girin'); return; }
    }

    setYukleniyor(true);
    try {
      const govde: Record<string, unknown> = {
        surgunId,
        tarih: form.tarih,
        tarlaId: form.tarlaId || null,
        tartimMiktariKg: tartim,
        // Kontenjan modunda: boş bırakılmışsa günlük kontenjan, elle yazılmışsa (0 dahil) o değer
        satisMiktariKg: aktifKontenjan
          ? (form.satisMiktariKg === '' ? aktifKontenjan.gunlukKontenjanKg : Number(form.satisMiktariKg))
          : Number(form.satisMiktariKg || form.tartimMiktariKg),
        toplanmaTuru: form.toplanmaTuru,
        musteriId: form.musteriId,
        notlar: form.notlar || null,
      };

      // Kontenjan bilgisi (bakiye hesabı için)
      if (aktifKontenjan) {
        govde.kontenjanId = aktifKontenjan.id;
        govde.kontenjanBakiyeKg = aktifKontenjan.oncekiBakiyeKg;
        govde.gunlukKontenjanKg = aktifKontenjan.gunlukKontenjanKg;
      }

      if (form.toplanmaTuru === 'isci') {
        govde.isciEkipId = form.isciEkipId || null;
        govde.odemeTuru = form.odemeTuru || null;
        if (form.odemeTuru === 'ton_isi') govde.tonFiyati = Number(form.tonFiyati);
        if (form.odemeTuru === 'yevmiye') govde.yevmiyeFiyati = Number(form.yevmiyeFiyati);
      }

      if (!musteriDevletMi && form.fiyatTuru) {
        govde.fiyatTuru = form.fiyatTuru;
        govde.satisKgFiyati = parseFloat(form.satisKgFiyati);
        govde.odemeSekli = form.odemeSekli;
        govde.odemeTarihi = form.odemeTarihi;
      }

      const yanit = await fetch('/api/hasat-girisleri', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(govde),
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

  if (veriYukleniyor) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
        <div className="rounded-xl bg-white px-8 py-6 text-gray-500 shadow-2xl">Yükleniyor...</div>
      </div>
    );
  }

  const seciliEkip = ekipler.find((e) => e.id === form.isciEkipId);
  const uyeSayisi = seciliEkip?.uyeler.length ?? 0;
  const kontenjanModu = !!aktifKontenjan;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="relative max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-xl bg-white shadow-2xl">
        <div className="sticky top-0 flex items-center justify-between border-b bg-white px-6 py-4">
          <div>
            <h2 className="text-lg font-semibold text-gray-800">Yeni Hasat Girişi</h2>
            {kontenjanModu && (
              <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-medium">
                Kontenjan Modu — {aktifKontenjan!.musteriAdi}
              </span>
            )}
          </div>
          <button onClick={onKapat} className="text-xl font-bold text-gray-400 hover:text-gray-600">✕</button>
        </div>

        <form onSubmit={kaydet} className="space-y-5 px-6 py-5">
          {hata && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{hata}</div>
          )}

          {/* Temel Bilgiler */}
          <fieldset className="space-y-3">
            <legend className="text-xs font-semibold uppercase tracking-wider text-gray-400">Temel Bilgiler</legend>

            <div className="grid grid-cols-2 gap-3">
              {/* Tarih */}
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Tarih <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={form.tarih}
                  onChange={(e) => guncelle('tarih', e.target.value)}
                  required
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
                />
              </div>

              {/* Müşteri (tarihten önce göster, kontenjanı algılamak için) */}
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Müşteri <span className="text-red-500">*</span>
                </label>
                <select
                  value={form.musteriId}
                  onChange={(e) => guncelle('musteriId', e.target.value)}
                  required
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
                >
                  <option value="">Müşteri seçin...</option>
                  {musteriler.map((musteri) => (
                    <option key={musteri.id} value={musteri.id}>
                      {musteri.musteriAdi}{musteri.devletMi ? ' 🏛️' : ''}
                    </option>
                  ))}
                </select>
                {kontenjanYukleniyor && (
                  <p className="mt-1 text-xs text-blue-500">Kontenjan aranıyor...</p>
                )}
              </div>
            </div>

            {/* Kontenjan Bilgisi Paneli */}
            {kontenjanModu && kontenjanBakiyeHesabi && (
              <div className="rounded-xl border border-blue-200 bg-blue-50 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-blue-800">Kontenjan Bilgisi</p>
                  <span className="text-xs bg-blue-200 text-blue-800 px-2 py-0.5 rounded-full">
                    {sayiFormat(aktifKontenjan!.gunlukKontenjanKg)} kg/gün
                  </span>
                </div>

                {/* Önceki bakiye */}
                {aktifKontenjan!.oncekiBakiyeKg !== 0 && (
                  <div className={`rounded-lg px-3 py-2 text-sm flex justify-between ${
                    aktifKontenjan!.oncekiBakiyeKg < 0
                      ? 'bg-red-100 text-red-800'
                      : 'bg-green-100 text-green-800'
                  }`}>
                    <span className="font-medium">
                      {aktifKontenjan!.oncekiBakiyeKg < 0 ? 'Devlet Borcu (eksik teslimat)' : 'Alacak (fazla teslimat)'}
                    </span>
                    <span className="font-bold">
                      {aktifKontenjan!.oncekiBakiyeKg < 0 ? '' : '+'}
                      {sayiFormat(aktifKontenjan!.oncekiBakiyeKg)} kg
                    </span>
                  </div>
                )}

                {/* Canlı hesap */}
                <div className="grid grid-cols-3 gap-2 text-xs">
                  <div className="rounded bg-white border border-blue-200 px-2 py-1.5 text-center">
                    <p className="text-gray-500">Tartım</p>
                    <p className="font-bold text-gray-800">{sayiFormat(kontenjanBakiyeHesabi.tartim)} kg</p>
                  </div>
                  <div className="rounded bg-white border border-blue-200 px-2 py-1.5 text-center">
                    <p className="text-gray-500">Etkili Tartım</p>
                    <p className={`font-bold ${kontenjanBakiyeHesabi.etkiliTartim < 0 ? 'text-red-600' : 'text-blue-700'}`}>
                      {sayiFormat(kontenjanBakiyeHesabi.etkiliTartim)} kg
                    </p>
                  </div>
                  <div className="rounded bg-white border border-blue-200 px-2 py-1.5 text-center">
                    <p className="text-gray-500">Satış</p>
                    <p className="font-bold text-blue-700">{sayiFormat(kontenjanBakiyeHesabi.satisKg)} kg</p>
                  </div>
                </div>

                {/* Yeni bakiye */}
                <div className={`rounded-lg px-3 py-2 flex justify-between items-center ${
                  kontenjanBakiyeHesabi.yeniBakiye < 0
                    ? 'bg-red-50 border border-red-200'
                    : kontenjanBakiyeHesabi.yeniBakiye > 0
                    ? 'bg-green-50 border border-green-200'
                    : 'bg-gray-50 border border-gray-200'
                }`}>
                  <span className="text-sm font-medium text-gray-700">Yeni Bakiye</span>
                  <div className="text-right">
                    <p className={`text-sm font-bold ${
                      kontenjanBakiyeHesabi.yeniBakiye < 0 ? 'text-red-700' :
                      kontenjanBakiyeHesabi.yeniBakiye > 0 ? 'text-green-700' : 'text-gray-700'
                    }`}>
                      {sayiFormat(kontenjanBakiyeHesabi.yeniBakiye)} kg
                    </p>
                    <p className="text-xs text-gray-500">
                      {kontenjanBakiyeHesabi.yeniBakiye < 0
                        ? `${sayiFormat(Math.abs(kontenjanBakiyeHesabi.yeniBakiye))} kg teslimat borcu`
                        : kontenjanBakiyeHesabi.yeniBakiye > 0
                        ? `${sayiFormat(kontenjanBakiyeHesabi.yeniBakiye)} kg alacak`
                        : 'Dengede'}
                    </p>
                  </div>
                </div>

                {/* Satış durumu notu */}
                {form.satisMiktariKg === '' ? (
                  <p className="text-xs text-blue-600 italic">
                    Satış alanı boş — günlük kontenjan ({sayiFormat(aktifKontenjan!.gunlukKontenjanKg)} kg) kullanılacak.
                  </p>
                ) : form.satisMiktariKg === '0' ? (
                  <p className="text-xs text-orange-600 italic">
                    Satış 0 — resmi satış yok, yalnızca tartım bakiyeye eklenir.
                  </p>
                ) : null}
              </div>
            )}

            {/* Tartım ve Satış Miktarları */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Tartım Miktarı (kg)
                  {!kontenjanModu && <span className="text-red-500"> *</span>}
                  {kontenjanModu && <span className="text-xs text-gray-400 font-normal"> (0 girilebilir)</span>}
                </label>
                <input
                  type="number"
                  value={form.tartimMiktariKg}
                  onChange={(e) => guncelle('tartimMiktariKg', e.target.value)}
                  required={!kontenjanModu}
                  min={0}
                  step={0.01}
                  placeholder="0.00"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
                />
                {kontenjanModu && (
                  <p className="mt-1 text-xs text-gray-400">
                    0 girilirse devlete borçlanılır
                  </p>
                )}
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Satış Miktarı (kg)
                  {kontenjanModu && <span className="text-xs text-blue-500 font-normal"> (varsayılan: kontenjan)</span>}
                </label>
                <input
                  type="number"
                  value={form.satisMiktariKg}
                  onChange={(e) => guncelle('satisMiktariKg', e.target.value)}
                  min={0}
                  step={0.01}
                  placeholder={kontenjanModu ? String(aktifKontenjan!.gunlukKontenjanKg) : '0.00'}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
                />
                {kontenjanModu && (
                  <p className="mt-1 text-xs text-gray-400">
                    Boş → günlük kontenjan ({aktifKontenjan!.gunlukKontenjanKg} kg) • 0 → resmi satış yok, tartım bakiyeyi düşürür
                  </p>
                )}
              </div>
            </div>

            {/* Tarla — Kontenjan modunda opsiyonel */}
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Tarla
                {!kontenjanModu && <span className="text-red-500"> *</span>}
                {kontenjanModu && <span className="text-xs text-gray-400 font-normal"> (kontenjan modunda opsiyonel)</span>}
              </label>
              <select
                value={form.tarlaId}
                onChange={(e) => guncelle('tarlaId', e.target.value)}
                required={!kontenjanModu}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
              >
                <option value="">{kontenjanModu ? '— Opsiyonel —' : 'Tarla seçin...'}</option>
                {tarlalar.map((tarla) => (
                  <option key={tarla.id} value={tarla.id}>
                    {tarla.tarlaAdi} — {tarla.ciftci.adSoyad}
                  </option>
                ))}
              </select>
              {kontenjanModu && (
                <p className="mt-1 text-xs text-gray-400">
                  Gerçek tartım yapılmıyorsa tarla seçmeden geçebilirsiniz
                </p>
              )}
            </div>
          </fieldset>

          {/* Satış Fiyatı — sadece özel müşterilerde */}
          {form.musteriId && !musteriDevletMi && (
            <fieldset className="space-y-3 rounded-lg border border-blue-100 bg-blue-50 p-4">
              <legend className="text-xs font-semibold uppercase tracking-wider text-blue-600">Satış Fiyatı</legend>

              <div className="flex gap-4">
                <label className="flex cursor-pointer items-center gap-2 text-sm">
                  <input
                    type="radio"
                    name="fiyatTuru"
                    value="devlet_fiyati"
                    checked={form.fiyatTuru === 'devlet_fiyati'}
                    onChange={(e) => guncelle('fiyatTuru', e.target.value)}
                    className="text-blue-600"
                  />
                  <span className="font-medium text-gray-700">Devlet Fiyatı</span>
                  {netFiyat && (
                    <span className="text-xs text-gray-400">(₺{Number(netFiyat).toFixed(4)}/kg)</span>
                  )}
                </label>
                <label className="flex cursor-pointer items-center gap-2 text-sm">
                  <input
                    type="radio"
                    name="fiyatTuru"
                    value="ozel_fiyat"
                    checked={form.fiyatTuru === 'ozel_fiyat'}
                    onChange={(e) => guncelle('fiyatTuru', e.target.value)}
                    className="text-blue-600"
                  />
                  <span className="font-medium text-gray-700">Özel Fiyat</span>
                </label>
              </div>

              {form.fiyatTuru && (
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    Kg Fiyatı (₺/kg) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    value={form.satisKgFiyati}
                    onChange={(e) => guncelle('satisKgFiyati', e.target.value)}
                    required
                    min={0}
                    step={0.0001}
                    placeholder="0.0000"
                    readOnly={form.fiyatTuru === 'devlet_fiyati'}
                    className={`w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 ${
                      form.fiyatTuru === 'devlet_fiyati'
                        ? 'border-gray-200 bg-gray-100 text-gray-500'
                        : 'border-gray-300 bg-white'
                    }`}
                  />
                  {form.fiyatTuru === 'devlet_fiyati' && !netFiyat && (
                    <p className="mt-1 text-xs text-orange-500">Hasat dönemine net fiyat girilmemiş!</p>
                  )}
                </div>
              )}

              {satisTutarOnizleme !== null && (
                <div className="rounded-lg border border-blue-200 bg-white px-4 py-2 flex justify-between text-sm">
                  <span className="text-gray-500">
                    {(parseFloat(form.satisMiktariKg) || parseFloat(form.tartimMiktariKg)).toFixed(2)} kg × ₺{parseFloat(form.satisKgFiyati).toFixed(4)}
                  </span>
                  <span className="font-bold text-blue-700">
                    = ₺{satisTutarOnizleme.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
                  </span>
                </div>
              )}

              {form.fiyatTuru && (
                <div className="space-y-3 border-t border-blue-200 pt-3">
                  <div className="flex gap-4">
                    <label className="flex cursor-pointer items-center gap-2 text-sm">
                      <input type="radio" name="odemeSekli" value="pesin"
                        checked={form.odemeSekli === 'pesin'}
                        onChange={(e) => guncelle('odemeSekli', e.target.value)} className="text-blue-600" />
                      <span className="font-medium text-gray-700">Peşin</span>
                    </label>
                    <label className="flex cursor-pointer items-center gap-2 text-sm">
                      <input type="radio" name="odemeSekli" value="vadeli"
                        checked={form.odemeSekli === 'vadeli'}
                        onChange={(e) => guncelle('odemeSekli', e.target.value)} className="text-blue-600" />
                      <span className="font-medium text-gray-700">Vadeli</span>
                    </label>
                  </div>

                  {form.odemeSekli && (
                    <div>
                      <label className="mb-1 block text-sm font-medium text-gray-700">
                        {form.odemeSekli === 'pesin' ? 'Ödeme Tarihi' : 'Vade Tarihi'}{' '}
                        <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="date"
                        value={form.odemeTarihi}
                        onChange={(e) => guncelle('odemeTarihi', e.target.value)}
                        required
                        className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    </div>
                  )}
                </div>
              )}
            </fieldset>
          )}

          {/* Toplanma Türü */}
          <fieldset className="space-y-3">
            <legend className="text-xs font-semibold uppercase tracking-wider text-gray-400">Toplanma Türü</legend>

            <div className="flex gap-4">
              <label className="flex cursor-pointer items-center gap-2 text-sm">
                <input type="radio" name="toplanmaTuru" value="tarla_sahibi"
                  checked={form.toplanmaTuru === 'tarla_sahibi'}
                  onChange={(e) => guncelle('toplanmaTuru', e.target.value)} className="text-green-600" />
                <span className="font-medium text-gray-700">Tarla Sahibi</span>
              </label>
              <label className="flex cursor-pointer items-center gap-2 text-sm">
                <input type="radio" name="toplanmaTuru" value="isci"
                  checked={form.toplanmaTuru === 'isci'}
                  onChange={(e) => guncelle('toplanmaTuru', e.target.value)} className="text-green-600" />
                <span className="font-medium text-gray-700">İşçi</span>
              </label>
            </div>

            {form.toplanmaTuru === 'isci' && (
              <div className="space-y-3 rounded-lg border border-amber-100 bg-amber-50 p-4">
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    İşçi Ekibi <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={form.isciEkipId}
                    onChange={(e) => guncelle('isciEkipId', e.target.value)}
                    required={form.toplanmaTuru === 'isci'}
                    className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
                  >
                    <option value="">Ekip seçin...</option>
                    {ekipler.map((ekip) => (
                      <option key={ekip.id} value={ekip.id}>
                        {ekip.ekipAdi} ({ekip.uyeler.length} kişi)
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    Ödeme Türü <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={form.odemeTuru}
                    onChange={(e) => guncelle('odemeTuru', e.target.value)}
                    required={form.toplanmaTuru === 'isci'}
                    className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
                  >
                    <option value="">Ödeme türü seçin...</option>
                    <option value="yevmiye">Yevmiye</option>
                    <option value="ton_isi">Ton İşi</option>
                  </select>
                </div>

                {form.odemeTuru === 'yevmiye' && (
                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">
                      Yevmiye Fiyatı (₺/kişi) <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      value={form.yevmiyeFiyati}
                      onChange={(e) => guncelle('yevmiyeFiyati', e.target.value)}
                      required={form.odemeTuru === 'yevmiye'}
                      min={0} step={0.01} placeholder="0.00"
                      className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
                    />
                    {form.isciEkipId && (
                      <p className="mt-1 text-xs text-gray-500">Ekipte {uyeSayisi} aktif üye var</p>
                    )}
                  </div>
                )}

                {form.odemeTuru === 'ton_isi' && (
                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">
                      Ton Fiyatı (₺/ton) <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      value={form.tonFiyati}
                      onChange={(e) => guncelle('tonFiyati', e.target.value)}
                      required={form.odemeTuru === 'ton_isi'}
                      min={0} step={0.01} placeholder="0.00"
                      className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
                    />
                  </div>
                )}

                {iscilikOnizleme !== null && (
                  <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3">
                    <p className="text-xs text-gray-500">Tahmini İşçilik Tutarı</p>
                    <p className="text-lg font-bold text-green-700">
                      ₺{iscilikOnizleme.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                )}
              </div>
            )}
          </fieldset>

          {/* Notlar */}
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Notlar</label>
            <textarea
              value={form.notlar}
              onChange={(e) => guncelle('notlar', e.target.value)}
              rows={2}
              placeholder="Ek notlar..."
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
            />
          </div>

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
              {yukleniyor ? 'Kaydediliyor...' : 'Hasat Girişini Kaydet'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
