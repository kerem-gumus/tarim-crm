import { prisma } from '@/lib/db';

const islemRenkleri: Record<string, string> = {
  olusturma: 'bg-green-100 text-green-800',
  guncelleme: 'bg-blue-100 text-blue-800',
  silme: 'bg-red-100 text-red-800',
  giris: 'bg-purple-100 text-purple-800',
  cikis: 'bg-gray-100 text-gray-800',
};

const islemEtiketleri: Record<string, string> = {
  olusturma: 'Oluşturma',
  guncelleme: 'Güncelleme',
  silme: 'Silme',
  giris: 'Giriş',
  cikis: 'Çıkış',
};

export default async function AktiviteLogSayfasi() {
  const loglar = await prisma.aktiviteLogu.findMany({
    orderBy: { tarih: 'desc' },
    take: 200,
  });

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Aktivite Logu</h1>
        <p className="mt-1 text-sm text-gray-500">Son 200 sistem işlemi</p>
      </div>

      <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                Tarih
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                İşlem
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                Modül
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                Tablo
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                Kayıt ID
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                IP Adresi
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loglar.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-gray-400">
                  Henüz aktivite kaydı yok.
                </td>
              </tr>
            ) : (
              loglar.map((log) => (
                <tr key={log.id} className="hover:bg-gray-50">
                  <td className="whitespace-nowrap px-4 py-3 text-gray-600">
                    {log.tarih.toLocaleString('tr-TR', {
                      day: '2-digit',
                      month: '2-digit',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        islemRenkleri[log.islemTipi] ?? 'bg-gray-100 text-gray-700'
                      }`}
                    >
                      {islemEtiketleri[log.islemTipi] ?? log.islemTipi}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-700">{log.modul}</td>
                  <td className="px-4 py-3 text-gray-500">{log.tablo}</td>
                  <td className="px-4 py-3 font-mono text-xs text-gray-400">
                    {log.kayitId ? log.kayitId.slice(0, 8) + '...' : '-'}
                  </td>
                  <td className="px-4 py-3 text-gray-500">{log.ipAdresi ?? '-'}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
