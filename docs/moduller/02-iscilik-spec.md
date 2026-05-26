<!--
TarimCRM Modul 2 Spec Dosyasi
========================================
Bu dosya SADECE Modul 2'in spec'idir.
Ana dokumandan (2/21) cikarilmistir.

Bu dosyayi okuyan agent'lar:
- modul-02-iscilik.md (gelistirme)
- test-modul-02.md (test)

Diger modulleri referans verirken sadece kisa not dus,
o modulun spec'ini OKUMA.
-->

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