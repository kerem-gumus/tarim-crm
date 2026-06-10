'use client';

import { useCallback, useEffect, useState } from 'react';

interface CuzdanKullanici {
  id: string;
  ad: string;
  telefon: string | null;
  durum: 'aktif' | 'pasif';
  ciftciId: string | null;
  notlar: string | null;
  netKg: number;
  olusturulmaTarihi: string;
}

function kgFormat(kg: number) {
  return `${Math.abs(kg).toLocaleString('tr-TR', { minimumFractionDigits: 0, maximumFractionDigits: 1 })} kg`;
}

function KullaniciFormu({
  mevcut,
  onKaydet,
  onKapat,
}: {
  mevcut?: CuzdanKullanici;
  onKaydet: () => void;
  onKapat: () => void;
}) {
  const [form, setForm] = useState({
    ad: mevcut?.ad ?? '',
    telefon: mevcut?.telefon ?? '',
    durum: mevcut?.durum ?? 'aktif',
    notlar: mevcut?.notlar ?? '',
  });
  const [kaydediliyor, setKaydediliyor] = useState(false);
  const [hata, setHata] = useState('');

  async function kaydet() {
    if (!form.ad.trim()) { setHata('Ad zorunludur'); return; }
    setKaydediliyor(true); setHata('');
    try {
      const url = mevcut ? `/api/cuzdan-kullanicilari/${mevcut.id}` : '/api/cuzdan-kullanicilari';
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
        <h3 className="text-base font-semibold text-gray-800">
          {mevcut ? 'Kullanıcı Düzenle' : 'Yeni Cüzdan Kullanıcısı'}
        </h3>

        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Ad *</label>
          <input value={form.ad} onChange={(e) => setForm((p) => ({ ...p, ad: e.target.value }))}
            placeholder="Kişi adı soyadı"
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500" />
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Telefon</label>
          <input value={form.telefon} onChange={(e) => setForm((p) => ({ ...p, telefon: e.target.value }))}
            placeholder="0555 555 55 55"
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500" />
        </div>

        {mevcut && (
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Durum</label>
            <select value={form.durum} onChange={(e) => setForm((p) => ({ ...p, durum: e.target.value as 'aktif' | 'pasif' }))}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500">
              <option value="aktif">Aktif</option>
              <option value="pasif">Pasif</option>
            </select>
          </div>
        )}

        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Notlar</label>
          <textarea value={form.notlar} onChange={(e) => setForm((p) => ({ ...p, notlar: e.target.value }))}
            rows={2} placeholder="Ek bilgi..."
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500" />
        </div>

        {hata && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{hata}</p>}

        <div className="flex gap-3 pt-1">
          <button onClick={onKapat} className="flex-1 rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">İptal</button>
          <button onClick={kaydet} disabled={kaydediliyor}
            className="flex-1 rounded-lg bg-amber-600 px-4 py-2 text-sm font-medium text-white hover:bg-amber-700 disabled:opacity-50">
            {kaydediliyor ? 'Kaydediliyor...' : 'Kaydet'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function CuzdanKullanicilariSayfasi() {
  const [kullanicilar, setKullanicilar] = useState<CuzdanKullanici[]>([]);
  const [yukleniyor, setYukleniyor] = useState(true);
  const [formAcik, setFormAcik] = useState(false);
  const [duzenlenecek, setDuzenlenecek] = useState<CuzdanKullanici | undefined>();

  const getir = useCallback(async () => {
    setYukleniyor(true);
    try {
      const yanit = await fetch('/api/cuzdan-kullanicilari?aktifSadece=false');
      const veri = await yanit.json();
      if (Array.isArray(veri)) setKullanicilar(veri);
    } finally { setYukleniyor(false); }
  }, []);

  useEffect(() => { getir(); }, [getir]);

  async function sil(id: string, ad: string) {
    if (!confirm(`"${ad}" kullanıcısını silmek istediğinizden emin misiniz?`)) return;
    const yanit = await fetch(`/api/cuzdan-kullanicilari/${id}`, { method: 'DELETE' });
    if (!yanit.ok) {
      const v = await yanit.json();
      alert(v.hata ?? 'Silinemedi');
      return;
    }
    getir();
  }

  return (
    <div className="min-h-full bg-gray-50">
      <div className="flex items-center justify-between px-4 pt-4 pb-2">
        <div>
          <h1 className="text-lg font-bold text-gray-800">Cüzdan Kullanıcıları</h1>
          <p className="text-xs text-gray-500">Cüzdan kullandıran kişiler ve net kg bakiyeleri</p>
        </div>
        <button onClick={() => { setDuzenlenecek(undefined); setFormAcik(true); }}
          className="rounded-lg bg-amber-600 px-3 py-2 text-sm font-medium text-white hover:bg-amber-700">
          + Yeni Ekle
        </button>
      </div>

      <div className="px-4 py-4">
        {yukleniyor ? (
          <p className="text-center text-gray-400 py-12">Yükleniyor...</p>
        ) : kullanicilar.length === 0 ? (
          <div className="rounded-2xl border border-gray-100 bg-white p-12 text-center text-sm text-gray-400">
            Henüz cüzdan kullanıcısı yok. Hasat girişlerinde başkası adına çay işleyebilirsiniz.
          </div>
        ) : (
          <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
            {/* Masaüstü tablo */}
            <table className="w-full text-sm hidden md:table">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  <th className="px-4 py-3">Ad</th>
                  <th className="px-4 py-3">Telefon</th>
                  <th className="px-4 py-3">Durum</th>
                  <th className="px-4 py-3">Net Cari Bakiye</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {kullanicilar.map((k) => (
                  <tr key={k.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-800">{k.ad}</td>
                    <td className="px-4 py-3 text-gray-600">{k.telefon ?? '—'}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${k.durum === 'aktif' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                        {k.durum === 'aktif' ? 'Aktif' : 'Pasif'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {k.netKg === 0 ? (
                        <span className="text-gray-400">Sıfır</span>
                      ) : k.netKg > 0 ? (
                        <span className="text-green-700 font-semibold">{kgFormat(k.netKg)} alacak</span>
                      ) : (
                        <span className="text-red-600 font-semibold">{kgFormat(k.netKg)} borç</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right space-x-2">
                      <a href={`/cari-hesap?id=${k.id}`}
                        className="text-xs text-blue-600 hover:underline">Ekstre</a>
                      <button onClick={() => { setDuzenlenecek(k); setFormAcik(true); }}
                        className="text-xs text-gray-500 hover:text-gray-700">Düzenle</button>
                      <button onClick={() => sil(k.id, k.ad)}
                        className="text-xs text-red-500 hover:text-red-700">Sil</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Mobil kart listesi */}
            <div className="md:hidden divide-y divide-gray-100">
              {kullanicilar.map((k) => (
                <div key={k.id} className="px-4 py-3 flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-medium text-gray-800 truncate">{k.ad}</p>
                    {k.telefon && <p className="text-xs text-gray-500">{k.telefon}</p>}
                    <div className="mt-1">
                      {k.netKg === 0 ? (
                        <span className="text-xs text-gray-400">Bakiye sıfır</span>
                      ) : k.netKg > 0 ? (
                        <span className="text-xs text-green-700 font-semibold">{kgFormat(k.netKg)} alacak</span>
                      ) : (
                        <span className="text-xs text-red-600 font-semibold">{kgFormat(k.netKg)} borç</span>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <a href={`/cari-hesap?id=${k.id}`}
                      className="rounded-lg border border-blue-300 px-2 py-1 text-xs font-medium text-blue-600 hover:bg-blue-50">
                      Ekstre
                    </a>
                    <button onClick={() => { setDuzenlenecek(k); setFormAcik(true); }}
                      className="rounded-lg border border-gray-300 px-2 py-1 text-xs text-gray-600 hover:bg-gray-50">
                      Düzenle
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {formAcik && (
        <KullaniciFormu
          mevcut={duzenlenecek}
          onKaydet={() => { setFormAcik(false); setDuzenlenecek(undefined); getir(); }}
          onKapat={() => { setFormAcik(false); setDuzenlenecek(undefined); }}
        />
      )}
    </div>
  );
}
