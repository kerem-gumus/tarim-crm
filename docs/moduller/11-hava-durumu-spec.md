<!--
TarimCRM Modul 11 Spec Dosyasi
========================================
Bu dosya SADECE Modul 11'in spec'idir.
Ana dokumandan (11/21) cikarilmistir.

Bu dosyayi okuyan agent'lar:
- modul-11-hava-durumu.md (gelistirme)
- test-modul-11.md (test)

Diger modulleri referans verirken sadece kisa not dus,
o modulun spec'ini OKUMA.
-->

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