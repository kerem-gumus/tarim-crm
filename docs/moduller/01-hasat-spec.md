<!--
TarimCRM Modul 1 Spec Dosyasi
========================================
Bu dosya SADECE Modul 1'in spec'idir.
Ana dokumandan (1/21) cikarilmistir.

Bu dosyayi okuyan agent'lar:
- modul-01-hasat.md (gelistirme)
- test-modul-01.md (test)

Diger modulleri referans verirken sadece kisa not dus,
o modulun spec'ini OKUMA.
-->

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