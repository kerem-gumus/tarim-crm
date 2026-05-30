'use client';

import dynamic from 'next/dynamic';

const HaritaComponenti = dynamic(() => import('@/components/harita/HaritaComponenti'), {
  ssr: false,
  loading: () => (
    <div className="h-96 bg-gray-100 rounded-xl flex items-center justify-center text-gray-500">
      Harita yükleniyor...
    </div>
  ),
});

export default function HaritaSayfasi() {
  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-800">Tarla Haritası</h2>
        <div className="flex gap-3 text-sm">
          <span className="flex items-center gap-1">
            <span className="w-3 h-3 rounded-full bg-green-500 inline-block" />
            Verim Artışı
          </span>
          <span className="flex items-center gap-1">
            <span className="w-3 h-3 rounded-full bg-yellow-500 inline-block" />
            Stabil
          </span>
          <span className="flex items-center gap-1">
            <span className="w-3 h-3 rounded-full bg-red-500 inline-block" />
            Verim Düşüşü
          </span>
          <span className="flex items-center gap-1">
            <span className="w-3 h-3 rounded-full bg-gray-400 inline-block" />
            Veri Yok
          </span>
        </div>
      </div>

      <HaritaComponenti />
    </div>
  );
}
