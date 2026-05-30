'use client';

import { useCallback, useEffect, useState } from 'react';
import type { Isci } from '@prisma/client';
import IsciFormu from '@/components/isci/IsciFormu';

export default function IscilerSayfasi() {
  const [isciler, setIsciler] = useState<Isci[]>([]);
  const [yukleniyor, setYukleniyor] = useState(true);
  const [aramaMetni, setAramaMetni] = useState('');
  const [formAcik, setFormAcik] = useState(false);
  const [seciliIsci, setSeciliIsci] = useState<Isci | null>(null);
  const [silOnayId, setSilOnayId] = useState<string | null>(null);
  const [siliniyor, setSiliniyor] = useState(false);
  const [aktifSekme, setAktifSekme] = useState<'aktif' | 'pasif'>('aktif');
  const [durumDegistiriliyor, setDurumDegistiriliyor] = useState<string | null>(null);

  const iscileriGetir = useCallback(async () => {
    setYukleniyor(true);
    try {
      const yanit = await fetch(`/api/isciler?durum=${aktifSekme}`);
      const veri = await yanit.json();
      setIsciler(Array.isArray(veri) ? veri : []);
    } finally { setYukleniyor(false); }
  }, [aktifSekme]);

  useEffect(() => { iscileriGetir(); }, [iscileriGetir]);

  async function sil(id: string) {
    setSiliniyor(true);
    try {
      await fetch(`/api/isciler/${id}`, { method: 'DELETE' });
      setSilOnayId(null);
      await iscileriGetir();
    } finally { setSiliniyor(false); }
  }

  async function durumDegistir(id: string, yeniDurum: 'aktif' | 'pasif') {
    setDurumDegistiriliyor(id);
    try {
      await fetch(`/api/isciler/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ durum: yeniDurum }) });
      await iscileriGetir();
    } finally { setDurumDegistiriliyor(null); }
  }

  const filtrelenmis = isciler.filter((i) => {
    const m = aramaMetni.toLowerCase();
    return i.adSoyad.toLowerCase().includes(m) || (i.tcNo ?? '').includes(m) || i.telefon.includes(m);
  });

  return (
    <div className="min-h-full bg-gray-50">
      {/* Yapışkan üst bar */}
      <div className="sticky top-0 z-10 bg-white border-b border-gray-200 px-4 py-3 md:px-6">
        <div className="flex items-center gap-3">
          <div className="relative flex-1">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
            </svg>
            <input type="text" value={aramaMetni} onChange={(e) => setAramaMetni(e.target.value)} placeholder="Ad, TC veya telefon..."
              className="w-full rounded-xl border border-gray-200 bg-gray-50 pl-9 pr-4 py-2.5 text-sm focus:border-green-500 focus:bg-white focus:outline-none" />
          </div>
          {aktifSekme === 'aktif' && (
            <button onClick={() => { setSeciliIsci(null); setFormAcik(true); }}
              className="flex items-center gap-1.5 rounded-xl bg-green-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm active:scale-95 transition-transform shrink-0">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
              <span className="hidden sm:inline">Yeni İşçi</span>
              <span className="sm:hidden">Ekle</span>
            </button>
          )}
        </div>
        {/* Aktif/Pasif sekmeler */}
        <div className="flex gap-1 mt-2.5 bg-gray-100 rounded-xl p-1 w-fit">
          {(['aktif', 'pasif'] as const).map((sekme) => (
            <button key={sekme} onClick={() => setAktifSekme(sekme)}
              className={`rounded-lg px-4 py-1.5 text-sm font-medium transition-colors ${aktifSekme === sekme ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-500'}`}>
              {sekme === 'aktif' ? 'Aktif' : 'Pasif'}
            </button>
          ))}
        </div>
      </div>

      <div className="px-4 py-4 md:px-6">
        {yukleniyor ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <div className="w-8 h-8 border-2 border-green-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filtrelenmis.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="text-5xl mb-4">👷</div>
            <p className="text-base font-medium text-gray-500">{aramaMetni ? 'Sonuç bulunamadı' : aktifSekme === 'pasif' ? 'Pasif işçi yok' : 'Henüz işçi yok'}</p>
          </div>
        ) : (
          <>
            {/* Mobil kart listesi */}
            <div className="md:hidden space-y-2">
              {filtrelenmis.map((isci) => (
                <div key={isci.id} className={`bg-white rounded-2xl border shadow-sm overflow-hidden ${aktifSekme === 'pasif' ? 'border-gray-200 opacity-80' : 'border-gray-100'}`}>
                  <div className="flex items-center gap-3 px-4 py-3.5">
                    <div className={`w-11 h-11 rounded-full flex items-center justify-center text-base font-bold shrink-0 ${aktifSekme === 'aktif' ? 'bg-teal-100 text-teal-700' : 'bg-gray-100 text-gray-500'}`}>
                      {isci.adSoyad.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`font-semibold truncate ${aktifSekme === 'pasif' ? 'text-gray-500' : 'text-gray-900'}`}>{isci.adSoyad}</p>
                      <div className="flex items-center gap-3 mt-0.5">
                        <p className="text-sm text-gray-500">{isci.telefon}</p>
                        {isci.tcNo && <p className="text-xs text-gray-400">TC: {isci.tcNo}</p>}
                      </div>
                      {isci.bankaIban && <p className="text-xs text-gray-400 font-mono mt-0.5 truncate">{isci.bankaIban}</p>}
                    </div>
                  </div>
                  <div className="flex border-t border-gray-100 divide-x divide-gray-100">
                    {aktifSekme === 'pasif' ? (
                      <button onClick={() => durumDegistir(isci.id, 'aktif')} disabled={durumDegistiriliyor === isci.id}
                        className="flex-1 flex items-center justify-center gap-1.5 py-3 text-sm font-medium text-green-600 active:bg-green-50 disabled:opacity-50">
                        {durumDegistiriliyor === isci.id ? '...' : '✓ Aktif Yap'}
                      </button>
                    ) : (
                      <>
                        <button onClick={() => { setSeciliIsci(isci); setFormAcik(true); }}
                          className="flex-1 flex items-center justify-center gap-1.5 py-3 text-sm font-medium text-blue-600 active:bg-blue-50">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125" /></svg>
                          Düzenle
                        </button>
                        <button onClick={() => durumDegistir(isci.id, 'pasif')} disabled={durumDegistiriliyor === isci.id}
                          className="flex-1 flex items-center justify-center gap-1.5 py-3 text-sm font-medium text-orange-500 active:bg-orange-50 disabled:opacity-50">
                          {durumDegistiriliyor === isci.id ? '...' : 'Pasife Al'}
                        </button>
                        {silOnayId === isci.id ? (
                          <div className="flex-1 flex items-center justify-center gap-2 py-3 bg-red-50">
                            <button onClick={() => sil(isci.id)} disabled={siliniyor} className="text-xs font-semibold text-red-600">{siliniyor ? '...' : 'Sil'}</button>
                            <button onClick={() => setSilOnayId(null)} className="text-xs text-gray-400">İptal</button>
                          </div>
                        ) : (
                          <button onClick={() => setSilOnayId(isci.id)} className="flex-1 flex items-center justify-center py-3 text-sm font-medium text-red-500 active:bg-red-50">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" /></svg>
                          </button>
                        )}
                      </>
                    )}
                  </div>
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
                    <th className="px-4 py-3">IBAN</th>
                    <th className="px-4 py-3">Durum</th>
                    <th className="px-4 py-3 text-right">İşlem</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {filtrelenmis.map((isci) => (
                    <tr key={isci.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3 font-medium text-gray-800">{isci.adSoyad}</td>
                      <td className="px-4 py-3 text-gray-600">{isci.tcNo ?? '—'}</td>
                      <td className="px-4 py-3 text-gray-600">{isci.telefon}</td>
                      <td className="px-4 py-3 text-gray-600 font-mono text-xs">{isci.bankaIban ?? '—'}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${isci.durum === 'aktif' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                          {isci.durum === 'aktif' ? 'Aktif' : 'Pasif'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        {aktifSekme === 'pasif' ? (
                          <button onClick={() => durumDegistir(isci.id, 'aktif')} disabled={durumDegistiriliyor === isci.id}
                            className="rounded px-3 py-1 text-xs font-medium text-green-600 bg-green-50 hover:bg-green-100 disabled:opacity-50">
                            {durumDegistiriliyor === isci.id ? '...' : 'Aktif Yap'}
                          </button>
                        ) : (
                          <>
                            <button onClick={() => { setSeciliIsci(isci); setFormAcik(true); }} className="mr-1 rounded px-2 py-1 text-xs font-medium text-blue-600 hover:bg-blue-50">Düzenle</button>
                            <button onClick={() => durumDegistir(isci.id, 'pasif')} disabled={durumDegistiriliyor === isci.id} className="mr-1 rounded px-2 py-1 text-xs font-medium text-orange-500 hover:bg-orange-50 disabled:opacity-50">Pasife Al</button>
                            {silOnayId === isci.id ? (
                              <span className="inline-flex gap-1">
                                <button onClick={() => sil(isci.id)} disabled={siliniyor} className="rounded px-2 py-1 text-xs font-medium text-red-600 hover:bg-red-50 disabled:opacity-50">{siliniyor ? '...' : 'Evet, Sil'}</button>
                                <button onClick={() => setSilOnayId(null)} className="rounded px-2 py-1 text-xs font-medium text-gray-500 hover:bg-gray-100">İptal</button>
                              </span>
                            ) : (
                              <button onClick={() => setSilOnayId(isci.id)} className="rounded px-2 py-1 text-xs font-medium text-red-500 hover:bg-red-50">Sil</button>
                            )}
                          </>
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
        <IsciFormu seciliIsci={seciliIsci}
          onKapat={() => { setFormAcik(false); setSeciliIsci(null); }}
          onKaydet={() => { setFormAcik(false); setSeciliIsci(null); iscileriGetir(); }} />
      )}
    </div>
  );
}
