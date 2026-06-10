'use client';

import { useState, useEffect } from 'react';

type Mod = 'gider' | 'gelir';

const GIDER_TIPLERI = [
  { deger: 'yakit', etiket: 'Yakıt (Mazot/Benzin/LPG)' },
  { deger: 'bakim', etiket: 'Periyodik Bakım' },
  { deger: 'onarim', etiket: 'Onarım / Tamirat' },
  { deger: 'lastik', etiket: 'Lastik' },
  { deger: 'sigorta', etiket: 'Sigorta' },
  { deger: 'vergi', etiket: 'MTV / Vergi' },
  { deger: 'muayene', etiket: 'Muayene' },
  { deger: 'yedek_parca', etiket: 'Yedek Parça' },
  { deger: 'yikama', etiket: 'Yıkama / Temizlik' },
  { deger: 'diger', etiket: 'Diğer' },
];

const GELIR_TIPLERI = [
  { deger: 'nakliye', etiket: 'Nakliye / Taşımacılık' },
  { deger: 'kiralama', etiket: 'Kiralama' },
  { deger: 'hizmet', etiket: 'Hizmet (Tarla Sürme vb.)' },
  { deger: 'diger', etiket: 'Diğer' },
];

const YUK_CINSLERI = [
  'Çay', 'Çay Tozu', 'Kum', 'Çakıl', 'Mıcır', 'Kereste', 'Lambiri', 'Tuğla', 'Beton',
  'Toprak', 'Gübre', 'Hayvan Gübresi', 'Yakıt', 'Fındık', 'Mısır', 'Tahıl', 'İnşaat Malzemesi', 'Diğer',
];

// m3 gerektiren yük cinsleri
const M3_YUKLER = ['Kum', 'Çakıl', 'Mıcır', 'Beton', 'Toprak', 'İnşaat Malzemesi'];

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
  aracMi: boolean;
  mod: Mod;
  onKapat: () => void;
  onKaydet: () => void;
}

function paraFormat(sayi: number) {
  return new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(sayi);
}

export default function EkipmanGiderGelirModal({
  ekipmanId, ekipmanAdi, plaka, aracMi, mod, onKapat, onKaydet,
}: Props) {
  const [kaydediliyor, setKaydediliyor] = useState(false);
  const [hata, setHata] = useState('');
  const [bankaHesaplari, setBankaHesaplari] = useState<BankaHesabi[]>([]);
  const [belgNoYukleniyor, setBelgNoYukleniyor] = useState(false);

  const [form, setForm] = useState({
    tarih: new Date().toISOString().split('T')[0],
    tip: mod === 'gider' ? 'yakit' : 'nakliye',
    tutar: '',
    aciklama: '',
    belgNo: '',
    kilometre: '',
    litre: '',
    mesafeKm: '',
    musteriAdi: '',
    bankaHesabiId: '',
    // Yakıt kaynağı
    yakitKaynagi: 'yeni_alim' as 'depo' | 'yeni_alim',
    yakitMalzemeId: '',
    // Nakliye
    kantarBosKg: '',
    kantarDoluKg: '',
    yukCinsi: '',
    yukBirimi: 'kg', // kg | m3 | adet
  });

  const tipNakliyeMi = mod === 'gelir' && form.tip === 'nakliye';
  const tipYakitMi = mod === 'gider' && form.tip === 'yakit';
  const tipler = mod === 'gider' ? GIDER_TIPLERI : GELIR_TIPLERI;

  // Banka hesapları
  useEffect(() => {
    fetch('/api/banka-hesaplari')
      .then((r) => r.json())
      .then((veri) => {
        if (Array.isArray(veri)) setBankaHesaplari(veri.filter((h: BankaHesabi) => h.tur !== 'fark_hesabi'));
      })
      .catch(() => {});
  }, []);

  // Otomatik belge no
  useEffect(() => {
    const prefix = mod === 'gelir' ? 'GEL' : 'GDR';
    setBelgNoYukleniyor(true);
    fetch(`/api/fatura-no?prefix=${prefix}`)
      .then((r) => r.json())
      .then((v) => { if (v.belgNo) setForm((p) => ({ ...p, belgNo: v.belgNo })); })
      .catch(() => {})
      .finally(() => setBelgNoYukleniyor(false));
  }, [mod]);

  // Yük cinsi değişince birimi otomatik ayarla
  useEffect(() => {
    if (!form.yukCinsi) return;
    const yukBirimi = M3_YUKLER.includes(form.yukCinsi) ? 'm3' : 'kg';
    setForm((p) => ({ ...p, yukBirimi }));
  }, [form.yukCinsi]);

  // Kantar farkından net miktar
  const netMiktar = form.kantarDoluKg && form.kantarBosKg
    ? Math.max(0, parseFloat(form.kantarDoluKg) - parseFloat(form.kantarBosKg))
    : null;

  const handleDegistir = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setForm((p) => ({ ...p, [e.target.name]: e.target.value }));
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setHata('');
    setKaydediliyor(true);
    try {
      const url = `/api/ekipmanlar/${ekipmanId}/${mod === 'gider' ? 'giderler' : 'gelirler'}`;

      const body = mod === 'gider'
        ? {
            tarih: form.tarih,
            giderTipi: form.tip,
            tutar: parseFloat(form.tutar),
            aciklama: form.aciklama || null,
            belgNo: form.belgNo || null,
            kilometre: form.kilometre ? parseInt(form.kilometre) : null,
            litre: form.litre ? parseFloat(form.litre) : null,
            bankaHesabiId: (form.tip === 'yakit' && form.yakitKaynagi === 'depo')
              ? null
              : (form.bankaHesabiId || null),
            yakitKaynagi: form.tip === 'yakit' ? form.yakitKaynagi : undefined,
          }
        : {
            tarih: form.tarih,
            gelirTipi: form.tip,
            tutar: parseFloat(form.tutar),
            aciklama: form.aciklama || null,
            belgNo: form.belgNo || null,
            mesafeKm: form.mesafeKm ? parseInt(form.mesafeKm) : null,
            musteriAdi: form.musteriAdi || null,
            bankaHesabiId: form.bankaHesabiId || null,
            kantarBosKg: form.kantarBosKg ? parseFloat(form.kantarBosKg) : null,
            kantarDoluKg: form.kantarDoluKg ? parseFloat(form.kantarDoluKg) : null,
            netMiktar: netMiktar ?? (form.kantarDoluKg ? parseFloat(form.kantarDoluKg) : null),
            yukCinsi: form.yukCinsi || null,
            yukBirimi: form.yukBirimi || null,
          };

      const yanit = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const veri = await yanit.json();
      if (!yanit.ok) { setHata(veri.hata ?? 'Hata oluştu'); return; }

      // Gelir kaydedildiyse ve fatura oluştuysa aç
      if (mod === 'gelir' && veri.faturaDosyaUrl) {
        window.open(veri.faturaDosyaUrl, '_blank');
      }

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
      <div className="w-full max-w-lg rounded-xl bg-white shadow-xl max-h-[90vh] flex flex-col">
        <div className="border-b px-5 py-4 shrink-0">
          <h2 className="text-base font-semibold text-gray-800">
            {mod === 'gider' ? '📤 Gider Ekle' : '📥 Gelir Ekle'}
          </h2>
          <p className="text-xs text-gray-400 mt-0.5">
            {ekipmanAdi}{plaka ? ` — ${plaka}` : ''}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4 overflow-y-auto flex-1">
          {hata && <div className="rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-700">{hata}</div>}

          {/* Tarih + Tutar */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Tarih *</label>
              <input type="date" name="tarih" value={form.tarih} onChange={handleDegistir} required
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Tutar (₺) *</label>
              <input type="number" name="tutar" value={form.tutar} onChange={handleDegistir} required
                min="0" step="0.01" placeholder="0.00"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
            </div>
          </div>

          {/* Tip */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              {mod === 'gider' ? 'Gider Tipi *' : 'Gelir Tipi *'}
            </label>
            <select name="tip" value={form.tip} onChange={handleDegistir} required
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500">
              {tipler.map((t) => (
                <option key={t.deger} value={t.deger}>{t.etiket}</option>
              ))}
            </select>
          </div>

          {/* Banka hesabı seçimi */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              {mod === 'gider' ? 'Ödeme Yapılan Hesap' : 'Para Yatırılacak Hesap'}
            </label>
            <select name="bankaHesabiId" value={form.bankaHesabiId} onChange={handleDegistir}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500">
              <option value="">— Nakit / Seçme —</option>
              {bankaHesaplari.map((h) => (
                <option key={h.id} value={h.id}>
                  {h.hesapAdi}{h.bankaAdi ? ` (${h.bankaAdi})` : ''} — {paraFormat(h.bakiye)}
                </option>
              ))}
            </select>
            {seciliBanka && (
              <p className="text-xs text-gray-500 mt-1">
                Mevcut bakiye: <span className="font-semibold">{paraFormat(seciliBanka.bakiye)}</span>
                {mod === 'gelir' && form.tutar && (
                  <span className="ml-2 text-green-600">
                    → {paraFormat(seciliBanka.bakiye + parseFloat(form.tutar || '0'))}
                  </span>
                )}
                {mod === 'gider' && form.tutar && (
                  <span className={`ml-2 ${seciliBanka.bakiye - parseFloat(form.tutar || '0') < 0 ? 'text-red-600' : 'text-gray-700'}`}>
                    → {paraFormat(seciliBanka.bakiye - parseFloat(form.tutar || '0'))}
                  </span>
                )}
              </p>
            )}
            {mod === 'gelir' && form.bankaHesabiId && (
              <p className="text-xs text-blue-600 mt-1">Fatura otomatik oluşturulacak ve hesap hareketlerine eklenecek.</p>
            )}
          </div>

          {/* Araç KM + litre */}
          {aracMi && mod === 'gider' && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">KM (Sayaç)</label>
                <input type="number" name="kilometre" value={form.kilometre} onChange={handleDegistir}
                  min="0" placeholder="Mevcut KM"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
              </div>
              {tipYakitMi && (
                <>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Litre</label>
                    <input type="number" name="litre" value={form.litre} onChange={handleDegistir}
                      min="0" step="0.01" placeholder="Yakıt miktarı"
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-xs font-medium text-gray-600 mb-1">Yakıt Kaynağı</label>
                    <div className="flex gap-4 mt-1">
                      <label className="flex items-center gap-2 cursor-pointer text-sm">
                        <input type="radio" name="yakitKaynagi" value="yeni_alim"
                          checked={form.yakitKaynagi === 'yeni_alim'}
                          onChange={handleDegistir} className="text-green-600" />
                        <span>Yeni Alım <span className="text-xs text-gray-400">(banka çıkışı)</span></span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer text-sm">
                        <input type="radio" name="yakitKaynagi" value="depo"
                          checked={form.yakitKaynagi === 'depo'}
                          onChange={handleDegistir} className="text-green-600" />
                        <span>Kendi Depom <span className="text-xs text-gray-400">(stoktan düş)</span></span>
                      </label>
                    </div>
                    {form.yakitKaynagi === 'depo' && (
                      <p className="mt-1 text-xs text-orange-600 bg-orange-50 rounded px-2 py-1">
                        Depodan kullanım: gider kaydı oluşur, banka işlemi olmaz.
                        Stok düşümü için ayrıca "Envanter → Yakıt Malzeme → Çıkış" yapınız.
                      </p>
                    )}
                  </div>
                </>
              )}
            </div>
          )}

          {/* Gelir araç alanları */}
          {aracMi && mod === 'gelir' && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Mesafe (KM)</label>
                <input type="number" name="mesafeKm" value={form.mesafeKm} onChange={handleDegistir}
                  min="0" placeholder="Sefer KM"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Müşteri / Alıcı</label>
                <input type="text" name="musteriAdi" value={form.musteriAdi} onChange={handleDegistir}
                  placeholder="İsim"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
              </div>
            </div>
          )}

          {/* Nakliye özel alanlar */}
          {tipNakliyeMi && (
            <div className="rounded-lg border border-blue-100 bg-blue-50 p-4 space-y-3">
              <p className="text-xs font-semibold text-blue-700 uppercase tracking-wide">Nakliye Detayı</p>

              {/* Yük cinsi + birim */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Yük Cinsi</label>
                  <select name="yukCinsi" value={form.yukCinsi} onChange={handleDegistir}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white">
                    <option value="">— Seçin —</option>
                    {YUK_CINSLERI.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Ölçü Birimi</label>
                  <select name="yukBirimi" value={form.yukBirimi} onChange={handleDegistir}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white">
                    <option value="kg">kg</option>
                    <option value="m3">m³</option>
                    <option value="adet">Adet</option>
                    <option value="ton">Ton</option>
                  </select>
                </div>
              </div>

              {/* Kantar — sadece kg modunda göster */}
              {(form.yukBirimi === 'kg' || form.yukBirimi === 'ton') && (
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Kantar Dolu</label>
                    <input type="number" name="kantarDoluKg" value={form.kantarDoluKg} onChange={handleDegistir}
                      min="0" step="0.01" placeholder="kg"
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Kantar Boş</label>
                    <input type="number" name="kantarBosKg" value={form.kantarBosKg} onChange={handleDegistir}
                      min="0" step="0.01" placeholder="kg"
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Net ({form.yukBirimi})</label>
                    <input type="number" readOnly
                      value={netMiktar !== null ? netMiktar.toFixed(2) : ''}
                      placeholder="Otomatik"
                      className="w-full rounded-lg border border-gray-200 bg-gray-100 px-3 py-2 text-sm text-gray-700" />
                  </div>
                </div>
              )}

              {/* m3 için sadece miktar */}
              {(form.yukBirimi === 'm3' || form.yukBirimi === 'adet') && (
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Miktar ({form.yukBirimi === 'm3' ? 'm³' : 'Adet'})
                  </label>
                  <input type="number" name="kantarDoluKg" value={form.kantarDoluKg} onChange={handleDegistir}
                    min="0" step="0.001" placeholder={`${form.yukBirimi === 'm3' ? 'Metre küp' : 'Adet sayısı'}`}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white" />
                </div>
              )}
            </div>
          )}

          {/* Açıklama */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Açıklama</label>
            <input type="text" name="aciklama" value={form.aciklama} onChange={handleDegistir}
              placeholder={mod === 'gider' ? 'Servis, akü değişimi, rota vs.' : 'Nereye, ne taşındı vs.'}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
          </div>

          {/* Belge no */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Belge / Fatura No
              {belgNoYukleniyor && <span className="ml-2 text-gray-400">(yükleniyor...)</span>}
            </label>
            <input type="text" name="belgNo" value={form.belgNo} onChange={handleDegistir}
              placeholder="Otomatik oluşturulur"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-green-500" />
          </div>

          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onKapat}
              className="flex-1 rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">
              İptal
            </button>
            <button type="submit" disabled={kaydediliyor}
              className={`flex-1 rounded-lg px-4 py-2 text-sm font-medium text-white disabled:opacity-60 ${
                mod === 'gider' ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700'
              }`}>
              {kaydediliyor ? 'Kaydediliyor...' : mod === 'gider' ? 'Gider Ekle' : 'Gelir Ekle'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
