<!--
TarimCRM Modul 20 Spec Dosyasi
========================================
Bu dosya SADECE Modul 20'in spec'idir.
Ana dokumandan (20/21) cikarilmistir.

Bu dosyayi okuyan agent'lar:
- modul-20-qr-kod.md (gelistirme)
- test-modul-20.md (test)

Diger modulleri referans verirken sadece kisa not dus,
o modulun spec'ini OKUMA.
-->

## Modül 20 - QR Kod ile Hızlı Tarla Seçimi

### 20.1 Amaç

Tarlada çalışırken telefon ile QR kod okutarak hızlıca hasat giriş ekranına düşmek.

### 20.2 Çalışma Mantığı

```
1. Her tarlaya sistem tarafından benzersiz QR kod üretilir
2. QR kod yazdırılıp tarlaya asılır (lamine edilmiş)
3. Tarlada telefon ile QR okutulur
4. Uygulama açılır → Hasat Giriş ekranı → Tarla otomatik seçili gelir
5. Sadece tartım miktarı ve diğer bilgiler girilir
```

**QR Kod İçeriği:**
```
tarimcrm://hasat-giris?tarla_id=UUID
```

**Teknik:**
- QR kod üretimi: `qrcode` npm paketi (frontend'de üretilir)
- QR kod okuma: Capacitor Camera/Barcode plugin
- Deep link ile uygulama içi yönlendirme

---