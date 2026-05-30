// Çay tarımı bölgelerinin ilçe bazlı koordinatları
// Open-Meteo API için kullanılır

export interface KonumBilgisi {
  il: string
  ilce: string
  lat: number
  lng: number
}

export const ILCE_KOORDINATLARI: KonumBilgisi[] = [
  // Rize
  { il: 'Rize', ilce: 'Merkez', lat: 41.02, lng: 40.52 },
  { il: 'Rize', ilce: 'Ardeşen', lat: 41.19, lng: 40.98 },
  { il: 'Rize', ilce: 'Çamlıhemşin', lat: 41.07, lng: 40.89 },
  { il: 'Rize', ilce: 'Çayeli', lat: 41.09, lng: 40.75 },
  { il: 'Rize', ilce: 'Derepazarı', lat: 41.06, lng: 40.65 },
  { il: 'Rize', ilce: 'Fındıklı', lat: 41.29, lng: 40.97 },
  { il: 'Rize', ilce: 'Güneysu', lat: 40.90, lng: 40.53 },
  { il: 'Rize', ilce: 'Hemşin', lat: 40.93, lng: 40.69 },
  { il: 'Rize', ilce: 'İkizdere', lat: 40.78, lng: 40.55 },
  { il: 'Rize', ilce: 'İyidere', lat: 41.02, lng: 40.67 },
  { il: 'Rize', ilce: 'Kalkandere', lat: 40.92, lng: 40.37 },
  { il: 'Rize', ilce: 'Pazar', lat: 41.18, lng: 40.88 },
  // Trabzon (çay bölgeleri)
  { il: 'Trabzon', ilce: 'Merkez', lat: 41.00, lng: 39.72 },
  { il: 'Trabzon', ilce: 'Araklı', lat: 40.95, lng: 39.99 },
  { il: 'Trabzon', ilce: 'Of', lat: 40.95, lng: 40.26 },
  { il: 'Trabzon', ilce: 'Sürmene', lat: 40.92, lng: 40.11 },
  // Artvin
  { il: 'Artvin', ilce: 'Merkez', lat: 41.18, lng: 41.82 },
  { il: 'Artvin', ilce: 'Arhavi', lat: 41.36, lng: 41.29 },
  { il: 'Artvin', ilce: 'Borçka', lat: 41.41, lng: 41.69 },
  { il: 'Artvin', ilce: 'Hopa', lat: 41.41, lng: 41.43 },
  // Giresun
  { il: 'Giresun', ilce: 'Merkez', lat: 40.91, lng: 38.39 },
  { il: 'Giresun', ilce: 'Dereli', lat: 40.68, lng: 38.43 },
  { il: 'Giresun', ilce: 'Espiye', lat: 40.94, lng: 38.71 },
  { il: 'Giresun', ilce: 'Tirebolu', lat: 40.98, lng: 38.82 },
]

// Varsayılan konum (cron için)
export const VARSAYILAN_KONUM: KonumBilgisi = {
  il: 'Rize',
  ilce: 'Merkez',
  lat: 41.02,
  lng: 40.52,
}

export function konumBul(il: string, ilce: string): KonumBilgisi {
  const bulunan = ILCE_KOORDINATLARI.find(
    (k) => k.il.toLowerCase() === il.toLowerCase() && k.ilce.toLowerCase() === ilce.toLowerCase()
  )
  return bulunan ?? VARSAYILAN_KONUM
}

export function illerListesi(): string[] {
  return [...new Set(ILCE_KOORDINATLARI.map((k) => k.il))]
}

export function ilceleriGetir(il: string): string[] {
  return ILCE_KOORDINATLARI.filter((k) => k.il.toLowerCase() === il.toLowerCase()).map((k) => k.ilce)
}
