# 🌿 TarımCRM - Çay Tarımı Yönetim Sistemi

## Proje Tanımı

**TarımCRM**, çay tarımı yapan çiftçilerin hasat yönetimi, işçilik takibi, finansal kontrol, müşteri ilişkileri, envanter yönetimi ve tarla bazlı verimlilik analizlerini tek bir platformda yönetmesini sağlayan kapsamlı bir tarım yönetim sistemidir.

---

## İçindekiler

1. [Modüller ve Özellikler](#modüller-ve-özellikler)
2. [Modül 1 - Hasat Yönetimi](#modül-1---hasat-yönetimi)
3. [Modül 2 - İşçilik ve Ekip Yönetimi](#modül-2---işçilik-ve-ekip-yönetimi)
4. [Modül 3 - Tarla Yönetimi](#modül-3---tarla-yönetimi)
5. [Modül 4 - Çiftçi Yönetimi](#modül-4---çiftçi-yönetimi)
6. [Modül 5 - Müşteri Yönetimi](#modül-5---müşteri-yönetimi)
7. [Modül 6 - Kontenjan ve Satış Sistemi](#modül-6---kontenjan-ve-satış-sistemi)
8. [Modül 7 - Finans ve Ödeme Yönetimi](#modül-7---finans-ve-ödeme-yönetimi)
9. [Modül 8 - Malzeme ve Envanter Yönetimi](#modül-8---malzeme-ve-envanter-yönetimi)
10. [Modül 9 - Akıllı Asistan (AI)](#modül-9---akıllı-asistan-ai)
11. [Modül 10 - Raporlama ve Dashboard](#modül-10---raporlama-ve-dashboard)
12. [Modül 11 - Hava Durumu Entegrasyonu](#modül-11---hava-durumu-entegrasyonu)
13. [Modül 12 - Bildirim ve Uyarı Sistemi](#modül-12---bildirim-ve-uyarı-sistemi)
14. [Modül 13 - Kullanıcı ve Yetkilendirme](#modül-13---kullanıcı-ve-yetkilendirme)
15. [Modül 14 - Aktivite Logu / Denetim İzi](#modül-14---aktivite-logu--denetim-izi)
16. [Modül 15 - Tarla Harita Görünümü](#modül-15---tarla-harita-görünümü)
17. [Modül 16 - Fotoğraf Yönetimi](#modül-16---fotoğraf-yönetimi)
18. [Modül 17 - Sezonluk Karşılaştırma](#modül-17---sezonluk-karşılaştırma)
19. [Modül 18 - Veri Yedekleme ve Dışa Aktarma](#modül-18---veri-yedekleme-ve-dışa-aktarma)
20. [Modül 19 - Çay Kalite Takibi](#modül-19---çay-kalite-takibi)
21. [Modül 20 - QR Kod ile Hızlı Tarla Seçimi](#modül-20---qr-kod-ile-hızlı-tarla-seçimi)
22. [Modül 21 - Mobil Uygulama (iOS + Android)](#modül-21---mobil-uygulama-ios--android)
23. [Veritabanı Şeması](#veritabanı-şeması)
24. [Sayfa Yapıları ve UI Akışları](#sayfa-yapıları-ve-ui-akışları)
25. [Teknik Altyapı](#teknik-altyapı)
26. [Geliştirme Ortamı Kurulumu](#geliştirme-ortamı-kurulumu)
27. [Hosting ve Deployment Stratejisi](#hosting-ve-deployment-stratejisi)
28. [Geliştirme Fazları](#geliştirme-fazları)

---

## Modüller ve Özellikler

| # | Modül | Öncelik | Durum |
|---|-------|---------|-------|
| 1 | Hasat Yönetimi | 🔴 Kritik | ✅ Tamamlandı |
| 2 | İşçilik ve Ekip Yönetimi | 🔴 Kritik | ✅ Tamamlandı |
| 3 | Tarla Yönetimi | 🔴 Kritik | ✅ Tamamlandı |
| 4 | Çiftçi Yönetimi | 🔴 Kritik | ✅ Tamamlandı |
| 5 | Müşteri Yönetimi | 🔴 Kritik | ✅ Tamamlandı |
| 6 | Kontenjan ve Satış Sistemi | 🔴 Kritik | ✅ Tamamlandı |
| 7 | Finans ve Ödeme Yönetimi | 🔴 Kritik | ✅ Tamamlandı |
| 8 | Malzeme ve Envanter Yönetimi | 🟡 Orta | ✅ Tamamlandı |
| 9 | Akıllı Asistan (AI) | 🟢 Düşük | ⬜ Bekliyor |
| 10 | Raporlama ve Dashboard | 🟡 Orta | ⬜ Bekliyor |
| 11 | Hava Durumu Entegrasyonu | 🟢 Düşük | ⬜ Bekliyor |
| 12 | Bildirim ve Uyarı Sistemi | 🟡 Orta | ⬜ Bekliyor |
| 13 | Kullanıcı ve Yetkilendirme | 🔴 Kritik | ⬜ Bekliyor |
| 14 | Aktivite Logu / Denetim İzi | 🟡 Orta | ⬜ Bekliyor |
| 15 | Tarla Harita Görünümü | 🟢 Düşük | ⬜ Bekliyor |
| 16 | Fotoğraf Yönetimi | 🟡 Orta | ✅ Tamamlandı |
| 17 | Sezonluk Karşılaştırma | 🟡 Orta | ⬜ Bekliyor |
| 18 | Veri Yedekleme ve Dışa Aktarma | 🔴 Kritik | ⬜ Bekliyor |
| 19 | Çay Kalite Takibi | 🟢 Düşük | ⬜ Bekliyor |
| 20 | QR Kod ile Hızlı Tarla Seçimi | 🟢 Düşük | ⬜ Bekliyor |
| 21 | Mobil Uygulama (iOS + Android) | 🔴 Kritik | ⬜ Bekliyor |

---

## Modül 1 - Hasat Yönetimi

### 1.1 Hasat Dönemi Yönetimi

Hasat dönemi, çay toplama sezonunun tamamını kapsayan ana birimdir.

**Hasat Dönemi Alanları:**

| Alan | Tip | Açıklama |
|------|-----|----------|
| `id` | UUID | Benzersiz kimlik |
| `donem_adi` | String | Örn: "2026 Hasat Dönemi" |
| `yil` | Integer | 2026 |
| `baslangic_tarihi` | Date | Dönem başlangıcı |
| `bitis_tarihi` | Date | Dönem bitişi (kapatılınca set edilir) |
| `durum` | Enum | `aktif`, `kapali` |
| `olusturma_tarihi` | DateTime | Kayıt tarihi |

**İş Kuralları:**
- Aynı anda sadece 1 hasat dönemi aktif olabilir.
- Hasat dönemi kapatılmadan yeni dönem açılamaz.
- Dönem kapatılınca tüm sürgünler otomatik kapanır.

### 1.2 Sürgün Yönetimi

Her hasat dönemi altında sürgünler (1. sürgün, 2. sürgün, 3. sürgün vb.) yer alır.

**Sürgün Alanları:**

| Alan | Tip | Açıklama |
|------|-----|----------|
| `id` | UUID | Benzersiz kimlik |
| `hasat_donemi_id` | FK | Bağlı hasat dönemi |
| `surgun_no` | Integer | 1, 2, 3... |
| `surgun_adi` | String | "1. Sürgün" |
| `baslangic_tarihi` | Date | Sürgün başlangıcı |
| `bitis_tarihi` | Date | Sürgün bitişi |
| `durum` | Enum | `aktif`, `kapali` |
| `toplam_hasat_kg` | Decimal | Otomatik hesaplanan toplam |
| `toplam_tutar` | Decimal | Otomatik hesaplanan gelir |

**İş Kuralları:**
- Sürgün kapatıldığında `toplam_tutar` → Finans modülüne "Ödeme Bekleniyor" olarak düşer.
- Bir sürgün kapatılmadan bir sonraki sürgün açılamaz.
- Sürgün sıralaması otomatik artan şekilde atanır.

### 1.3 Günlük Çay Hasadı Giriş Ekranı

Bu ekran, günlük olarak toplanan çayların sisteme girildiği ana ekrandır.

**Hasat Girişi Alanları:**

| Alan | Tip | Açıklama |
|------|-----|----------|
| `id` | UUID | Benzersiz kimlik |
| `surgun_id` | FK | Aktif sürgün |
| `tarih` | Date | Hasat tarihi |
| `tarla_id` | FK | Hangi tarlada toplandı |
| `tartim_miktari_kg` | Decimal | Tartılan toplam kg |
| `satis_miktari_kg` | Decimal | Kontenjan dahil satış kg |
| `toplanma_turu` | Enum | `tarla_sahibi`, `isci` |
| `isci_ekip_id` | FK (nullable) | İşçi ekibi (sadece tür=işçi ise) |
| `odeme_turu` | Enum (nullable) | `yevmiye`, `ton_isi` (sadece tür=işçi ise) |
| `ton_fiyati` | Decimal (nullable) | Ton başı fiyat (ton_isi ise) |
| `yevmiye_fiyati` | Decimal (nullable) | Günlük yevmiye (yevmiye ise) |
| `iscilik_toplam_tutar` | Decimal (nullable) | Otomatik hesaplanan işçilik maliyeti |
| `musteri_id` | FK | Çayı alan müşteri |
| `kontenjan_durumu` | Object | Kontenjan hesaplama detayları |
| `notlar` | Text | Ek notlar |

**Ekran Akışı (Koşullu Alanlar):**

```
1. Tarih seç (varsayılan: bugün)
2. Tarla seç (dropdown - kayıtlı tarlalar)
3. Tartım miktarı gir (kg)
4. Toplanma türü seç:
   ├── "Tarla Sahibi (Çiftçi)" → İşçilik alanları GİZLENİR
   │   └── Devam → Müşteri seçimi
   └── "İşçi" → İşçilik alanları AÇILIR
       ├── İşçi ekibi seç (dropdown)
       ├── Ödeme türü seç:
       │   ├── "Yevmiye" → Yevmiye fiyatı gir
       │   │   └── İşçilik Tutarı = yevmiye_fiyati × ekipteki_isci_sayisi
       │   └── "Ton İşi" → Ton fiyatı gir
       │       └── İşçilik Tutarı = (tartim_miktari_kg / 1000) × ton_fiyati
       └── Devam → Müşteri seçimi
5. Müşteri seç
6. Kontenjan hesaplama (müşteri devletse otomatik)
7. Satış miktarı belirleme (kontenjan dahil)
8. Kaydet
```

**İşçilik Hesaplama Formülleri:**

```
Ton İşi:
  işçilik_tutarı = (tartım_miktarı_kg / 1000) × ton_fiyatı

Yevmiye:
  işçilik_tutarı = yevmiye_fiyatı × ekipteki_işçi_sayısı
  (veya sabit yevmiye_fiyatı eğer ekip bazlı tek yevmiye ise)
```

> **NOT:** İşçilik tutarı hesaplandıktan sonra otomatik olarak Ödemeler tablosuna işçi ekibi adıyla borç kaydı düşer.

---

## Modül 2 - İşçilik ve Ekip Yönetimi

### 2.1 İşçi Kayıt

**İşçi Alanları:**

| Alan | Tip | Açıklama |
|------|-----|----------|
| `id` | UUID | Benzersiz kimlik |
| `ad_soyad` | String | İşçi adı soyadı |
| `tc_no` | String (nullable) | TC kimlik no |
| `telefon` | String | İletişim |
| `adres` | Text | Adres |
| `banka_iban` | String (nullable) | Ödeme için IBAN |
| `acil_iletisim` | String (nullable) | Acil durum kişisi |
| `notlar` | Text | Ek notlar |
| `durum` | Enum | `aktif`, `pasif` |
| `kayit_tarihi` | DateTime | Sisteme eklenme |

### 2.2 İşçi Ekipleri

**Ekip Alanları:**

| Alan | Tip | Açıklama |
|------|-----|----------|
| `id` | UUID | Benzersiz kimlik |
| `ekip_adi` | String | Örn: "Ali Usta Ekibi" |
| `ekip_basi_id` | FK (nullable) | Ekip başı olan işçi |
| `durum` | Enum | `aktif`, `pasif` |

**Ekip-İşçi İlişkisi (Many-to-Many):**

| Alan | Tip | Açıklama |
|------|-----|----------|
| `ekip_id` | FK | Ekip |
| `isci_id` | FK | İşçi |
| `katilma_tarihi` | Date | Ekibe dahil olma |
| `ayrilma_tarihi` | Date (nullable) | Ekipten ayrılma |

**İş Kuralları:**
- Bir işçi aynı anda birden fazla ekipte olabilir (farklı günlerde farklı ekiplerle çalışabilir).
- Ekip oluşturulurken mevcut kayıtlı işçilerden seçim yapılır.
- Ekip başı atanabilir (opsiyonel).

---

## Modül 3 - Tarla Yönetimi

### 3.1 Tarla Kayıt

**Tarla Alanları:**

| Alan | Tip | Açıklama |
|------|-----|----------|
| `id` | UUID | Benzersiz kimlik |
| `tarla_adi` | String | Örn: "Yukarı Tarla", "Dere Kenarı" |
| `konum_il` | String | İl |
| `konum_ilce` | String | İlçe |
| `konum_koy` | String | Köy/Mahalle |
| `ada_no` | String (nullable) | Kadastro ada no |
| `parsel_no` | String (nullable) | Kadastro parsel no |
| `donum` | Decimal | Tarla büyüklüğü (dönüm) |
| `metrekare` | Decimal (nullable) | m² cinsinden alan |
| `rakım` | Integer (nullable) | Metre cinsinden rakım |
| `cay_cesidi` | String (nullable) | Yetiştirilen çay çeşidi |
| `dikim_yili` | Integer (nullable) | Çay fidanı dikim yılı |
| `toprak_tipi` | String (nullable) | Toprak analiz bilgisi |
| `sulama_durumu` | Enum | `dogal`, `sulamali`, `karma` |
| `ciftci_id` | FK | Atanmış çiftçi |
| `koordinat_lat` | Decimal (nullable) | GPS enlem |
| `koordinat_lng` | Decimal (nullable) | GPS boylam |
| `durum` | Enum | `aktif`, `pasif` |
| `notlar` | Text | Ek notlar |

**İş Kuralları:**
- Her tarlaya bir çiftçi atanmalıdır.
- Tarla dönümü, verimlilik hesaplamaları için kullanılır.
- GPS koordinatları harita görünümü için opsiyonel.
- Ada/parsel no resmi kayıtlarla eşleştirme için kullanılır.

### 3.2 Tarla Bazlı Verimlilik Takibi

Sistem, tarla bazında sürgün bazlı verimlilik otomatik hesaplar:

```
Verimlilik (kg/dönüm) = Toplam Hasat (kg) / Tarla Dönümü

Sürgün Karşılaştırma:
  1. Sürgün: Tarla A → 450 kg/dönüm
  2. Sürgün: Tarla A → 380 kg/dönüm  (▼ %15.5 düşüş)
  3. Sürgün: Tarla A → 420 kg/dönüm  (▲ %10.5 artış)
```

---

## Modül 4 - Çiftçi Yönetimi

### 4.1 Çiftçi Kayıt

**Çiftçi Alanları:**

| Alan | Tip | Açıklama |
|------|-----|----------|
| `id` | UUID | Benzersiz kimlik |
| `ad_soyad` | String | Çiftçi adı soyadı |
| `tc_no` | String | TC kimlik no |
| `telefon` | String | İletişim |
| `telefon_2` | String (nullable) | Alternatif telefon |
| `adres` | Text | Adres |
| `il` | String | İl |
| `ilce` | String | İlçe |
| `koy` | String | Köy/Mahalle |
| `cay_kuru_no` | String (nullable) | Çay-Kur kayıt numarası |
| `banka_iban` | String (nullable) | IBAN |
| `vergi_no` | String (nullable) | Vergi numarası |
| `durum` | Enum | `aktif`, `pasif` |
| `notlar` | Text | Ek notlar |
| `kayit_tarihi` | DateTime | Kayıt tarihi |

**İş Kuralları:**
- Bir çiftçinin birden fazla tarlası olabilir.
- Çiftçi aynı zamanda tarla sahibi olarak hasat girişinde seçilebilir.
- Çay-Kur numarası kontenjan takibi için önemlidir.

---

## Modül 5 - Müşteri Yönetimi

### 5.1 Müşteri Kayıt

**Müşteri Alanları:**

| Alan | Tip | Açıklama |
|------|-----|----------|
| `id` | UUID | Benzersiz kimlik |
| `musteri_adi` | String | Kişi veya kurum adı |
| `musteri_tipi` | Enum | `kurumsal`, `pesincu` |
| `kurumsal_mi` | Boolean | Kurumsal mı? |
| `devlet_mi` | Boolean | Devlet kurumu mu? (Çay-Kur gibi) |
| `kurum_adi` | String (nullable) | Kurum adı |
| `yetkili_kisi` | String (nullable) | İletişim kişisi |
| `telefon` | String | Telefon |
| `email` | String (nullable) | E-posta |
| `adres` | Text | Adres |
| `vergi_dairesi` | String (nullable) | Vergi dairesi |
| `vergi_no` | String (nullable) | Vergi no |
| `odeme_vade_gun` | Integer | Varsayılan ödeme vadesi (gün) |
| `kontenjan_var_mi` | Boolean | Kontenjan uygulanıyor mu? |
| `durum` | Enum | `aktif`, `pasif` |
| `notlar` | Text | Ek notlar |

**Müşteri Tipleri:**

```
Müşteri Tipi Seçimi:
├── "Kurumsal"
│   ├── Devlet Kurumu mu? 
│   │   ├── Evet → Kontenjan sistemi aktif (Çay-Kur vb.)
│   │   └── Hayır → Normal kurumsal (özel fabrikalar)
│   └── Vade süresi belirlenir
└── "Peşinci" (Perakende Alıcı)
    └── Genelde peşin ödeme, vade opsiyonel
```

**İş Kuralları:**
- `devlet_mi = true` olan müşteriler kontenjan sistemini tetikler.
- Peşinci müşteriler peşin ödeme yapar, vade genelde 0.
- Kurumsal müşterilere vade süresi tanımlanabilir.

---

## Modül 6 - Kontenjan ve Satış Sistemi

### 6.1 Kontenjan Tanımı

Devlet (Çay-Kur) belirli tarihlerde kontenjan açar. Kontenjan, günlük olarak ne kadar yaş çay satılabileceğini belirler.

**Kontenjan Alanları:**

| Alan | Tip | Açıklama |
|------|-----|----------|
| `id` | UUID | Benzersiz kimlik |
| `surgun_id` | FK | Bağlı sürgün |
| `musteri_id` | FK | Devlet müşterisi |
| `baslangic_tarihi` | Date | Kontenjan başlangıcı |
| `bitis_tarihi` | Date (nullable) | Kontenjan bitişi |
| `gunluk_kontenjan_kg` | Decimal | Günlük satılabilecek kg |
| `durum` | Enum | `aktif`, `kapali` |

### 6.2 Günlük Kontenjan Hesaplama Mantığı

Bu sistemin en kritik iş kurallarından biridir.

**Temel Kavramlar:**
- `tartim_miktari`: Tarladan tartılan gerçek çay miktarı (kg)
- `gunluk_kontenjan`: Devletin o gün için belirlediği satılabilecek kg
- `satis_miktari`: Müşteriye fiilen satılan miktar (kg)
- `fark`: tartım ile satış arasındaki fark

**Senaryo 1: Tartım < Kontenjan (Borç Oluşur)**

```
Gün 1:
  Tartım: 500 kg
  Kontenjan: 650 kg
  Satış: Alıcı 650kg olarak işlerse → 650 kg
  Borç (bize): 650 - 500 = 150 kg
  → 150 kg sonraki güne EKSİ bakiye olarak taşınır

Gün 2:
  Tartım: 700 kg
  Kontenjan: 850 kg
  Önceki gün borç: -150 kg (biz borçluyuz)
  Gerçek satış kapasitesi: 850 + 150 = 1000 kg
  → Satış miktarı: 1000 kg olarak hesaplanır
```

**Senaryo 2: Tartım > Kontenjan (Fazla Oluşur)**

```
Gün 1:
  Tartım: 500 kg
  Kontenjan: 450 kg
  Satış: 450 kg (kontenjana göre)
  Fazla: 500 - 450 = 50 kg
  → 50 kg alıcı fazladan aldı, ARTI bakiye olarak taşınır

Gün 2:
  Tartım: 400 kg
  Kontenjan: 450 kg
  Önceki gün fazla: +50 kg (alıcıda fazla var)
  Gerçek satış miktarı: 450 - 50 = 400 kg
  → Satış miktarı: 400 kg olarak yansır
```

**Kontenjan Takip Tablosu:**

| Alan | Tip | Açıklama |
|------|-----|----------|
| `id` | UUID | Benzersiz kimlik |
| `kontenjan_id` | FK | Bağlı kontenjan tanımı |
| `tarih` | Date | İşlem tarihi |
| `tartim_kg` | Decimal | O günkü tartım |
| `gunluk_kontenjan_kg` | Decimal | O günkü kontenjan |
| `onceki_bakiye_kg` | Decimal | Önceki günden devir (+/-) |
| `hesaplanan_satis_kg` | Decimal | Hesaplanan satış miktarı |
| `kalan_bakiye_kg` | Decimal | Sonraki güne devir |

**Hesaplama Formülü:**

```
hesaplanan_satis = gunluk_kontenjan + onceki_bakiye (negatifse ekler, pozitifse çıkarır)
kalan_bakiye = tartim - hesaplanan_satis

Eğer kalan_bakiye > 0 → Alıcıda fazla var (sonraki günden düşülür)
Eğer kalan_bakiye < 0 → Biz borçluyuz (sonraki güne eklenir)
Eğer kalan_bakiye = 0 → Dengede
```

---

## Modül 7 - Finans ve Ödeme Yönetimi

### 7.1 Gelir Takibi

**Gelir Kayıtları:**

| Alan | Tip | Açıklama |
|------|-----|----------|
| `id` | UUID | Benzersiz kimlik |
| `surgun_id` | FK | Bağlı sürgün |
| `musteri_id` | FK | Müşteri |
| `toplam_kg` | Decimal | Sürgün toplam satış |
| `birim_fiyat` | Decimal | kg başı fiyat |
| `toplam_tutar` | Decimal | Toplam gelir |
| `odeme_durumu` | Enum | `odeme_bekleniyor`, `kismi_odendi`, `odendi` |
| `odenen_tutar` | Decimal | Şu ana kadar ödenen |
| `kalan_tutar` | Decimal | Kalan alacak |
| `vade_tarihi` | Date (nullable) | Ödeme vadesi |
| `olusturma_tarihi` | DateTime | Kayıt tarihi |

**İş Kuralları:**
- Sürgün kapatıldığında otomatik olarak gelir kaydı oluşur.
- Durum: "Ödeme Bekleniyor" olarak finans sayfasına düşer.
- Müşteriden kısmi ödemeler alındıkça güncellenir.

### 7.2 Borç/Gider Takibi (Ödemeler Tablosu)

**Ödeme Kayıtları:**

| Alan | Tip | Açıklama |
|------|-----|----------|
| `id` | UUID | Benzersiz kimlik |
| `kategori` | Enum | `iscilik`, `malzeme`, `yakit`, `gubre`, `diger` |
| `aciklama` | String | Açıklama metni |
| `ilgili_ekip_id` | FK (nullable) | İşçi ekibi (işçilik ise) |
| `ilgili_isci_id` | FK (nullable) | Bireysel işçi |
| `hasat_giris_id` | FK (nullable) | Bağlı hasat girişi |
| `tutar` | Decimal | Borç tutarı |
| `odeme_durumu` | Enum | `odenmedi`, `kismi_odendi`, `odendi` |
| `odenen_tutar` | Decimal | Şu ana kadar ödenen |
| `odeme_tarihi` | Date (nullable) | Ödeme yapıldığında |
| `odeme_yontemi` | Enum (nullable) | `nakit`, `banka`, `eft` |
| `olusturma_tarihi` | DateTime | Kayıt tarihi |

**İş Kuralları:**
- Hasat girişinde işçilik seçildiğinde → otomatik borç kaydı oluşur.
- Borç kaydında işçi ekibinin adı görünür.
- Malzeme alımlarında → otomatik gider kaydı oluşur.
- Ödeme yapıldığında borç kaydı güncellenir.

### 7.3 Finans Dashboard Görünümü

```
┌─────────────────────────────────────────────┐
│              FİNANS ÖZETİ                   │
├──────────────────┬──────────────────────────┤
│  ALACAKLAR       │  BORÇLAR                 │
│  ─────────       │  ───────                 │
│  Ödeme Bekleniyor│  İşçilik Borçları        │
│  Kısmi Ödenenler │  Malzeme Borçları        │
│  Toplam Alacak   │  Diğer Giderler          │
│                  │  Toplam Borç             │
├──────────────────┴──────────────────────────┤
│  NET DURUM = Toplam Alacak - Toplam Borç    │
├─────────────────────────────────────────────┤
│  SON İŞLEMLER (timeline)                    │
│  SON ÖDEMELER                               │
└─────────────────────────────────────────────┘
```

---

## Modül 8 - Malzeme ve Envanter Yönetimi

### 8.1 Malzeme Kategorileri

```
Malzeme Kategorileri:
├── Gübreler
│   ├── Kimyasal Gübre
│   ├── Organik Gübre
│   ├── Yaprak Gübresi
│   └── Diğer Gübre
├── Tarım İlaçları
│   ├── Herbisit (Yabancı Ot)
│   ├── Fungisit (Mantar)
│   ├── İnsektisit (Böcek)
│   └── Diğer İlaç
├── Tarım Aletleri ve Makineler
│   ├── Çay Toplama Makinesi
│   ├── Motorlu Testere
│   ├── Sırt Tırpanı
│   ├── Budama Makası
│   ├── Çapa Makinesi
│   └── Diğer Alet
├── Yakıt ve Sarf Malzemeleri
│   ├── Benzin
│   ├── Mazot
│   ├── Motor Yağı
│   ├── 2T Yağ (Karışım Yağı)
│   ├── Zincir Yağı
│   ├── Temizlik Spreyi
│   └── Diğer Sarf
├── Yedek Parçalar
│   ├── Bıçak / Kesici
│   ├── Filtre
│   ├── Kayış
│   ├── Buji
│   └── Diğer Yedek Parça
└── Diğer Malzemeler
    ├── Çuval / Torba
    ├── İp / Bağ
    └── Diğer
```

### 8.2 Malzeme Kayıt

**Malzeme Alanları:**

| Alan | Tip | Açıklama |
|------|-----|----------|
| `id` | UUID | Benzersiz kimlik |
| `malzeme_adi` | String | Malzeme adı |
| `kategori` | Enum | Yukarıdaki kategorilerden |
| `alt_kategori` | String | Alt kategori |
| `birim` | Enum | `adet`, `kg`, `litre`, `paket`, `cuval` |
| `mevcut_stok` | Decimal | Anlık stok miktarı |
| `minimum_stok` | Decimal | Uyarı eşiği |
| `birim_fiyat` | Decimal | Son alım fiyatı |
| `depo_konumu` | String (nullable) | Depolama yeri |
| `durum` | Enum | `aktif`, `pasif` |
| `notlar` | Text | Ek notlar |

### 8.3 Stok Hareketleri

| Alan | Tip | Açıklama |
|------|-----|----------|
| `id` | UUID | Benzersiz kimlik |
| `malzeme_id` | FK | Malzeme |
| `hareket_tipi` | Enum | `giris`, `cikis`, `fire`, `iade` |
| `miktar` | Decimal | Hareket miktarı |
| `birim_fiyat` | Decimal (nullable) | Alım fiyatı (giriş ise) |
| `toplam_tutar` | Decimal (nullable) | Toplam maliyet |
| `tarla_id` | FK (nullable) | Kullanıldığı tarla |
| `tedarikci` | String (nullable) | Tedarikçi adı |
| `fatura_no` | String (nullable) | Fatura numarası |
| `tarih` | Date | Hareket tarihi |
| `notlar` | Text | Açıklama |

**İş Kuralları:**
- Stok girişi yapıldığında mevcut_stok artar, çıkışta azalır.
- minimum_stok altına düşünce bildirim gönderilir.
- Gübre/ilaç kullanımı tarla bazlı izlenebilir.
- Stok çıkışı maliyet olarak finans modülüne gider kaydı düşer.

### 8.4 Makine/Ekipman Takibi

| Alan | Tip | Açıklama |
|------|-----|----------|
| `id` | UUID | Benzersiz kimlik |
| `ekipman_adi` | String | Ekipman adı |
| `kategori` | String | Kategori |
| `marka` | String (nullable) | Marka |
| `model` | String (nullable) | Model |
| `seri_no` | String (nullable) | Seri numarası |
| `satin_alma_tarihi` | Date (nullable) | Alım tarihi |
| `satin_alma_fiyati` | Decimal (nullable) | Alım fiyatı |
| `garanti_bitis` | Date (nullable) | Garanti bitiş |
| `son_bakim_tarihi` | Date (nullable) | Son bakım |
| `sonraki_bakim_tarihi` | Date (nullable) | Planlanan bakım |
| `durum` | Enum | `aktif`, `bakimda`, `arızalı`, `hurda` |
| `calisma_saati` | Decimal (nullable) | Toplam çalışma saati |
| `notlar` | Text | Ek notlar |

**İş Kuralları:**
- Bakım zamanı geldiğinde bildirim gönderilir.
- Garanti süresi takip edilir.
- Yakıt/yağ tüketimleri stok hareketleriyle ilişkilendirilebilir.

---

## Modül 9 - Akıllı Asistan (AI)

### 9.1 Amaç

İlerleyen fazlarda sisteme entegre edilecek AI asistan, birikmiş verileri analiz ederek çiftçiye akıllı öneriler sunar.

### 9.2 Planlanan Özellikler

**Verimlilik Analizi:**
- Tarla bazında sürgünler arası verim karşılaştırması
- "Tarla X'te 2. sürgün 1. sürgüne göre %18 düştü" tarzı uyarılar
- Yıllık verimlilik trendleri
- Dönüm başı en verimli tarla sıralaması

**Maliyet Analizi:**
- İşçilik maliyeti / kg analizi
- Ton işi mi yevmiye mi daha avantajlı karşılaştırması
- Tarla bazlı maliyet/gelir oranı
- Gübre/ilaç kullanımı-verim ilişkisi

**Tahmin ve Öneri:**
- Geçmiş verilere göre bir sonraki sürgün tahmini
- Optimal hasat zamanı önerisi
- İşçi ekip verimliliği karşılaştırması
- Hava durumu + verimlilik korelasyonu

**Kontenjan Optimizasyonu:**
- Kontenjan kullanım oranı analizi
- Optimal satış stratejisi önerisi
- Bakiye trend analizi

---

## Modül 10 - Raporlama ve Dashboard

### 10.1 Ana Dashboard

```
┌────────────────────────────────────────────────────────┐
│                    ANA DASHBOARD                        │
├────────────┬────────────┬────────────┬────────────────┤
│ Aktif      │ Bugünkü    │ Toplam     │ Net Kâr/Zarar │
│ Sürgün: 2  │ Hasat:     │ Hasat:     │               │
│            │ 1,250 kg   │ 45,600 kg  │ ₺125,400      │
├────────────┴────────────┴────────────┴────────────────┤
│                                                        │
│  📊 Günlük Hasat Grafiği (son 30 gün)                 │
│  ████████████████████████████████████                  │
│                                                        │
├────────────────────────┬──────────────────────────────┤
│ Tarla Bazlı Verim      │ Kontenjan Durumu             │
│ ─────────────────      │ ─────────────────            │
│ Tarla A: 420 kg/dönüm  │ Bugünkü: 850 kg             │
│ Tarla B: 380 kg/dönüm  │ Bakiye: -150 kg             │
│ Tarla C: 510 kg/dönüm  │ Satış: 1000 kg              │
├────────────────────────┼──────────────────────────────┤
│ Yaklaşan Ödemeler      │ Stok Uyarıları              │
│ ─────────────────      │ ─────────────────            │
│ Ali Usta Ekibi: ₺2,400 │ ⚠️ Benzin: 5L kaldı        │
│ Çay-Kur: ₺45,000 bekl. │ ⚠️ Motor Yağı: 2L kaldı    │
└────────────────────────┴──────────────────────────────┘
```

### 10.2 Rapor Türleri

- **Günlük Hasat Raporu:** Tarih bazlı, tarla bazlı, müşteri bazlı hasat detayları
- **Sürgün Özet Raporu:** Sürgün kapanışında toplam özet
- **İşçilik Raporu:** Ekip bazlı maliyet analizi, ödeme durumları
- **Tarla Verimlilik Raporu:** Tarla bazlı sürgün karşılaştırmalı verim
- **Kontenjan Raporu:** Günlük kontenjan kullanım detayları ve bakiye geçmişi
- **Finans Raporu:** Gelir-gider, alacak-borç, kâr/zarar
- **Envanter Raporu:** Stok durumu, hareket geçmişi, maliyet
- **Yıllık Karşılaştırma Raporu:** Yıllar arası verimlilik ve finansal karşılaştırma

---

## Modül 11 - Hava Durumu Entegrasyonu *(Benim Önerim)*

### 11.1 Amaç

Çay hasadı hava koşullarından doğrudan etkilenir. Bu modül, günlük hava verilerini hasat verileriyle ilişkilendirerek AI asistanın analizlerini güçlendirir.

### 11.2 Özellikler

- Tarla konumuna göre günlük hava durumu çekme (API entegrasyonu)
- Hasat girişiyle birlikte otomatik hava verisi kaydetme (sıcaklık, nem, yağış)
- Hava durumu - verimlilik korelasyonu (AI modülü için veri)
- Yaklaşan kötü hava uyarıları (don, dolu, aşırı yağış)
- Hasat planlaması için hava tahmini gösterimi

**Hava Verisi Kaydı:**

| Alan | Tip | Açıklama |
|------|-----|----------|
| `id` | UUID | Benzersiz kimlik |
| `tarla_id` | FK | Tarla |
| `tarih` | Date | Tarih |
| `sicaklik_min` | Decimal | Minimum sıcaklık (°C) |
| `sicaklik_max` | Decimal | Maksimum sıcaklık (°C) |
| `nem_orani` | Decimal | Nem (%) |
| `yagis_mm` | Decimal | Yağış (mm) |
| `ruzgar_hizi` | Decimal (nullable) | Rüzgar (km/h) |
| `hava_durumu` | String | Genel durum (güneşli, bulutlu, yağmurlu) |

---

## Modül 12 - Bildirim ve Uyarı Sistemi *(Benim Önerim)*

### 12.1 Bildirim Türleri

| Bildirim | Tetikleyici | Öncelik |
|----------|------------|---------|
| Stok uyarısı | Stok < minimum_stok | 🔴 Yüksek |
| Ödeme vadesi | Vade tarihine 3 gün kala | 🟡 Orta |
| Bakım hatırlatma | Ekipman bakım tarihi yaklaştığında | 🟡 Orta |
| Kontenjan değişimi | Yeni kontenjan tanımlandığında | 🔴 Yüksek |
| Sürgün kapanış | Sürgün kapandığında özet | 🟢 Bilgi |
| Hava uyarısı | Don/dolu/aşırı yağış tahmini | 🔴 Yüksek |
| Verim düşüşü | Tarla veriminde %20+ düşüş | 🟡 Orta |
| Garanti bitiş | Ekipman garantisi dolmadan 30 gün önce | 🟢 Bilgi |

### 12.2 Bildirim Kanalları

- Uygulama içi bildirim (in-app notification)
- Push notification (mobil)
- SMS (kritik uyarılar için - opsiyonel)

---

## Modül 13 - Kullanıcı ve Yetkilendirme

### 13.1 Kullanıcı Rolleri

| Rol | Açıklama | Yetkiler |
|-----|----------|----------|
| `admin` | Sistem sahibi (çiftçi) | Tam yetki |
| `muhasebeci` | Finansal işlemler | Finans, raporlar, müşteriler |
| `tarimci` | Tarla ve hasat işleri | Hasat girişi, tarla yönetimi |
| `izleyici` | Sadece görüntüleme | Sadece okuma yetkisi |

### 13.2 Kullanıcı Alanları

| Alan | Tip | Açıklama |
|------|-----|----------|
| `id` | UUID | Benzersiz kimlik |
| `kullanici_adi` | String | Kullanıcı adı |
| `email` | String | E-posta |
| `sifre_hash` | String | Hashlenmiş şifre |
| `ad_soyad` | String | Ad soyad |
| `rol` | Enum | Yukarıdaki roller |
| `telefon` | String (nullable) | Telefon |
| `son_giris` | DateTime | Son giriş zamanı |
| `durum` | Enum | `aktif`, `pasif` |

---

## Veritabanı Şeması

### Entity-Relationship Özet

```
Hasat Dönemi (1) ──── (N) Sürgün
Sürgün (1) ──── (N) Hasat Girişi
Sürgün (1) ──── (N) Kontenjan
Hasat Girişi (N) ──── (1) Tarla
Hasat Girişi (N) ──── (1) Müşteri
Hasat Girişi (N) ──── (1) İşçi Ekibi [nullable]
Hasat Girişi (1) ──── (1) Çay Kalite [nullable]
Tarla (N) ──── (1) Çiftçi
İşçi Ekibi (N) ──── (N) İşçi [Many-to-Many]
Hasat Girişi (1) ──── (1) Ödeme Kaydı [otomatik - işçilik]
Sürgün Kapanış (1) ──── (1) Gelir Kaydı [otomatik]
Malzeme (1) ──── (N) Stok Hareketi
Stok Hareketi (N) ──── (1) Tarla [nullable]
Kontenjan (1) ──── (N) Kontenjan Günlük Takip
Tarla (1) ──── (N) Hava Verisi
Fotoğraf (N) ──── (1) Hasat/Tarla/Ekipman [polymorphic]
Aktivite Logu ──── Tüm Tablolar [polymorphic]
```

### Veritabanı Tabloları Listesi

1. `hasat_donemleri`
2. `surgunler`
3. `hasat_girisleri`
4. `tarlalar`
5. `ciftciler`
6. `musteriler`
7. `isciler`
8. `isci_ekipleri`
9. `ekip_isci_iliskisi`
10. `kontenjanlar`
11. `kontenjan_gunluk_takip`
12. `gelir_kayitlari`
13. `odeme_kayitlari`
14. `malzemeler`
15. `stok_hareketleri`
16. `ekipmanlar`
17. `hava_verileri`
18. `bildirimler`
19. `kullanicilar`
20. `aktivite_loglari`
21. `fotograflar`
22. `cay_kalite`
23. `qr_kodlar`
24. `offline_sync_kuyrugu`

---

## Sayfa Yapıları ve UI Akışları

### Ana Menü Yapısı

```
📊 Dashboard (Ana Sayfa)
├── 🌿 Hasat Yönetimi
│   ├── Hasat Dönemi Başlat/Yönet
│   ├── Sürgün Yönetimi
│   ├── Günlük Hasat Girişi
│   └── Kontenjan Takibi
├── 👥 İşçilik
│   ├── İşçi Listesi
│   ├── İşçi Ekle
│   ├── Ekip Yönetimi
│   └── Ekip Oluştur
├── 🌾 Tarlalar
│   ├── Tarla Listesi
│   ├── Tarla Ekle
│   ├── Tarla Detay / Verimlilik
│   └── Harita Görünümü (opsiyonel)
├── 🧑‍🌾 Çiftçiler
│   ├── Çiftçi Listesi
│   ├── Çiftçi Ekle
│   └── Çiftçi Detay
├── 🤝 Müşteriler
│   ├── Müşteri Listesi
│   ├── Müşteri Ekle
│   └── Müşteri Detay
├── 💰 Finans
│   ├── Finans Özeti
│   ├── Alacaklar (Ödeme Bekleniyor)
│   ├── Borçlar (İşçilik, Malzeme)
│   ├── Ödeme Geçmişi
│   └── Gelir-Gider Raporu
├── 📦 Envanter
│   ├── Malzeme Listesi
│   ├── Malzeme Ekle
│   ├── Stok Hareketi Gir
│   ├── Ekipman Listesi
│   └── Ekipman Ekle
├── 📈 Raporlar
│   ├── Hasat Raporları
│   ├── Verimlilik Raporları
│   ├── Finansal Raporlar
│   ├── Kontenjan Raporları
│   └── Envanter Raporları
├── 🤖 Akıllı Asistan (AI)
│   └── Soru-Cevap / Analiz Paneli
├── ⚙️ Ayarlar
│   ├── Kullanıcı Yönetimi
│   ├── Bildirim Ayarları
│   ├── Sistem Ayarları
│   └── Veri Yedekleme
└── 🔔 Bildirimler
```

---

## Teknik Altyapı

### Tasarım Prensibi: Sıfır veya Minimum Maliyet

Bu proje kişisel kullanım amaçlıdır, ticari amaç gütmez. Bu nedenle VPS/sunucu kiralamadan, ücretsiz tier'lar ve ucuz shared hosting ile çalışacak şekilde tasarlanmıştır.

### Teknoloji Yığını

| Katman | Teknoloji | Neden | Maliyet |
|--------|-----------|-------|---------|
| **Frontend** | Next.js 14+ (App Router) | SSR, static export, Capacitor uyumlu | Ücretsiz |
| **UI Kütüphanesi** | Tailwind CSS + shadcn/ui | Hızlı, tutarlı, özelleştirilebilir | Ücretsiz |
| **State Management** | TanStack Query (React Query) + Zustand | Offline cache + hafif state | Ücretsiz |
| **Backend API** | Next.js API Routes | Fullstack tek projede | Ücretsiz |
| **Veritabanı** | Supabase (PostgreSQL) | Ücretsiz tier: 500MB DB, Auth dahil | **Ücretsiz** |
| **Auth** | Supabase Auth | Email/şifre, session yönetimi | **Ücretsiz** |
| **ORM** | Prisma | Type-safe, migration, kolay schema | Ücretsiz |
| **Dosya Depolama** | Supabase Storage veya Cloudflare R2 | Fotoğraflar için, 1GB ücretsiz | **Ücretsiz** |
| **Hava API** | OpenWeatherMap | 1000 istek/gün ücretsiz | **Ücretsiz** |
| **AI** | Anthropic Claude API | Akıllı asistan (kullandıkça öde) | ~$5-10/ay |
| **Hosting** | Hostinger (mevcut) | Node.js destekli, zaten ödeniyor | **₺0 ek** |
| **Domain** | Hostinger'da mevcut (.com) | DNS ayarı gerekmez | **₺0 ek** |
| **Mobil** | Capacitor | Next.js → iOS + Android native app | Ücretsiz |
| **Harita** | Leaflet.js + OpenStreetMap | Açık kaynak, ücretsiz | **Ücretsiz** |
| **QR Kod** | qrcode (npm) + Capacitor Barcode | Üretim ve okuma | Ücretsiz |

**Tahmini Ek Aylık Maliyet: ₺0 (web) / ~₺100 (mobil + AI dahil)**

### Neden Supabase?

Supabase, PostgreSQL veritabanı + Auth + Storage + Realtime'ı tek platformda ücretsiz sunar:

- **Veritabanı:** 500MB PostgreSQL (kişisel kullanım için fazlasıyla yeterli)
- **Auth:** Sınırsız kullanıcı, email/şifre, magic link
- **Storage:** 1GB dosya depolama (fotoğraflar için)
- **Realtime:** Canlı veri güncellemeleri (opsiyonel)
- **Otomatik Yedekleme:** Günlük yedek (ücretsiz tier'da 7 gün)
- **Edge Functions:** Serverless fonksiyonlar (opsiyonel)

> **NOT:** Supabase ücretsiz tier'da 1 hafta inaktiflik sonrası pause olabilir. Kişisel kullanımda düzenli giriş yapıldığı için sorun olmaz. Yine de önemli verilerin aylık JSON yedeğini almak iyi bir pratiktir.

### Hostinger hPanel Konfigürasyonu

Zaten Hostinger'da aktif hosting + domain (.com) mevcut. Ekstra maliyet oluşturmamak için bu altyapıyı kullanacağız:

- **Hostinger (hPanel):** Next.js uygulamasını Node.js ile çalıştırır → zaten ödeniyor
- **Supabase (Ücretsiz):** PostgreSQL + Auth + Storage → ek maliyet yok  
- **Domain:** Zaten Hostinger'da kayıtlı → DNS ayarı bile gerekmez

> **Vercel'e gerek yok.** Hostinger Node.js desteklediği için Next.js doğrudan Hostinger'da çalışır.

### Hostinger'da Next.js Deployment Adımları

```
1. hPanel → Website → Node.js 
   → Node.js versiyonu: 18.x veya 20.x seç

2. Proje dosyalarını yükle:
   → Yöntem A: Git Repository bağla (önerilen)
      hPanel → Git → Repository URL yapıştır → Auto deploy
   → Yöntem B: SSH ile manuel
      ssh kullanici@sunucu.hostinger.com
      cd ~/domains/senindomain.com/public_html
      git clone <repo-url> .
      npm install
      npm run build

3. Node.js App ayarları (hPanel):
   → Entry point: server.js
   → Node.js version: 20.x
   → Application root: /domains/senindomain.com/public_html
   → Environment variables: .env değişkenlerini hPanel'den ekle

4. Başlat:
   → npm run build && npm run start
   → Port: hPanel'in atadığı port (otomatik)
```

**Hostinger için next.config.js:**

```javascript
// next.config.js - Hostinger uyumlu
/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',  // ÖNEMLİ: Hostinger için standalone build
  images: {
    unoptimized: false,
  },
}
module.exports = nextConfig
```

**Hostinger için custom server.js:**

```javascript
// server.js - Hostinger'ın port atamasını yakalar
const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');

const dev = false;
const hostname = '0.0.0.0';
const port = process.env.PORT || 3000;

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  createServer(async (req, res) => {
    const parsedUrl = parse(req.url, true);
    await handle(req, res, parsedUrl);
  }).listen(port, () => {
    console.log(`> TarımCRM ready on port ${port}`);
  });
});
```

### Proje Klasör Yapısı

```
tarim-crm/
├── prisma/
│   └── schema.prisma            # Veritabanı şeması
├── src/
│   ├── app/                     # Next.js App Router
│   │   ├── (auth)/              # Auth sayfaları
│   │   │   ├── login/
│   │   │   └── register/
│   │   ├── (dashboard)/         # Ana layout
│   │   │   ├── layout.tsx       # Sidebar + Header
│   │   │   ├── page.tsx         # Dashboard
│   │   │   ├── hasat/
│   │   │   │   ├── donem/
│   │   │   │   ├── surgun/
│   │   │   │   ├── giris/
│   │   │   │   └── kontenjan/
│   │   │   ├── iscilik/
│   │   │   │   ├── isciler/
│   │   │   │   └── ekipler/
│   │   │   ├── tarlalar/
│   │   │   ├── ciftciler/
│   │   │   ├── musteriler/
│   │   │   ├── finans/
│   │   │   ├── envanter/
│   │   │   │   ├── malzemeler/
│   │   │   │   └── ekipmanlar/
│   │   │   ├── raporlar/
│   │   │   ├── asistan/
│   │   │   ├── harita/
│   │   │   └── ayarlar/
│   │   └── api/                 # API Routes
│   │       ├── hasat/
│   │       ├── iscilik/
│   │       ├── tarlalar/
│   │       ├── ciftciler/
│   │       ├── musteriler/
│   │       ├── finans/
│   │       ├── envanter/
│   │       ├── kontenjan/
│   │       ├── raporlar/
│   │       ├── yedekleme/
│   │       └── auth/
│   ├── components/
│   │   ├── ui/                  # shadcn/ui bileşenleri
│   │   ├── layout/              # Header, Sidebar, Footer
│   │   ├── forms/               # Form bileşenleri
│   │   ├── tables/              # Tablo bileşenleri
│   │   ├── charts/              # Grafik bileşenleri (Recharts)
│   │   ├── map/                 # Harita bileşenleri (Leaflet)
│   │   └── shared/              # Ortak bileşenler
│   ├── lib/
│   │   ├── supabase.ts          # Supabase client
│   │   ├── db.ts                # Prisma client
│   │   ├── auth.ts              # Auth helpers
│   │   ├── utils.ts             # Yardımcı fonksiyonlar
│   │   ├── kontenjan.ts         # Kontenjan hesaplama mantığı
│   │   ├── offline.ts           # Offline sync mantığı
│   │   ├── qr.ts                # QR kod üretim/okuma
│   │   └── validators.ts        # Zod şemaları
│   ├── hooks/
│   │   ├── useOffline.ts        # Offline durum hook'u
│   │   ├── useSync.ts           # Senkronizasyon hook'u
│   │   └── useLocation.ts       # GPS hook'u
│   ├── types/                   # TypeScript tipleri
│   └── constants/               # Sabit değerler
├── ios/                         # Capacitor iOS projesi (otomatik)
├── android/                     # Capacitor Android projesi (otomatik)
├── public/
│   ├── images/
│   ├── icons/                   # PWA/App ikonları
│   └── manifest.json            # PWA manifest
├── capacitor.config.ts          # Capacitor konfigürasyonu
├── .env.local                   # Ortam değişkenleri
├── package.json
├── tsconfig.json
├── tailwind.config.ts
├── next.config.js
└── README.md
```

---

## Geliştirme Ortamı Kurulumu

### Çoklu Makine Stratejisi

Geliştirme iki makine arasında yapılacak. Amaç: hangi makinede olursan ol **5 dakikada** kodlamaya başlayabilmek.

| | Windows PC (Ev) | Mac M2 (İşyeri) |
|---|---|---|
| **OS** | Windows 10/11 | macOS (Apple Silicon) |
| **Geliştirme Aracı** | Claude Code (terminal) | Claude Code (terminal) |
| **Terminal** | PowerShell / Git Bash | Terminal (zsh) |
| **Node.js** | nvm-windows | nvm (unix) |
| **Git** | Git for Windows | Xcode CLI Tools |

### Claude Code Nedir?

Claude Code, Anthropic'in terminal tabanlı AI geliştirme aracıdır. IDE'ye bağımlı değildir — doğrudan terminalde çalışır, proje dosyalarını okur/yazar, komut çalıştırır. Bu projenin tüm kodlaması Claude Code ile yapılacak.

**Avantajları:**
- Terminal tabanlı → Windows, Mac, Linux fark etmez
- IDE kurulumu / extension yönetimi derdi yok
- Projenin bağlamını (context) anlayarak kod yazar
- Git, Prisma, npm komutlarını doğrudan çalıştırabilir
- Dosya okuma/yazma/düzenleme yapabilir

### Tek Seferlik Kurulum (Her İki Makine)

Her iki makineye bir kez kurulanlar. Sonra sadece `git pull && npm install` ile çalışmaya başlarsın.

**Adım 1: Node.js (nvm ile — versiyon tutarlılığı için)**

```bash
# --- MAC ---
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
source ~/.zshrc
nvm install 20
nvm use 20
nvm alias default 20

# --- WINDOWS ---
# nvm-windows indir: https://github.com/coreybutler/nvm-windows/releases
# Kurulumdan sonra:
nvm install 20
nvm use 20
```

**Adım 2: Claude Code Kurulumu (Her iki platform)**

```bash
# --- HER İKİ MAKİNEDE ---
npm install -g @anthropic-ai/claude-code

# Kurulumu doğrula:
claude --version

# İlk kullanımda Anthropic API key ile giriş yapılır
# veya Anthropic hesabıyla OAuth login
```

> **NOT:** Claude Code terminal tabanlıdır. Kod düzenlemek için ayrıca bir editör (VS Code, vim, nano vb.) kullanabilirsin ama Claude Code zaten dosya okuma/yazma/düzenleme yapabildiği için çoğu zaman editöre ihtiyaç duymayacaksın.

**Adım 3: Git + GitHub SSH Key**

```bash
# --- HER İKİ MAKİNEDE ---
git config --global user.name "Senin Adın"
git config --global user.email "senin@email.com"

# SSH key oluştur (her makinede ayrı ayrı)
ssh-keygen -t ed25519 -C "senin@email.com"

# Public key'i kopyala
# Mac:
cat ~/.ssh/id_ed25519.pub | pbcopy
# Windows (Git Bash):
cat ~/.ssh/id_ed25519.pub | clip

# GitHub.com → Settings → SSH Keys → New SSH Key → Yapıştır
# NOT: Her makine için ayrı key ekle (isimlendir: "Mac M2", "Windows PC")
```

**Adım 4: Projeyi Klonla**

```bash
# --- HER İKİ MAKİNEDE ---
cd ~/Projects  # veya istediğin klasör
git clone git@github.com:KULLANICI_ADIN/tarim-crm.git
cd tarim-crm
npm install
```

### Ortam Değişkenleri (.env.local)

Bu dosya Git'e **gitmez** (.gitignore'da). Her iki makineye bir kez elle oluşturulur.

```bash
# Projenin kök dizininde:
cp .env.example .env.local
# Sonra .env.local içini gerçek değerlerle doldur
```

**Kritik:** `.env.example` dosyası Git'te tutulur (değerler boş, sadece key isimleri). `.env.local` ise Git'e gitmez. Bu sayede:
- Yeni makineye geçince `.env.example`'ı kopyala, değerleri doldur, çalış
- Gerçek API key'lerin Git'te sızmaz

**.env.example (Git'te tutulacak):**

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Database
DATABASE_URL=

# Auth
NEXTAUTH_SECRET=
NEXTAUTH_URL=http://localhost:3000

# Hava Durumu
OPENWEATHERMAP_API_KEY=

# AI (opsiyonel)
ANTHROPIC_API_KEY=

# Uygulama
NODE_ENV=development
```

> **İPUCU:** `.env.local` değerlerini güvenli bir yere kaydet (1Password, Bitwarden, veya basitçe özel bir not). Yeni makineye geçince oradan kopyala-yapıştır.

### Günlük Geliştirme Akışı

```
┌──────────────────────────────────────────────────────────┐
│             GÜNLÜK GELİŞTİRME DÖNGÜSÜ                    │
│                                                           │
│  Makineyi aç (Windows veya Mac, fark etmez)              │
│    │                                                      │
│    ├─→ Terminal aç                                        │
│    │     cd ~/Projects/tarim-crm                         │
│    │     git pull                  ← son değişiklikleri çek│
│    │     npm install               ← yeni paket varsa    │
│    │                                                      │
│    ├─→ Claude Code ile geliştirmeye başla:                │
│    │     claude                    ← Claude Code başlat   │
│    │     "Hasat giriş formunu oluştur"  ← doğal dilde    │
│    │     Claude Code dosyaları okur, yazar, çalıştırır   │
│    │                                                      │
│    ├─→ Test etmek için (ayrı terminal sekmesinde):       │
│    │     npm run dev               ← localhost:3000       │
│    │                                                      │
│    ├─→ İşin bitince:                                     │
│    │     git add .                                        │
│    │     git commit -m "hasat giriş formu tamamlandı"    │
│    │     git push                                         │
│    │                                                      │
│    └─→ Diğer makinede devam etmek istersen:              │
│          git pull && npm install                          │
│          claude    ← kaldığın yerden devam!               │
└──────────────────────────────────────────────────────────┘
```

**3 komut, 30 saniye:**
```bash
git pull && npm install && claude
```
Bu kadar. Hangi makinede olursan ol, bu 3 komut seni çalışır duruma getirir.

### Claude Code ile Çalışma Örnekleri

```bash
# Projeye gir ve Claude Code'u başlat
cd ~/Projects/tarim-crm
claude

# Artık doğal dilde komut verebilirsin:
> "Çiftçi CRUD sayfasını oluştur"
> "Prisma schema'ya tarlalar tablosunu ekle"
> "Hasat giriş formundaki işçilik hesaplamasını düzelt"
> "npm run dev çalıştır ve hataları düzelt"
> "Git'e commit et: hasat modülü tamamlandı"
```

### CLAUDE.md — Claude Code Proje Bağlamı

Projenin kök dizinine `CLAUDE.md` dosyası eklenir. Claude Code her çalıştığında bu dosyayı okur ve projenin kurallarını bilir.

```markdown
# TarımCRM - Claude Code Bağlam Dosyası

## Proje Hakkında
Çay tarımı yönetim sistemi. Next.js 14 + Supabase + Prisma + Tailwind.

## KRİTİK KODLAMA KURALLARI

### Dil: %100 Türkçe Kod
Bu projede TÜM kod Türkçe yazılır. İstisnasız.

- Değişken isimleri: Türkçe (toplamMiktar, hasatGirisi, gunlukKontenjan)
- Fonksiyon isimleri: Türkçe (hasatGirisiOlustur, kontenjanHesapla)
- Veritabanı tablo isimleri: Türkçe (hasat_girisleri, isci_ekipleri)
- Veritabanı sütun isimleri: Türkçe (tartim_miktari_kg, odeme_durumu)
- API route isimleri: Türkçe (/api/hasat, /api/iscilik)
- Component isimleri: Türkçe (HasatGirisFormu, TarlaListesi)
- Type/Interface isimleri: Türkçe (HasatGirisi, IsciEkibi)
- Enum değerleri: Türkçe (odeme_bekleniyor, ton_isi)
- Hata mesajları: Türkçe
- Yorum satırları: Türkçe

### Türkçe Karakter Kuralları
- Dosya/klasör isimlerinde Türkçe karakter KULLANMA (ı,ş,ç,ö,ü,ğ → i,s,c,o,u,g)
- Değişken isimlerinde Türkçe karakter KULLANMA (camelCase ASCII)
- Veritabanı isimlerinde Türkçe karakter KULLANMA (snake_case ASCII)
- Yorum ve string değerlerde Türkçe karakter KULLANABİLİRSİN

### İsimlendirme Örnekleri
```typescript
// ✅ DOĞRU - Türkçe ama ASCII karakterler
const toplamHasatMiktari = 500;
const gunlukKontenjan = 650;
const iscilikTutari = hesaplaIscilikTutari(miktar, birimFiyat);

function hasatGirisiOlustur(veri: HasatGirisiFormu): Promise<HasatGirisi> { }
function kontenjanBakiyesiHesapla(tarih: Date): number { }
function isciEkibiGetir(ekipId: string): Promise<IsciEkibi> { }

interface HasatGirisi {
  id: string;
  surgunId: string;
  tarlaId: string;
  tartimMiktariKg: number;
  satisMiktariKg: number;
  toplanmaTuru: 'tarla_sahibi' | 'isci';
}

// ❌ YANLIŞ - İngilizce
const totalHarvestAmount = 500;
function createHarvestEntry() { }
interface HarvestEntry { }
```

### Yorum ve Açıklama Kuralları
Her fonksiyon, değişken ve karmaşık iş mantığı Türkçe açıklamalı olacak:

```typescript
/**
 * Günlük kontenjan bakiyesini hesaplar.
 * 
 * Eğer tartım miktarı kontenjandan azsa → borç oluşur (negatif bakiye)
 * Eğer tartım miktarı kontenjandan fazlaysa → fazla oluşur (pozitif bakiye)
 * Bir önceki günün bakiyesi otomatik olarak dahil edilir.
 * 
 * @param tartimKg - Günlük tartım miktarı (kg)
 * @param gunlukKontenjanKg - O günkü kontenjan limiti (kg)
 * @param oncekiBakiyeKg - Bir önceki günden devir bakiye (kg)
 * @returns Hesaplanan satış miktarı ve yeni bakiye
 */
function kontenjanBakiyesiHesapla(
  tartimKg: number,
  gunlukKontenjanKg: number,
  oncekiBakiyeKg: number
): { satisMiktariKg: number; kalanBakiyeKg: number } {
  // Günlük satış kapasitesi = kontenjan + önceki bakiye
  const satisKapasitesi = gunlukKontenjanKg + oncekiBakiyeKg;
  
  // Kalan bakiye = tartım - satış kapasitesi
  // Pozitif → alıcıda fazla var, negatif → biz borçluyuz
  const kalanBakiye = tartimKg - satisKapasitesi;
  
  return {
    satisMiktariKg: satisKapasitesi,
    kalanBakiyeKg: kalanBakiye,
  };
}
```

### Veritabanı İsimlendirme (Prisma Schema)
```prisma
model HasatGirisi {
  id                String   @id @default(uuid())
  surgunId          String   @map("surgun_id")
  tarlaId           String   @map("tarla_id")
  tarih             DateTime
  tartimMiktariKg   Decimal  @map("tartim_miktari_kg")
  satisMiktariKg    Decimal  @map("satis_miktari_kg")
  toplanmaTuru      ToplanmaTuru @map("toplanma_turu")
  
  // İlişkiler
  surgun            Surgun   @relation(fields: [surgunId], references: [id])
  tarla             Tarla    @relation(fields: [tarlaId], references: [id])
  
  @@map("hasat_girisleri")
}

enum ToplanmaTuru {
  tarla_sahibi
  isci
}

enum OdemeDurumu {
  odeme_bekleniyor
  kismi_odendi
  odendi
}

enum OdemeTuru {
  yevmiye
  ton_isi
}
```

### Component İsimlendirme
- Sayfa: `hasat-girisi/page.tsx` (kebab-case dosya, Next.js kuralı)
- Component: `HasatGirisFormu.tsx` (PascalCase)
- Hook: `useHasatGirisi.ts` (camelCase, use prefixi)
- Util: `kontenjanHesapla.ts` (camelCase)
- Type: `HasatGirisi.ts` (PascalCase)

### Dosya Yapısı
Detaylı klasör yapısı için TarimCRM_Proje_Dokumani.md dosyasına bak.

### Komutlar
- `npm run dev` → Geliştirme sunucusu (localhost:3000)
- `npm run build` → Production build
- `npx prisma generate` → Prisma client yenile
- `npx prisma db push` → Schema'yı DB'ye uygula
- `npx prisma studio` → DB görsel arayüzü
```

### .nvmrc ile Node Versiyon Tutarlılığı

Projenin kök dizinine `.nvmrc` dosyası eklenir:

```
20
```

Bu sayede her iki makinede:
```bash
nvm use          # otomatik olarak Node 20'ye geçer
```

### .gitignore (Projeye Eklenecek)

```gitignore
# Bağımlılıklar
node_modules/
.pnp
.pnp.js

# Build çıktıları
.next/
out/
build/
dist/

# Ortam değişkenleri (GİZLİ - Git'e gitmez)
.env
.env.local
.env.production.local
.env.development.local

# IDE ve editörler
.vscode/
.idea/
*.swp
*.swo

# İşletim sistemi
.DS_Store          # Mac
Thumbs.db          # Windows
desktop.ini        # Windows

# Capacitor (platforma özel build'ler)
ios/App/Pods/
android/.gradle/
android/app/build/

# Debug logları
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# Prisma
prisma/migrations/migration_lock.toml

# Diğer
*.tsbuildinfo
next-env.d.ts
```

### Sık Kullanılan Komutlar (Cheat Sheet)

```bash
# Claude Code
claude                         # Claude Code başlat (proje dizininde)

# Geliştirme
npm run dev                    # Dev sunucusu başlat (localhost:3000)
npm run build                  # Production build
npm run start                  # Production sunucu başlat
npm run lint                   # Kod kalite kontrolü

# Veritabanı (Prisma)
npx prisma generate            # Prisma client yenile
npx prisma db push             # Schema'yı DB'ye uygula
npx prisma migrate dev         # Migration oluştur + uygula
npx prisma studio              # DB görsel arayüzü (localhost:5555)

# Git
git pull                       # Son değişiklikleri çek
git add .                      # Tüm değişiklikleri stage'e al
git commit -m "mesaj"          # Commit
git push                       # GitHub'a gönder
git status                     # Değişiklikleri gör
git log --oneline -10          # Son 10 commit

# Capacitor (mobil - ileri faz)
npx cap sync                   # Web → native kopyala
npx cap open ios               # Xcode aç (sadece Mac)
npx cap open android           # Android Studio aç
npx cap run android            # Doğrudan cihazda çalıştır
```

### Olası Sorunlar ve Çözümleri

| Sorun | Çözüm |
|-------|-------|
| `npm install` hata veriyor | `rm -rf node_modules && rm package-lock.json && npm install` |
| Port 3000 meşgul | `npx kill-port 3000` veya `npm run dev -- -p 3001` |
| Prisma client hatası | `npx prisma generate` |
| Git conflict | `git stash → git pull → git stash pop → conflict çöz` |
| Mac'te `nvm: command not found` | `source ~/.zshrc` veya terminal'i kapat-aç |
| Windows'ta path sorunu | Git Bash kullan (PowerShell yerine) |
| `.env.local` unutuldu | `cp .env.example .env.local` → değerleri doldur |
| Claude Code bağlantı hatası | API key kontrol et: `claude auth status` |

---

## Hosting ve Deployment Stratejisi

### Mimari Diyagram

```
┌──────────────────────────────────────────────────────────┐
│                    KULLANICI ERİŞİMİ                      │
├──────────┬──────────────┬──────────────┬─────────────────┤
│ 🌐 Web   │ 📱 iOS App   │ 🤖 Android   │ 📱 PWA          │
│(Tarayıcı)│ (App Store)  │ (Play Store) │ (Ana Ekrana     │
│          │              │ (veya APK)   │  Ekle)          │
├──────────┴──────────────┴──────────────┴─────────────────┤
│                                                           │
│         Hostinger (Mevcut Hosting + Domain)               │
│         ┌──────────────────────────────┐                  │
│         │  senindomain.com             │                  │
│         │  ┌────────────────────────┐  │                  │
│         │  │   Next.js Uygulaması   │  │                  │
│         │  │   Node.js 20.x         │  │                  │
│         │  │   standalone mode      │  │                  │
│         │  │   SSL (Let's Encrypt)  │  │                  │
│         │  └───────────┬────────────┘  │                  │
│         │              │               │                  │
│         │   hPanel Yönetim + Git Deploy│                  │
│         └──────────────┼───────────────┘                  │
│                        │                                  │
├────────────────────────┼─────────────────────────────────┤
│                        │                                  │
│  ┌─────────────────────┼──────────────────────┐          │
│  │           Supabase (Ücretsiz Tier)          │          │
│  │  ┌──────────┬──────────┬──────────────┐    │          │
│  │  │PostgreSQL│   Auth   │   Storage     │    │          │
│  │  │  500MB   │ Sınırsız │    1GB        │    │          │
│  │  │Veritabanı│ Kullanıcı│  Fotoğraflar  │    │          │
│  │  └──────────┴──────────┴──────────────┘    │          │
│  │  + Otomatik Yedekleme (7 gün)              │          │
│  └────────────────────────────────────────────┘          │
│                                                           │
│  ┌──────────────┐  ┌───────────────────────┐             │
│  │OpenWeatherMap│  │ Claude API (opsiyonel) │             │
│  │  (Ücretsiz)  │  │ (Kullandıkça öde)     │             │
│  └──────────────┘  └───────────────────────┘             │
└──────────────────────────────────────────────────────────┘
```

### Deployment Akışı

```
Yöntem 1 - Git Auto Deploy (Önerilen):
  git push origin main
    ↓
  Hostinger hPanel Git otomatik pull
    ↓
  npm install && npm run build
    ↓
  Node.js restart → https://senindomain.com canlı!

Yöntem 2 - SSH ile Manuel:
  ssh -p 65002 kullanici@sunucu.hostinger.com
    ↓
  cd ~/domains/senindomain.com/public_html
    ↓
  git pull && npm install && npm run build
    ↓
  Node.js restart (hPanel'den veya pm2 ile)

Mobil Güncelleme:
  Web güncellemesi → Capacitor live reload (geliştirmede)
  Major güncelleme → Yeniden build + App Store/Play Store'a gönder
```

### Hostinger Ortam Değişkenleri (hPanel → Environment Variables)

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJI...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJI...

# Database (Supabase PostgreSQL)
DATABASE_URL=postgresql://postgres:xxxxx@db.xxxxx.supabase.co:5432/postgres

# Auth
NEXTAUTH_SECRET=rastgele-guclu-bir-anahtar
NEXTAUTH_URL=https://senindomain.com

# Hava Durumu
OPENWEATHERMAP_API_KEY=xxxxx

# AI (opsiyonel)
ANTHROPIC_API_KEY=sk-ant-xxxxx

# Uygulama
NODE_ENV=production
PORT=3000
```

### Maliyet Özeti

| Hizmet | Durum | Aylık Maliyet |
|--------|-------|---------------|
| Hostinger Hosting | **Zaten mevcut, ödeniyor** | ₺0 (ek maliyet yok) |
| Domain (.com) | **Zaten mevcut, ödeniyor** | ₺0 (ek maliyet yok) |
| SSL Sertifikası | Hostinger ücretsiz (Let's Encrypt) | **₺0** |
| Supabase DB + Auth | 500MB DB, sınırsız auth | **₺0** |
| Supabase Storage | 1GB dosya depolama | **₺0** |
| OpenWeatherMap | 1000 istek/gün | **₺0** |
| Apple Developer | iOS uygulama için (opsiyonel) | ~$99/yıl |
| Google Play | Tek seferlik (opsiyonel) | $25 (tek sefer) |
| Claude API | Akıllı asistan (opsiyonel) | ~₺150-300/ay |
| **TOPLAM (sadece web)** | | **₺0 ek maliyet** |
| **TOPLAM (mobil dahil)** | | **~₺100/ay ortalama** |

> **Sonuç:** Mevcut Hostinger hosting + domain zaten ödeniyor. Proje için **sıfır ek maliyet** ile web uygulaması yayına alınabilir. Mobil uygulama ve AI asistan opsiyoneldir.

---

## Geliştirme Fazları

### Faz 1 - Temel Altyapı ve CRUD (Hafta 1-3)

**Hedef:** Projenin iskeletini kurmak, temel veri giriş/çıkış işlemlerini tamamlamak.

- [x] Proje kurulumu (Next.js, Prisma, Supabase, Tailwind)
- [x] Supabase PostgreSQL bağlantısı ve Prisma schema oluşturma
- [x] Supabase Auth entegrasyonu (email/şifre giriş, çıkış, middleware)
- [x] Ana layout (Sidebar, Header, responsive tasarım)
- [x] Aktivite logu altyapısı (Modül 14 - tüm CRUD'larda otomatik log)
- [x] Çiftçi CRUD (Ekleme, Listeleme, Düzenleme, Silme)
- [x] Tarla CRUD + Çiftçi ataması
- [x] İşçi CRUD
- [x] İşçi Ekibi CRUD + İşçi ekleme/çıkarma
- [x] Müşteri CRUD (Kurumsal/Peşinci, Devlet ayrımı)

### Faz 2 - Hasat ve Kontenjan Sistemi (Hafta 4-6)

**Hedef:** Çekirdek iş mantığını çalışır hale getirmek.

- [x] Hasat Dönemi başlatma/kapatma
- [x] Sürgün yönetimi (açma, kapatma, sıralama)
- [x] Günlük Hasat Girişi ekranı (koşullu alanlar)
- [x] İşçilik hesaplama (ton işi / yevmiye)
- [x] Otomatik ödeme kaydı oluşturma (işçilik → borç)
- [x] Kontenjan tanımlama
- [x] Günlük kontenjan hesaplama mantığı (bakiye devir sistemi)
- [x] Kontenjan takip tablosu
- [ ] Çay kalite takibi (Modül 19 - hasat girişine opsiyonel ekleme)

### Faz 3 - Finans Modülü (Hafta 7-8)

**Hedef:** Gelir-gider takibini tamamlamak.

- [x] Sürgün kapanışında otomatik gelir kaydı
- [x] Alacak takibi (ödeme bekleniyor, kısmi ödeme, tamamlandı)
- [x] Borç takibi (işçilik, malzeme, diğer)
- [x] Ödeme yapma/alma işlemleri
- [x] Finans dashboard'u
- [x] Gelir-gider özeti

### Faz 4 - Envanter ve Malzeme (Hafta 9-10)

**Hedef:** Malzeme ve ekipman yönetimini tamamlamak.

- [x] Malzeme CRUD (kategorili)
- [x] Stok hareketi giriş/çıkış
- [x] Minimum stok uyarısı
- [x] Ekipman CRUD + bakım takibi
- [x] Stok çıkışı → finans gider kaydı
- [x] Fotoğraf yükleme altyapısı (Modül 16 - Supabase Storage)

### Faz 5 - Raporlama ve Dashboard (Hafta 11-12)

**Hedef:** Veri görselleştirme ve analiz.

- [ ] Ana Dashboard tasarımı ve verileri (Recharts)
- [ ] Hasat raporları (günlük, sürgün bazlı, tarla bazlı)
- [ ] Verimlilik grafikleri (tarla bazlı sürgün karşılaştırma)
- [ ] Kontenjan raporları
- [ ] Finansal raporlar
- [ ] Envanter raporları
- [ ] Sezonluk karşılaştırma (Modül 17)
- [ ] Excel/PDF rapor dışa aktarma
- [ ] Veri yedekleme ve dışa aktarma (Modül 18 - JSON/Excel export)

### Faz 6 - Harita, Bildirim ve Hava Durumu (Hafta 13-14)

**Hedef:** Görsel tarla takibi, proaktif bildirim ve hava entegrasyonu.

- [ ] Tarla harita görünümü (Modül 15 - Leaflet.js + OpenStreetMap)
- [ ] Verimlilik renk kodlaması harita üzerinde
- [ ] Bildirim altyapısı (in-app)
- [ ] Stok uyarıları, ödeme vade hatırlatmaları, bakım hatırlatmaları
- [ ] Hava durumu API entegrasyonu (OpenWeatherMap)
- [ ] Hasat girişiyle hava verisi eşleştirme
- [ ] QR kod üretimi ve tarla ataması (Modül 20)

### Faz 7 - Mobil Uygulama (Hafta 15-17)

**Hedef:** Capacitor ile iOS + Android native uygulama.

- [ ] Capacitor kurulumu ve konfigürasyonu
- [ ] Next.js static export optimizasyonu
- [ ] Offline veri saklama altyapısı (IndexedDB / SQLite)
- [ ] Offline hasat girişi + senkronizasyon mekanizması
- [ ] Kamera entegrasyonu (fotoğraf çekme)
- [ ] GPS entegrasyonu (tarla koordinatları)
- [ ] QR kod okuma entegrasyonu
- [ ] Push notification entegrasyonu
- [ ] Deep link yapılandırması (QR → hasat giriş)
- [ ] iOS build + test (Xcode)
- [ ] Android build + test (Android Studio veya APK)
- [ ] App Store / Play Store'a yükleme (veya APK dağıtım)

### Faz 8 - Akıllı Asistan ve Son Düzeltmeler (Hafta 18-20)

**Hedef:** AI destekli analiz ve projenin tamamlanması.

- [ ] Claude API entegrasyonu
- [ ] Verimlilik analiz sorgulama
- [ ] Maliyet optimizasyon önerileri
- [ ] Doğal dil ile veri sorgulama
- [ ] Trend analizi ve tahminler
- [ ] Performans optimizasyonu (Lighthouse audit)
- [ ] Güvenlik denetimi
- [ ] Kullanıcı testleri ve hata düzeltmeleri
- [ ] Dokümantasyon tamamlama

---

## Modül 14 - Aktivite Logu / Denetim İzi

### 14.1 Amaç

Sistemdeki her işlemi kayıt altına alarak güvenlik, hata takibi ve geri izlenebilirlik sağlar.

### 14.2 Log Kayıt Alanları

| Alan | Tip | Açıklama |
|------|-----|----------|
| `id` | UUID | Benzersiz kimlik |
| `kullanici_id` | FK | İşlemi yapan kullanıcı |
| `islem_tipi` | Enum | `olusturma`, `guncelleme`, `silme`, `giris`, `cikis` |
| `modul` | String | Hangi modülde yapıldı (hasat, finans, envanter vb.) |
| `tablo` | String | Etkilenen veritabanı tablosu |
| `kayit_id` | UUID | Etkilenen kaydın ID'si |
| `eski_deger` | JSON (nullable) | Değişiklik öncesi veri |
| `yeni_deger` | JSON (nullable) | Değişiklik sonrası veri |
| `ip_adresi` | String (nullable) | İşlem yapan IP |
| `cihaz_bilgisi` | String (nullable) | Tarayıcı/cihaz bilgisi |
| `tarih` | DateTime | İşlem zamanı |

**İş Kuralları:**
- Tüm CRUD işlemleri otomatik loglanır.
- Loglar silinemez (immutable).
- Admin panelinden filtrelenebilir log görüntüleme.
- 90 günden eski loglar arşivlenebilir (opsiyonel).

---

## Modül 15 - Tarla Harita Görünümü

### 15.1 Amaç

Tarlaların GPS koordinatlarıyla interaktif harita üzerinde gösterimi. Verimlilik renk kodlamasıyla görsel takip.

### 15.2 Özellikler

- Leaflet.js (açık kaynak, ücretsiz) ile harita entegrasyonu
- Tarla konumları pin olarak gösterilir
- Pin renkleri verimlilik durumuna göre değişir:
  - 🟢 Yeşil: Verim artışı olan tarlalar
  - 🟡 Sarı: Stabil tarlalar
  - 🔴 Kırmızı: Verim düşüşü olan tarlalar
- Pin'e tıklayınca tarla detayları (dönüm, son hasat, verimlilik) popup olarak gösterilir
- Tarla sınırları polygon olarak çizilebilir (opsiyonel)

**Veri Kaynağı:**
- `tarlalar` tablosundaki `koordinat_lat` ve `koordinat_lng` alanları
- Verimlilik verileri `hasat_girisleri` tablosundan hesaplanır

---

## Modül 16 - Fotoğraf Yönetimi

### 16.1 Amaç

Hasat girişlerine, tarla kayıtlarına ve ekipman kayıtlarına fotoğraf ekleyerek görsel arşiv oluşturmak.

### 16.2 Fotoğraf Alanları

| Alan | Tip | Açıklama |
|------|-----|----------|
| `id` | UUID | Benzersiz kimlik |
| `modul` | Enum | `hasat`, `tarla`, `ekipman`, `malzeme` |
| `kayit_id` | UUID | İlişkili kaydın ID'si |
| `dosya_yolu` | String | Depolama yolu |
| `dosya_adi` | String | Orijinal dosya adı |
| `boyut_kb` | Integer | Dosya boyutu |
| `aciklama` | String (nullable) | Fotoğraf açıklaması |
| `yukleme_tarihi` | DateTime | Yüklenme zamanı |

**İş Kuralları:**
- Fotoğraflar Supabase Storage veya Cloudflare R2'de saklanır (ücretsiz tier).
- Yükleme sırasında otomatik sıkıştırma (max 1MB).
- Hasat girişinde opsiyonel fotoğraf, tarlada hastalık/zararlı tespiti için.
- Mobil cihazdan doğrudan kamera ile çekim desteği.

---

## Modül 17 - Sezonluk Karşılaştırma

### 17.1 Amaç

Yıllar arası performans karşılaştırması yaparak trendleri görmek.

### 17.2 Karşılaştırma Metrikleri

| Metrik | Açıklama |
|--------|----------|
| Toplam Hasat (kg) | Yıl bazlı toplam |
| Dönüm Başı Verim | kg/dönüm bazlı |
| Sürgün Sayısı | Yılda kaç sürgün yapıldı |
| Toplam Gelir (₺) | Yıllık toplam gelir |
| Toplam Gider (₺) | İşçilik + malzeme + diğer |
| Net Kâr (₺) | Gelir - Gider |
| Ortalama Satış Fiyatı | ₺/kg |
| İşçilik Maliyeti / kg | Ton başı işçilik ortalaması |

**Karşılaştırma Görünümleri:**
- Yan yana tablo (2025 vs 2026)
- Çizgi grafik (yıl bazlı trend)
- Tarla bazlı yıllık karşılaştırma
- Sürgün bazlı yıllık karşılaştırma

---

## Modül 18 - Veri Yedekleme ve Dışa Aktarma

### 18.1 Amaç

Çiftçi verisi kritik veridir, kaybedilmemesi gerekir. Düzenli yedekleme ve dışa aktarma.

### 18.2 Özellikler

**Otomatik Yedekleme:**
- Günlük otomatik veritabanı yedeği (Supabase otomatik sağlar)
- Haftalık tam yedek (JSON formatında)
- Point-in-time recovery desteği

**Manuel Dışa Aktarma:**
- Tüm veri JSON olarak indirilebilir
- Modül bazlı Excel dışa aktarma (hasat, finans, envanter ayrı ayrı)
- PDF rapor dışa aktarma
- CSV dışa aktarma (analiz araçları için)

**Veri İçe Aktarma:**
- Excel/CSV'den toplu veri yükleme (ilk kurulumda mevcut verileri aktarmak için)

---

## Modül 19 - Çay Kalite Takibi

### 19.1 Amaç

Toplanan çayın kalite parametrelerini kayıt altına alarak AI analizlerini güçlendirmek.

### 19.2 Kalite Parametreleri

| Alan | Tip | Açıklama |
|------|-----|----------|
| `id` | UUID | Benzersiz kimlik |
| `hasat_giris_id` | FK | Bağlı hasat girişi |
| `nem_orani` | Decimal (nullable) | Yaş çay nem oranı (%) |
| `yaprak_boyutu` | Enum (nullable) | `kucuk`, `orta`, `buyuk` |
| `yaprak_rengi` | Enum (nullable) | `acik_yesil`, `yesil`, `koyu_yesil` |
| `dal_orani` | Decimal (nullable) | Dal/yaprak oranı (%) |
| `hastalık_var_mi` | Boolean | Hastalık belirtisi var mı |
| `hastalik_turu` | String (nullable) | Hastalık türü |
| `genel_kalite` | Enum | `cok_iyi`, `iyi`, `orta`, `dusuk` |
| `notlar` | Text | Ek gözlemler |

**İş Kuralları:**
- Hasat girişinde opsiyonel olarak kalite bilgisi eklenebilir.
- AI asistan kalite-verimlilik korelasyonu analizi yapabilir.
- Kalite düşüşü trendi tespit edildiğinde uyarı.

---

## Modül 20 - QR Kod ile Hızlı Tarla Seçimi

### 20.1 Amaç

Tarlada çalışırken telefon ile QR kod okutarak hızlıca hasat giriş ekranına düşmek.

### 20.2 Çalışma Mantığı

```
1. Her tarlaya sistem tarafından benzersiz QR kod üretilir
2. QR kod yazdırılıp tarlaya asılır (lamine edilmiş)
3. Tarlada telefon ile QR okutulur
4. Uygulama açılır → Hasat Giriş ekranı → Tarla otomatik seçili gelir
5. Sadece tartım miktarı ve diğer bilgiler girilir
```

**QR Kod İçeriği:**
```
tarimcrm://hasat-giris?tarla_id=UUID
```

**Teknik:**
- QR kod üretimi: `qrcode` npm paketi (frontend'de üretilir)
- QR kod okuma: Capacitor Camera/Barcode plugin
- Deep link ile uygulama içi yönlendirme

---

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
