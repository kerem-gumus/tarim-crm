<!--
TarimCRM Modul 8 Spec Dosyasi
========================================
Bu dosya SADECE Modul 8'in spec'idir.
Ana dokumandan (8/21) cikarilmistir.

Bu dosyayi okuyan agent'lar:
- modul-08-envanter.md (gelistirme)
- test-modul-08.md (test)

Diger modulleri referans verirken sadece kisa not dus,
o modulun spec'ini OKUMA.
-->

## Modül 8 - Malzeme ve Envanter Yönetimi

### 8.1 Malzeme Kategorileri

```
Malzeme Kategorileri:
├── Gübreler
│   ├── Kimyasal Gübre
│   ├── Organik Gübre
│   ├── Yaprak Gübresi
│   └── Diğer Gübre
├── Tarım İlaçları
│   ├── Herbisit (Yabancı Ot)
│   ├── Fungisit (Mantar)
│   ├── İnsektisit (Böcek)
│   └── Diğer İlaç
├── Tarım Aletleri ve Makineler
│   ├── Çay Toplama Makinesi
│   ├── Motorlu Testere
│   ├── Sırt Tırpanı
│   ├── Budama Makası
│   ├── Çapa Makinesi
│   └── Diğer Alet
├── Yakıt ve Sarf Malzemeleri
│   ├── Benzin
│   ├── Mazot
│   ├── Motor Yağı
│   ├── 2T Yağ (Karışım Yağı)
│   ├── Zincir Yağı
│   ├── Temizlik Spreyi
│   └── Diğer Sarf
├── Yedek Parçalar
│   ├── Bıçak / Kesici
│   ├── Filtre
│   ├── Kayış
│   ├── Buji
│   └── Diğer Yedek Parça
└── Diğer Malzemeler
    ├── Çuval / Torba
    ├── İp / Bağ
    └── Diğer
```

### 8.2 Malzeme Kayıt

**Malzeme Alanları:**

| Alan | Tip | Açıklama |
|------|-----|----------|
| `id` | UUID | Benzersiz kimlik |
| `malzeme_adi` | String | Malzeme adı |
| `kategori` | Enum | Yukarıdaki kategorilerden |
| `alt_kategori` | String | Alt kategori |
| `birim` | Enum | `adet`, `kg`, `litre`, `paket`, `cuval` |
| `mevcut_stok` | Decimal | Anlık stok miktarı |
| `minimum_stok` | Decimal | Uyarı eşiği |
| `birim_fiyat` | Decimal | Son alım fiyatı |
| `depo_konumu` | String (nullable) | Depolama yeri |
| `durum` | Enum | `aktif`, `pasif` |
| `notlar` | Text | Ek notlar |

### 8.3 Stok Hareketleri

| Alan | Tip | Açıklama |
|------|-----|----------|
| `id` | UUID | Benzersiz kimlik |
| `malzeme_id` | FK | Malzeme |
| `hareket_tipi` | Enum | `giris`, `cikis`, `fire`, `iade` |
| `miktar` | Decimal | Hareket miktarı |
| `birim_fiyat` | Decimal (nullable) | Alım fiyatı (giriş ise) |
| `toplam_tutar` | Decimal (nullable) | Toplam maliyet |
| `tarla_id` | FK (nullable) | Kullanıldığı tarla |
| `tedarikci` | String (nullable) | Tedarikçi adı |
| `fatura_no` | String (nullable) | Fatura numarası |
| `tarih` | Date | Hareket tarihi |
| `notlar` | Text | Açıklama |

**İş Kuralları:**
- Stok girişi yapıldığında mevcut_stok artar, çıkışta azalır.
- minimum_stok altına düşünce bildirim gönderilir.
- Gübre/ilaç kullanımı tarla bazlı izlenebilir.
- Stok çıkışı maliyet olarak finans modülüne gider kaydı düşer.

### 8.4 Makine/Ekipman Takibi

| Alan | Tip | Açıklama |
|------|-----|----------|
| `id` | UUID | Benzersiz kimlik |
| `ekipman_adi` | String | Ekipman adı |
| `kategori` | String | Kategori |
| `marka` | String (nullable) | Marka |
| `model` | String (nullable) | Model |
| `seri_no` | String (nullable) | Seri numarası |
| `satin_alma_tarihi` | Date (nullable) | Alım tarihi |
| `satin_alma_fiyati` | Decimal (nullable) | Alım fiyatı |
| `garanti_bitis` | Date (nullable) | Garanti bitiş |
| `son_bakim_tarihi` | Date (nullable) | Son bakım |
| `sonraki_bakim_tarihi` | Date (nullable) | Planlanan bakım |
| `durum` | Enum | `aktif`, `bakimda`, `arızalı`, `hurda` |
| `calisma_saati` | Decimal (nullable) | Toplam çalışma saati |
| `notlar` | Text | Ek notlar |

**İş Kuralları:**
- Bakım zamanı geldiğinde bildirim gönderilir.
- Garanti süresi takip edilir.
- Yakıt/yağ tüketimleri stok hareketleriyle ilişkilendirilebilir.

---