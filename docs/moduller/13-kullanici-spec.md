<!--
TarimCRM Modul 13 Spec Dosyasi
========================================
Bu dosya SADECE Modul 13'in spec'idir.
Ana dokumandan (13/21) cikarilmistir.

Bu dosyayi okuyan agent'lar:
- modul-13-kullanici.md (gelistirme)
- test-modul-13.md (test)

Diger modulleri referans verirken sadece kisa not dus,
o modulun spec'ini OKUMA.
-->

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