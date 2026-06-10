'use client';

import Link from 'next/link';
import { useEffect } from 'react';
import { useKullanici } from '@/hooks/useKullanici';
import { useRouter } from 'next/navigation';

const MENU_GRUPLARI = [
  {
    baslik: 'Yönetim',
    ogeler: [
      { etiket: 'Çiftçiler', yol: '/ciftciler', ikon: '👨‍🌾', renk: 'bg-emerald-50 text-emerald-700' },
      { etiket: 'Tarlalar', yol: '/tarlalar', ikon: '🌿', renk: 'bg-green-50 text-green-700' },
      { etiket: 'İşçiler', yol: '/isciler', ikon: '👷', renk: 'bg-teal-50 text-teal-700' },
      { etiket: 'Ekipler', yol: '/ekipler', ikon: '👥', renk: 'bg-cyan-50 text-cyan-700' },
      { etiket: 'Müşteriler', yol: '/musteriler', ikon: '🏢', renk: 'bg-blue-50 text-blue-700' },
      { etiket: 'Envanter', yol: '/envanter', ikon: '📦', renk: 'bg-indigo-50 text-indigo-700' },
    ],
  },
  {
    baslik: 'Hasat & Satış',
    ogeler: [
      { etiket: 'Hasat', yol: '/hasat', ikon: '🍃', renk: 'bg-lime-50 text-lime-700' },
      { etiket: 'Kontenjan', yol: '/kontenjan', ikon: '📊', renk: 'bg-yellow-50 text-yellow-700' },
      { etiket: 'Çay Kalite', yol: '/cay-kalite', ikon: '🍵', renk: 'bg-orange-50 text-orange-700' },
      { etiket: 'Cüzdan Kull.', yol: '/cuzdan-kullanicilari', ikon: '👛', renk: 'bg-amber-50 text-amber-700' },
      { etiket: 'Cari Hesap', yol: '/cari-hesap', ikon: '⚖️', renk: 'bg-cyan-50 text-cyan-700' },
    ],
  },
  {
    baslik: 'Raporlar & Araçlar',
    ogeler: [
      { etiket: 'Raporlar', yol: '/raporlar', ikon: '📋', renk: 'bg-purple-50 text-purple-700' },
      { etiket: 'Sezon', yol: '/raporlar/sezon-karsilastirma', ikon: '📈', renk: 'bg-violet-50 text-violet-700' },
      { etiket: 'Toprak', yol: '/toprak-analiz', ikon: '🧪', renk: 'bg-stone-50 text-stone-700' },
      { etiket: 'Harita', yol: '/harita', ikon: '🗺️', renk: 'bg-sky-50 text-sky-700' },
      { etiket: 'Hava', yol: '/hava-durumu', ikon: '🌤️', renk: 'bg-blue-50 text-blue-700' },
      { etiket: 'AI Asistan', yol: '/asistan', ikon: '🤖', renk: 'bg-fuchsia-50 text-fuchsia-700' },
    ],
  },
  {
    baslik: 'Sistem',
    ogeler: [
      { etiket: 'Bildirimler', yol: '/bildirimler', ikon: '🔔', renk: 'bg-rose-50 text-rose-700' },
      { etiket: 'Aktivite', yol: '/aktivite-log', ikon: '📋', renk: 'bg-gray-50 text-gray-700' },
      { etiket: 'Yedekleme', yol: '/yedekleme', ikon: '💾', renk: 'bg-slate-50 text-slate-700' },
      { etiket: 'Kullanıcılar', yol: '/kullanicilar', ikon: '👤', renk: 'bg-zinc-50 text-zinc-700' },
      { etiket: 'Roller', yol: '/kullanicilar/roller', ikon: '🔐', renk: 'bg-neutral-50 text-neutral-700' },
    ],
  },
];

interface Props {
  acik: boolean;
  onKapat: () => void;
  aktifYol: string;
}

export default function MobilMenuCekmece({ acik, onKapat, aktifYol }: Props) {
  const { kullanici } = useKullanici();
  const yonlendirici = useRouter();

  useEffect(() => {
    if (acik) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = '';
    return () => { document.body.style.overflow = ''; };
  }, [acik]);

  async function handleCikis() {
    onKapat();
    await fetch('/api/auth/cikis', { method: 'POST' });
    yonlendirici.push('/login');
  }

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 z-50 bg-black/40 backdrop-blur-sm transition-opacity duration-300 md:hidden ${acik ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={onKapat}
      />

      {/* Çekmece paneli */}
      <div className={`fixed inset-x-0 bottom-0 z-50 md:hidden transition-transform duration-300 ease-out ${acik ? 'translate-y-0' : 'translate-y-full'}`}
        style={{ maxHeight: '85dvh' }}
      >
        <div className="flex flex-col bg-white rounded-t-3xl shadow-2xl overflow-hidden" style={{ maxHeight: '85dvh' }}>

          {/* Tutma çubuğu */}
          <div className="flex justify-center pt-3 pb-2 shrink-0">
            <div className="w-10 h-1 rounded-full bg-gray-300" />
          </div>

          {/* Kullanıcı bilgisi */}
          <div className="flex items-center gap-3 px-5 pb-4 border-b border-gray-100 shrink-0">
            <div className="w-11 h-11 rounded-full bg-green-100 flex items-center justify-center text-lg font-bold text-green-700 shrink-0">
              {kullanici?.adSoyad?.charAt(0).toUpperCase() ?? 'K'}
            </div>
            <div className="min-w-0">
              <p className="font-semibold text-gray-900 text-sm truncate">{kullanici?.adSoyad ?? 'Kullanıcı'}</p>
              <p className="text-xs text-gray-400 truncate">{kullanici?.eposta ?? ''}</p>
            </div>
            <Link href="/profil" onClick={onKapat} className="ml-auto shrink-0 text-xs text-green-600 font-medium bg-green-50 px-3 py-1.5 rounded-full">
              Profil
            </Link>
          </div>

          {/* Menü içeriği */}
          <div className="overflow-y-auto flex-1 px-4 py-3 space-y-5 pb-[env(safe-area-inset-bottom)]">
            {MENU_GRUPLARI.map((grup) => (
              <div key={grup.baslik}>
                <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2 px-1">{grup.baslik}</p>
                <div className="grid grid-cols-3 gap-2">
                  {grup.ogeler.map((oge) => {
                    const aktif = aktifYol === oge.yol;
                    return (
                      <Link
                        key={oge.yol}
                        href={oge.yol}
                        onClick={onKapat}
                        className={`flex flex-col items-center gap-1.5 p-3 rounded-2xl text-center transition-all active:scale-95 ${
                          aktif
                            ? 'bg-green-500 text-white shadow-lg shadow-green-200'
                            : `${oge.renk} hover:opacity-80`
                        }`}
                      >
                        <span className="text-2xl leading-none">{oge.ikon}</span>
                        <span className={`text-[11px] font-medium leading-tight ${aktif ? 'text-white' : ''}`}>
                          {oge.etiket}
                        </span>
                      </Link>
                    );
                  })}
                </div>
              </div>
            ))}

            {/* Çıkış */}
            <button
              onClick={handleCikis}
              className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-red-50 text-red-600 font-medium text-sm active:scale-95 transition-all"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75" />
              </svg>
              Çıkış Yap
            </button>

            <div className="h-4" />
          </div>
        </div>
      </div>
    </>
  );
}
