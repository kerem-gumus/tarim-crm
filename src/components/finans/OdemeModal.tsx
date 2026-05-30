'use client';

import { useEffect, useState } from 'react';

interface BankaHesabi {
  id: string;
  hesapAdi: string;
  bankaAdi: string | null;
  tur: 'banka' | 'kasa' | 'fark_hesabi';
  bakiye: number;
  kmhLimiti: boolean;
  alarmDurumu: boolean;
}

interface OdemeModalProps {
  tip: 'gelir' | 'borc';
  kayitId: string;
  kalanTutar: number;
  toplamTutar?: number;
  musteriAdi?: string | null;
  onKaydet: () => void;
  onKapat: () => void;
}

function paraFormat(sayi: number) {
  return sayi.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' ₺';
}

// KMH onay modalı
function KmhUyariModal({
  bakiye,
  odenenMiktar,
  kmhLimiti,
  onOnayla,
  onIptal,
}: {
  bakiye: number;
  odenenMiktar: number;
  kmhLimiti: boolean;
  onOnayla: () => void;
  onIptal: () => void;
}) {
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-sm rounded-xl bg-white shadow-2xl">
        <div className="border-b border-red-100 bg-red-50 px-5 py-4 rounded-t-xl">
          <div className="flex items-center gap-2">
            <span className="text-2xl">⚠️</span>
            <h3 className="text-base font-semibold text-red-800">Hesap Bakiyesi Yetersiz</h3>
          </div>
        </div>
        <div className="p-5 space-y-3">
          <div className="rounded-lg bg-amber-50 border border-amber-200 px-4 py-3 space-y-1">
            <div className="flex justify-between text-sm">
              <span className="text-amber-700">Mevcut Bakiye</span>
              <span className="font-semibold text-amber-800">{paraFormat(bakiye)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-amber-700">Yapılacak Ödeme</span>
              <span className="font-semibold text-amber-800">{paraFormat(odenenMiktar)}</span>
            </div>
            <div className="flex justify-between text-sm border-t border-amber-200 pt-1 mt-1">
              <span className="text-red-700 font-medium">Eksik Tutar</span>
              <span className="font-bold text-red-800">{paraFormat(odenenMiktar - bakiye)}</span>
            </div>
          </div>

          {kmhLimiti ? (
            <div className="rounded-lg bg-orange-50 border border-orange-200 px-4 py-3">
              <p className="text-sm font-medium text-orange-800">KMH devreye girecek</p>
              <p className="text-xs text-orange-600 mt-1">
                Bu hesapta Kredili Mevduat Hesabı (KMH) tanımlı. Devam ederseniz bakiye eksiye düşecek ve
                banka faiz işletecektir. Hesap alarm durumuna geçecektir.
              </p>
            </div>
          ) : (
            <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3">
              <p className="text-sm font-medium text-red-800">Hesapta para yok!</p>
              <p className="text-xs text-red-600 mt-1">
                Bu hesapta yeterli bakiye bulunmuyor ve KMH limiti tanımlı değil.
                Gene de devam etmek isterseniz hesap alarm durumuna geçecektir.
              </p>
            </div>
          )}

          <p className="text-xs text-gray-500 text-center">Devam etmek istiyor musunuz?</p>
        </div>
        <div className="border-t px-5 py-4 flex gap-3">
          <button
            onClick={onIptal}
            className="flex-1 rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            İptal
          </button>
          <button
            onClick={onOnayla}
            className="flex-1 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
          >
            Evet, Devam Et
          </button>
        </div>
      </div>
    </div>
  );
}

export default function OdemeModal({
  tip,
  kayitId,
  kalanTutar,
  toplamTutar,
  musteriAdi,
  onKaydet,
  onKapat,
}: OdemeModalProps) {
  // Gelir için
  const [gercekTutar, setGercekTutar] = useState<string>(kalanTutar.toFixed(2));
  const [bankaHesabiId, setBankaHesabiId] = useState<string>('');
  const [tamOdeme, setTamOdeme] = useState<boolean>(true);
  const [dekontUrl, setDekontUrl] = useState<string>('');
  const [aciklama, setAciklama] = useState<string>('');
  // Borç için
  const [borcGercekOdeme, setBorcGercekOdeme] = useState<string>(kalanTutar.toFixed(2));
  const [borcTamOdeme, setBorcTamOdeme] = useState<boolean>(true);
  const [odemeYontemi, setOdemeYontemi] = useState<string>('nakit');
  const [borcBankaHesabiId, setBorcBankaHesabiId] = useState<string>('');
  const [dekontDosyaAdi, setDekontDosyaAdi] = useState<string>('');
  const [dekontYukleniyor, setDekontYukleniyor] = useState(false);
  // Ortak
  const [odemeTarihi, setOdemeTarihi] = useState<string>(new Date().toISOString().split('T')[0]);
  const [bankaHesaplari, setBankaHesaplari] = useState<BankaHesabi[]>([]);
  const [kmhUyari, setKmhUyari] = useState<{ bakiye: number; kmhLimiti: boolean } | null>(null);
  const [yukleniyor, setYukleniyor] = useState(false);
  const [hata, setHata] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/banka-hesaplari')
      .then((r) => r.json())
      .then((veri) => {
        if (Array.isArray(veri)) {
          setBankaHesaplari(veri.filter((h: BankaHesabi) => h.tur !== 'fark_hesabi'));
        }
      })
      .catch(() => {});
  }, []);

  // Gelir fark hesabı
  const gercekSayi = Number(gercekTutar) || 0;
  const farkTutar = kalanTutar - gercekSayi;
  const farkPozitif = farkTutar > 0.005;
  const farkNegatif = farkTutar < -0.005;

  // Borç fark hesabı
  const borcGercekSayi = Number(borcGercekOdeme) || 0;
  const borcFarkTutar = kalanTutar - borcGercekSayi; // > 0: az ödedik (elimizde kaldı), < 0: fazla ödedik
  const borcFarkPozitif = borcFarkTutar > 0.005;
  const borcFarkNegatif = borcFarkTutar < -0.005;

  const seciliBorcHesap = bankaHesaplari.find((h) => h.id === borcBankaHesabiId);

  async function odemeYap(kmhOnayi = false) {
    if (!borcGercekSayi || borcGercekSayi <= 0) { setHata('Geçerli bir ödeme tutarı giriniz'); return; }
    if (odemeYontemi === 'banka' && !borcBankaHesabiId) {
      setHata('Lütfen bir banka hesabı seçiniz'); return;
    }

    setYukleniyor(true); setHata(null);
    try {
      const yanit = await fetch(`/api/odeme-kayitlari/${kayitId}/odeme`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          gercekOdeme: borcGercekSayi,
          tamOdeme: borcTamOdeme,
          odemeYontemi,
          odemeTarihi,
          bankaHesabiId: odemeYontemi === 'banka' ? borcBankaHesabiId : undefined,
          kmhOnayi,
        }),
      });

      if (yanit.status === 409) {
        const v = await yanit.json();
        if (v.hata === 'yetersiz_bakiye') {
          setKmhUyari({ bakiye: v.bakiye, kmhLimiti: v.kmhLimiti });
          return;
        }
        setHata(v.mesaj ?? 'Hata');
        return;
      }

      if (!yanit.ok) { const v = await yanit.json(); setHata(v.hata ?? 'Hata'); return; }
      onKaydet();
    } catch { setHata('Bağlantı hatası'); } finally { setYukleniyor(false); }
  }

  async function handleKaydet() {
    if (tip === 'gelir') {
      if (gercekSayi <= 0) { setHata('Geçerli bir gerçek tutar giriniz'); return; }
      setYukleniyor(true); setHata(null);
      try {
        const yanit = await fetch(`/api/gelir-kayitlari/${kayitId}/odeme`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            hesaplananTutar: kalanTutar,
            gercekTutar: gercekSayi,
            odemeTarihi,
            aciklama: aciklama || null,
            dekontUrl: dekontUrl || null,
            bankaHesabiId: bankaHesabiId || null,
            tamOdeme,
          }),
        });
        if (!yanit.ok) { const v = await yanit.json(); setHata(v.hata ?? 'Hata'); return; }
        onKaydet();
      } catch { setHata('Bağlantı hatası'); } finally { setYukleniyor(false); }
    } else {
      await odemeYap(false);
    }
  }

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
        <div className="w-full max-w-md rounded-xl bg-white shadow-xl">
          <div className="border-b px-5 py-4">
            <h3 className="text-base font-semibold text-gray-800">
              {tip === 'gelir' ? 'Ödeme Al' : 'Ödeme Yap'}
            </h3>
            {musteriAdi && <p className="text-xs text-gray-500 mt-0.5">{musteriAdi}</p>}
          </div>

          <div className="p-5 space-y-4">
            {tip === 'gelir' ? (
              <>
                {/* Hesaplanan tutar */}
                <div className="rounded-lg bg-blue-50 border border-blue-100 px-4 py-3 flex justify-between items-center">
                  <div>
                    <p className="text-xs text-blue-600 font-medium">Hesaplanan Kalan Tutar</p>
                    {toplamTutar && toplamTutar !== kalanTutar && (
                      <p className="text-xs text-blue-400">Toplam: {paraFormat(toplamTutar)}</p>
                    )}
                  </div>
                  <p className="text-xl font-bold text-blue-800">{paraFormat(kalanTutar)}</p>
                </div>

                {/* Gerçek banka tutarı */}
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Gerçek Banka Ödemesi (₺) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    value={gercekTutar}
                    onChange={(e) => setGercekTutar(e.target.value)}
                    step={0.01}
                    min={0.01}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                  <p className="text-xs text-gray-400 mt-1">
                    Fabrikanın banka hesabınıza yatırdığı gerçek tutar
                  </p>
                </div>

                {/* Fark göstergesi */}
                {(farkPozitif || farkNegatif) && (
                  <div className={`rounded-lg px-4 py-2.5 border ${farkPozitif ? 'bg-amber-50 border-amber-200' : 'bg-purple-50 border-purple-200'}`}>
                    <div className="flex justify-between items-center">
                      <span className={`text-xs font-medium ${farkPozitif ? 'text-amber-700' : 'text-purple-700'}`}>
                        {farkPozitif ? 'Eksik Ödeme (Fark)' : 'Fazla Ödeme (Fark)'}
                      </span>
                      <span className={`text-sm font-bold ${farkPozitif ? 'text-amber-800' : 'text-purple-800'}`}>
                        {farkPozitif ? '-' : '+'}{paraFormat(Math.abs(farkTutar))}
                      </span>
                    </div>
                    <p className={`text-xs mt-0.5 ${farkPozitif ? 'text-amber-600' : 'text-purple-600'}`}>
                      Otomatik olarak Fark Hesabı'na yansıtılacak
                    </p>
                  </div>
                )}

                {/* Tam ödeme işaretle */}
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={tamOdeme}
                    onChange={(e) => setTamOdeme(e.target.checked)}
                    className="accent-green-600"
                  />
                  <span className="text-sm text-gray-700">Ödemeyi tam alındı olarak işaretle (kalan sıfırla)</span>
                </label>

                {/* Banka hesabı */}
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Hangi Hesaba Yattı?
                  </label>
                  <select
                    value={bankaHesabiId}
                    onChange={(e) => setBankaHesabiId(e.target.value)}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                  >
                    <option value="">— Seçiniz (opsiyonel) —</option>
                    {bankaHesaplari.map((h) => (
                      <option key={h.id} value={h.id}>
                        {h.hesapAdi}{h.bankaAdi ? ` — ${h.bankaAdi}` : ''} ({paraFormat(Number(h.bakiye))})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Ödeme tarihi */}
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Ödeme Tarihi</label>
                  <input
                    type="date"
                    value={odemeTarihi}
                    onChange={(e) => setOdemeTarihi(e.target.value)}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>

                {/* Dekont Yükle */}
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Dekont (opsiyonel)</label>
                  {dekontUrl ? (
                    <div className="flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 px-3 py-2">
                      <span className="text-lg">📎</span>
                      <span className="text-xs text-green-800 flex-1 truncate font-medium">
                        {dekontDosyaAdi || dekontUrl.split('/').pop()}
                      </span>
                      <button
                        type="button"
                        onClick={() => { setDekontUrl(''); setDekontDosyaAdi(''); }}
                        className="text-xs text-red-500 hover:text-red-700 font-medium shrink-0"
                      >
                        Kaldır
                      </button>
                    </div>
                  ) : (
                    <label className={`flex items-center gap-2 rounded-lg border border-dashed px-3 py-2.5 text-sm cursor-pointer transition-colors ${dekontYukleniyor ? 'border-gray-200 bg-gray-50 text-gray-400' : 'border-gray-300 hover:border-green-400 hover:bg-green-50 text-gray-500'}`}>
                      <input
                        type="file"
                        accept=".pdf,.jpg,.jpeg,.png"
                        className="hidden"
                        disabled={dekontYukleniyor}
                        onChange={async (e) => {
                          const dosya = e.target.files?.[0];
                          if (!dosya) return;
                          setDekontYukleniyor(true);
                          setHata(null);
                          try {
                            const fd = new FormData();
                            fd.append('dosya', dosya);
                            const yanit = await fetch('/api/dekont-yukle', { method: 'POST', body: fd });
                            const veri = await yanit.json();
                            if (!yanit.ok) { setHata(veri.hata ?? 'Yükleme hatası'); return; }
                            setDekontUrl(veri.url);
                            setDekontDosyaAdi(veri.dosyaAdi);
                          } catch { setHata('Dosya yüklenemedi'); }
                          finally { setDekontYukleniyor(false); e.target.value = ''; }
                        }}
                      />
                      <span className="text-base">{dekontYukleniyor ? '⏳' : '📎'}</span>
                      <span>{dekontYukleniyor ? 'Yükleniyor...' : 'PDF veya JPG/PNG seç'}</span>
                    </label>
                  )}
                </div>

                {/* Açıklama */}
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Açıklama</label>
                  <input
                    type="text"
                    value={aciklama}
                    onChange={(e) => setAciklama(e.target.value)}
                    placeholder="İsteğe bağlı not"
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
              </>
            ) : (
              /* Borç ödeme */
              <>
                {/* Ödenecek tutar kutusu */}
                <div className="rounded-lg bg-red-50 border border-red-100 px-4 py-3 flex justify-between items-center">
                  <p className="text-xs text-red-600 font-medium">Ödenecek Kalan Tutar</p>
                  <p className="text-xl font-bold text-red-800">{paraFormat(kalanTutar)}</p>
                </div>

                {/* Gerçek ödeme tutarı */}
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Gerçek Ödeme Tutarı (₺) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    value={borcGercekOdeme}
                    onChange={(e) => setBorcGercekOdeme(e.target.value)}
                    min={0.01}
                    step={0.01}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                  <p className="text-xs text-gray-400 mt-1">
                    Gerçekte ödediğiniz tutar (küsürat farkı oluşabilir)
                  </p>
                </div>

                {/* Fark göstergesi */}
                {(borcFarkPozitif || borcFarkNegatif) && (
                  <div className={`rounded-lg px-4 py-2.5 border ${borcFarkPozitif ? 'bg-amber-50 border-amber-200' : 'bg-purple-50 border-purple-200'}`}>
                    <div className="flex justify-between items-center">
                      <span className={`text-xs font-medium ${borcFarkPozitif ? 'text-amber-700' : 'text-purple-700'}`}>
                        {borcFarkPozitif ? 'Az Ödeme (Fark Elimizde Kaldı)' : 'Fazla Ödeme (Fark)'}
                      </span>
                      <span className={`text-sm font-bold ${borcFarkPozitif ? 'text-amber-800' : 'text-purple-800'}`}>
                        {borcFarkPozitif ? '+' : '-'}{paraFormat(Math.abs(borcFarkTutar))}
                      </span>
                    </div>
                    <p className={`text-xs mt-0.5 ${borcFarkPozitif ? 'text-amber-600' : 'text-purple-600'}`}>
                      {borcFarkPozitif
                        ? 'Tam ödeme seçilirse fark, Fark Hesabı\'na giriş olarak yansır'
                        : 'Tam ödeme seçilirse fazla ödeme Fark Hesabı\'ndan düşülür'}
                    </p>
                  </div>
                )}

                {/* Tam ödeme işaretle */}
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={borcTamOdeme}
                    onChange={(e) => setBorcTamOdeme(e.target.checked)}
                    className="accent-green-600"
                  />
                  <span className="text-sm text-gray-700">Ödemeyi tam yapıldı olarak işaretle (kalan sıfırla)</span>
                </label>

                {/* Ödeme yöntemi */}
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">Ödeme Yöntemi</label>
                  <select
                    value={odemeYontemi}
                    onChange={(e) => { setOdemeYontemi(e.target.value); setBorcBankaHesabiId(''); }}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                  >
                    <option value="nakit">Nakit</option>
                    <option value="banka">Banka</option>
                    <option value="eft">EFT</option>
                  </select>
                </div>

                {/* Banka seçilince hesap listesi */}
                {odemeYontemi === 'banka' && (
                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">
                      Hangi Hesaptan? <span className="text-red-500">*</span>
                    </label>
                    {bankaHesaplari.length === 0 ? (
                      <p className="text-sm text-gray-400 italic">Tanımlı banka hesabı bulunamadı</p>
                    ) : (
                      <div className="space-y-2">
                        {bankaHesaplari.map((h) => {
                          const bakiyeRenk = Number(h.bakiye) <= 0 ? 'text-red-600' : 'text-green-700';
                          const secili = borcBankaHesabiId === h.id;
                          return (
                            <label
                              key={h.id}
                              className={`flex items-center justify-between gap-3 rounded-lg border px-3 py-2.5 cursor-pointer transition-colors ${
                                secili ? 'border-green-500 bg-green-50' : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                              } ${h.alarmDurumu ? 'border-red-300 bg-red-50' : ''}`}
                            >
                              <div className="flex items-center gap-2">
                                <input
                                  type="radio"
                                  name="borcBankaHesabi"
                                  value={h.id}
                                  checked={secili}
                                  onChange={() => setBorcBankaHesabiId(h.id)}
                                  className="accent-green-600"
                                />
                                <div>
                                  <p className="text-sm font-medium text-gray-800">
                                    {h.hesapAdi}
                                    {h.alarmDurumu && <span className="ml-1.5 text-xs text-red-600 font-semibold">⚠️ Alarm</span>}
                                    {h.kmhLimiti && <span className="ml-1 text-xs text-orange-600">(KMH)</span>}
                                  </p>
                                  {h.bankaAdi && <p className="text-xs text-gray-400">{h.bankaAdi}</p>}
                                </div>
                              </div>
                              <p className={`text-sm font-semibold ${bakiyeRenk}`}>
                                {paraFormat(Number(h.bakiye))}
                              </p>
                            </label>
                          );
                        })}
                      </div>
                    )}

                    {seciliBorcHesap && Number(seciliBorcHesap.bakiye) < borcGercekSayi && borcGercekSayi > 0 && (
                      <div className="mt-2 rounded-lg bg-amber-50 border border-amber-200 px-3 py-2">
                        <p className="text-xs font-medium text-amber-700">
                          ⚠️ Hesap bakiyesi ödeme miktarından düşük
                          {seciliBorcHesap.kmhLimiti ? ' — KMH devreye girecek' : ' — onay gerekecek'}
                        </p>
                      </div>
                    )}
                  </div>
                )}

                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">Ödeme Tarihi</label>
                  <input
                    type="date"
                    value={odemeTarihi}
                    onChange={(e) => setOdemeTarihi(e.target.value)}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
              </>
            )}

            {hata && (
              <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{hata}</p>
            )}
          </div>

          <div className="border-t px-5 py-4 flex justify-end gap-3">
            <button
              onClick={onKapat}
              disabled={yukleniyor}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-60"
            >
              İptal
            </button>
            <button
              onClick={handleKaydet}
              disabled={yukleniyor}
              className="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-60"
            >
              {yukleniyor ? 'Kaydediliyor...' : 'Kaydet'}
            </button>
          </div>
        </div>
      </div>

      {/* KMH Uyarı Modalı */}
      {kmhUyari && (
        <KmhUyariModal
          bakiye={kmhUyari.bakiye}
          odenenMiktar={borcGercekSayi}
          kmhLimiti={kmhUyari.kmhLimiti}
          onOnayla={() => {
            setKmhUyari(null);
            odemeYap(true);
          }}
          onIptal={() => setKmhUyari(null)}
        />
      )}
    </>
  );
}
