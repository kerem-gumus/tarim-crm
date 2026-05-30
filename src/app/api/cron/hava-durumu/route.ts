import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { konumBul, VARSAYILAN_KONUM } from '@/lib/konumlar'

// Vercel Cron: günde 5 kez (06, 09, 12, 15, 18 İstanbul saati)
// Güvenlik: CRON_SECRET env değişkeniyle korumalı

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

function ortalamaBul(dizi: number[]): number | null {
  const gecerli = dizi.filter((v) => v !== null && v !== undefined && !isNaN(v))
  if (gecerli.length === 0) return null
  return gecerli.reduce((a, b) => a + b, 0) / gecerli.length
}

export async function GET(istek: NextRequest) {
  // Cron secret kontrolü
  const authHeader = istek.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ hata: 'Yetkisiz erişim' }, { status: 401 })
  }

  try {
    // Konum ayarlarını DB'den oku, yoksa varsayılanı kullan
    const ayarlar = await prisma.sistemAyar.findMany({
      where: {
        anahtar: { in: ['hava_il', 'hava_ilce'] },
      },
    })
    const ayarMap = Object.fromEntries(ayarlar.map((a) => [a.anahtar, a.deger]))

    const il = ayarMap['hava_il'] ?? VARSAYILAN_KONUM.il
    const ilce = ayarMap['hava_ilce'] ?? VARSAYILAN_KONUM.ilce
    const konum = konumBul(il, ilce)

    // Open-Meteo API — saatlik + günlük veri
    const apiUrl =
      `https://api.open-meteo.com/v1/forecast` +
      `?latitude=${konum.lat}&longitude=${konum.lng}` +
      `&hourly=temperature_2m,relative_humidity_2m,precipitation,windspeed_10m,weathercode` +
      `&daily=temperature_2m_max,temperature_2m_min,precipitation_sum,windspeed_10m_max,weathercode` +
      `&timezone=Europe/Istanbul&forecast_days=1`

    const yanit = await fetch(apiUrl, { cache: 'no-store' })
    if (!yanit.ok) {
      throw new Error(`Open-Meteo hatası: ${yanit.status}`)
    }

    const veri = await yanit.json()
    const hourly = veri.hourly
    const daily = veri.daily

    const bugunTarih = daily.time[0] as string

    // Saatlik verileri hazırla
    const saatlikVeriler = (hourly.time as string[]).map((saat: string, i: number) => ({
      saat,
      sicaklik: hourly.temperature_2m[i] as number,
      nem: hourly.relative_humidity_2m[i] as number,
      yagis: hourly.precipitation[i] as number,
      ruzgar: hourly.windspeed_10m[i] as number,
      durum: weatherCodeToDurum(hourly.weathercode[i] as number),
    }))

    // Günlük ortalama nem hesapla
    const nemOrtalaması = ortalamaBul(hourly.relative_humidity_2m as number[])
    const sicaklikOrt = ortalamaBul(hourly.temperature_2m as number[])

    // DB'ye upsert
    const mevcutKayit = await prisma.havaVerisi.findFirst({
      where: {
        tarih: new Date(bugunTarih),
        il: konum.il,
        ilce: konum.ilce,
        tarlaId: null,
      },
    })

    const kayitVerisi = {
      il: konum.il,
      ilce: konum.ilce,
      kaynakLat: konum.lat,
      kaynakLng: konum.lng,
      sicaklikMin: daily.temperature_2m_min[0] as number,
      sicaklikMax: daily.temperature_2m_max[0] as number,
      sicaklikOrtalama: sicaklikOrt,
      nemOrani: nemOrtalaması,
      yagisMm: daily.precipitation_sum[0] as number,
      ruzgarHizi: daily.windspeed_10m_max[0] as number,
      havaDurumu: weatherCodeToDurum(daily.weathercode[0] as number),
      saatlikVeriler,
      cronCekimi: true,
      guncellemeTarihi: new Date(),
    }

    if (mevcutKayit) {
      await prisma.havaVerisi.update({
        where: { id: mevcutKayit.id },
        data: kayitVerisi,
      })
    } else {
      await prisma.havaVerisi.create({
        data: {
          tarih: new Date(bugunTarih),
          ...kayitVerisi,
        },
      })
    }

    return NextResponse.json({
      basarili: true,
      konum: `${konum.ilce}, ${konum.il}`,
      tarih: bugunTarih,
      sicaklik: `${daily.temperature_2m_min[0]}°C - ${daily.temperature_2m_max[0]}°C`,
      nem: nemOrtalaması ? `%${nemOrtalaması.toFixed(1)}` : 'bilinmiyor',
      havaDurumu: weatherCodeToDurum(daily.weathercode[0] as number),
    })
  } catch (hata) {
    const mesaj = hata instanceof Error ? hata.message : 'Bilinmeyen hata'
    console.error('Hava cron hatası:', mesaj)
    return NextResponse.json({ hata: mesaj }, { status: 500 })
  }
}
