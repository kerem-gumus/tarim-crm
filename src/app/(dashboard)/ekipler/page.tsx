'use client';

import { useCallback, useEffect, useState } from 'react';
import type { Isci, IsciEkibi } from '@prisma/client';
import EkipFormu from '@/components/ekip/EkipFormu';

type UyeBilgisi = {
  ekipId: string;
  isciId: string;
  katilmaTarihi: string;
  ayrilmaTarihi: string | null;
  isci: { id: string; adSoyad: string };
};

type EkipDetay = IsciEkibi & {
  uyeler: UyeBilgisi[];
};

export default function EkiplerSayfasi() {
  const [ekipler, setEkipler] = useState<EkipDetay[]>([]);
  const [isciler, setIsciler] = useState<Pick<Isci, 'id' | 'adSoyad'>[]>([]);
  const [yukleniyor, setYukleniyor] = useState(true);
  const [formAcik, setFormAcik] = useState(false);
  const [seciliEkip, setSeciliEkip] = useState<IsciEkibi | null>(null);
  const [silOnayId, setSilOnayId] = useState<string | null>(null);
  const [siliniyor, setSiliniyor] = useState(false);
  const [aktifSekme, setAktifSekme] = useState<'aktif' | 'pasif'>('aktif');
  const [durumDegistiriliyor, setDurumDegistiriliyor] = useState<string | null>(null);
  const [aramaMetni, setAramaMetni] = useState('');

  // Üye paneli state
  const [acikEkipId, setAcikEkipId] = useState<string | null>(null);
  const [yeniIsciId, setYeniIsciId] = useState('');
  const [katilmaTarihi, setKatilmaTarihi] = useState('');
  const [uyeEkleniyor, setUyeEkleniyor] = useState(false);
  const [uyeCikariliyor, setUyeCikariliyor] = useState<string | null>(null);
  const [uyeHata, setUyeHata] = useState('');

  const ekipleriGetir = useCallback(async () => {
    setYukleniyor(true);
    try {
      const yanit = await fetch(`/api/ekipler?durum=${aktifSekme}`);
      const veri = await yanit.json();
      setEkipler(Array.isArray(veri) ? veri : []);
    } finally {
      setYukleniyor(false);
    }
  }, [aktifSekme]);

  const iscileriGetir = useCallback(async () => {
    try {
      const yanit = await fetch('/api/isciler');
      const veri: Isci[] = await yanit.json();
      setIsciler(veri.filter((i) => i.durum === 'aktif').map((i) => ({ id: i.id, adSoyad: i.adSoyad })));
    } catch {
      // işçiler yüklenemezse sessizce devam et
    }
  }, []);

  useEffect(() => {
    ekipleriGetir();
    iscileriGetir();
  }, [ekipleriGetir, iscileriGetir]);

  function yeniEkle() {
    setSeciliEkip(null);
    setFormAcik(true);
  }

  function duzenle(ekip: IsciEkibi) {
    setSeciliEkip(ekip);
    setFormAcik(true);
  }

  async function sil(id: string) {
    setSiliniyor(true);
    try {
      await fetch(`/api/ekipler/${id}`, { method: 'DELETE' });
      setSilOnayId(null);
      if (acikEkipId === id) setAcikEkipId(null);
      await ekipleriGetir();
    } finally {
      setSiliniyor(false);
    }
  }

  async function durumDegistir(id: string, yeniDurum: 'aktif' | 'pasif') {
    setDurumDegistiriliyor(id);
    try {
      await fetch(`/api/ekipler/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ durum: yeniDurum }),
      });
      await ekipleriGetir();
    } finally {
      setDurumDegistiriliyor(null);
    }
  }

  function formKaydedildi() {
    setFormAcik(false);
    setSeciliEkip(null);
    ekipleriGetir();
  }

  function uyePaneliToggle(ekipId: string) {
    setAcikEkipId((onceki) => (onceki === ekipId ? null : ekipId));
    setUyeHata('');
    setYeniIsciId('');
    setKatilmaTarihi('');
  }

  async function uyeEkle(ekipId: string) {
    if (!yeniIsciId) {
      setUyeHata('Lütfen bir işçi seçin');
      return;
    }
    setUyeEkleniyor(true);
    setUyeHata('');
    try {
      const yanit = await fetch(`/api/ekipler/${ekipId}/uyeler`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          isciId: yeniIsciId,
          katilmaTarihi: katilmaTarihi || undefined,
        }),
      });
      if (!yanit.ok) {
        const veri = await yanit.json();
        throw new Error(veri.hata ?? 'Üye eklenemedi');
      }
      setYeniIsciId('');
      setKatilmaTarihi('');
      await ekipleriGetir();
    } catch (err) {
      setUyeHata(err instanceof Error ? err.message : 'Bir hata oluştu');
    } finally {
      setUyeEkleniyor(false);
    }
  }

  async function uyeCikar(ekipId: string, isciId: string) {
    setUyeCikariliyor(isciId);
    setUyeHata('');
    try {
      const yanit = await fetch(`/api/ekipler/${ekipId}/uyeler`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isciId }),
      });
      if (!yanit.ok) {
        const veri = await yanit.json();
        throw new Error(veri.hata ?? 'Üye çıkarılamadı');
      }
      await ekipleriGetir();
    } catch (err) {
      setUyeHata(err instanceof Error ? err.message : 'Bir hata oluştu');
    } finally {
      setUyeCikariliyor(null);
    }
  }

  function ekipBasiAdSoyad(ekipBasiId: string | null): string {
    if (!ekipBasiId) return '—';
    const bulunan = isciler.find((i) => i.id === ekipBasiId);
    return bulunan ? bulunan.adSoyad : '—';
  }

  function eklenebilirIsciler(ekip: EkipDetay) {
    const mevcutIds = new Set(ekip.uyeler.map((u) => u.isciId));
    return isciler.filter((i) => !mevcutIds.has(i.id));
  }

  const filtreliEkipler = ekipler.filter((e) =>
    e.ekipAdi.toLowerCase().includes(aramaMetni.toLowerCase())
  );

  return (
    <div className="min-h-full bg-gray-50">
      {/* Sticky üst bar */}
      <div className="sticky top-0 z-10 bg-white border-b border-gray-200 px-4 pt-4 pb-3 space-y-3 shadow-sm">
        {/* Arama + Ekle */}
        <div className="flex gap-2">
          <div className="relative flex-1">
            <svg
              className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400"
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
              type="text"
              value={aramaMetni}
              onChange={(e) => setAramaMetni(e.target.value)}
              placeholder="Ekip ara..."
              className="w-full rounded-xl border border-gray-300 pl-9 pr-3 py-2 text-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
            />
          </div>
          <button
            onClick={yeniEkle}
            className="flex-shrink-0 rounded-xl bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700 transition-colors"
          >
            + Ekle
          </button>
        </div>

        {/* Aktif / Pasif Sekme */}
        <div className="flex gap-1 rounded-xl bg-gray-100 p-1">
          <button
            onClick={() => setAktifSekme('aktif')}
            className={`flex-1 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
              aktifSekme === 'aktif'
                ? 'bg-white text-gray-800 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Aktif Kayıtlar
          </button>
          <button
            onClick={() => setAktifSekme('pasif')}
            className={`flex-1 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
              aktifSekme === 'pasif'
                ? 'bg-white text-gray-800 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Pasif Kayıtlar
          </button>
        </div>
      </div>

      {/* İçerik */}
      <div className="p-4">
        {yukleniyor ? (
          /* Yükleniyor spinner */
          <div className="flex flex-col items-center justify-center py-24 gap-3">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-green-200 border-t-green-600" />
            <p className="text-sm text-gray-400">Yükleniyor...</p>
          </div>
        ) : filtreliEkipler.length === 0 ? (
          /* Boş durum */
          <div className="flex flex-col items-center justify-center py-24 gap-2 text-gray-400">
            <span className="text-4xl">🌿</span>
            <p className="text-base font-medium">
              {aramaMetni
                ? 'Arama sonucu bulunamadı.'
                : aktifSekme === 'pasif'
                ? 'Pasif ekip kaydı yok.'
                : 'Henüz ekip kaydı yok.'}
            </p>
            {aktifSekme === 'aktif' && !aramaMetni && (
              <button onClick={yeniEkle} className="mt-1 text-sm text-green-600 hover:underline">
                İlk ekibi oluştur →
              </button>
            )}
          </div>
        ) : (
          <>
            {/* ---- MOBİL KART LİSTESİ ---- */}
            <div className="md:hidden space-y-3">
              {filtreliEkipler.map((ekip) => (
                <div key={ekip.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                  {/* Kart üstü */}
                  <div className="px-4 pt-4 pb-3 flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <p
                        className={`font-semibold text-base truncate ${
                          aktifSekme === 'pasif' ? 'text-gray-400' : 'text-gray-800'
                        }`}
                      >
                        {ekip.ekipAdi}
                      </p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        Ekip Başı: {ekipBasiAdSoyad(ekip.ekipBasiId)}
                      </p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {ekip.uyeler.length} üye
                      </p>
                    </div>
                    <span
                      className={`flex-shrink-0 inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
                        ekip.durum === 'aktif'
                          ? 'bg-green-100 text-green-700'
                          : 'bg-gray-100 text-gray-500'
                      }`}
                    >
                      {ekip.durum === 'aktif' ? 'Aktif' : 'Pasif'}
                    </span>
                  </div>

                  {/* Aksiyon butonları */}
                  <div className="border-t border-gray-100 flex divide-x divide-gray-100">
                    {aktifSekme === 'pasif' ? (
                      <button
                        onClick={() => durumDegistir(ekip.id, 'aktif')}
                        disabled={durumDegistiriliyor === ekip.id}
                        className="flex-1 py-2.5 text-xs font-semibold text-green-600 hover:bg-green-50 disabled:opacity-50 transition-colors"
                      >
                        {durumDegistiriliyor === ekip.id ? '...' : 'Aktif Yap'}
                      </button>
                    ) : (
                      <>
                        <button
                          onClick={() => uyePaneliToggle(ekip.id)}
                          className="flex-1 py-2.5 text-xs font-semibold text-purple-600 hover:bg-purple-50 transition-colors"
                        >
                          {acikEkipId === ekip.id ? 'Üyeleri Gizle' : 'Üyeleri Gör'}
                        </button>
                        <button
                          onClick={() => duzenle(ekip)}
                          className="flex-1 py-2.5 text-xs font-semibold text-blue-600 hover:bg-blue-50 transition-colors"
                        >
                          Düzenle
                        </button>
                        <button
                          onClick={() =>
                            silOnayId === ekip.id ? setSilOnayId(null) : setSilOnayId(ekip.id)
                          }
                          className="flex-1 py-2.5 text-xs font-semibold text-red-500 hover:bg-red-50 transition-colors"
                        >
                          Sil
                        </button>
                      </>
                    )}
                  </div>

                  {/* Silme onay bandı */}
                  {silOnayId === ekip.id && (
                    <div className="bg-red-50 border-t border-red-100 flex items-center justify-between px-4 py-3 gap-2">
                      <p className="text-xs text-red-700 font-medium">Bu ekibi silmek istediğinize emin misiniz?</p>
                      <div className="flex gap-2">
                        <button
                          onClick={() => sil(ekip.id)}
                          disabled={siliniyor}
                          className="rounded-lg bg-red-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-red-700 disabled:opacity-50"
                        >
                          {siliniyor ? '...' : 'Evet, Sil'}
                        </button>
                        <button
                          onClick={() => setSilOnayId(null)}
                          className="rounded-lg bg-white border border-gray-300 px-3 py-1.5 text-xs font-semibold text-gray-600 hover:bg-gray-50"
                        >
                          İptal
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Üye paneli — mobil */}
                  {aktifSekme === 'aktif' && acikEkipId === ekip.id && (
                    <div className="border-t border-gray-100 bg-gray-50 px-4 py-4 space-y-4">
                      <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">
                        Mevcut Üyeler
                      </p>

                      {uyeHata && (
                        <div className="rounded-xl bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700">
                          {uyeHata}
                        </div>
                      )}

                      {ekip.uyeler.length === 0 ? (
                        <p className="text-sm text-gray-400">Bu ekipte henüz üye yok.</p>
                      ) : (
                        <div className="space-y-2">
                          {ekip.uyeler.map((uye) => (
                            <div
                              key={uye.isciId}
                              className="flex items-center justify-between bg-white rounded-xl border border-gray-100 px-3 py-2.5"
                            >
                              <div>
                                <p className="text-sm font-medium text-gray-800">{uye.isci.adSoyad}</p>
                                <p className="text-xs text-gray-400">
                                  {new Date(uye.katilmaTarihi).toLocaleDateString('tr-TR')}
                                </p>
                              </div>
                              <button
                                onClick={() => uyeCikar(ekip.id, uye.isciId)}
                                disabled={uyeCikariliyor === uye.isciId}
                                className="rounded-lg px-3 py-1.5 text-xs font-semibold text-red-500 hover:bg-red-50 disabled:opacity-50 transition-colors"
                              >
                                {uyeCikariliyor === uye.isciId ? '...' : 'Çıkar'}
                              </button>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Üye Ekle — mobil */}
                      <div className="border-t border-gray-200 pt-3 space-y-2">
                        <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">
                          Üye Ekle
                        </p>
                        <select
                          value={yeniIsciId}
                          onChange={(e) => setYeniIsciId(e.target.value)}
                          className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
                        >
                          <option value="">— İşçi seçin —</option>
                          {eklenebilirIsciler(ekip).map((isci) => (
                            <option key={isci.id} value={isci.id}>
                              {isci.adSoyad}
                            </option>
                          ))}
                        </select>
                        <input
                          type="date"
                          value={katilmaTarihi}
                          onChange={(e) => setKatilmaTarihi(e.target.value)}
                          className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
                        />
                        <button
                          onClick={() => uyeEkle(ekip.id)}
                          disabled={uyeEkleniyor}
                          className="w-full rounded-xl bg-green-600 py-2.5 text-sm font-semibold text-white hover:bg-green-700 disabled:opacity-50 transition-colors"
                        >
                          {uyeEkleniyor ? 'Ekleniyor...' : 'Ekle'}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* ---- MASAÜSTÜ TABLO ---- */}
            <div className="hidden md:block overflow-x-auto rounded-xl border bg-white shadow-sm">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-gray-50 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                    <th className="px-4 py-3">Ekip Adı</th>
                    <th className="px-4 py-3">Ekip Başı</th>
                    <th className="px-4 py-3">Üye Sayısı</th>
                    <th className="px-4 py-3">Durum</th>
                    <th className="px-4 py-3 text-right">İşlem</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {filtreliEkipler.map((ekip) => (
                    <>
                      <tr
                        key={ekip.id}
                        className={`transition-colors ${
                          aktifSekme === 'pasif' ? 'bg-gray-50 hover:bg-gray-100' : 'hover:bg-gray-50'
                        }`}
                      >
                        <td
                          className={`px-4 py-3 font-medium ${
                            aktifSekme === 'pasif' ? 'text-gray-500' : 'text-gray-800'
                          }`}
                        >
                          {ekip.ekipAdi}
                        </td>
                        <td className="px-4 py-3 text-gray-600">{ekipBasiAdSoyad(ekip.ekipBasiId)}</td>
                        <td className="px-4 py-3 text-gray-600">{ekip.uyeler.length} kişi</td>
                        <td className="px-4 py-3">
                          <span
                            className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${
                              ekip.durum === 'aktif'
                                ? 'bg-green-100 text-green-700'
                                : 'bg-gray-100 text-gray-500'
                            }`}
                          >
                            {ekip.durum === 'aktif' ? 'Aktif' : 'Pasif'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          {aktifSekme === 'pasif' ? (
                            <button
                              onClick={() => durumDegistir(ekip.id, 'aktif')}
                              disabled={durumDegistiriliyor === ekip.id}
                              className="rounded px-3 py-1 text-xs font-medium text-green-600 bg-green-50 hover:bg-green-100 disabled:opacity-50"
                            >
                              {durumDegistiriliyor === ekip.id ? '...' : 'Aktif Yap'}
                            </button>
                          ) : (
                            <>
                              <button
                                onClick={() => uyePaneliToggle(ekip.id)}
                                className="mr-2 rounded px-2 py-1 text-xs font-medium text-purple-600 hover:bg-purple-50"
                              >
                                {acikEkipId === ekip.id ? 'Üyeleri Gizle' : 'Üyeleri Gör'}
                              </button>
                              <button
                                onClick={() => duzenle(ekip)}
                                className="mr-2 rounded px-2 py-1 text-xs font-medium text-blue-600 hover:bg-blue-50"
                              >
                                Düzenle
                              </button>
                              {silOnayId === ekip.id ? (
                                <span className="inline-flex gap-1">
                                  <button
                                    onClick={() => sil(ekip.id)}
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
                                  onClick={() => setSilOnayId(ekip.id)}
                                  className="rounded px-2 py-1 text-xs font-medium text-red-500 hover:bg-red-50"
                                >
                                  Sil
                                </button>
                              )}
                            </>
                          )}
                        </td>
                      </tr>

                      {/* Üye Paneli — masaüstü */}
                      {aktifSekme === 'aktif' && acikEkipId === ekip.id && (
                        <tr key={`${ekip.id}-uyeler`}>
                          <td colSpan={5} className="bg-gray-50 px-6 py-4">
                            <div className="space-y-4">
                              <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">
                                Mevcut Üyeler
                              </p>

                              {uyeHata && (
                                <div className="rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700">
                                  {uyeHata}
                                </div>
                              )}

                              {ekip.uyeler.length === 0 ? (
                                <p className="text-sm text-gray-400">Bu ekipte henüz üye yok.</p>
                              ) : (
                                <div className="rounded-lg border bg-white overflow-hidden">
                                  <table className="w-full text-sm">
                                    <thead>
                                      <tr className="border-b bg-gray-50 text-left text-xs font-semibold text-gray-500">
                                        <th className="px-3 py-2">Ad Soyad</th>
                                        <th className="px-3 py-2">Katılma Tarihi</th>
                                        <th className="px-3 py-2 text-right">İşlem</th>
                                      </tr>
                                    </thead>
                                    <tbody className="divide-y">
                                      {ekip.uyeler.map((uye) => (
                                        <tr key={uye.isciId} className="hover:bg-gray-50">
                                          <td className="px-3 py-2 font-medium text-gray-800">
                                            {uye.isci.adSoyad}
                                          </td>
                                          <td className="px-3 py-2 text-gray-600">
                                            {new Date(uye.katilmaTarihi).toLocaleDateString('tr-TR')}
                                          </td>
                                          <td className="px-3 py-2 text-right">
                                            <button
                                              onClick={() => uyeCikar(ekip.id, uye.isciId)}
                                              disabled={uyeCikariliyor === uye.isciId}
                                              className="rounded px-2 py-1 text-xs font-medium text-red-500 hover:bg-red-50 disabled:opacity-50"
                                            >
                                              {uyeCikariliyor === uye.isciId ? '...' : 'Çıkar'}
                                            </button>
                                          </td>
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                </div>
                              )}

                              {/* Üye Ekle — masaüstü */}
                              <div className="border-t pt-3">
                                <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-400">
                                  Üye Ekle
                                </p>
                                <div className="flex gap-2 flex-wrap">
                                  <select
                                    value={yeniIsciId}
                                    onChange={(e) => setYeniIsciId(e.target.value)}
                                    className="flex-1 min-w-[200px] rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
                                  >
                                    <option value="">— İşçi seçin —</option>
                                    {eklenebilirIsciler(ekip).map((isci) => (
                                      <option key={isci.id} value={isci.id}>
                                        {isci.adSoyad}
                                      </option>
                                    ))}
                                  </select>
                                  <input
                                    type="date"
                                    value={katilmaTarihi}
                                    onChange={(e) => setKatilmaTarihi(e.target.value)}
                                    className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
                                  />
                                  <button
                                    onClick={() => uyeEkle(ekip.id)}
                                    disabled={uyeEkleniyor}
                                    className="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50"
                                  >
                                    {uyeEkleniyor ? 'Ekleniyor...' : 'Ekle'}
                                  </button>
                                </div>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      {/* Modal Form */}
      {formAcik && (
        <EkipFormu
          seciliEkip={seciliEkip}
          isciler={isciler}
          onKapat={() => {
            setFormAcik(false);
            setSeciliEkip(null);
          }}
          onKaydet={formKaydedildi}
        />
      )}
    </div>
  );
}
