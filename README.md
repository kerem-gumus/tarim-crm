# 🌿 TarımCRM — Çay Tarımı Yönetim Sistemi

<div align="center">

![Next.js](https://img.shields.io/badge/Next.js-14-black?style=for-the-badge&logo=next.js)
![Prisma](https://img.shields.io/badge/Prisma-5-blue?style=for-the-badge&logo=prisma)
![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-3ECF8E?style=for-the-badge&logo=supabase)
![Capacitor](https://img.shields.io/badge/Capacitor-8-119EFF?style=for-the-badge&logo=capacitor)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=for-the-badge&logo=typescript)

**Çay tarımı operasyonlarını uçtan uca yöneten, mobil uyumlu modern bir CRM sistemi.**

</div>

---

## 📖 Proje Hakkında

TarımCRM, çay tarımı yapan işletmelerin tüm operasyonlarını tek bir platformdan yönetmesine olanak tanıyan kapsamlı bir ERP/CRM sistemidir. Çiftçi yönetiminden hasat takibine, finansal işlemlerden stok kontrolüne kadar tüm süreçleri dijitalleştirir.

**Kimler için?**
- Çay fabrikaları ve alım kooperatifleri
- Çay bahçesi işleten çiftçiler ve aracılar
- Tarım danışmanlık firmaları

---

## ✨ Özellikler

### 🌱 Hasat Yönetimi
- Hasat dönemleri ve sürgün takibi (1. sürgün, 2. sürgün...)
- Günlük hasat girişleri — tarla bazlı tartım ve satış miktarı
- İşçi ve tarla sahibi bazlı toplanma türü
- Brüt / Net kg fiyatı, kesinti yönetimi (Çay-Kur kesintisi, kooperatif aidatı vb.)
- Kontenjan bazlı satış takibi
- **Eski dönem arşivi** — geçmiş hasat kayıtlarına erişim, sürgün girişleri görüntüleme
- Hasat raporu (tarla bazlı, ekip bazlı, günlük dağılım grafiği)

### 👨‍🌾 Çiftçi & Tarla Yönetimi
- Çiftçi kaydı (TC, Çay-Kur no, iletişim bilgileri)
- Tarla kartı (ada/parsel, dönüm, çay çeşidi, sulama durumu, GPS koordinatı)
- Mülkiyet takibi (kendi mülkü / kiralık — kiracı çiftçi ataması)
- Çiftçi ataması kaldırma (kira bitti, tarla boşaltıldı)
- Tarla bazlı QR kod üretimi ve fotoğraf galerisi

### 👷 İşçilik & Ekip Yönetimi
- İşçi kaydı (TC, IBAN, acil iletişim)
- Ekip oluşturma, üye ekleme/çıkarma
- Aktif / Pasif işçi ve ekip takibi (ayrı sekmelerde)
- İşçilik raporu — ekip bazlı kg ve maliyet, kg başı maliyet analizi

### 🏢 Müşteri & Kontenjan Yönetimi
- Müşteri kaydı (kurumsal / peşinci, devlet alımı takibi)
- Ödeme vadesi ve kontenjan tanımı
- Günlük kontenjan takibi

### 💰 Finans & Muhasebe
- Gelir alacakları (sürgün, müşteri ve ay bazlı gruplama)
- Gider / borç takibi (işçilik, malzeme, yakıt vb. kategorileri)
- Tekli ve **toplu ödeme** alma
- Gerçek ödeme tutarı vs hesaplanan tutar — **fark hesabı** otomasyonu
- Budama ödemeleri ve devlet destekleme takibi
- Ödenenler arşivi, filtreli görünüm

### 🏦 Banka / Kasa Yönetimi
- Birden fazla banka hesabı ve kasa yönetimi
- KMH (Kredili Mevduat Hesabı) limiti ve alarm sistemi
- Tüm hesap hareketleri — tarih, tip ve hesap bazlı filtre
- **Fark hesabı**: küsürat farkları otomatik ayrı hesaba işlenir
- Hesap bakiyesi sıfırlama (karşı hareket ile)
- **Dekont dosyası yükleme** (PDF/JPG/PNG) ve inline görüntüleme
- Sunucu taraflı sayfalama — büyük veri setlerinde performans

### 📦 Malzeme & Ekipman Yönetimi
- Malzeme stok takibi (giriş/çıkış/fire, kritik stok uyarısı)
- Kategori: Gübre, Tarım İlacı, Yağ, Yakıt/Sarf, Yedek Parça, Alet/Makine
- Ekipman kartı (araç, traktör, motorlu alet, sulama ekipmanı)
- **Bakım kaydı** — kullanılan malzemeler stoktan otomatik düşer, banka entegrasyonlu
- Ekipman gider/gelir takibi — banka hesabına otomatik yansıma
- Nakliye geliri: kantar boş/dolu, yük cinsi (Çay, Çay Tozu, Kum, Kereste, Hayvan Gübresi, m³ vb.)
- Otomatik fatura numarası (GEL-2026-00001 formatı) ve **HTML fatura üretimi**
- Üretilen fatura banka hareketlerinde dekont olarak görünür

### 📊 Raporlar & Analiz
- Hasat raporu (dönem, tarih aralığı, ekip filtresi)
- İşçilik raporu (ekip bazlı maliyet, kg başı maliyet analizi)
- Finans raporu (gelir/gider dağılımı, aylık trend grafikleri)
- Envanter raporu (kritik stoklar, kategori bazlı harcama)
- Araç raporu (gider/gelir/net kâr, yakıt tüketimi)
- Sezon karşılaştırma (yıllar arası hasat ve gelir analizi)

### 🤖 AI Asistan
- Claude API entegrasyonlu doğal dil sorgulama
- "Bu ay kaç kg çay toplandı?", "En yüksek verimli tarla hangisi?" gibi sorular

### 📍 Diğer Özellikler
- **Tarla haritası** (Leaflet.js — GPS koordinatı bazlı görselleştirme)
- Hava durumu takibi
- Çay kalite kontrolü (nem, yaprak kalitesi)
- QR kod üretimi (tarla bazlı)
- Fotoğraf galerisi (tarla fotoğrafları)
- Aktivite logu (tüm işlemler izlenir, kim ne zaman yaptı)
- Kullanıcı yönetimi ve **rol bazlı yetki** (admin, muhasebeci, tarımcı, izleyici)
- Veri yedekleme ve dışa aktarma (CSV/JSON)
- Bildirim sistemi
- **Offline mod** — İnternet kesilince işlemler kuyruğa alınır, bağlantı gelince otomatik senkron

---

## 🛠 Teknoloji Yığını

| Katman | Teknoloji |
|--------|-----------|
| **Frontend** | Next.js 14 (App Router), React 18, TypeScript |
| **Stil** | Tailwind CSS v3, Recharts (grafikler) |
| **Backend** | Next.js API Routes (sunucu taraflı rendering) |
| **ORM** | Prisma 5 |
| **Veritabanı** | PostgreSQL (Supabase) |
| **Auth** | Supabase Auth (SSR cookie tabanlı) |
| **Mobil** | Capacitor 8 (Android & iOS) |
| **Harita** | React Leaflet |
| **Dosya Yükleme** | Next.js FormData API (sunucuya kayıt) |
| **QR Kod** | qrcode paketi |
| **AI** | Anthropic Claude API |

---

## 🚀 Kurulum

### Gereksinimler

- Node.js 20+
- npm 10+
- PostgreSQL (Supabase hesabı önerilir)

### 1. Repoyu klonla ve bağımlılıkları kur

```bash
git clone https://github.com/kerem-gumus/tarim-crm.git
cd tarim-crm
npm ci
```

### 2. Ortam değişkenlerini tanımla

Projenin kök dizininde `.env` dosyası oluştur:

```env
# Supabase PostgreSQL (pgBouncer üzerinden)
DATABASE_URL="postgresql://postgres:[sifre]@[host]:6543/postgres?pgbouncer=true"

# Supabase PostgreSQL (doğrudan bağlantı — migration için)
DIRECT_URL="postgresql://postgres:[sifre]@[host]:5432/postgres"

# Supabase Public Keys
NEXT_PUBLIC_SUPABASE_URL="https://[proje-id].supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="[anon-key]"

# AI Asistan (opsiyonel)
ANTHROPIC_API_KEY="sk-ant-..."
```

### 3. Veritabanı şemasını oluştur

```bash
npx prisma db push
npx prisma generate
```

### 4. Geliştirme sunucusunu başlat

```bash
npm run dev
# Tarayıcıda: http://localhost:3000
```

### 5. İlk kullanıcıyı oluştur

Supabase Dashboard → Authentication → Users → **"Invite User"** ile ilk admin kullanıcısını ekle.

---

## 📱 Mobil Uygulama (Android & iOS)

TarımCRM, Capacitor kullanarak native Android ve iOS uygulamasına dönüştürülebilir. **Server URL modu** ile çalışır — production sunucusunu native WebView içinde açar. SSR, auth cookie'ler ve tüm API route'lar tam çalışır.

### Android

**Gereksinimler:** Android Studio, Java 17+

```bash
# İlk kurulum (bir kez çalıştır)
npx cap add android

# Development — local sunucuya bağlı
npm run dev                                                           # Terminal 1
CAPACITOR_SERVER_URL=http://10.0.2.2:3000 npx cap sync               # Terminal 2
npx cap open android                                                   # Android Studio aç

# Production build — canlı sunucuya bağlı
CAPACITOR_SERVER_URL=https://sizin-adresiniz.com npx cap sync
npx cap open android
```

Android Studio'da **▶ Run** ile cihaz veya emülatöre yükle.
APK için: `Build → Build Bundle(s) / APK(s) → Build APK(s)`

### iOS

**Gereksinimler:** macOS + Xcode + CocoaPods

```bash
sudo gem install cocoapods

# İlk kurulum (bir kez)
npx cap add ios

# Development
npm run dev                                                           # Terminal 1
CAPACITOR_SERVER_URL=http://localhost:3000 npx cap sync              # Terminal 2
npx cap open ios                                                      # Xcode aç
```

Xcode'da hedef cihazı seç ve **▶ Run** ile yükle.

### Offline Senkron

İnternet bağlantısı kesildiğinde yapılan işlemler `localStorage` kuyruğuna alınır. Bağlantı gelince `useOfflineSenkron` hook'u otomatik senkron eder:

| İşlem tipi | Endpoint |
|-----------|----------|
| Hasat girişi | `POST /api/hasat-girisleri` |
| Stok hareketi | `POST /api/stok-hareketleri` |
| Ekipman gideri | `POST /api/ekipmanlar/[id]/giderler` |
| Ekipman geliri | `POST /api/ekipmanlar/[id]/gelirler` |
| Ödeme kaydı | `POST /api/odeme-kayitlari` |

---

## 📁 Proje Yapısı

```
tarim-crm/
├── src/
│   ├── app/
│   │   ├── (dashboard)/          # Korumalı sayfalar (auth gerekli)
│   │   │   ├── dashboard/        # Ana panel
│   │   │   ├── hasat/            # Hasat yönetimi
│   │   │   ├── finans/           # Finans & ödemeler
│   │   │   ├── banka-kasa/       # Banka hesapları & hareketler
│   │   │   ├── envanter/         # Malzeme & ekipman
│   │   │   ├── ciftciler/        # Çiftçi yönetimi
│   │   │   ├── tarlalar/         # Tarla yönetimi
│   │   │   ├── isciler/          # İşçi yönetimi
│   │   │   ├── ekipler/          # Ekip yönetimi
│   │   │   ├── musteriler/       # Müşteri yönetimi
│   │   │   ├── kontenjan/        # Kontenjan takibi
│   │   │   ├── raporlar/         # Raporlar & analizler
│   │   │   ├── asistan/          # AI asistan
│   │   │   ├── harita/           # Tarla haritası
│   │   │   └── ...
│   │   ├── api/                  # API route'ları
│   │   │   ├── hasat-donemleri/
│   │   │   ├── hasat-girisleri/
│   │   │   ├── banka-hesaplari/
│   │   │   ├── banka-hareketleri/
│   │   │   ├── gelir-kayitlari/
│   │   │   ├── odeme-kayitlari/
│   │   │   ├── ekipmanlar/
│   │   │   ├── malzemeler/
│   │   │   ├── raporlar/
│   │   │   ├── dashboard/
│   │   │   └── ...
│   │   └── login/
│   ├── components/
│   │   ├── layout/               # Kenarlik, UstBar, MobilAltNav, MobilMenuCekmece
│   │   ├── hasat/                # Hasat formları ve modalleri
│   │   ├── finans/               # Ödeme modalleri
│   │   ├── envanter/             # Malzeme ve ekipman formları
│   │   ├── mobil/                # Offline bar, kamera hook
│   │   └── ...
│   ├── hooks/
│   │   ├── useOfflineSenkron.ts  # Offline kuyruk ve senkron
│   │   ├── useKullanici.ts       # Mevcut kullanıcı
│   │   └── useMobilKamera.ts     # Capacitor kamera
│   └── lib/
│       ├── db.ts                 # Prisma client singleton
│       ├── supabase.ts           # Supabase client (client-side)
│       ├── supabase-server.ts    # Supabase client (server-side)
│       └── aktiviteLog.ts        # İşlem loglama
├── prisma/
│   └── schema.prisma             # Veritabanı şeması
├── android/                      # Android native proje (Capacitor)
├── public/
│   └── uploads/                  # Yüklenen dosyalar (dekont, fatura, foto)
├── scripts/
│   └── icon-olustur.mjs          # Uygulama ikonu üretici
└── capacitor.config.ts           # Mobil uygulama yapılandırması
```

---

## 🗄 Temel Veritabanı Modelleri

| Model | Açıklama |
|-------|----------|
| `HasatDonemi` | Hasat sezonu (yıl, brüt/net fiyat, kesintiler, destekleme) |
| `Surgun` | Sürgün dönemi (1., 2. sürgün, toplam hasat kg) |
| `HasatGirisi` | Günlük hasat kaydı (tarla, ekip, müşteri, tartım) |
| `Ciftci` | Çiftçi (TC, Çay-Kur no) |
| `Tarla` | Tarla kartı (ada/parsel, GPS koordinatı, mülkiyet) |
| `Isci` | İşçi (TC, IBAN) |
| `IsciEkibi` | Ekip ve üyeleri |
| `Musteri` | Müşteri (kurumsal/peşinci, kontenjan, vade) |
| `Kontenjan` | Günlük kontenjan sözleşmesi |
| `GelirKaydi` | Alacak/gelir (müşteri, sürgün, ay bazlı) |
| `OdemeKaydi` | Borç/gider (kategori bazlı) |
| `BankaHesabi` | Banka/kasa hesabı (KMH limiti dahil) |
| `BankaHareketi` | Hesap hareketi (dekont URL dahil) |
| `Malzeme` | Stok kalemi (kategori, birim, min stok) |
| `StokHareketi` | Stok giriş/çıkış/fire kaydı |
| `Ekipman` | Araç/ekipman (plaka, km, bakım tarihi) |
| `EkipmanGider` | Ekipman gider (banka + kullanılan malzeme) |
| `EkipmanGelir` | Ekipman gelir (fatura URL, nakliye detayı) |
| `BudamaBilgisi` | Budama alacak hesabı |
| `BudamaOdeme` | Budama ödeme kaydı |

---

## 🔐 Kullanıcı Rolleri

| Rol | Açıklama |
|-----|----------|
| `admin` | Tüm modüller + kullanıcı yönetimi + sistem ayarları |
| `muhasebeci` | Finans, banka/kasa, raporlar |
| `tarımcı` | Hasat, çiftçi, tarla, envanter |
| `izleyici` | Sadece okuma yetkisi |

---

## 📋 Yararlı Komutlar

```bash
# Geliştirme
npm run dev              # Geliştirme sunucusu → localhost:3000
npm run build            # Production build
npm run typecheck        # TypeScript tip kontrolü
npm run lint             # ESLint kontrolü

# Veritabanı
npx prisma studio        # Görsel veritabanı editörü (localhost:5555)
npx prisma db push       # Schema değişikliklerini DB'ye uygula
npx prisma generate      # Prisma Client'ı yenile

# Mobil
npx cap sync android     # Android'e web varlıklarını kopyala
npx cap sync ios         # iOS'a web varlıklarını kopyala
npx cap open android     # Android Studio'yu aç
npx cap open ios         # Xcode'u aç

# Simge
node scripts/icon-olustur.mjs   # SVG uygulama simgesi üret
```

---

## 📄 Lisans

Özel proje — Tüm hakları saklıdır © 2026

---

<div align="center">
  <strong>🌿 TarımCRM</strong> — Çay tarımını dijitalleştiriyoruz<br/>
  <sub>Next.js 14 · Prisma · Supabase · Capacitor · Tailwind CSS</sub>
</div>
