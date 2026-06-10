'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';

function GirisFormu() {
  const yonlendirici = useRouter();
  const aramaParams = useSearchParams();
  const [eposta, setEposta] = useState('');
  const [sifre, setSifre] = useState('');
  const [hata, setHata] = useState('');
  const [yukleniyor, setYukleniyor] = useState(false);
  const [sifreSifirlamaModu, setSifreSifirlamaModu] = useState(false);
  const [sifirlamaMesaji, setSifirlamaMesaji] = useState('');
  const [bilgi, setBilgi] = useState('');

  useEffect(() => {
    const sebep = aramaParams.get('sebep');
    if (sebep === 'oturum_suresi_doldu') {
      setBilgi('Oturumunuzun süresi doldu. Lütfen tekrar giriş yapın.');
    }
  }, [aramaParams]);

  async function handleSifreSifirla(e: React.FormEvent) {
    e.preventDefault();
    if (!eposta) { setHata('E-posta adresinizi girin.'); return; }
    setYukleniyor(true);
    const { error } = await supabase.auth.resetPasswordForEmail(eposta, {
      redirectTo: `${window.location.origin}/login`,
    });
    setYukleniyor(false);
    if (error) { setHata('Şifre sıfırlama e-postası gönderilemedi.'); return; }
    setSifirlamaMesaji('Şifre sıfırlama bağlantısı e-postanıza gönderildi.');
    setHata('');
  }

  async function handleGiris(e: React.FormEvent) {
    e.preventDefault();
    setHata('');
    setYukleniyor(true);

    const { error } = await supabase.auth.signInWithPassword({
      email: eposta,
      password: sifre,
    });

    setYukleniyor(false);

    if (error) {
      setHata('E-posta veya şifre hatalı.');
      return;
    }

    // Tarayıcı oturum bayrağını kur — tarayıcı kapanınca silinir
    sessionStorage.setItem('tarimcrm_tarayici_aktif', '1');
    localStorage.setItem('tarimcrm_son_aktivite', Date.now().toString());

    yonlendirici.push('/dashboard');
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <div className="w-full max-w-sm rounded-2xl bg-white p-8 shadow-md">
        {/* Logo / Başlık */}
        <div className="mb-8 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-green-600">
            <svg
              className="h-7 w-7 text-white"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064"
              />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-800">TarımCRM</h1>
          <p className="mt-1 text-sm text-gray-500">Hesabınıza giriş yapın</p>
        </div>

        {/* Form */}
        <form onSubmit={sifreSifirlamaModu ? handleSifreSifirla : handleGiris} className="space-y-4">
          <div>
            <label htmlFor="eposta" className="mb-1 block text-sm font-medium text-gray-700">
              E-posta
            </label>
            <input
              id="eposta"
              type="email"
              required
              value={eposta}
              onChange={(e) => setEposta(e.target.value)}
              placeholder="ornek@tarimcrm.com"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-800 placeholder-gray-400 outline-none focus:border-green-500 focus:ring-2 focus:ring-green-100"
            />
          </div>

          {!sifreSifirlamaModu && (
            <div>
              <label htmlFor="sifre" className="mb-1 block text-sm font-medium text-gray-700">
                Şifre
              </label>
              <input
                id="sifre"
                type="password"
                required
                value={sifre}
                onChange={(e) => setSifre(e.target.value)}
                placeholder="••••••••"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-800 placeholder-gray-400 outline-none focus:border-green-500 focus:ring-2 focus:ring-green-100"
              />
            </div>
          )}

          {bilgi && (
            <p className="rounded-lg bg-amber-50 border border-amber-200 px-3 py-2 text-sm text-amber-700">{bilgi}</p>
          )}
          {hata && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{hata}</p>
          )}
          {sifirlamaMesaji && (
            <p className="rounded-lg bg-green-50 px-3 py-2 text-sm text-green-700">{sifirlamaMesaji}</p>
          )}

          <button
            type="submit"
            disabled={yukleniyor}
            className="w-full rounded-lg bg-green-600 py-2.5 text-sm font-semibold text-white transition hover:bg-green-700 disabled:opacity-60"
          >
            {yukleniyor
              ? (sifreSifirlamaModu ? 'Gönderiliyor…' : 'Giriş yapılıyor…')
              : (sifreSifirlamaModu ? 'Sıfırlama E-postası Gönder' : 'Giriş Yap')}
          </button>

          <button
            type="button"
            onClick={() => { setSifreSifirlamaModu(!sifreSifirlamaModu); setHata(''); setSifirlamaMesaji(''); }}
            className="w-full text-center text-xs text-gray-400 hover:text-gray-600"
          >
            {sifreSifirlamaModu ? '← Giriş sayfasına dön' : 'Şifremi unuttum'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default function GirisYapSayfasi() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center bg-gray-50 text-gray-400">Yükleniyor...</div>}>
      <GirisFormu />
    </Suspense>
  );
}
