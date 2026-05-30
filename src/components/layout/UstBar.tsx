'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import BildirimZili from '@/components/bildirim/BildirimZili';
import { useKullanici } from '@/hooks/useKullanici';

const sayfaBasliklari: Record<string, string> = {
  '/ciftciler': 'Çiftçiler',
  '/tarlalar': 'Tarlalar',
  '/isciler': 'İşçiler',
  '/musteriler': 'Müşteriler',
  '/hasat': 'Hasat',
  '/kontenjan': 'Kontenjan',
  '/finans': 'Finans',
  '/banka-kasa': 'Banka / Kasa',
  '/envanter': 'Envanter',
  '/dashboard': 'Dashboard',
  '/raporlar': 'Raporlar',
  '/kullanicilar': 'Kullanıcılar',
  '/asistan': 'AI Asistan',
  '/bildirimler': 'Bildirimler',
  '/harita': 'Harita',
  '/hava-durumu': 'Hava Durumu',
  '/cay-kalite': 'Çay Kalite',
  '/yedekleme': 'Yedekleme',
  '/aktivite-log': 'Aktivite Logu',
  '/ekipler': 'Ekipler',
  '/profil': 'Profilim',
};

export default function UstBar() {
  const yol = usePathname();
  const yonlendirici = useRouter();
  const ana = '/' + yol.split('/')[1];
  const baslik = sayfaBasliklari[ana] ?? 'TarımCRM';
  const [cikisYapiliyor, setCikisYapiliyor] = useState(false);
  const [menuAcik, setMenuAcik] = useState(false);
  const { kullanici } = useKullanici();
  const avatarHarf = kullanici?.adSoyad?.charAt(0).toUpperCase() ?? 'K';

  async function handleCikis() {
    setCikisYapiliyor(true);
    try {
      await fetch('/api/auth/cikis', { method: 'POST' });
    } finally {
      yonlendirici.push('/login');
    }
  }

  useEffect(() => {
    function kapat(e: MouseEvent) {
      const hedef = e.target as HTMLElement;
      if (!hedef.closest('[data-profil-menu]')) setMenuAcik(false);
    }
    if (menuAcik) document.addEventListener('mousedown', kapat);
    return () => document.removeEventListener('mousedown', kapat);
  }, [menuAcik]);

  return (
    <header className="shrink-0 border-b border-gray-200 bg-white">
      {/* Mobil üst bar */}
      <div className="flex items-center justify-between px-4 py-3 md:hidden"
        style={{ paddingTop: 'calc(0.75rem + env(safe-area-inset-top))' }}>
        {/* Logo */}
        <div className="flex items-center gap-2">
          <span className="text-xl">🌿</span>
          <span className="text-sm font-bold text-gray-800">{baslik}</span>
        </div>
        <div className="flex items-center gap-2">
          <BildirimZili />
          <Link href="/profil"
            className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center text-sm font-bold text-green-700">
            {kullanici?.profilFotoUrl ? (
              <img src={kullanici.profilFotoUrl} alt="" className="w-full h-full object-cover rounded-full" />
            ) : avatarHarf}
          </Link>
        </div>
      </div>

      {/* Masaüstü üst bar */}
      <div className="hidden md:flex items-center justify-between px-6 py-3">
        <h1 className="text-base font-semibold text-gray-700">{baslik}</h1>
        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-400">
            {new Date().toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })}
          </span>
          <BildirimZili />
          <div className="relative" data-profil-menu>
            <button
              onClick={() => setMenuAcik(!menuAcik)}
              className="flex items-center gap-1.5 rounded-full px-1 py-1 hover:bg-gray-50 transition"
            >
              <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center text-sm font-semibold text-green-700">
                {kullanici?.profilFotoUrl ? (
                  <img src={kullanici.profilFotoUrl} alt="" className="w-full h-full object-cover rounded-full" />
                ) : avatarHarf}
              </div>
              <span className="hidden text-xs font-medium text-gray-500 sm:inline">
                {kullanici?.adSoyad?.split(' ')[0] ?? 'Hesap'}
              </span>
            </button>
            {menuAcik && (
              <div className="absolute right-0 top-full mt-1 w-44 rounded-xl border bg-white shadow-lg z-50 overflow-hidden">
                <Link href="/profil" onClick={() => setMenuAcik(false)}
                  className="flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50">
                  👤 Profilim
                </Link>
                <Link href="/kullanicilar" onClick={() => setMenuAcik(false)}
                  className="flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50">
                  👥 Kullanıcılar
                </Link>
                <div className="border-t" />
                <button onClick={handleCikis} disabled={cikisYapiliyor}
                  className="flex w-full items-center gap-2 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50">
                  🚪 {cikisYapiliyor ? 'Çıkılıyor…' : 'Çıkış Yap'}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
