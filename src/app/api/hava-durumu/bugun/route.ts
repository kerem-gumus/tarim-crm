export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { konumBul, VARSAYILAN_KONUM } from '@/lib/konumlar'

function weatherCodeToDurum(kod: number): string {
  if (kod === 0) return 'güneşli'
  if (kod <= 3) return 'parçalı bulutlu'
  if (kod <= 48) return 'sisli'
  if (kod <= 67) return 'yağmurlu'
  if (kod <= 77) return 'karlı'
  if (kod <= 82) return 'sağanak'
  if (kod <= 99) return 'fırtınalı'
  return 'bilinmiyor'
}

export async function GET(istek: NextRequest) {
  try {
    const { searchParams } = new URL(istek.url)
    const ilParam = searchParams.get('il')
    const ilceParam = searchParams.get('ilce')

    // İl/ilçe yoksa DB'den sistem ayarını oku
    let il = ilParam
    let ilce = ilceParam

    if (!il || !ilce) {
      try {
        const ayarlar = await prisma.sistemAyar.findMany({
          where: { anahtar: { in: ['hava_il', 'hava_ilce'] } },
        })
        const ayarMap = Object.fromEntries(ayarlar.map((a) => [a.anahtar, a.deger]))
        il = il ?? ayarMap['hava_il'] ?? VARSAYILAN_KONUM.il
        ilce = ilce ?? ayarMap['hava_ilce'] ?? VARSAYILAN_KONUM.ilce
      } catch {
        il = il ?? VARSAYILAN_KONUM.il
        ilce = ilce ?? VARSAYILAN_KONUM.ilce
      }
    }

    const konum = konumBul(il, ilce)

    // Bugünün DB kaydı var mı kontrol et
    const bugun = new Date()
    bugun.setHours(0, 0, 0, 0)

    const dbKayit = await prisma.havaVerisi.findFirst({
      where: {
        tarih: bugun,
        il: konum.il,
        ilce: konum.ilce,
        tarlaId: null,
      },
    })

    // Hafif cache: son 30 dakikada cron güncellediyse DB'den dön
    if (dbKayit?.cronCekimi && dbKayit.guncellemeTarihi) {
      const fark = Date.now() - dbKayit.guncellemeTarihi.getTime()
      if (fark < 30 * 60 * 1000) {
        return NextResponse.json({
          tarih: bugun.toISOString().split('T')[0],
          il: konum.il,
          ilce: konum.ilce,
          sicaklikMin: Number(dbKayit.sicaklikMin),
          sicaklikMax: Number(dbKayit.sicaklikMax),
          sicaklikOrtalama: dbKayit.sicaklikOrtalama ? Number(dbKayit.sicaklikOrtalama) : null,
          nemOrani: dbKayit.nemOrani ? Number(dbKayit.nemOrani) : null,
          yagisMm: Number(dbKayit.yagisMm),
          ruzgarHizi: Number(dbKayit.ruzgarHizi),
          havaDurumu: dbKayit.havaDurumu,
          saatlikVeriler: dbKayit.saatlikVeriler,
          tahmin7Gun: [],
          kaynakCache: true,
        })
      }
    }

    // API'den çek (7 günlük tahmin + saatlik veri)
    const apiUrl =
      `https://api.open-meteo.com/v1/forecast` +
      `?latitude=${konum.lat}&longitude=${konum.lng}` +
      `&hourly=temperature_2m,relative_humidity_2m,precipitation,windspeed_10m,weathercode` +
      `&daily=temperature_2m_max,temperature_2m_min,precipitation_sum,windspeed_10m_max,weathercode` +
      `&timezone=Europe/Istanbul&forecast_days=7`

    const yanit = await fetch(apiUrl, { next: { revalidate: 1800 } })
    if (!yanit.ok) throw new Error(`Open-Meteo API hatası: ${yanit.status}`)

    const veri = await yanit.json()
    const daily = veri.daily
    const hourly = veri.hourly

    const bugunTarih = daily.time[0] as string

    // Saatlik veriler (bugün)
    const bugunSaatleri = (hourly.time as string[])
      .map((t: string, i: number) => ({ t, i }))
      .filter(({ t }) => t.startsWith(bugunTarih))
      .map(({ i }) => ({
        saat: (hourly.time as string[])[i].split('T')[1],
        sicaklik: hourly.temperature_2m[i] as number,
        nem: hourly.relative_humidity_2m[i] as number,
        yagis: hourly.precipitation[i] as number,
        ruzgar: hourly.windspeed_10m[i] as number,
        durum: weatherCodeToDurum(hourly.weathercode[i] as number),
      }))

    // Günlük ortalama nem
    const bugunNemler = bugunSaatleri.map((s) => s.nem).filter((v) => !isNaN(v))
    const nemOrtalaması = bugunNemler.length > 0
      ? bugunNemler.reduce((a, b) => a + b, 0) / bugunNemler.length
      : null

    const sicaklikOrtalama = bugunSaatleri.length > 0
      ? bugunSaatleri.reduce((a, b) => a + b.sicaklik, 0) / bugunSaatleri.length
      : null

    const tahmin7Gun = (daily.time as string[]).map((tarih: string, i: number) => ({
      tarih,
      sicaklikMax: daily.temperature_2m_max[i] as number,
      sicaklikMin: daily.temperature_2m_min[i] as number,
      yagisMm: daily.precipitation_sum[i] as number,
      ruzgarHizi: daily.windspeed_10m_max[i] as number,
      havaDurumu: weatherCodeToDurum(daily.weathercode[i] as number),
    }))

    // DB upsert
    try {
      const dbVerisi = {
        il: konum.il,
        ilce: konum.ilce,
        kaynakLat: konum.lat,
        kaynakLng: konum.lng,
        sicaklikMin: daily.temperature_2m_min[0] as number,
        sicaklikMax: daily.temperature_2m_max[0] as number,
        sicaklikOrtalama,
        nemOrani: nemOrtalaması,
        yagisMm: daily.precipitation_sum[0] as number,
        ruzgarHizi: daily.windspeed_10m_max[0] as number,
        havaDurumu: weatherCodeToDurum(daily.weathercode[0] as number),
        saatlikVeriler: bugunSaatleri,
        guncellemeTarihi: new Date(),
      }

      if (dbKayit) {
        await prisma.havaVerisi.update({ where: { id: dbKayit.id }, data: dbVerisi })
      } else {
        await prisma.havaVerisi.create({
          data: { tarih: new Date(bugunTarih), ...dbVerisi },
        })
      }
    } catch (dbHata) {
      console.error('DB kayıt hatası (kritik değil):', dbHata)
    }

    return NextResponse.json({
      tarih: bugunTarih,
      il: konum.il,
      ilce: konum.ilce,
      sicaklikMin: daily.temperature_2m_min[0] as number,
      sicaklikMax: daily.temperature_2m_max[0] as number,
      sicaklikOrtalama,
      nemOrani: nemOrtalaması,
      yagisMm: daily.precipitation_sum[0] as number,
      ruzgarHizi: daily.windspeed_10m_max[0] as number,
      havaDurumu: weatherCodeToDurum(daily.weathercode[0] as number),
      saatlikVeriler: bugunSaatleri,
      tahmin7Gun,
      kaynakCache: false,
    })
  } catch (hata) {
    console.error('Hava durumu API hatası:', hata)
    return NextResponse.json({ hata: 'Hava durumu alınamadı' }, { status: 500 })
  }
}
