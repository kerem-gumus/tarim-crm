import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { logKaydet } from '@/lib/aktiviteLog';
import { auditGuncelle } from '@/lib/auditKullanici';
import { kontenjanZinciriGuncelle } from '@/lib/kontenjanZinciri';

// PUT — temel alanları güncelle (tarih, kg, açıklama, notlar)
export async function PUT(istek: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { tarih, tartimMiktariKg, satisMiktariKg, aciklama, notlar } = await istek.json();

    const eskiGiris = await prisma.hasatGirisi.findUnique({ where: { id } });
    if (!eskiGiris) return NextResponse.json({ hata: 'Hasat girişi bulunamadı' }, { status: 404 });

    const audit = await auditGuncelle();

    // Tartım değişmişse sürgün toplamını fark kadar güncelle (Senaryo2'de atlıyoruz)
    const eskiKg = Number(eskiGiris.tartimMiktariKg);
    const yeniKg = tartimMiktariKg !== undefined ? Number(tartimMiktariKg) : eskiKg;
    const kgFarki = yeniKg - eskiKg;

    const guncel = await prisma.hasatGirisi.update({
      where: { id },
      data: {
        ...(tarih ? { tarih: new Date(tarih) } : {}),
        ...(tartimMiktariKg !== undefined ? { tartimMiktariKg: yeniKg } : {}),
        ...(satisMiktariKg !== undefined ? { satisMiktariKg: Number(satisMiktariKg) } : {}),
        ...(aciklama !== undefined ? { aciklama: aciklama?.trim() || null } : {}),
        ...(notlar !== undefined ? { notlar: notlar?.trim() || null } : {}),
        ...audit,
      },
      include: { tarla: { include: { ciftci: true } }, isciEkip: true, musteri: true },
    });

    // Sürgün toplamını güncelle (Senaryo 2 girişleri hariç — onlar zaten sayılmıyordu)
    if (kgFarki !== 0 && eskiGiris.satisBenimMi !== false) {
      await prisma.surgun.update({
        where: { id: eskiGiris.surgunId },
        data: { toplamHasatKg: { increment: kgFarki } },
      });
    }

    logKaydet({
      islemTipi: 'guncelleme', modul: 'hasat', tablo: 'hasat_girisleri',
      kayitId: id, yeniDeger: { tartimMiktariKg: yeniKg, satisMiktariKg },
    }).catch(console.error);

    return NextResponse.json(guncel);
  } catch (err) {
    console.error('[hasat PUT]', err);
    return NextResponse.json({ hata: 'Hasat girişi güncellenemedi' }, { status: 500 });
  }
}

export async function DELETE(_istek: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;

    const giris = await prisma.hasatGirisi.findUnique({ where: { id } });
    if (!giris) {
      return NextResponse.json({ hata: 'Hasat girişi bulunamadı' }, { status: 404 });
    }

    const audit = await auditGuncelle();

    await prisma.odemeKaydi.updateMany({ where: { hasatGirisId: id }, data: { aktif: false, ...audit } });
    // Cüzdan cari hareketini de pasifleştir
    await prisma.cariHareket.updateMany({ where: { hasatGirisiId: id, aktif: true }, data: { aktif: false } });
    // Hasat girişinden oluşan alacak kaydını da pasifleştir
    await prisma.gelirKaydi.updateMany({ where: { hasatGirisiId: id, aktif: true }, data: { aktif: false } });
    await prisma.hasatGirisi.update({ where: { id }, data: { aktif: false, ...audit } });

    // Sürgün toplam hasat güncelle
    // Senaryo 2 (satisBenimMi === false = "B yaptı") girişlerinde kg zaten
    // sürgüne eklenmemişti — silince de düşülmemeli, yoksa negatife gider.
    const kgSurguneEklenmisti = giris.satisBenimMi !== false;
    if (kgSurguneEklenmisti && Number(giris.tartimMiktariKg) > 0) {
      await prisma.surgun.update({
        where: { id: giris.surgunId },
        data: { toplamHasatKg: { decrement: Number(giris.tartimMiktariKg) } },
      });
    }

    // Kontenjan takip zincirini güncelle
    if (giris.kontenjanId) {
      // Bu girişe ait takip kaydını bul
      const takip = await prisma.kontenjanGunlukTakip.findFirst({
        where: { hasatGirisId: id, aktif: true },
      });

      if (takip) {
        // Bu takip kaydından bir öncekinin kalanını bul
        const oncekiTakip = await prisma.kontenjanGunlukTakip.findFirst({
          where: {
            kontenjanId: giris.kontenjanId,
            aktif: true,
            OR: [
              { tarih: { lt: takip.tarih } },
              {
                tarih: takip.tarih,
                olusturmaTarihi: { lt: takip.olusturmaTarihi },
              },
            ],
          },
          orderBy: [{ tarih: 'desc' }, { olusturmaTarihi: 'desc' }],
        });

        // Bu takip kaydını kapat
        await prisma.kontenjanGunlukTakip.update({
          where: { id: takip.id },
          data: { aktif: false, ...audit },
        });

        // Eğer bu takipten sonra kayıtlar varsa, önceki kalanı kullanarak yeniden hesapla
        const oncekiKalan = oncekiTakip ? Number(oncekiTakip.kalanBakiyeKg) : 0;

        // Sonraki kayıtları bul ve önceki kalanıyla yeniden hesapla
        const sonrakiler = await prisma.kontenjanGunlukTakip.findMany({
          where: {
            kontenjanId: giris.kontenjanId,
            aktif: true,
            OR: [
              { tarih: { gt: takip.tarih } },
              {
                tarih: takip.tarih,
                olusturmaTarihi: { gt: takip.olusturmaTarihi },
              },
            ],
          },
          orderBy: [{ tarih: 'asc' }, { olusturmaTarihi: 'asc' }],
        });

        let devamKalan = oncekiKalan;
        for (const t of sonrakiler) {
          const etkili = Number(t.tartimKg) + devamKalan;
          const yeniKalan = etkili - Number(t.hesaplananSatisKg);
          await prisma.kontenjanGunlukTakip.update({
            where: { id: t.id },
            data: { oncekiBakiyeKg: devamKalan, kalanBakiyeKg: yeniKalan },
          });
          devamKalan = yeniKalan;
        }
      }
    }

    logKaydet({
      islemTipi: 'silme',
      modul: 'hasat',
      tablo: 'hasat_girisleri',
      kayitId: id,
    }).catch(console.error);

    return NextResponse.json({ basarili: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ hata: 'Hasat girişi silinemedi' }, { status: 500 });
  }
}
