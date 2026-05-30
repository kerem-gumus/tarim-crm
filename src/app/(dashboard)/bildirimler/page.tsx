'use client'

import { useCallback, useEffect, useState } from 'react'

type Bildirim = {
  id: string
  tip: string
  baslik: string
  mesaj: string
  oncelik: 'yuksek' | 'orta' | 'bilgi'
  okundu: boolean
  ilgiliModul: string | null
  ilgiliKayitId: string | null
  olusturmaTarihi: string
}

type Filtre = 'tumu' | 'okunmamis' | 'yuksek'

const oncelikRenk: Record<string, string> = {
  yuksek: 'bg-red-100 text-red-700',
  orta: 'bg-yellow-100 text-yellow-700',
  bilgi: 'bg-green-100 text-green-700',
}

const oncelikEtiket: Record<string, string> = {
  yuksek: 'Yüksek',
  orta: 'Orta',
  bilgi: 'Bilgi',
}

const tipEtiket: Record<string, string> = {
  stok_uyarisi: 'Stok Uyarısı',
  odeme_vadesi: 'Ödeme Vadesi',
  bakim_hatirlatma: 'Bakım Hatırlatma',
  kontenjan_degisimi: 'Kontenjan Değişimi',
  surgun_kapanis: 'Sürgün Kapanış',
  hava_uyarisi: 'Hava Uyarısı',
  verim_dususu: 'Verim Düşüşü',
  garanti_bitis: 'Garanti Bitişi',
}

function zamanOnce(tarih: Date): string {
  const fark = Date.now() - new Date(tarih).getTime()
  const dakika = Math.floor(fark / 60000)
  if (dakika < 1) return 'az önce'
  if (dakika < 60) return `${dakika} dakika önce`
  const saat = Math.floor(dakika / 60)
  if (saat < 24) return `${saat} saat önce`
  return `${Math.floor(saat / 24)} gün önce`
}

export default function BildirimlerSayfasi() {
  const [bildirimler, setBildirimler] = useState<Bildirim[]>([])
  const [yukleniyor, setYukleniyor] = useState(true)
  const [filtre, setFiltre] = useState<Filtre>('tumu')
  const [kontolEdiliyor, setKontrolEdiliyor] = useState(false)
  const [toastMesaj, setToastMesaj] = useState<string | null>(null)

  const bildirimleriGetir = useCallback(async () => {
    setYukleniyor(true)
    try {
      const yanit = await fetch('/api/bildirimler')
      const veri = await yanit.json()
      setBildirimler(veri.bildirimler ?? [])
    } finally {
      setYukleniyor(false)
    }
  }, [])

  useEffect(() => {
    bildirimleriGetir()
  }, [bildirimleriGetir])

  function toastGoster(mesaj: string) {
    setToastMesaj(mesaj)
    setTimeout(() => setToastMesaj(null), 3000)
  }

  async function kontrolEt() {
    setKontrolEdiliyor(true)
    try {
      const yanit = await fetch('/api/bildirimler/kontrol', { method: 'POST' })
      const veri = await yanit.json()
      await bildirimleriGetir()
      toastGoster(`Kontrol tamamlandı. ${veri.olusturulan} yeni bildirim oluşturuldu.`)
    } catch {
      toastGoster('Kontrol sırasında hata oluştu.')
    } finally {
      setKontrolEdiliyor(false)
    }
  }

  async function okunduIsaretle(id: string) {
    try {
      await fetch(`/api/bildirimler/${id}/oku`, { method: 'PATCH' })
      await bildirimleriGetir()
    } catch {
      // sessiz hata
    }
  }

  async function tumunuOku() {
    try {
      await fetch('/api/bildirimler/tumunu-oku', { method: 'PATCH' })
      await bildirimleriGetir()
      toastGoster('Tüm bildirimler okundu olarak işaretlendi.')
    } catch {
      toastGoster('İşlem sırasında hata oluştu.')
    }
  }

  const filtrelenmis = bildirimler.filter((b) => {
    if (filtre === 'okunmamis') return !b.okundu
    if (filtre === 'yuksek') return b.oncelik === 'yuksek'
    return true
  })

  const okunmamisSayisi = bildirimler.filter((b) => !b.okundu).length

  return (
    <div className="p-6">
      {/* Toast */}
      {toastMesaj && (
        <div className="fixed bottom-6 right-6 z-50 rounded-xl bg-gray-800 px-5 py-3 text-sm text-white shadow-lg">
          {toastMesaj}
        </div>
      )}

      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-800">Bildirimler</h2>
          <p className="text-sm text-gray-500">
            {okunmamisSayisi > 0 ? `${okunmamisSayisi} okunmamış bildirim` : 'Tüm bildirimler okundu'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {okunmamisSayisi > 0 && (
            <button
              onClick={tumunuOku}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-600 hover:bg-gray-50 transition-colors"
            >
              Tümünü Okundu İşaretle
            </button>
          )}
          <button
            onClick={kontrolEt}
            disabled={kontolEdiliyor}
            className="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 transition-colors disabled:opacity-60"
          >
            {kontolEdiliyor ? 'Kontrol ediliyor...' : 'Kontrol Et'}
          </button>
        </div>
      </div>

      {/* Filtreler */}
      <div className="mb-4 flex gap-2">
        {(['tumu', 'okunmamis', 'yuksek'] as Filtre[]).map((f) => (
          <button
            key={f}
            onClick={() => setFiltre(f)}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
              filtre === f
                ? 'bg-green-600 text-white'
                : 'border border-gray-300 text-gray-600 hover:bg-gray-50'
            }`}
          >
            {f === 'tumu' ? 'Tümü' : f === 'okunmamis' ? 'Okunmamış' : 'Yüksek Öncelikli'}
          </button>
        ))}
      </div>

      {/* Tablo */}
      {yukleniyor ? (
        <div className="flex items-center justify-center py-20 text-gray-400">Yükleniyor...</div>
      ) : filtrelenmis.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-gray-400">
          <p className="text-lg">Bildirim bulunamadı.</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border bg-white shadow-sm">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-gray-50 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                <th className="px-4 py-3">Öncelik</th>
                <th className="px-4 py-3">Tip</th>
                <th className="px-4 py-3">Başlık</th>
                <th className="px-4 py-3">Mesaj</th>
                <th className="px-4 py-3">Zaman</th>
                <th className="px-4 py-3">Durum</th>
                <th className="px-4 py-3 text-right">İşlem</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filtrelenmis.map((b) => (
                <tr
                  key={b.id}
                  className={`transition-colors hover:bg-gray-50 ${!b.okundu ? 'bg-blue-50' : ''}`}
                >
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${oncelikRenk[b.oncelik]}`}
                    >
                      {oncelikEtiket[b.oncelik]}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-600 text-xs">
                    {tipEtiket[b.tip] ?? b.tip}
                  </td>
                  <td className="px-4 py-3 font-medium text-gray-800 max-w-[180px]">
                    <span className="line-clamp-1">{b.baslik}</span>
                  </td>
                  <td className="px-4 py-3 text-gray-600 max-w-[240px]">
                    <span className="line-clamp-2">{b.mesaj}</span>
                  </td>
                  <td className="px-4 py-3 text-gray-500 text-xs whitespace-nowrap">
                    {zamanOnce(new Date(b.olusturmaTarihi))}
                  </td>
                  <td className="px-4 py-3">
                    {b.okundu ? (
                      <span className="text-xs text-gray-400">Okundu</span>
                    ) : (
                      <span className="inline-flex rounded-full bg-blue-100 px-2 py-0.5 text-xs font-semibold text-blue-700">
                        Yeni
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {!b.okundu && (
                      <button
                        onClick={() => okunduIsaretle(b.id)}
                        className="rounded px-2 py-1 text-xs font-medium text-blue-600 hover:bg-blue-50"
                      >
                        Okundu İşaretle
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
