export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { logKaydet } from '@/lib/aktiviteLog';
import { auditGuncelle } from '@/lib/auditKullanici';
import { createClient } from '@supabase/supabase-js';

function supabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );
}

// DELETE /api/gelir-kayitlari/[id]/odeme/[odemeId]
// Alacak ödemesini geri al:
// 1. GelirOdemesi kaydını sil
// 2. GelirKaydi odenen/kalan/durum güncelle
// 3. Banka hareketi tersine çevir + bakiye düzelt
// 4. Varsa dekont dosyasını Storage'dan sil
export async function DELETE(
  _istek: Request,
  { params }: { params: Promise<{ id: string; odemeId: string }> }
) {
  try {
    const { id: gelirKaydiId, odemeId } = await params;

    // Ödeme kaydını al
    const odeme = await prisma.gelirOdemesi.findUnique({
      where: { id: odemeId },
      include: { gelirKaydi: true },
    });

    if (!odeme) {
      return NextResponse.json({ hata: 'Ödeme kaydı bulunamadı' }, { status: 404 });
    }
    if (odeme.gelirKaydiId !== gelirKaydiId) {
      return NextResponse.json({ hata: 'Ödeme bu alacak kaydına ait değil' }, { status: 400 });
    }

    const geriAlinacakTutar = Number(odeme.gercekTutar);
    const mevcutKayit = odeme.gelirKaydi;

    // Geri alındıktan sonraki değerler
    const yeniOdenen = Math.max(0, Number(mevcutKayit.odenenTutar) - geriAlinacakTutar);
    const yeniKalan = Number(mevcutKayit.toplamTutar) - yeniOdenen;
    const yeniDurum =
      yeniOdenen <= 0 ? 'odeme_bekleniyor' :
      yeniOdenen < Number(mevcutKayit.toplamTutar) ? 'kismi_odendi' :
      'odendi';

    const audit = await auditGuncelle();

    await prisma.$transaction(async (tx) => {
      // 1. GelirOdemesi kaydını sil (hard delete — küçük finansal kayıt)
      await tx.gelirOdemesi.delete({ where: { id: odemeId } });

      // 2. GelirKaydi güncelle
      await tx.gelirKaydi.update({
        where: { id: gelirKaydiId },
        data: {
          odenenTutar: yeniOdenen,
          kalanTutar: yeniKalan,
          odemeDurumu: yeniDurum,
          ...audit,
        },
      });

      // 3. Banka hareketi: bu ödemeye bağlı hareketi bul ve tersine çevir
      const bankaHareketleri = await tx.bankaHareketi.findMany({
        where: { referansTipi: 'gelir_kaydi', referansId: gelirKaydiId },
      });

      // En son ödemeye ait hareketi bul (odeme tarihi + oluşturma tarihi en yakın)
      // Birden fazla ödeme varsa sadece bu ödemeye ait olanı siliyoruz
      // GelirOdemesi.olusturmaTarihi ile BankaHareketi.olusturmaTarihi karşılaştır
      const odemeZaman = odeme.olusturmaTarihi.getTime();
      const ilgiliHareket = bankaHareketleri
        .filter((h) => h.tip === 'giris')
        .sort((a, b) => {
          const farkA = Math.abs(a.olusturmaTarihi.getTime() - odemeZaman);
          const farkB = Math.abs(b.olusturmaTarihi.getTime() - odemeZaman);
          return farkA - farkB;
        })[0];

      if (ilgiliHareket) {
        // Hareketi pasifleştir (soft delete)
        await tx.bankaHareketi.update({
          where: { id: ilgiliHareket.id },
          data: { referansTipi: 'iptal_edildi' },
        });

        // Banka bakiyesini geri al (giriş hareketi → bakiyeden düş)
        if (odeme.bankaHesabiId) {
          await tx.bankaHesabi.update({
            where: { id: odeme.bankaHesabiId },
            data: { bakiye: { decrement: geriAlinacakTutar } },
          });
        }

        // Fark hareketi varsa onu da geri al
        const farkTutar = Number(odeme.farkTutar);
        if (Math.abs(farkTutar) >= 0.01) {
          const farkHesabi = await tx.bankaHesabi.findFirst({
            where: { tur: 'fark_hesabi', aktif: true },
          });
          if (farkHesabi) {
            const farkHareket = bankaHareketleri.find(
              (h) => h.bankaHesabiId === farkHesabi.id &&
                Math.abs(h.olusturmaTarihi.getTime() - odemeZaman) < 60000
            );
            if (farkHareket) {
              await tx.bankaHareketi.update({
                where: { id: farkHareket.id },
                data: { referansTipi: 'iptal_edildi' },
              });
              // Fark hesabı bakiyesini da geri al
              const farkYon = farkTutar > 0 ? -Math.abs(farkTutar) : Math.abs(farkTutar);
              await tx.bankaHesabi.update({
                where: { id: farkHesabi.id },
                data: { bakiye: { increment: farkYon } },
              });
            }
          }
        }
      }
    });

    // 4. Dekont dosyasını Storage'dan sil (varsa)
    if (odeme.dekontUrl) {
      try {
        // Storage path'ini URL'den çıkar: fotograflar/dekontlar/xxx.pdf
        const url = odeme.dekontUrl;
        const storageMatch = url.match(/fotograflar\/(.+)$/);
        if (storageMatch) {
          const depoYolu = storageMatch[1];
          await supabaseAdmin().storage.from('fotograflar').remove([`dekontlar/${depoYolu.split('dekontlar/')[1] ?? depoYolu}`]);
        }
      } catch { /* Dekont silinemese de ödeme geri alımı başarılı sayılır */ }
    }

    logKaydet({
      islemTipi: 'silme',
      modul: 'finans',
      tablo: 'gelir_odemeleri',
      kayitId: odemeId,
      eskiDeger: { gercekTutar: geriAlinacakTutar, gelirKaydiId },
    }).catch(console.error);

    return NextResponse.json({
      basarili: true,
      geriAlinan: geriAlinacakTutar,
      yeniOdenen,
      yeniKalan,
      yeniDurum,
    });
  } catch (err) {
    console.error('[gelir odeme DELETE]', err);
    return NextResponse.json({ hata: 'Ödeme geri alınamadı' }, { status: 500 });
  }
}
