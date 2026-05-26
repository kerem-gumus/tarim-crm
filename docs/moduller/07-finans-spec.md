<!--
TarimCRM Modul 7 Spec Dosyasi
========================================
Bu dosya SADECE Modul 7'in spec'idir.
Ana dokumandan (7/21) cikarilmistir.

Bu dosyayi okuyan agent'lar:
- modul-07-finans.md (gelistirme)
- test-modul-07.md (test)

Diger modulleri referans verirken sadece kisa not dus,
o modulun spec'ini OKUMA.
-->

## Modül 7 - Finans ve Ödeme Yönetimi

### 7.1 Gelir Takibi

**Gelir Kayıtları:**

| Alan | Tip | Açıklama |
|------|-----|----------|
| `id` | UUID | Benzersiz kimlik |
| `surgun_id` | FK | Bağlı sürgün |
| `musteri_id` | FK | Müşteri |
| `toplam_kg` | Decimal | Sürgün toplam satış |
| `birim_fiyat` | Decimal | kg başı fiyat |
| `toplam_tutar` | Decimal | Toplam gelir |
| `odeme_durumu` | Enum | `odeme_bekleniyor`, `kismi_odendi`, `odendi` |
| `odenen_tutar` | Decimal | Şu ana kadar ödenen |
| `kalan_tutar` | Decimal | Kalan alacak |
| `vade_tarihi` | Date (nullable) | Ödeme vadesi |
| `olusturma_tarihi` | DateTime | Kayıt tarihi |

**İş Kuralları:**
- Sürgün kapatıldığında otomatik olarak gelir kaydı oluşur.
- Durum: "Ödeme Bekleniyor" olarak finans sayfasına düşer.
- Müşteriden kısmi ödemeler alındıkça güncellenir.

### 7.2 Borç/Gider Takibi (Ödemeler Tablosu)

**Ödeme Kayıtları:**

| Alan | Tip | Açıklama |
|------|-----|----------|
| `id` | UUID | Benzersiz kimlik |
| `kategori` | Enum | `iscilik`, `malzeme`, `yakit`, `gubre`, `diger` |
| `aciklama` | String | Açıklama metni |
| `ilgili_ekip_id` | FK (nullable) | İşçi ekibi (işçilik ise) |
| `ilgili_isci_id` | FK (nullable) | Bireysel işçi |
| `hasat_giris_id` | FK (nullable) | Bağlı hasat girişi |
| `tutar` | Decimal | Borç tutarı |
| `odeme_durumu` | Enum | `odenmedi`, `kismi_odendi`, `odendi` |
| `odenen_tutar` | Decimal | Şu ana kadar ödenen |
| `odeme_tarihi` | Date (nullable) | Ödeme yapıldığında |
| `odeme_yontemi` | Enum (nullable) | `nakit`, `banka`, `eft` |
| `olusturma_tarihi` | DateTime | Kayıt tarihi |

**İş Kuralları:**
- Hasat girişinde işçilik seçildiğinde → otomatik borç kaydı oluşur.
- Borç kaydında işçi ekibinin adı görünür.
- Malzeme alımlarında → otomatik gider kaydı oluşur.
- Ödeme yapıldığında borç kaydı güncellenir.

### 7.3 Finans Dashboard Görünümü

```
┌─────────────────────────────────────────────┐
│              FİNANS ÖZETİ                   │
├──────────────────┬──────────────────────────┤
│  ALACAKLAR       │  BORÇLAR                 │
│  ─────────       │  ───────                 │
│  Ödeme Bekleniyor│  İşçilik Borçları        │
│  Kısmi Ödenenler │  Malzeme Borçları        │
│  Toplam Alacak   │  Diğer Giderler          │
│                  │  Toplam Borç             │
├──────────────────┴──────────────────────────┤
│  NET DURUM = Toplam Alacak - Toplam Borç    │
├─────────────────────────────────────────────┤
│  SON İŞLEMLER (timeline)                    │
│  SON ÖDEMELER                               │
└─────────────────────────────────────────────┘
```

---