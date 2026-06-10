'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const menuGruplari = [
  {
    baslik: 'Temel',
    ogeler: [
      { etiket: 'Çiftçiler', yol: '/ciftciler', ikon: '👨‍🌾' },
      { etiket: 'Tarlalar', yol: '/tarlalar', ikon: '🌿' },
      { etiket: 'İşçiler', yol: '/isciler', ikon: '👷' },
      { etiket: 'Ekipler', yol: '/ekipler', ikon: '👥' },
      { etiket: 'Müşteriler', yol: '/musteriler', ikon: '🏢' },
      { etiket: 'Harita', yol: '/harita', ikon: '🗺️' },
    ],
  },
  {
    baslik: 'Araçlar',
    ogeler: [
      { etiket: 'Hava Durumu', yol: '/hava-durumu', ikon: '🌤️' },
      { etiket: 'Çay Kalite', yol: '/cay-kalite', ikon: '🍵' },
      { etiket: 'Toprak Analizi', yol: '/toprak-analiz', ikon: '🧪' },
    ],
  },
  {
    baslik: 'Hasat',
    ogeler: [
      { etiket: 'Hasat Yönetimi', yol: '/hasat', ikon: '🍃' },
      { etiket: 'Kontenjan', yol: '/kontenjan', ikon: '📊' },
      { etiket: 'Cüzdan Kull.', yol: '/cuzdan-kullanicilari', ikon: '👛' },
    ],
  },
  {
    baslik: 'Finans',
    ogeler: [
      { etiket: 'Finans', yol: '/finans', ikon: '💰' },
      { etiket: 'Cari Hesap', yol: '/cari-hesap', ikon: '⚖️' },
      { etiket: 'Banka / Kasa', yol: '/banka-kasa', ikon: '🏦' },
      { etiket: 'Envanter', yol: '/envanter', ikon: '📦' },
    ],
  },
  {
    baslik: 'Raporlar',
    ogeler: [
      { etiket: 'Dashboard', yol: '/dashboard', ikon: '📈' },
      { etiket: 'Raporlar', yol: '/raporlar', ikon: '📋' },
      { etiket: 'Sezon Karşılaştırma', yol: '/raporlar/sezon-karsilastirma', ikon: '📊' },
    ],
  },
  {
    baslik: 'AI',
    ogeler: [
      { etiket: 'AI Asistan', yol: '/asistan', ikon: '🤖' },
    ],
  },
  {
    baslik: 'Sistem',
    ogeler: [
      { etiket: 'Profilim', yol: '/profil', ikon: '🙋' },
      { etiket: 'Kullanıcılar', yol: '/kullanicilar', ikon: '👤' },
      { etiket: 'Rol Yönetimi', yol: '/kullanicilar/roller', ikon: '🔐' },
      { etiket: 'Aktivite Logu', yol: '/aktivite-log', ikon: '📋' },
      { etiket: 'Yedekleme', yol: '/yedekleme', ikon: '💾' },
      { etiket: 'Bildirimler', yol: '/bildirimler', ikon: '🔔' },
    ],
  },
];

export default function Kenarlik() {
  const yol = usePathname();

  return (
    <aside className="flex h-full w-56 flex-shrink-0 flex-col border-r border-gray-200 bg-white">
      {/* Logo */}
      <div className="flex items-center gap-2 border-b border-gray-200 px-4 py-4">
        <span className="text-2xl">🌿</span>
        <div>
          <p className="text-sm font-bold text-gray-800">TarımCRM</p>
          <p className="text-xs text-gray-400">Çay Tarımı Sistemi</p>
        </div>
      </div>

      {/* Menü */}
      <nav className="flex-1 overflow-y-auto px-2 py-3">
        {menuGruplari.map((grup) => (
          <div key={grup.baslik} className="mb-4">
            <p className="mb-1 px-2 text-xs font-semibold uppercase tracking-wider text-gray-400">
              {grup.baslik}
            </p>
            {grup.ogeler.map((oge) => {
              const aktif = yol === oge.yol || yol.startsWith(oge.yol + '/');
              return (
                <Link
                  key={oge.yol}
                  href={oge.yol}
                  className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors ${
                    aktif
                      ? 'bg-green-50 font-medium text-green-700'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-800'
                  }`}
                >
                  <span>{oge.ikon}</span>
                  {oge.etiket}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      {/* Alt */}
      <div className="border-t border-gray-200 px-4 py-3">
        <p className="text-xs text-gray-400">v1.0 — Faz 1</p>
      </div>
    </aside>
  );
}
