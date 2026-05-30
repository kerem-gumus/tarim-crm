import { prisma } from '@/lib/db';

// =====================================================
// Kontenjan zincirini yeniden hesapla
// Verilen takip kaydından sonraki tüm kayıtları günceller
// Sıra: tarih ASC, olusturmaTarihi ASC
// =====================================================
export async function kontenjanZinciriGuncelle(kontenjanId: string, baslangicTakipId: string) {
  const baslangic = await prisma.kontenjanGunlukTakip.findUnique({
    where: { id: baslangicTakipId },
  });
  if (!baslangic) return;

  const sonrakiler = await prisma.kontenjanGunlukTakip.findMany({
    where: {
      kontenjanId,
      aktif: true,
      OR: [
        { tarih: { gt: baslangic.tarih } },
        {
          tarih: baslangic.tarih,
          olusturmaTarihi: { gt: baslangic.olusturmaTarihi },
        },
      ],
    },
    orderBy: [{ tarih: 'asc' }, { olusturmaTarihi: 'asc' }],
  });

  let oncekiKalan = Number(baslangic.kalanBakiyeKg);

  for (const t of sonrakiler) {
    const etkili = Number(t.tartimKg) + oncekiKalan;
    const yeniKalan = etkili - Number(t.hesaplananSatisKg);
    await prisma.kontenjanGunlukTakip.update({
      where: { id: t.id },
      data: { oncekiBakiyeKg: oncekiKalan, kalanBakiyeKg: yeniKalan },
    });
    oncekiKalan = yeniKalan;
  }
}
