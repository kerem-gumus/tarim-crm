<!--
TarimCRM Modul 18 Spec Dosyasi
========================================
Bu dosya SADECE Modul 18'in spec'idir.
Ana dokumandan (18/21) cikarilmistir.

Bu dosyayi okuyan agent'lar:
- modul-18-yedekleme.md (gelistirme)
- test-modul-18.md (test)

Diger modulleri referans verirken sadece kisa not dus,
o modulun spec'ini OKUMA.
-->

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