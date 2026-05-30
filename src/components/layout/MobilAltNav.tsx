'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import MobilMenuCekmece from './MobilMenuCekmece';

const SEKMELER = [
  {
    etiket: 'Ana Sayfa',
    yol: '/dashboard',
    ikon: (aktif: boolean) => (
      <svg viewBox="0 0 24 24" fill={aktif ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={aktif ? 0 : 1.8} className="w-6 h-6">
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
      </svg>
    ),
  },
  {
    etiket: 'Hasat',
    yol: '/hasat',
    ikon: (aktif: boolean) => (
      <svg viewBox="0 0 24 24" fill={aktif ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={aktif ? 0 : 1.8} className="w-6 h-6">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z" />
      </svg>
    ),
  },
  {
    etiket: 'Finans',
    yol: '/finans',
    ikon: (aktif: boolean) => (
      <svg viewBox="0 0 24 24" fill={aktif ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={aktif ? 0 : 1.8} className="w-6 h-6">
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75" />
      </svg>
    ),
  },
  {
    etiket: 'Banka',
    yol: '/banka-kasa',
    ikon: (aktif: boolean) => (
      <svg viewBox="0 0 24 24" fill={aktif ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={aktif ? 0 : 1.8} className="w-6 h-6">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 21v-8.25M15.75 21v-8.25M8.25 21v-8.25M3 9l9-6 9 6m-1.5 12V10.332A48.36 48.36 0 0012 9.75c-2.551 0-5.056.2-7.5.582V21M3 21h18M12 6.75h.008v.008H12V6.75z" />
      </svg>
    ),
  },
  {
    etiket: 'Menü',
    yol: '__menu__',
    ikon: (_aktif: boolean) => (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-6 h-6">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
      </svg>
    ),
  },
];

export default function MobilAltNav() {
  const yol = usePathname();
  const [menuAcik, setMenuAcik] = useState(false);

  const aktifYol = '/' + yol.split('/')[1];

  return (
    <>
      {/* Alt navigasyon çubuğu */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 md:hidden">
        {/* Cam efekti arka plan */}
        <div className="absolute inset-0 bg-white/90 backdrop-blur-xl border-t border-gray-200/60 shadow-[0_-4px_24px_rgba(0,0,0,0.08)]" />

        <div className="relative flex items-end justify-around px-2 pb-[env(safe-area-inset-bottom)] pt-2">
          {SEKMELER.map((sekme) => {
            if (sekme.yol === '__menu__') {
              return (
                <button
                  key="menu"
                  onClick={() => setMenuAcik(true)}
                  className="flex flex-col items-center gap-0.5 px-4 py-1 min-w-[56px]"
                >
                  <span className={`transition-colors ${menuAcik ? 'text-green-600' : 'text-gray-400'}`}>
                    {sekme.ikon(menuAcik)}
                  </span>
                  <span className={`text-[10px] font-medium transition-colors ${menuAcik ? 'text-green-600' : 'text-gray-400'}`}>
                    {sekme.etiket}
                  </span>
                </button>
              );
            }

            const aktif = aktifYol === sekme.yol;
            return (
              <Link
                key={sekme.yol}
                href={sekme.yol}
                className="flex flex-col items-center gap-0.5 px-4 py-1 min-w-[56px] relative"
              >
                {aktif && (
                  <span className="absolute -top-0.5 left-1/2 -translate-x-1/2 w-8 h-0.5 rounded-full bg-green-500" />
                )}
                <span className={`transition-colors ${aktif ? 'text-green-600' : 'text-gray-400'}`}>
                  {sekme.ikon(aktif)}
                </span>
                <span className={`text-[10px] font-medium transition-colors ${aktif ? 'text-green-600' : 'text-gray-400'}`}>
                  {sekme.etiket}
                </span>
              </Link>
            );
          })}
        </div>
      </nav>

      <MobilMenuCekmece acik={menuAcik} onKapat={() => setMenuAcik(false)} aktifYol={aktifYol} />
    </>
  );
}
