<!--
TarimCRM Modul 12 Spec Dosyasi
========================================
Bu dosya SADECE Modul 12'in spec'idir.
Ana dokumandan (12/21) cikarilmistir.

Bu dosyayi okuyan agent'lar:
- modul-12-bildirim.md (gelistirme)
- test-modul-12.md (test)

Diger modulleri referans verirken sadece kisa not dus,
o modulun spec'ini OKUMA.
-->

## Modül 12 - Bildirim ve Uyarı Sistemi *(Benim Önerim)*

### 12.1 Bildirim Türleri

| Bildirim | Tetikleyici | Öncelik |
|----------|------------|---------|
| Stok uyarısı | Stok < minimum_stok | 🔴 Yüksek |
| Ödeme vadesi | Vade tarihine 3 gün kala | 🟡 Orta |
| Bakım hatırlatma | Ekipman bakım tarihi yaklaştığında | 🟡 Orta |
| Kontenjan değişimi | Yeni kontenjan tanımlandığında | 🔴 Yüksek |
| Sürgün kapanış | Sürgün kapandığında özet | 🟢 Bilgi |
| Hava uyarısı | Don/dolu/aşırı yağış tahmini | 🔴 Yüksek |
| Verim düşüşü | Tarla veriminde %20+ düşüş | 🟡 Orta |
| Garanti bitiş | Ekipman garantisi dolmadan 30 gün önce | 🟢 Bilgi |

### 12.2 Bildirim Kanalları

- Uygulama içi bildirim (in-app notification)
- Push notification (mobil)
- SMS (kritik uyarılar için - opsiyonel)

---