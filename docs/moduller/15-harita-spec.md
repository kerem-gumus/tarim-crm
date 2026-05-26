<!--
TarimCRM Modul 15 Spec Dosyasi
========================================
Bu dosya SADECE Modul 15'in spec'idir.
Ana dokumandan (15/21) cikarilmistir.

Bu dosyayi okuyan agent'lar:
- modul-15-harita.md (gelistirme)
- test-modul-15.md (test)

Diger modulleri referans verirken sadece kisa not dus,
o modulun spec'ini OKUMA.
-->

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