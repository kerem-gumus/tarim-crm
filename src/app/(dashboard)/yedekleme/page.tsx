'use client';

import { useState } from 'react';

interface IndirmeButonuProps {
  etiket: string;
  aciklama: string;
  url: string;
  renk: 'mavi' | 'yesil' | 'turuncu' | 'mor' | 'camgobegi';
}

function IndirmeButonu({ etiket, aciklama, url, renk }: IndirmeButonuProps) {
  const [indiriliyor, setIndiriliyor] = useState(false);

  const renkHaritasi = {
    mavi: {
      kart: 'border-blue-200 bg-blue-50',
      buton: 'bg-blue-600 hover:bg-blue-700',
      simge: 'text-blue-500',
    },
    yesil: {
      kart: 'border-green-200 bg-green-50',
      buton: 'bg-green-600 hover:bg-green-700',
      simge: 'text-green-500',
    },
    turuncu: {
      kart: 'border-orange-200 bg-orange-50',
      buton: 'bg-orange-600 hover:bg-orange-700',
      simge: 'text-orange-500',
    },
    mor: {
      kart: 'border-purple-200 bg-purple-50',
      buton: 'bg-purple-600 hover:bg-purple-700',
      simge: 'text-purple-500',
    },
    camgobegi: {
      kart: 'border-teal-200 bg-teal-50',
      buton: 'bg-teal-600 hover:bg-teal-700',
      simge: 'text-teal-500',
    },
  };

  const stil = renkHaritasi[renk];

  async function indir() {
    setIndiriliyor(true);
    try {
      window.open(url, '_blank');
      // Kısa gecikme sonrası sıfırla
      setTimeout(() => setIndiriliyor(false), 1500);
    } catch {
      setIndiriliyor(false);
    }
  }

  return (
    <div className={`rounded-xl border p-5 ${stil.kart}`}>
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <h4 className="font-semibold text-gray-800 mb-1">{etiket}</h4>
          <p className="text-sm text-gray-500">{aciklama}</p>
        </div>
        <button
          onClick={indir}
          disabled={indiriliyor}
          className={`flex-shrink-0 rounded-lg px-4 py-2 text-sm font-medium text-white transition-colors disabled:opacity-60 ${stil.buton}`}
        >
          {indiriliyor ? 'İndiriliyor...' : 'İndir'}
        </button>
      </div>
    </div>
  );
}

export default function YedeklemePage() {
  return (
    <div className="p-6 space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-800">Veri Yedekleme ve Export</h2>
        <p className="text-sm text-gray-500 mt-1">
          Sisteminizin verilerini yedekleyin veya analiz için dışa aktarın
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 max-w-2xl">
        {/* Tam Yedek */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="mb-4">
            <h3 className="text-base font-semibold text-gray-800">Tam Sistem Yedeği</h3>
            <p className="text-sm text-gray-500 mt-1">
              Tüm tablolar tek bir JSON dosyasında — geri yükleme ve arşiv için idealdir
            </p>
          </div>
          <IndirmeButonu
            etiket="JSON Tam Yedek"
            aciklama="Çiftçiler, tarlalar, hasat dönemleri, finans kayıtları ve daha fazlası"
            url="/api/export/json"
            renk="mavi"
          />
        </div>

        {/* Modül Bazlı CSV */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="mb-4">
            <h3 className="text-base font-semibold text-gray-800">Modül Bazlı Export (CSV)</h3>
            <p className="text-sm text-gray-500 mt-1">
              Belirli bir modülü CSV olarak indirin — Excel ile açılabilir
            </p>
          </div>
          <div className="space-y-3">
            <IndirmeButonu
              etiket="Hasat Verileri"
              aciklama="Hasat girişleri — tarih, tarla, miktar, müşteri, ekip bilgileri"
              url="/api/export/csv?modul=hasat"
              renk="yesil"
            />
            <IndirmeButonu
              etiket="Finans Kayıtları"
              aciklama="Gelir ve gider kayıtları, ödeme durumları"
              url="/api/export/csv?modul=finans"
              renk="turuncu"
            />
            <IndirmeButonu
              etiket="Envanter"
              aciklama="Malzeme listesi ve stok hareketleri"
              url="/api/export/csv?modul=envanter"
              renk="mor"
            />
            <IndirmeButonu
              etiket="Çiftçiler"
              aciklama="Tüm çiftçi kayıtları ve iletişim bilgileri"
              url="/api/export/csv?modul=ciftciler"
              renk="camgobegi"
            />
          </div>
        </div>
      </div>

      {/* Bilgi Notu */}
      <div className="max-w-2xl">
        <div className="rounded-lg bg-amber-50 border border-amber-200 p-4">
          <p className="text-xs text-amber-700 font-medium mb-1">Önemli Notlar</p>
          <ul className="text-xs text-amber-600 space-y-1 list-disc list-inside">
            <li>CSV dosyalarını Excel ile açabilirsiniz (UTF-8 kodlaması seçin).</li>
            <li>JSON yedeği tüm veritabanını içerir — güvenli bir yerde saklayın.</li>
            <li>Hassas veriler (TC No, IBAN) de dahil olduğu için dosyaları yetkisiz kişilerle paylaşmayın.</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
