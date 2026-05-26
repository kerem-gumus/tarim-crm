<!--
TarimCRM Modul 6 Spec Dosyasi
========================================
Bu dosya SADECE Modul 6'in spec'idir.
Ana dokumandan (6/21) cikarilmistir.

Bu dosyayi okuyan agent'lar:
- modul-06-kontenjan.md (gelistirme)
- test-modul-06.md (test)

Diger modulleri referans verirken sadece kisa not dus,
o modulun spec'ini OKUMA.
-->

## Modül 6 - Kontenjan ve Satış Sistemi

### 6.1 Kontenjan Tanımı

Devlet (Çay-Kur) belirli tarihlerde kontenjan açar. Kontenjan, günlük olarak ne kadar yaş çay satılabileceğini belirler.

**Kontenjan Alanları:**

| Alan | Tip | Açıklama |
|------|-----|----------|
| `id` | UUID | Benzersiz kimlik |
| `surgun_id` | FK | Bağlı sürgün |
| `musteri_id` | FK | Devlet müşterisi |
| `baslangic_tarihi` | Date | Kontenjan başlangıcı |
| `bitis_tarihi` | Date (nullable) | Kontenjan bitişi |
| `gunluk_kontenjan_kg` | Decimal | Günlük satılabilecek kg |
| `durum` | Enum | `aktif`, `kapali` |

### 6.2 Günlük Kontenjan Hesaplama Mantığı

Bu sistemin en kritik iş kurallarından biridir.

**Temel Kavramlar:**
- `tartim_miktari`: Tarladan tartılan gerçek çay miktarı (kg)
- `gunluk_kontenjan`: Devletin o gün için belirlediği satılabilecek kg
- `satis_miktari`: Müşteriye fiilen satılan miktar (kg)
- `fark`: tartım ile satış arasındaki fark

**Senaryo 1: Tartım < Kontenjan (Borç Oluşur)**

```
Gün 1:
  Tartım: 500 kg
  Kontenjan: 650 kg
  Satış: Alıcı 650kg olarak işlerse → 650 kg
  Borç (bize): 650 - 500 = 150 kg
  → 150 kg sonraki güne EKSİ bakiye olarak taşınır

Gün 2:
  Tartım: 700 kg
  Kontenjan: 850 kg
  Önceki gün borç: -150 kg (biz borçluyuz)
  Gerçek satış kapasitesi: 850 + 150 = 1000 kg
  → Satış miktarı: 1000 kg olarak hesaplanır
```

**Senaryo 2: Tartım > Kontenjan (Fazla Oluşur)**

```
Gün 1:
  Tartım: 500 kg
  Kontenjan: 450 kg
  Satış: 450 kg (kontenjana göre)
  Fazla: 500 - 450 = 50 kg
  → 50 kg alıcı fazladan aldı, ARTI bakiye olarak taşınır

Gün 2:
  Tartım: 400 kg
  Kontenjan: 450 kg
  Önceki gün fazla: +50 kg (alıcıda fazla var)
  Gerçek satış miktarı: 450 - 50 = 400 kg
  → Satış miktarı: 400 kg olarak yansır
```

**Kontenjan Takip Tablosu:**

| Alan | Tip | Açıklama |
|------|-----|----------|
| `id` | UUID | Benzersiz kimlik |
| `kontenjan_id` | FK | Bağlı kontenjan tanımı |
| `tarih` | Date | İşlem tarihi |
| `tartim_kg` | Decimal | O günkü tartım |
| `gunluk_kontenjan_kg` | Decimal | O günkü kontenjan |
| `onceki_bakiye_kg` | Decimal | Önceki günden devir (+/-) |
| `hesaplanan_satis_kg` | Decimal | Hesaplanan satış miktarı |
| `kalan_bakiye_kg` | Decimal | Sonraki güne devir |

**Hesaplama Formülü:**

```
hesaplanan_satis = gunluk_kontenjan + onceki_bakiye (negatifse ekler, pozitifse çıkarır)
kalan_bakiye = tartim - hesaplanan_satis

Eğer kalan_bakiye > 0 → Alıcıda fazla var (sonraki günden düşülür)
Eğer kalan_bakiye < 0 → Biz borçluyuz (sonraki güne eklenir)
Eğer kalan_bakiye = 0 → Dengede
```

---