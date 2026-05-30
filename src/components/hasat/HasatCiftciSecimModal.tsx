'use client';

import { useState, useEffect } from 'react';

type Ciftci = {
  id: string;
  adSoyad: string;
  cayKurNo: string | null;
  telefon: string;
  toplamDonum?: number; // tarlalardan hesaplanan
};

type Props = {
  hasatDonemiId: string;
  secilenCiftciIdler: string[]; // zaten eklenmiş olanlar
  onKapat: () => void;
  onKaydet: () => void;
};

export default function HasatCiftciSecimModal({
  hasatDonemiId,
  secilenCiftciIdler,
  onKapat,
  onKaydet,
}: Props) {
  const [ciftciler, setCiftciler] = useState<Ciftci[]>([]);
  const [yukleniyor, setYukleniyor] = useState(true);
  const [secilen, setSecilen] = useState<Set<string>>(new Set());
  const [arama, setArama] = useState('');
  const [kaydediliyor, setKaydediliyor] = useState(false);
  const [hata, setHata] = useState('');

  useEffect(() => {
    async function ciftcileriGetir() {
      try {
        const yanit = await fetch('/api/ciftciler');
        const veri = await yanit.json();
        // Her çiftçinin tarla toplamını da alalım
        const tarlalarYanit = await fetch('/api/tarlalar');
        const tarlalar = await tarlalarYanit.json();

        const ciftciDonum: Record<string, number> = {};
        if (Array.isArray(tarlalar)) {
          for (const t of tarlalar) {
            if (!ciftciDonum[t.ciftciId]) ciftciDonum[t.ciftciId] = 0;
            ciftciDonum[t.ciftciId] += Number(t.donum ?? 0);
          }
        }

        setCiftciler(
          (Array.isArray(veri) ? veri : []).map((c: Ciftci) => ({
            ...c,
            toplamDonum: ciftciDonum[c.id] ?? 0,
          }))
        );
      } finally {
        setYukleniyor(false);
      }
    }
    ciftcileriGetir();
  }, []);

  const filtrelenmis = ciftciler.filter(
    (c) =>
      c.adSoyad.toLowerCase().includes(arama.toLowerCase()) ||
      (c.cayKurNo && c.cayKurNo.includes(arama))
  );

  function toggleSecim(id: string) {
    setSecilen((onceki) => {
      const yeni = new Set(onceki);
      if (yeni.has(id)) yeni.delete(id);
      else yeni.add(id);
      return yeni;
    });
  }

  function tumunuSec() {
    const tumu = new Set(filtrelenmis.map((c) => c.id));
    setSecilen(tumu);
  }

  async function kaydet() {
    if (secilen.size === 0) {
      setHata('En az bir çiftçi seçin');
      return;
    }
    setHata('');
    setKaydediliyor(true);
    try {
      const yanit = await fetch(`/api/hasat-donemleri/${hasatDonemiId}/ciftciler`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ciftciIdler: [...secilen] }),
      });
      const veri = await yanit.json();
      if (!yanit.ok) { setHata(veri.hata); return; }
      onKaydet();
      onKapat();
    } catch {
      setHata('Bir hata oluştu');
    } finally {
      setKaydediliyor(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-lg rounded-xl bg-white shadow-xl flex flex-col max-h-[85vh]">
        {/* Başlık */}
        <div className="border-b px-5 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-base font-semibold text-gray-800">Çiftçi Seçimi</h2>
            <p className="text-xs text-gray-400 mt-0.5">Bu hasat dönemine katılacak çiftçileri seçin</p>
          </div>
          <button onClick={onKapat} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
        </div>

        {/* Arama */}
        <div className="px-5 pt-4 pb-2">
          <input
            type="text"
            value={arama}
            onChange={(e) => setArama(e.target.value)}
            placeholder="İsim veya Çay-Kur No ara..."
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
          />
          {hata && <p className="mt-2 text-xs text-red-600">{hata}</p>}
        </div>

        {/* Liste */}
        <div className="flex-1 overflow-y-auto px-5 pb-2">
          {yukleniyor ? (
            <p className="py-8 text-center text-sm text-gray-400">Yükleniyor...</p>
          ) : filtrelenmis.length === 0 ? (
            <p className="py-8 text-center text-sm text-gray-400">Çiftçi bulunamadı</p>
          ) : (
            <>
              <div className="flex items-center justify-between py-2">
                <span className="text-xs text-gray-500">{filtrelenmis.length} çiftçi</span>
                <button
                  onClick={tumunuSec}
                  className="text-xs text-green-600 hover:underline"
                >
                  Tümünü Seç
                </button>
              </div>
              <div className="space-y-1">
                {filtrelenmis.map((ciftci) => {
                  const zatenVar = secilenCiftciIdler.includes(ciftci.id);
                  const secildi = secilen.has(ciftci.id);
                  return (
                    <label
                      key={ciftci.id}
                      className={`flex items-center gap-3 rounded-lg px-3 py-2.5 cursor-pointer transition-colors ${
                        secildi ? 'bg-green-50 border border-green-200' : 'hover:bg-gray-50 border border-transparent'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={secildi}
                        onChange={() => toggleSecim(ciftci.id)}
                        className="h-4 w-4 rounded border-gray-300 text-green-600 focus:ring-green-500"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-gray-800">{ciftci.adSoyad}</span>
                          {zatenVar && (
                            <span className="rounded-full bg-blue-100 px-1.5 py-0.5 text-xs text-blue-600">Eklendi</span>
                          )}
                        </div>
                        <div className="flex items-center gap-3 mt-0.5">
                          {ciftci.cayKurNo && (
                            <span className="text-xs text-gray-400">Çay-Kur: {ciftci.cayKurNo}</span>
                          )}
                          {(ciftci.toplamDonum ?? 0) > 0 && (
                            <span className="text-xs text-gray-400">
                              {Number(ciftci.toplamDonum).toLocaleString('tr-TR', { minimumFractionDigits: 2 })} dönüm
                            </span>
                          )}
                        </div>
                      </div>
                    </label>
                  );
                })}
              </div>
            </>
          )}
        </div>

        {/* Alt butonlar */}
        <div className="border-t px-5 py-4 flex items-center justify-between">
          <span className="text-sm text-gray-500">{secilen.size} çiftçi seçildi</span>
          <div className="flex gap-3">
            <button
              onClick={onKapat}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              İptal
            </button>
            <button
              onClick={kaydet}
              disabled={kaydediliyor || secilen.size === 0}
              className="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50"
            >
              {kaydediliyor ? 'Kaydediliyor...' : `${secilen.size} Çiftçi Ekle`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
