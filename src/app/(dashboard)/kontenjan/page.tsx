'use client';

import { useCallback, useEffect, useState } from 'react';
import type { Kontenjan, Surgun, Musteri, KontenjanGunlukTakip } from '@prisma/client';
import KontenjanFormu from '@/components/kontenjan/KontenjanFormu';

type KontenjanDetay = Kontenjan & {
  surgun: Surgun;
  musteri: Musteri;
  gunlukTakip: KontenjanGunlukTakip[];
};

export default function KontenjanSayfasi() {
  const [kontenjanlar, setKontenjanlar] = useState<KontenjanDetay[]>([]);
  const [filtreliKontenjanlar, setFiltreliKontenjanlar] = useState<KontenjanDetay[]>([]);
  const [seciliKontenjan, setSeciliKontenjan] = useState<KontenjanDetay | null>(null);
  const [takipKayitlari, setTakipKayitlari] = useState<KontenjanGunlukTakip[]>([]);
  const [yukleniyor, setYukleniyor] = useState(true);
  const [takipYukleniyor, setTakipYukleniyor] = useState(false);
  const [formAcik, setFormAcik] = useState(false);
  const [duzenlemeDeki, setDuzenlemeDeki] = useState<KontenjanDetay | null>(null);
  const [silOnayId, setSilOnayId] = useState<string | null>(null);
  const [siliniyor, setSiliniyor] = useState(false);
  const [kapatiliyor, setKapatiliyor] = useState<string | null>(null);
  const [islemHatasi, setIslemHatasi] = useState('');
  const [aramaMetni, setAramaMetni] = useState('');
  const [durumFiltre, setDurumFiltre] = useState<'hepsi' | 'aktif' | 'kapali'>('hepsi');

  const kontenjanlarGetir = useCallback(async () => {
    setYukleniyor(true);
    try {
      const yanit = await fetch('/api/kontenjanlar');
      const veri = await yanit.json();
      setKontenjanlar(veri);
    } finally {
      setYukleniyor(false);
    }
  }, []);

  useEffect(() => {
    kontenjanlarGetir();
  }, [kontenjanlarGetir]);

  useEffect(() => {
    let liste = kontenjanlar;
    if (aramaMetni.trim()) {
      const kucuk = aramaMetni.toLowerCase();
      liste = liste.filter(
        (k) =>
          k.musteri.musteriAdi.toLowerCase().includes(kucuk) ||
          k.surgun.surgunAdi.toLowerCase().includes(kucuk),
      );
    }
    if (durumFiltre !== 'hepsi') {
      liste = liste.filter((k) =>
        durumFiltre === 'aktif' ? k.durum === 'aktif' : k.durum !== 'aktif',
      );
    }
    setFiltreliKontenjanlar(liste);
  }, [kontenjanlar, aramaMetni, durumFiltre]);

  async function takipGetir(kontenjanId: string) {
    setTakipYukleniyor(true);
    setTakipKayitlari([]);
    try {
      const yanit = await fetch(`/api/kontenjan-takip?kontenjanId=${kontenjanId}`);
      const veri = await yanit.json();
      setTakipKayitlari(veri);
    } finally {
      setTakipYukleniyor(false);
    }
  }

  function kontenjanSec(kontenjan: KontenjanDetay) {
    if (seciliKontenjan?.id === kontenjan.id) {
      setSeciliKontenjan(null);
      setTakipKayitlari([]);
    } else {
      setSeciliKontenjan(kontenjan);
      takipGetir(kontenjan.id);
    }
  }

  function yeniEkle() {
    setDuzenlemeDeki(null);
    setFormAcik(true);
  }

  function duzenle(kontenjan: KontenjanDetay) {
    setDuzenlemeDeki(kontenjan);
    setFormAcik(true);
  }

  async function sil(id: string) {
    setSiliniyor(true);
    setIslemHatasi('');
    try {
      const yanit = await fetch(`/api/kontenjanlar/${id}`, { method: 'DELETE' });
      const veri = await yanit.json();
      if (!yanit.ok) {
        setIslemHatasi(veri.hata ?? 'Silinemedi');
        return;
      }
      setSilOnayId(null);
      if (seciliKontenjan?.id === id) {
        setSeciliKontenjan(null);
        setTakipKayitlari([]);
      }
      await kontenjanlarGetir();
    } finally {
      setSiliniyor(false);
    }
  }

  async function kapat(id: string) {
    setKapatiliyor(id);
    setIslemHatasi('');
    try {
      const yanit = await fetch(`/api/kontenjanlar/${id}/kapat`, { method: 'POST' });
      const veri = await yanit.json();
      if (!yanit.ok) {
        setIslemHatasi(veri.hata ?? 'Kapatılamadı');
        return;
      }
      await kontenjanlarGetir();
      if (seciliKontenjan?.id === id) {
        setSeciliKontenjan(veri);
      }
    } finally {
      setKapatiliyor(null);
    }
  }

  function formKaydedildi() {
    setFormAcik(false);
    setDuzenlemeDeki(null);
    kontenjanlarGetir();
  }

  function tarihBicimle(tarih: string | Date) {
    return new Date(tarih).toLocaleDateString('tr-TR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  function sayiBicimle(sayi: any) {
    return Number(sayi).toLocaleString('tr-TR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  function bakiyeRengi(bakiye: any) {
    const deger = Number(bakiye);
    if (deger > 0) return 'text-green-600 font-medium';
    if (deger < 0) return 'text-red-600 font-medium';
    return 'text-gray-400';
  }

  return (
    <div className="min-h-full bg-gray-50">
      {/* Sticky üst bar */}
      <div className="sticky top-0 z-10 bg-white border-b border-gray-200 shadow-sm">
        <div className="px-4 py-3 space-y-3">
          {/* Başlık satırı */}
          <div className="flex items-center justify-between gap-3">
            <div>
              <h1 className="text-base font-semibold text-gray-800">Kontenjan Tanımları</h1>
              <p className="text-xs text-gray-500">{filtreliKontenjanlar.length} kontenjan</p>
            </div>
            <button
              onClick={yeniEkle}
              className="shrink-0 rounded-xl bg-green-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-green-700 active:bg-green-800 transition-colors"
            >
              + Ekle
            </button>
          </div>

          {/* Arama ve filtre */}
          <div className="flex gap-2">
            <div className="relative flex-1">
              <svg
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z"
                />
              </svg>
              <input
                type="search"
                placeholder="Müşteri veya sürgün ara..."
                value={aramaMetni}
                onChange={(e) => setAramaMetni(e.target.value)}
                className="w-full rounded-xl border border-gray-200 bg-gray-50 py-2 pl-9 pr-3 text-sm text-gray-800 placeholder-gray-400 focus:border-green-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-green-100"
              />
            </div>
            <select
              value={durumFiltre}
              onChange={(e) => setDurumFiltre(e.target.value as 'hepsi' | 'aktif' | 'kapali')}
              className="rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-700 focus:border-green-400 focus:outline-none focus:ring-2 focus:ring-green-100"
            >
              <option value="hepsi">Tümü</option>
              <option value="aktif">Aktif</option>
              <option value="kapali">Kapalı</option>
            </select>
          </div>
        </div>
      </div>

      <div className="px-4 py-4 space-y-6">
        {/* Hata mesajı */}
        {islemHatasi && (
          <div className="rounded-xl bg-red-50 border border-red-100 px-4 py-3 text-sm text-red-600 flex items-center justify-between">
            <span>{islemHatasi}</span>
            <button
              onClick={() => setIslemHatasi('')}
              className="ml-3 font-medium hover:underline shrink-0"
            >
              Kapat
            </button>
          </div>
        )}

        {/* ==================== YÜKLENİYOR ==================== */}
        {yukleniyor ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-green-200 border-t-green-600" />
            <span className="text-sm text-gray-400">Yükleniyor...</span>
          </div>
        ) : filtreliKontenjanlar.length === 0 ? (
          /* ==================== BOŞ DURUM ==================== */
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-gray-200 bg-white py-16 text-gray-400 gap-2">
            <svg className="h-10 w-10 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M9 17v-2a4 4 0 0 1 4-4h0a4 4 0 0 1 4 4v2M12 11V7m0 0a4 4 0 1 0 0-8 4 4 0 0 0 0 8z" />
            </svg>
            <p className="text-sm">
              {aramaMetni || durumFiltre !== 'hepsi'
                ? 'Filtreyle eşleşen kontenjan bulunamadı.'
                : 'Henüz kontenjan tanımı yok.'}
            </p>
            {!aramaMetni && durumFiltre === 'hepsi' && (
              <button onClick={yeniEkle} className="mt-1 text-sm font-medium text-green-600 hover:underline">
                İlk kontenjanı ekle →
              </button>
            )}
          </div>
        ) : (
          <>
            {/* ==================== MOBİL KARTLAR (md:hidden) ==================== */}
            <div className="md:hidden space-y-3">
              {filtreliKontenjanlar.map((k) => {
                const sonTakip = k.gunlukTakip[0];
                const bakiye = sonTakip ? Number(sonTakip.kalanBakiyeKg) : null;

                return (
                  <div
                    key={k.id}
                    onClick={() => kontenjanSec(k)}
                    className={`rounded-2xl bg-white shadow-sm border transition-colors cursor-pointer ${
                      seciliKontenjan?.id === k.id
                        ? 'border-green-400 ring-2 ring-green-100'
                        : 'border-gray-100'
                    }`}
                  >
                    {/* Kart gövdesi */}
                    <div className="px-4 pt-4 pb-3 space-y-3">
                      {/* Üst satır: Müşteri adı + durum badge */}
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="truncate font-semibold text-gray-900 text-sm leading-tight">
                            {k.musteri.musteriAdi}
                          </p>
                          <p className="mt-0.5 truncate text-xs text-gray-500">{k.surgun.surgunAdi}</p>
                        </div>
                        <span
                          className={`shrink-0 inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                            k.durum === 'aktif'
                              ? 'bg-green-100 text-green-700'
                              : 'bg-gray-100 text-gray-500'
                          }`}
                        >
                          {k.durum === 'aktif' ? 'Aktif' : 'Kapalı'}
                        </span>
                      </div>

                      {/* Orta bilgi satırı */}
                      <div className="grid grid-cols-3 gap-2 text-center">
                        <div className="rounded-xl bg-gray-50 px-2 py-2">
                          <p className="text-xs text-gray-400 mb-0.5">Günlük</p>
                          <p className="text-sm font-semibold text-gray-800">
                            {sayiBicimle(k.gunlukKontenjanKg)}<span className="text-xs font-normal text-gray-400"> kg</span>
                          </p>
                        </div>
                        <div className="rounded-xl bg-gray-50 px-2 py-2">
                          <p className="text-xs text-gray-400 mb-0.5">Başlangıç</p>
                          <p className="text-xs font-medium text-gray-700">{tarihBicimle(k.baslangicTarihi)}</p>
                        </div>
                        <div className="rounded-xl bg-gray-50 px-2 py-2">
                          <p className="text-xs text-gray-400 mb-0.5">Bitiş</p>
                          <p className="text-xs font-medium text-gray-700">
                            {k.bitisTarihi ? tarihBicimle(k.bitisTarihi) : '—'}
                          </p>
                        </div>
                      </div>

                      {/* Bakiye satırı */}
                      {bakiye !== null && (
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-gray-400">Bakiye:</span>
                          <span
                            className={`text-sm font-semibold ${
                              bakiye > 0 ? 'text-green-600' : bakiye < 0 ? 'text-red-600' : 'text-gray-400'
                            }`}
                          >
                            {bakiye > 0 && '+'}
                            {sayiBicimle(bakiye)} kg
                          </span>
                          {bakiye > 0 && <span className="text-xs text-green-500">alacak</span>}
                          {bakiye < 0 && <span className="text-xs text-red-500">borç</span>}
                        </div>
                      )}
                    </div>

                    {/* Aksiyon butonları */}
                    <div
                      className="flex items-center border-t border-gray-100 divide-x divide-gray-100"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button
                        onClick={() => duzenle(k)}
                        className="flex-1 py-2.5 text-xs font-medium text-blue-600 hover:bg-blue-50 active:bg-blue-100 transition-colors text-center"
                      >
                        Düzenle
                      </button>
                      {k.durum === 'aktif' && (
                        <button
                          onClick={() => kapat(k.id)}
                          disabled={kapatiliyor === k.id}
                          className="flex-1 py-2.5 text-xs font-medium text-orange-600 hover:bg-orange-50 active:bg-orange-100 transition-colors text-center disabled:opacity-50"
                        >
                          {kapatiliyor === k.id ? '...' : 'Kapat'}
                        </button>
                      )}
                      {silOnayId === k.id ? (
                        <div className="flex flex-1 divide-x divide-gray-100">
                          <button
                            onClick={() => sil(k.id)}
                            disabled={siliniyor}
                            className="flex-1 py-2.5 text-xs font-medium text-red-600 hover:bg-red-50 active:bg-red-100 transition-colors text-center disabled:opacity-50"
                          >
                            {siliniyor ? '...' : 'Evet, Sil'}
                          </button>
                          <button
                            onClick={() => setSilOnayId(null)}
                            className="flex-1 py-2.5 text-xs font-medium text-gray-500 hover:bg-gray-50 active:bg-gray-100 transition-colors text-center"
                          >
                            İptal
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setSilOnayId(k.id)}
                          className="flex-1 py-2.5 text-xs font-medium text-red-500 hover:bg-red-50 active:bg-red-100 transition-colors text-center"
                        >
                          Sil
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* ==================== MASAÜSTÜ TABLO (hidden md:block) ==================== */}
            <div className="hidden md:block overflow-x-auto rounded-xl border bg-white shadow-sm">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-gray-50 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                    <th className="px-4 py-3">Sürgün</th>
                    <th className="px-4 py-3">Müşteri</th>
                    <th className="px-4 py-3">Günlük (kg)</th>
                    <th className="px-4 py-3">Güncel Bakiye</th>
                    <th className="px-4 py-3">Başlangıç</th>
                    <th className="px-4 py-3">Bitiş</th>
                    <th className="px-4 py-3">Durum</th>
                    <th className="px-4 py-3 text-right">İşlem</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {filtreliKontenjanlar.map((k) => (
                    <tr
                      key={k.id}
                      onClick={() => kontenjanSec(k)}
                      className={`cursor-pointer transition-colors ${
                        seciliKontenjan?.id === k.id
                          ? 'bg-green-50 hover:bg-green-100'
                          : 'hover:bg-gray-50'
                      }`}
                    >
                      <td className="px-4 py-3 font-medium text-gray-800">{k.surgun.surgunAdi}</td>
                      <td className="px-4 py-3 text-gray-600">{k.musteri.musteriAdi}</td>
                      <td className="px-4 py-3 text-gray-800 font-medium">
                        {sayiBicimle(k.gunlukKontenjanKg)} kg
                      </td>
                      <td className="px-4 py-3">
                        {(() => {
                          const sonTakip = k.gunlukTakip[0];
                          if (!sonTakip) return <span className="text-gray-300">—</span>;
                          const bakiye = Number(sonTakip.kalanBakiyeKg);
                          return (
                            <span
                              className={`font-medium text-sm ${
                                bakiye > 0
                                  ? 'text-green-600'
                                  : bakiye < 0
                                    ? 'text-red-600'
                                    : 'text-gray-400'
                              }`}
                            >
                              {bakiye > 0 && '+'}
                              {sayiBicimle(bakiye)} kg
                              {bakiye > 0 && (
                                <span className="block text-xs font-normal text-green-500">alacak</span>
                              )}
                              {bakiye < 0 && (
                                <span className="block text-xs font-normal text-red-500">borç</span>
                              )}
                            </span>
                          );
                        })()}
                      </td>
                      <td className="px-4 py-3 text-gray-600">{tarihBicimle(k.baslangicTarihi)}</td>
                      <td className="px-4 py-3 text-gray-600">
                        {k.bitisTarihi ? (
                          tarihBicimle(k.bitisTarihi)
                        ) : (
                          <span className="text-gray-300">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${
                            k.durum === 'aktif'
                              ? 'bg-green-100 text-green-700'
                              : 'bg-gray-100 text-gray-500'
                          }`}
                        >
                          {k.durum === 'aktif' ? 'Aktif' : 'Kapalı'}
                        </span>
                      </td>
                      <td
                        className="px-4 py-3 text-right"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <button
                          onClick={() => duzenle(k)}
                          className="mr-1 rounded px-2 py-1 text-xs font-medium text-blue-600 hover:bg-blue-50"
                        >
                          Düzenle
                        </button>
                        {k.durum === 'aktif' && (
                          <button
                            onClick={() => kapat(k.id)}
                            disabled={kapatiliyor === k.id}
                            className="mr-1 rounded px-2 py-1 text-xs font-medium text-orange-600 hover:bg-orange-50 disabled:opacity-50"
                          >
                            {kapatiliyor === k.id ? '...' : 'Kapat'}
                          </button>
                        )}
                        {silOnayId === k.id ? (
                          <span className="inline-flex gap-1">
                            <button
                              onClick={() => sil(k.id)}
                              disabled={siliniyor}
                              className="rounded px-2 py-1 text-xs font-medium text-red-600 hover:bg-red-50 disabled:opacity-50"
                            >
                              {siliniyor ? '...' : 'Evet, Sil'}
                            </button>
                            <button
                              onClick={() => setSilOnayId(null)}
                              className="rounded px-2 py-1 text-xs font-medium text-gray-500 hover:bg-gray-100"
                            >
                              İptal
                            </button>
                          </span>
                        ) : (
                          <button
                            onClick={() => setSilOnayId(k.id)}
                            className="rounded px-2 py-1 text-xs font-medium text-red-500 hover:bg-red-50"
                          >
                            Sil
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}

        {/* ==================== GÜNLÜK TAKİP ==================== */}
        {seciliKontenjan && (
          <div>
            <div className="mb-4">
              <h2 className="text-base font-semibold text-gray-800">
                Günlük Takip —{' '}
                <span className="text-green-700">{seciliKontenjan.surgun.surgunAdi}</span>
                {' / '}
                <span className="text-blue-700">{seciliKontenjan.musteri.musteriAdi}</span>
              </h2>
              <p className="text-sm text-gray-500">Kontenjan dönemine ait takip kayıtları</p>
            </div>

            {takipYukleniyor ? (
              <div className="flex flex-col items-center justify-center py-12 gap-3">
                <div className="h-7 w-7 animate-spin rounded-full border-4 border-green-200 border-t-green-600" />
                <span className="text-sm text-gray-400">Yükleniyor...</span>
              </div>
            ) : takipKayitlari.length === 0 ? (
              <div className="flex items-center justify-center rounded-2xl border border-dashed border-gray-200 bg-white py-12 text-sm text-gray-400">
                Bu kontenjan için henüz takip kaydı yok.
              </div>
            ) : (
              <div className="overflow-x-auto rounded-xl border bg-white shadow-sm">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-gray-50 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                      <th className="px-4 py-3">Tarih</th>
                      <th className="px-4 py-3">Tartım (kg)</th>
                      <th className="px-4 py-3">Kota (kg/gün)</th>
                      <th className="px-4 py-3">Önceki Bakiye</th>
                      <th className="px-4 py-3">Günlük Satış</th>
                      <th className="px-4 py-3">Kalan Bakiye</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {takipKayitlari.map((t) => {
                      // eslint-disable-next-line @typescript-eslint/no-explicit-any
                      const kalanBakiye = Number((t.kalanBakiyeKg as any).toString());
                      // eslint-disable-next-line @typescript-eslint/no-explicit-any
                      const oncekiBakiye = Number((t.oncekiBakiyeKg as any).toString());
                      return (
                        <tr key={t.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-4 py-3 font-medium text-gray-800">
                            {tarihBicimle(t.tarih)}
                          </td>
                          <td className="px-4 py-3 text-gray-700">{sayiBicimle(t.tartimKg)} kg</td>
                          <td className="px-4 py-3 text-gray-700">
                            {sayiBicimle(t.gunlukKontenjanKg)} kg
                          </td>
                          <td className={`px-4 py-3 ${bakiyeRengi(oncekiBakiye)}`}>
                            {oncekiBakiye > 0 && '+'}
                            {sayiBicimle(oncekiBakiye)} kg
                            {oncekiBakiye > 0 && (
                              <span className="ml-1 text-xs text-gray-400">(alıcıda fazla)</span>
                            )}
                            {oncekiBakiye < 0 && (
                              <span className="ml-1 text-xs text-gray-400">(borçluyuz)</span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-gray-700 font-medium">
                            {sayiBicimle(t.hesaplananSatisKg)} kg
                            {Number(t.hesaplananSatisKg) === 0 && (
                              <span className="ml-1 text-xs text-orange-500">(satış yok)</span>
                            )}
                          </td>
                          <td className={`px-4 py-3 ${bakiyeRengi(kalanBakiye)}`}>
                            {kalanBakiye > 0 && '+'}
                            {sayiBicimle(kalanBakiye)} kg
                            {kalanBakiye > 0 && (
                              <span className="ml-1 text-xs font-normal text-gray-400">
                                (alıcıda fazla)
                              </span>
                            )}
                            {kalanBakiye < 0 && (
                              <span className="ml-1 text-xs font-normal text-gray-400">
                                (biz borçluyuz)
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modal Form */}
      {formAcik && (
        <KontenjanFormu
          seciliKontenjan={duzenlemeDeki}
          onKapat={() => {
            setFormAcik(false);
            setDuzenlemeDeki(null);
          }}
          onKaydet={formKaydedildi}
        />
      )}
    </div>
  );
}
