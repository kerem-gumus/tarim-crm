import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { auditOlustur } from '@/lib/auditKullanici'
import { mkdir, writeFile } from 'fs/promises'
import { join } from 'path'

// Basit HTML fatura üretici — PDF yerine print-ready HTML
function faturaHtmlOlustur(veri: {
  belgNo: string; tarih: string; ekipmanAdi: string; plaka: string | null;
  musteriAdi: string | null; gelirTipi: string; tutar: number;
  aciklama: string | null; mesafeKm: number | null;
  yukCinsi: string | null; yukBirimi: string | null; netMiktar: number | null;
  kantarBosKg: number | null; kantarDoluKg: number | null;
  olusturanAdi: string | null;
}): string {
  const gelirTipiEtiket: Record<string, string> = {
    nakliye: 'Nakliye / Taşımacılık', kiralama: 'Kiralama',
    hizmet: 'Hizmet', diger: 'Diğer',
  }
  const tarihStr = new Date(veri.tarih).toLocaleDateString('tr-TR')

  return `<!DOCTYPE html>
<html lang="tr">
<head>
<meta charset="UTF-8">
<title>Fatura ${veri.belgNo}</title>
<style>
  body { font-family: Arial, sans-serif; margin: 40px; color: #1a1a1a; }
  .baslik { text-align: center; border-bottom: 3px solid #16a34a; padding-bottom: 16px; margin-bottom: 24px; }
  .baslik h1 { color: #16a34a; font-size: 28px; margin: 0; }
  .baslik p { color: #666; margin: 4px 0 0; }
  .bilgi-satir { display: flex; justify-content: space-between; margin-bottom: 8px; }
  .bilgi-satir span:first-child { color: #666; font-size: 13px; }
  .bilgi-satir span:last-child { font-weight: 600; font-size: 13px; }
  .bolum { border: 1px solid #e5e7eb; border-radius: 8px; padding: 16px; margin-bottom: 16px; }
  .bolum-baslik { font-size: 12px; font-weight: 700; text-transform: uppercase; color: #6b7280; margin-bottom: 12px; }
  .tutar-kutu { background: #f0fdf4; border: 2px solid #16a34a; border-radius: 8px; padding: 16px; text-align: center; }
  .tutar-kutu .tutar { font-size: 32px; font-weight: 800; color: #16a34a; }
  .imza { margin-top: 48px; display: flex; justify-content: space-between; }
  .imza div { text-align: center; width: 180px; border-top: 1px solid #ccc; padding-top: 8px; font-size: 12px; color: #666; }
  @media print { body { margin: 20px; } }
</style>
</head>
<body>
  <div class="baslik">
    <h1>GELİR FATURASI</h1>
    <p>Tarim CRM Sistemi</p>
  </div>

  <div style="display:flex;justify-content:space-between;margin-bottom:20px;">
    <div>
      <div class="bilgi-satir"><span>Belge No</span><span style="margin-left:16px;">${veri.belgNo}</span></div>
      <div class="bilgi-satir"><span>Tarih</span><span style="margin-left:16px;">${tarihStr}</span></div>
      <div class="bilgi-satir"><span>Düzenleyen</span><span style="margin-left:16px;">${veri.olusturanAdi ?? '—'}</span></div>
    </div>
    <div style="text-align:right;">
      <div class="bilgi-satir" style="flex-direction:column;align-items:flex-end;">
        <span>Araç / Ekipman</span>
        <span>${veri.ekipmanAdi}${veri.plaka ? ` (${veri.plaka})` : ''}</span>
      </div>
    </div>
  </div>

  <div class="bolum">
    <div class="bolum-baslik">İşlem Bilgileri</div>
    <div class="bilgi-satir"><span>Gelir Türü</span><span>${gelirTipiEtiket[veri.gelirTipi] ?? veri.gelirTipi}</span></div>
    ${veri.musteriAdi ? `<div class="bilgi-satir"><span>Müşteri / Alıcı</span><span>${veri.musteriAdi}</span></div>` : ''}
    ${veri.mesafeKm ? `<div class="bilgi-satir"><span>Mesafe</span><span>${veri.mesafeKm} km</span></div>` : ''}
    ${veri.aciklama ? `<div class="bilgi-satir"><span>Açıklama</span><span>${veri.aciklama}</span></div>` : ''}
  </div>

  ${veri.gelirTipi === 'nakliye' && (veri.yukCinsi || veri.netMiktar) ? `
  <div class="bolum">
    <div class="bolum-baslik">Nakliye Detayı</div>
    ${veri.yukCinsi ? `<div class="bilgi-satir"><span>Yük Cinsi</span><span>${veri.yukCinsi}</span></div>` : ''}
    ${veri.kantarDoluKg ? `<div class="bilgi-satir"><span>Kantar Dolu</span><span>${Number(veri.kantarDoluKg).toLocaleString('tr-TR')} kg</span></div>` : ''}
    ${veri.kantarBosKg ? `<div class="bilgi-satir"><span>Kantar Boş</span><span>${Number(veri.kantarBosKg).toLocaleString('tr-TR')} kg</span></div>` : ''}
    ${veri.netMiktar ? `<div class="bilgi-satir"><span>Net Miktar</span><span>${Number(veri.netMiktar).toLocaleString('tr-TR', { maximumFractionDigits: 3 })} ${veri.yukBirimi ?? ''}</span></div>` : ''}
  </div>` : ''}

  <div class="tutar-kutu">
    <div style="font-size:14px;color:#4b5563;margin-bottom:4px;">Toplam Tutar</div>
    <div class="tutar">₺${veri.tutar.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
  </div>

  <div class="imza">
    <div>Düzenleyen İmza</div>
    <div>Alıcı İmza / Kaşe</div>
  </div>
</body>
</html>`
}

export async function GET(_: NextRequest, { params }: { params: { id: string } }) {
  try {
    const gelirler = await prisma.ekipmanGelir.findMany({
      where: { ekipmanId: params.id, aktif: { not: false } },
      include: { bankaHesabi: { select: { id: true, hesapAdi: true } } },
      orderBy: { tarih: 'desc' },
    })
    return NextResponse.json(gelirler.map((g) => ({
      ...g,
      tutar: Number(g.tutar),
      kantarBosKg: g.kantarBosKg ? Number(g.kantarBosKg) : null,
      kantarDoluKg: g.kantarDoluKg ? Number(g.kantarDoluKg) : null,
      netMiktar: g.netMiktar ? Number(g.netMiktar) : null,
      hesapAdi: g.bankaHesabi?.hesapAdi ?? null,
    })))
  } catch {
    return NextResponse.json({ hata: 'Gelirler getirilemedi' }, { status: 500 })
  }
}

export async function POST(istek: NextRequest, { params }: { params: { id: string } }) {
  try {
    const {
      tarih, gelirTipi, tutar, aciklama, mesafeKm, musteriAdi, belgNo,
      bankaHesabiId, kantarBosKg, kantarDoluKg, netMiktar, yukCinsi, yukBirimi,
    } = await istek.json()

    if (!tarih || !gelirTipi || !tutar) {
      return NextResponse.json({ hata: 'Tarih, gelir tipi ve tutar zorunludur' }, { status: 400 })
    }

    const tutarSayi = parseFloat(tutar)
    const audit = await auditOlustur()

    const ekipman = await prisma.ekipman.findUnique({
      where: { id: params.id },
      select: { ekipmanAdi: true, plaka: true },
    })

    const kayit = await prisma.$transaction(async (tx) => {
      const yeniGelir = await tx.ekipmanGelir.create({
        data: {
          ekipmanId: params.id,
          tarih: new Date(tarih),
          gelirTipi,
          tutar: tutarSayi,
          aciklama: aciklama || null,
          mesafeKm: mesafeKm || null,
          musteriAdi: musteriAdi || null,
          belgNo: belgNo || null,
          bankaHesabiId: bankaHesabiId || null,
          kantarBosKg: kantarBosKg ? parseFloat(kantarBosKg) : null,
          kantarDoluKg: kantarDoluKg ? parseFloat(kantarDoluKg) : null,
          netMiktar: netMiktar ? parseFloat(netMiktar) : null,
          yukCinsi: yukCinsi || null,
          yukBirimi: yukBirimi || null,
          ...audit,
        },
      })

      // Banka hareketini kaydet ve fatura oluştur
      let faturaDosyaUrl: string | null = null
      if (bankaHesabiId) {
        // HTML fatura oluştur
        const faturaHtml = faturaHtmlOlustur({
          belgNo: belgNo ?? yeniGelir.id,
          tarih,
          ekipmanAdi: ekipman?.ekipmanAdi ?? '',
          plaka: ekipman?.plaka ?? null,
          musteriAdi: musteriAdi || null,
          gelirTipi,
          tutar: tutarSayi,
          aciklama: aciklama || null,
          mesafeKm: mesafeKm || null,
          yukCinsi: yukCinsi || null,
          yukBirimi: yukBirimi || null,
          netMiktar: netMiktar || null,
          kantarBosKg: kantarBosKg || null,
          kantarDoluKg: kantarDoluKg || null,
          olusturanAdi: audit.olusturanAdi ?? null,
        })

        const dosyaAdi = `fatura-${(belgNo ?? yeniGelir.id).replace(/[^a-zA-Z0-9\-]/g, '_')}.html`
        const klasor = join(process.cwd(), 'public', 'uploads', 'faturalar')
        await mkdir(klasor, { recursive: true })
        await writeFile(join(klasor, dosyaAdi), faturaHtml, 'utf-8')
        faturaDosyaUrl = `/uploads/faturalar/${dosyaAdi}`

        // Banka hareketi
        const hareket = await tx.bankaHareketi.create({
          data: {
            bankaHesabiId,
            tip: 'giris',
            tutar: tutarSayi,
            aciklama: aciklama || `Ekipman geliri — ${gelirTipi}${musteriAdi ? ` / ${musteriAdi}` : ''}`,
            tarih: new Date(tarih),
            referansTipi: 'ekipman_gelir',
            referansId: yeniGelir.id,
            dekontUrl: faturaDosyaUrl,
            olusturanId: audit.olusturanId ?? null,
            olusturanAdi: audit.olusturanAdi ?? null,
          },
        })

        await tx.bankaHesabi.update({
          where: { id: bankaHesabiId },
          data: { bakiye: { increment: tutarSayi } },
        })

        // Gelir kaydına fatura url'sini güncelle
        await tx.ekipmanGelir.update({
          where: { id: yeniGelir.id },
          data: { faturaDosyaUrl },
        })

        return { ...yeniGelir, faturaDosyaUrl, hareketId: hareket.id }
      }

      return yeniGelir
    })

    return NextResponse.json({ ...kayit, tutar: tutarSayi }, { status: 201 })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ hata: 'Gelir oluşturulamadı' }, { status: 500 })
  }
}

export async function DELETE(istek: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { searchParams } = new URL(istek.url)
    const gelirId = searchParams.get('gelirId')
    if (!gelirId) return NextResponse.json({ hata: 'gelirId gerekli' }, { status: 400 })
    await prisma.ekipmanGelir.update({
      where: { id: gelirId },
      data: { aktif: false },
    })
    return NextResponse.json({ basarili: true })
  } catch {
    return NextResponse.json({ hata: 'Gelir silinemedi' }, { status: 500 })
  }
}
