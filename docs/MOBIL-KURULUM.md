# Mobil Uygulama Kurulum Kılavuzu

## Gereksinimler
- iOS: macOS + Xcode 14+ + Apple Developer hesabı ($99/yıl)
- Android: Android Studio + JDK 17

## İlk Kurulum (sadece bir kez)
```bash
npm run build:mobile
npx cap add ios
npx cap add android
npx cap sync
```

## Güncelleme (her değişiklikten sonra)
```bash
npm run cap:sync
```

## iOS Build
```bash
npx cap open ios
```
Xcode'da: Product → Archive → Distribute

## Android Build
```bash
npx cap open android
```
Android Studio'da: Build → Generate Signed Bundle/APK

## Offline Test
1. Chrome DevTools → Network → Offline
2. Hasat girişi yap → "Kuyruğa Eklendi" mesajı gelmeli
3. Network → Online → Otomatik senkron başlamalı

## Deep Link (QR Kod)
QR kod `tarimcrm://hasat-giris?tarla_id=UUID` formatında.
Capacitor App plugin ile yakala:
```typescript
import { App } from '@capacitor/app'

App.addListener('appUrlOpen', ({ url }) => {
  const tarlaId = new URL(url.replace('tarimcrm://', 'https://x.com/')).searchParams.get('tarla_id')
  router.push(`/hasat/mobil-giris?tarla_id=${tarlaId}`)
})
```

## Build Ortamları

| Komut | Output | Kullanım |
|-------|--------|----------|
| `npm run build` | standalone | Hostinger'a deploy |
| `npm run build:mobile` | export | Capacitor native build |
| `npm run cap:sync` | export + cap sync | iOS/Android güncelleme |
| `npm run cap:ios` | export + cap sync + Xcode aç | iOS build |
| `npm run cap:android` | export + cap sync + Android Studio aç | Android build |

## Notlar
- `@capacitor/storage` paketi deprecated, `@capacitor/preferences` kullanmayı düşünün
- Offline kuyruğu localStorage tabanlıdır, uygulama kapatılsa bile korunur
- Referans cache süresi 1 saattir (tarlalar, sürgünler, ekipler, müşteriler)
