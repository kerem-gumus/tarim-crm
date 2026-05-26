<!--
TarimCRM Modul 4 Spec Dosyasi
========================================
Bu dosya SADECE Modul 4'in spec'idir.
Ana dokumandan (4/21) cikarilmistir.

Bu dosyayi okuyan agent'lar:
- modul-04-ciftci.md (gelistirme)
- test-modul-04.md (test)

Diger modulleri referans verirken sadece kisa not dus,
o modulun spec'ini OKUMA.
-->

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