import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

// =====================================================
// Tüm hesapların hareketleri — sayfalama + filtre destekli
// GET /api/banka-hareketleri
// Query: sayfa, limit, tip, hesapId, baslangic, bitis, arama
// Response: { hareketler, toplam, toplamGiris, toplamCikis }
// =====================================================

export async function GET(istek: NextRequest) {
  try {
    const { searchParams } = new URL(istek.url);

    const sayfa   = Math.max(1, Number(searchParams.get('sayfa')  ?? 1));
    const limit   = Math.min(100, Math.max(1, Number(searchParams.get('limit') ?? 15)));
    const tip     = searchParams.get('tip')     ?? '';   // 'giris' | 'cikis' | ''
    const hesapId = searchParams.get('hesapId') ?? '';
    const baslangic = searchParams.get('baslangic') ?? '';
    const bitis     = searchParams.get('bitis')     ?? '';
    const arama     = searchParams.get('arama')     ?? '';

    // Tarih dönüşümleri
    function tarihUTC(tarihStr: string, sonGun = false): Date {
      const [yil, ay, gun] = tarihStr.split('-').map(Number);
      const d = new Date(Date.UTC(yil, ay - 1, gun));
      if (sonGun) d.setUTCHours(23, 59, 59, 999);
      return d;
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: Record<string, any> = {};

    if (tip === 'giris' || tip === 'cikis') where.tip = tip;
    if (hesapId) where.bankaHesabiId = hesapId;
    if (baslangic) where.tarih = { ...where.tarih, gte: tarihUTC(baslangic) };
    if (bitis)     where.tarih = { ...where.tarih, lte: tarihUTC(bitis, true) };
    if (arama) {
      where.OR = [
        { aciklama:    { contains: arama, mode: 'insensitive' } },
        { bankaHesabi: { hesapAdi: { contains: arama, mode: 'insensitive' } } },
      ];
    }

    const [toplam, girisAgg, cikisAgg, hareketler] = await Promise.all([
      prisma.bankaHareketi.count({ where }),
      prisma.bankaHareketi.aggregate({ where: { ...where, tip: 'giris' }, _sum: { tutar: true } }),
      prisma.bankaHareketi.aggregate({ where: { ...where, tip: 'cikis' }, _sum: { tutar: true } }),
      prisma.bankaHareketi.findMany({
        where,
        include: {
          bankaHesabi: { select: { id: true, hesapAdi: true } },
        },
        orderBy: [{ tarih: 'desc' }, { olusturmaTarihi: 'desc' }],
        skip: (sayfa - 1) * limit,
        take: limit,
      }),
    ]);

    const veri = hareketler.map((h) => ({
      id: h.id,
      bankaHesabiId: h.bankaHesabiId,
      hesapAdi: h.bankaHesabi.hesapAdi,
      tip: h.tip,
      tutar: Number(h.tutar),
      aciklama: h.aciklama,
      tarih: h.tarih,
      referansTipi: h.referansTipi,
      referansId: h.referansId,
      dekontUrl: h.dekontUrl ?? null,
      olusturmaTarihi: h.olusturmaTarihi,
    }));

    return NextResponse.json({
      hareketler: veri,
      toplam,
      toplamGiris:  Number(girisAgg._sum.tutar ?? 0),
      toplamCikis:  Number(cikisAgg._sum.tutar ?? 0),
      sayfaSayisi:  Math.ceil(toplam / limit),
      mevcutSayfa:  sayfa,
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ hata: 'Hareketler getirilemedi' }, { status: 500 });
  }
}
