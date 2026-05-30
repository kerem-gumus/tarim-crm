'use client';

import { useEffect, useState } from 'react';
import ProfilFotoYukleyici from '@/components/profil/ProfilFotoYukleyici';

interface Kullanici {
  id: string;
  adSoyad: string;
  eposta: string;
  telefon: string | null;
  profilFotoUrl: string | null;
  rol: 'admin' | 'muhasebeci' | 'tarimci' | 'izleyici';
  sonGiris: string | null;
}

const ROL_BILGI = {
  admin: {
    renk: 'bg-red-100 text-red-700 border-red-200',
    metin: 'Yönetici',
    aciklama: 'Tam yetki — tüm modüllere erişim',
  },
  muhasebeci: {
    renk: 'bg-blue-100 text-blue-700 border-blue-200',
    metin: 'Muhasebeci',
    aciklama: 'Finans, raporlar ve müşteri erişimi',
  },
  tarimci: {
    renk: 'bg-green-100 text-green-700 border-green-200',
    metin: 'Tarımcı',
    aciklama: 'Hasat ve tarla işlemleri',
  },
  izleyici: {
    renk: 'bg-gray-100 text-gray-600 border-gray-200',
    metin: 'İzleyici',
    aciklama: 'Sadece görüntüleme yetkisi',
  },
};

export default function ProfilSayfasi() {
  const [kullanici, setKullanici] = useState<Kullanici | null>(null);
  const [adSoyad, setAdSoyad] = useState('');
  const [telefon, setTelefon] = useState('');
  const [yeniSifre, setYeniSifre] = useState('');
  const [sifreTekrar, setSifreTekrar] = useState('');
  const [basari, setBasari] = useState('');
  const [hata, setHata] = useState('');
  const [kaydediliyor, setKaydediliyor] = useState(false);
  const [sifreDegistiriliyor, setSifreDegistiriliyor] = useState(false);
  const [yukleniyor, setYukleniyor] = useState(true);

  useEffect(() => {
    fetch('/api/kullanicilar/benim')
      .then((r) => r.json())
      .then((veri: Kullanici) => {
        setKullanici(veri);
        setAdSoyad(veri.adSoyad ?? '');
        setTelefon(veri.telefon ?? '');
        setYukleniyor(false);
      })
      .catch(() => {
        setHata('Kullanıcı bilgileri alınamadı.');
        setYukleniyor(false);
      });
  }, []);

  function mesajTemizle() {
    setBasari('');
    setHata('');
  }

  async function profilKaydet(e: React.FormEvent) {
    e.preventDefault();
    mesajTemizle();
    setKaydediliyor(true);
    const yanit = await fetch('/api/kullanicilar/benim', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ adSoyad, telefon }),
    });
    const veri = await yanit.json();
    if (!yanit.ok) {
      setHata(veri.hata);
      setKaydediliyor(false);
      return;
    }
    setKullanici(veri);
    setBasari('Profil güncellendi.');
    setKaydediliyor(false);
  }

  async function sifreDegistir(e: React.FormEvent) {
    e.preventDefault();
    mesajTemizle();
    if (yeniSifre !== sifreTekrar) {
      setHata('Şifreler eşleşmiyor');
      return;
    }
    if (yeniSifre.length < 6) {
      setHata('En az 6 karakter giriniz');
      return;
    }
    setSifreDegistiriliyor(true);
    const yanit = await fetch('/api/auth/sifre-degistir', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ yeniSifre }),
    });
    const veri = await yanit.json();
    if (!yanit.ok) {
      setHata(veri.hata);
    } else {
      setBasari('Şifre başarıyla değiştirildi.');
      setYeniSifre('');
      setSifreTekrar('');
    }
    setSifreDegistiriliyor(false);
  }

  if (yukleniyor) {
    return (
      <div className="p-6 max-w-3xl mx-auto">
        <div className="text-gray-400 text-sm">Yükleniyor...</div>
      </div>
    );
  }

  const rol = kullanici?.rol ?? 'izleyici';
  const rolBilgi = ROL_BILGI[rol];

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      <h2 className="text-xl font-bold text-gray-800">Profilim</h2>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Sol kart */}
        <div className="bg-white rounded-2xl border p-6 flex flex-col items-center gap-3">
          <ProfilFotoYukleyici
            mevcutUrl={kullanici?.profilFotoUrl}
            adSoyad={kullanici?.adSoyad ?? ''}
            rol={rol}
            onGuncellendi={(url) => {
              if (kullanici) setKullanici({ ...kullanici, profilFotoUrl: url })
            }}
          />
          <p className="font-semibold text-gray-800 text-center">{kullanici?.adSoyad}</p>
          <p className="text-sm text-gray-500 text-center break-all">{kullanici?.eposta}</p>

          {/* Rol badge */}
          <span
            className={`px-3 py-1 rounded-full text-xs font-semibold border ${rolBilgi.renk}`}
          >
            {rolBilgi.metin}
          </span>
          <p className="text-xs text-gray-400 text-center">{rolBilgi.aciklama}</p>

          {rol !== 'admin' && (
            <p className="text-xs text-gray-400 text-center italic">
              Rolünüzü değiştiremezsiniz. Yöneticinizle iletişime geçin.
            </p>
          )}

          {/* Son giriş */}
          {kullanici?.sonGiris && (
            <p className="text-xs text-gray-400 text-center">
              Son giriş: {new Date(kullanici.sonGiris).toLocaleString('tr-TR')}
            </p>
          )}
        </div>

        {/* Sağ: formlar */}
        <div className="md:col-span-2 space-y-4">
          {/* Başarı/hata mesajları */}
          {basari && (
            <div className="rounded-lg bg-green-50 border border-green-200 px-4 py-2 text-sm text-green-700">
              {basari}
            </div>
          )}
          {hata && (
            <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-2 text-sm text-red-700">
              {hata}
            </div>
          )}

          {/* Profil formu */}
          <div className="bg-white rounded-2xl border p-6">
            <h3 className="text-sm font-semibold text-gray-700 mb-4">Profil Bilgileri</h3>
            <form onSubmit={profilKaydet} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Ad Soyad</label>
                <input
                  type="text"
                  value={adSoyad}
                  onChange={(e) => setAdSoyad(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="Ad Soyad"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Telefon</label>
                <input
                  type="tel"
                  value={telefon}
                  onChange={(e) => setTelefon(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="05XX XXX XX XX"
                />
              </div>
              <button
                type="submit"
                disabled={kaydediliyor}
                className="w-full rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-60 transition"
              >
                {kaydediliyor ? 'Kaydediliyor...' : 'Kaydet'}
              </button>
            </form>
          </div>

          {/* Şifre formu */}
          <div className="bg-white rounded-2xl border p-6">
            <h3 className="text-sm font-semibold text-gray-700 mb-4">Şifre Değiştir</h3>
            <form onSubmit={sifreDegistir} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Yeni Şifre</label>
                <input
                  type="password"
                  value={yeniSifre}
                  onChange={(e) => setYeniSifre(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="En az 6 karakter"
                  minLength={6}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Şifre Tekrar
                </label>
                <input
                  type="password"
                  value={sifreTekrar}
                  onChange={(e) => setSifreTekrar(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="Şifrenizi tekrar girin"
                  minLength={6}
                />
              </div>
              <button
                type="submit"
                disabled={sifreDegistiriliyor}
                className="w-full rounded-lg bg-gray-700 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-60 transition"
              >
                {sifreDegistiriliyor ? 'Değiştiriliyor...' : 'Şifreyi Değiştir'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
