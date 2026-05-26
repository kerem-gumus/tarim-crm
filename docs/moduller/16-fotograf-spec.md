<!--
TarimCRM Modul 16 Spec Dosyasi
========================================
Bu dosya SADECE Modul 16'in spec'idir.
Ana dokumandan (16/21) cikarilmistir.

Bu dosyayi okuyan agent'lar:
- modul-16-fotograf.md (gelistirme)
- test-modul-16.md (test)

Diger modulleri referans verirken sadece kisa not dus,
o modulun spec'ini OKUMA.
-->

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