<!--
TarimCRM Modul 3 Spec Dosyasi
========================================
Bu dosya SADECE Modul 3'in spec'idir.
Ana dokumandan (3/21) cikarilmistir.

Bu dosyayi okuyan agent'lar:
- modul-03-tarla.md (gelistirme)
- test-modul-03.md (test)

Diger modulleri referans verirken sadece kisa not dus,
o modulun spec'ini OKUMA.
-->

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