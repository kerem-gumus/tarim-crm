'use client';

import { useCallback, useEffect, useState } from 'react';
import type { Ciftci } from '@prisma/client';
import CiftciFormu from '@/components/ciftci/CiftciFormu';

function SilOnayBubble({ onOnayla, onIptal, yukleniyor }: { onOnayla: () => void; onIptal: () => void; yukleniyor: boolean }) {
  return (
    <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl px-3 py-2">
      <span className="text-xs text-red-700">Emin misiniz?</span>
      <button onClick={onOnayla} disabled={yukleniyor}
        className="text-xs font-semibold text-red-600 disabled:opacity-50">
        {yukleniyor ? '...' : 'Sil'}
      </button>
      <button onClick={onIptal} className="text-xs text-gray-500">İptal</button>
    </div>
  );
}

export default function CiftcilerSayfasi() {
  const [ciftciler, setCiftciler] = useState<Ciftci[]>([]);
  const [yukleniyor, setYukleniyor] = useState(true);
  const [aramaMetni, setAramaMetni] = useState('');
  const [formAcik, setFormAcik] = useState(false);
  const [seciliCiftci, setSeciliCiftci] = useState<Ciftci | null>(null);
  const [silOnayId, setSilOnayId] = useState<string | null>(null);
  const [siliniyor, setSiliniyor] = useState(false);

  const ciftcilerGetir = useCallback(async () => {
    setYukleniyor(true);
    try {
      const yanit = await fetch('/api/ciftciler');
      const veri = await yanit.json();
      setCiftciler(Array.isArray(veri) ? veri : []);
    } finally { setYukleniyor(false); }
  }, []);

  useEffect(() => { ciftcilerGetir(); }, [ciftcilerGetir]);

  async function sil(id: string) {
    setSiliniyor(true);
    try {
      await fetch(`/api/ciftciler/${id}`, { method: 'DELETE' });
      setSilOnayId(null);
      await ciftcilerGetir();
    } finally { setSiliniyor(false); }
  }

  const filtrelenmis = ciftciler.filter((c) => {
    const m = aramaMetni.toLowerCase();
    return c.adSoyad.toLowerCase().includes(m) || (c.tcNo ?? '').includes(m) ||
      c.telefon.includes(m) || (c.cayKurNo ?? '').toLowerCase().includes(m) || (c.il ?? '').toLowerCase().includes(m);
  });

  const avatarHarf = (ad: string) => ad.charAt(0).toUpperCase();

  return (
    <div className="min-h-full bg-gray-50">
      {/* Yapışkan üst bar */}
      <div className="sticky top-0 z-10 bg-white border-b border-gray-200 px-4 py-3 md:px-6">
        <div className="flex items-center gap-3">
          <div className="relative flex-1">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
            </svg>
            <input type="text" value={aramaMetni} onChange={(e) => setAramaMetni(e.target.value)}
              placeholder="Ad, TC, telefon ara..."
              className="w-full rounded-xl border border-gray-200 bg-gray-50 pl-9 pr-4 py-2.5 text-sm focus:border-green-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-green-500" />
          </div>
          <button onClick={() => { setSeciliCiftci(null); setFormAcik(true); }}
            className="flex items-center gap-1.5 rounded-xl bg-green-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm active:scale-95 transition-transform shrink-0">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            <span className="hidden sm:inline">Yeni Çiftçi</span>
            <span className="sm:hidden">Ekle</span>
          </button>
        </div>
        <p className="text-xs text-gray-400 mt-2">{filtrelenmis.length} çiftçi {aramaMetni ? 'bulundu' : 'kayıtlı'}</p>
      </div>

      <div className="px-4 py-4 md:px-6">
        {yukleniyor ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <div className="w-8 h-8 border-2 border-green-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-sm text-gray-400">Yükleniyor...</p>
          </div>
        ) : filtrelenmis.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-gray-400">
            <div className="text-5xl mb-4">👨‍🌾</div>
            <p className="text-base font-medium text-gray-500">{aramaMetni ? 'Sonuç bulunamadı' : 'Henüz çiftçi yok'}</p>
            {!aramaMetni && <button onClick={() => { setSeciliCiftci(null); setFormAcik(true); }} className="mt-3 text-sm text-green-600 font-medium">İlk çiftçiyi ekle →</button>}
          </div>
        ) : (
          <>
            {/* Mobil kart listesi */}
            <div className="md:hidden space-y-2">
              {filtrelenmis.map((ciftci) => (
                <div key={ciftci.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                  <div className="flex items-center gap-3 px-4 py-3.5">
                    {/* Avatar */}
                    <div className="w-11 h-11 rounded-full bg-green-100 flex items-center justify-center text-lg font-bold text-green-700 shrink-0">
                      {avatarHarf(ciftci.adSoyad)}
                    </div>
                    {/* Bilgi */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-gray-900 truncate">{ciftci.adSoyad}</p>
                        <span className={`shrink-0 text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${ciftci.durum === 'aktif' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                          {ciftci.durum === 'aktif' ? 'Aktif' : 'Pasif'}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 mt-0.5">
                        <p className="text-sm text-gray-500">{ciftci.telefon}</p>
                        {ciftci.il && <p className="text-sm text-gray-400">{[ciftci.il, ciftci.ilce].filter(Boolean).join('/')}</p>}
                      </div>
                      {ciftci.cayKurNo && <p className="text-xs text-green-600 mt-0.5">Çay-Kur: {ciftci.cayKurNo}</p>}
                    </div>
                  </div>
                  {/* Aksiyonlar */}
                  {silOnayId === ciftci.id ? (
                    <div className="px-4 pb-3">
                      <SilOnayBubble onOnayla={() => sil(ciftci.id)} onIptal={() => setSilOnayId(null)} yukleniyor={siliniyor} />
                    </div>
                  ) : (
                    <div className="flex border-t border-gray-100 divide-x divide-gray-100">
                      <button onClick={() => { setSeciliCiftci(ciftci); setFormAcik(true); }}
                        className="flex-1 flex items-center justify-center gap-1.5 py-3 text-sm font-medium text-blue-600 active:bg-blue-50">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125" /></svg>
                        Düzenle
                      </button>
                      <button onClick={() => setSilOnayId(ciftci.id)}
                        className="flex-1 flex items-center justify-center gap-1.5 py-3 text-sm font-medium text-red-500 active:bg-red-50">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" /></svg>
                        Sil
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Masaüstü tablo */}
            <div className="hidden md:block overflow-x-auto rounded-xl border bg-white shadow-sm">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-gray-50 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                    <th className="px-4 py-3">Ad Soyad</th>
                    <th className="px-4 py-3">TC No</th>
                    <th className="px-4 py-3">Telefon</th>
                    <th className="px-4 py-3">İl / İlçe</th>
                    <th className="px-4 py-3">Çay-Kur No</th>
                    <th className="px-4 py-3">Durum</th>
                    <th className="px-4 py-3 text-right">İşlem</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {filtrelenmis.map((ciftci) => (
                    <tr key={ciftci.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3 font-medium text-gray-800">{ciftci.adSoyad}</td>
                      <td className="px-4 py-3 text-gray-600">{ciftci.tcNo ?? '—'}</td>
                      <td className="px-4 py-3 text-gray-600">{ciftci.telefon}</td>
                      <td className="px-4 py-3 text-gray-600">{[ciftci.il, ciftci.ilce].filter(Boolean).join(' / ') || '—'}</td>
                      <td className="px-4 py-3 text-gray-600">{ciftci.cayKurNo ?? '—'}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${ciftci.durum === 'aktif' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                          {ciftci.durum === 'aktif' ? 'Aktif' : 'Pasif'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button onClick={() => { setSeciliCiftci(ciftci); setFormAcik(true); }} className="mr-2 rounded px-2 py-1 text-xs font-medium text-blue-600 hover:bg-blue-50">Düzenle</button>
                        {silOnayId === ciftci.id ? (
                          <span className="inline-flex gap-1">
                            <button onClick={() => sil(ciftci.id)} disabled={siliniyor} className="rounded px-2 py-1 text-xs font-medium text-red-600 hover:bg-red-50 disabled:opacity-50">{siliniyor ? '...' : 'Evet, Sil'}</button>
                            <button onClick={() => setSilOnayId(null)} className="rounded px-2 py-1 text-xs font-medium text-gray-500 hover:bg-gray-100">İptal</button>
                          </span>
                        ) : (
                          <button onClick={() => setSilOnayId(ciftci.id)} className="rounded px-2 py-1 text-xs font-medium text-red-500 hover:bg-red-50">Sil</button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      {formAcik && (
        <CiftciFormu seciliCiftci={seciliCiftci}
          onKapat={() => { setFormAcik(false); setSeciliCiftci(null); }}
          onKaydet={() => { setFormAcik(false); setSeciliCiftci(null); ciftcilerGetir(); }} />
      )}
    </div>
  );
}
