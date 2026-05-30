import { prisma } from '@/lib/db';

type LogGirdisi = {
  kullaniciId?: string;
  islemTipi: 'olusturma' | 'guncelleme' | 'silme' | 'giris' | 'cikis';
  modul: string;
  tablo: string;
  kayitId?: string;
  eskiDeger?: unknown;
  yeniDeger?: unknown;
  ipAdresi?: string;
  cihazBilgisi?: string;
};

export async function logKaydet(girdi: LogGirdisi): Promise<void> {
  try {
    await prisma.aktiviteLogu.create({
      data: {
        kullaniciId: girdi.kullaniciId,
        islemTipi: girdi.islemTipi,
        modul: girdi.modul,
        tablo: girdi.tablo,
        kayitId: girdi.kayitId,
        eskiDeger: girdi.eskiDeger !== undefined ? (girdi.eskiDeger as object) : undefined,
        yeniDeger: girdi.yeniDeger !== undefined ? (girdi.yeniDeger as object) : undefined,
        ipAdresi: girdi.ipAdresi,
        cihazBilgisi: girdi.cihazBilgisi,
      },
    });
  } catch (hata) {
    console.error('[aktiviteLog] Log kaydedilemedi:', hata);
  }
}
