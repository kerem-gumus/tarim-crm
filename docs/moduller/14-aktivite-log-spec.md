<!--
TarimCRM Modul 14 Spec Dosyasi
========================================
Bu dosya SADECE Modul 14'in spec'idir.
Ana dokumandan (14/21) cikarilmistir.

Bu dosyayi okuyan agent'lar:
- modul-14-aktivite-log.md (gelistirme)
- test-modul-14.md (test)

Diger modulleri referans verirken sadece kisa not dus,
o modulun spec'ini OKUMA.
-->

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