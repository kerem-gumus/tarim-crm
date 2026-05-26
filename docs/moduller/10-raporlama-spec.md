<!--
TarimCRM Modul 10 Spec Dosyasi
========================================
Bu dosya SADECE Modul 10'in spec'idir.
Ana dokumandan (10/21) cikarilmistir.

Bu dosyayi okuyan agent'lar:
- modul-10-raporlama.md (gelistirme)
- test-modul-10.md (test)

Diger modulleri referans verirken sadece kisa not dus,
o modulun spec'ini OKUMA.
-->

## Modül 10 - Raporlama ve Dashboard

### 10.1 Ana Dashboard

```
┌────────────────────────────────────────────────────────┐
│                    ANA DASHBOARD                        │
├────────────┬────────────┬────────────┬────────────────┤
│ Aktif      │ Bugünkü    │ Toplam     │ Net Kâr/Zarar │
│ Sürgün: 2  │ Hasat:     │ Hasat:     │               │
│            │ 1,250 kg   │ 45,600 kg  │ ₺125,400      │
├────────────┴────────────┴────────────┴────────────────┤
│                                                        │
│  📊 Günlük Hasat Grafiği (son 30 gün)                 │
│  ████████████████████████████████████                  │
│                                                        │
├────────────────────────┬──────────────────────────────┤
│ Tarla Bazlı Verim      │ Kontenjan Durumu             │
│ ─────────────────      │ ─────────────────            │
│ Tarla A: 420 kg/dönüm  │ Bugünkü: 850 kg             │
│ Tarla B: 380 kg/dönüm  │ Bakiye: -150 kg             │
│ Tarla C: 510 kg/dönüm  │ Satış: 1000 kg              │
├────────────────────────┼──────────────────────────────┤
│ Yaklaşan Ödemeler      │ Stok Uyarıları              │
│ ─────────────────      │ ─────────────────            │
│ Ali Usta Ekibi: ₺2,400 │ ⚠️ Benzin: 5L kaldı        │
│ Çay-Kur: ₺45,000 bekl. │ ⚠️ Motor Yağı: 2L kaldı    │
└────────────────────────┴──────────────────────────────┘
```

### 10.2 Rapor Türleri

- **Günlük Hasat Raporu:** Tarih bazlı, tarla bazlı, müşteri bazlı hasat detayları
- **Sürgün Özet Raporu:** Sürgün kapanışında toplam özet
- **İşçilik Raporu:** Ekip bazlı maliyet analizi, ödeme durumları
- **Tarla Verimlilik Raporu:** Tarla bazlı sürgün karşılaştırmalı verim
- **Kontenjan Raporu:** Günlük kontenjan kullanım detayları ve bakiye geçmişi
- **Finans Raporu:** Gelir-gider, alacak-borç, kâr/zarar
- **Envanter Raporu:** Stok durumu, hareket geçmişi, maliyet
- **Yıllık Karşılaştırma Raporu:** Yıllar arası verimlilik ve finansal karşılaştırma

---