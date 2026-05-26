<!--
TarimCRM Modul 21 Spec Dosyasi
========================================
Bu dosya SADECE Modul 21'in spec'idir.
Ana dokumandan (21/21) cikarilmistir.

Bu dosyayi okuyan agent'lar:
- modul-21-mobil.md (gelistirme)
- test-modul-21.md (test)

Diger modulleri referans verirken sadece kisa not dus,
o modulun spec'ini OKUMA.
-->

## Modül 21 - Mobil Uygulama (iOS + Android)

### 21.1 Strateji: Capacitor ile Native Uygulama

Web uygulaması **Capacitor** ile sarmalanarak hem iOS hem Android için native uygulama haline getirilir. Bu yaklaşımın avantajları:

- **Tek kod tabanı:** Next.js web uygulaması + Capacitor = iOS + Android + Web
- **Native erişim:** Kamera, GPS, bildirimler, QR okuyucu, offline storage
- **App Store/Play Store:** Her iki mağazada yayınlanabilir
- **Maliyet:** Ekstra geliştirme maliyeti minimum

### 21.2 Capacitor Entegrasyonları

| Plugin | Kullanım |
|--------|----------|
| `@capacitor/camera` | Fotoğraf çekme (tarla, hasat) |
| `@capacitor/geolocation` | GPS konum alma (tarla koordinatları) |
| `@capacitor/push-notifications` | Push bildirimler |
| `@capacitor/network` | Online/offline durum kontrolü |
| `@capacitor/storage` | Offline veri saklama |
| `@capacitor-community/barcode-scanner` | QR kod okuma |
| `@capacitor/app` | Deep link yönetimi |
| `@capacitor/splash-screen` | Açılış ekranı |
| `@capacitor/status-bar` | Status bar kontrolü |

### 21.3 Offline Destek Stratejisi

Tarlada internet olmayabilir, bu yüzden offline çalışma kritiktir.

**Offline Çalışan Sayfalar:**
- Günlük hasat girişi (en kritik)
- Tarla listesi görüntüleme
- İşçi/Ekip listesi görüntüleme

**Offline Mekanizma:**

```
Online iken:
  → Tüm referans veriler (tarlalar, işçiler, ekipler, müşteriler) 
    cihaz SQLite/IndexedDB'ye cache'lenir

Offline iken:
  → Hasat girişi yapılabilir, yerel SQLite'a kaydedilir
  → Ekranda "Offline - Senkronize edilmedi" uyarısı gösterilir
  → Girilen veriler kuyrukta bekler

Online'a dönünce:
  → Otomatik senkronizasyon başlar
  → Kuyruktaki veriler sunucuya gönderilir
  → Çakışma kontrolü (conflict resolution) yapılır
  → Başarılı senkronizasyon bildirimi gösterilir
```

**Offline Veri Yapısı:**

| Tablo | Offline | Açıklama |
|-------|---------|----------|
| Tarlalar | ✅ Cache | Salt okunur referans |
| İşçiler | ✅ Cache | Salt okunur referans |
| Ekipler | ✅ Cache | Salt okunur referans |
| Müşteriler | ✅ Cache | Salt okunur referans |
| Hasat Girişi | ✅ Yazma | Offline giriş + senkronizasyon |
| Stok Hareketi | ✅ Yazma | Offline giriş + senkronizasyon |
| Finans | ❌ | Sadece online |
| Raporlar | ❌ | Sadece online |

### 21.4 Uygulama Derleme Akışı

```
Next.js Build (Static Export)
  → npx next build && npx next export
  → out/ klasörü oluşur

Capacitor Sync
  → npx cap sync
  → Web dosyaları native projelere kopyalanır

iOS Build
  → npx cap open ios
  → Xcode'da build + archive
  → App Store Connect'e yükleme

Android Build
  → npx cap open android
  → Android Studio'da build
  → Google Play Console'a yükleme (veya APK dağıtım)
```

**Gereksinimler:**
- iOS: Mac + Xcode (Apple Developer Account yıllık $99)
- Android: Android Studio (Google Play Developer hesabı tek seferlik $25)
- Mac yoksa: Android APK'yı doğrudan dağıtabilirsin (sideload)

---

> **Bu doküman, projenin ana referans belgesidir. Geliştirme sürecinde her modül tamamlandıkça "Durum" sütunu güncellenecektir.**
>
> **Son Güncelleme:** 16 Mart 2026
> **Versiyon:** 2.3
> **Değişiklikler v2.3:** Cursor → Claude Code olarak değiştirildi, %100 Türkçe kodlama standardı eklendi (CLAUDE.md bağlam dosyası, isimlendirme kuralları, Prisma schema örnekleri, yorum standartları), tüm geliştirme akışı Claude Code'a göre güncellendi.
> **Değişiklikler v2.2:** Windows PC + Mac M2 çoklu makine geliştirme ortamı rehberi eklendi.
> **Değişiklikler v2.1:** Hosting stratejisi Hostinger (hPanel + Node.js) olarak güncellendi.
> **Değişiklikler v2.0:** Önerilen özellikler tam modül olarak eklendi (14-21), Capacitor ile native iOS + Android mobil uygulama stratejisi eklendi.