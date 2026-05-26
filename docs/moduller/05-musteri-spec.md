<!--
TarimCRM Modul 5 Spec Dosyasi
========================================
Bu dosya SADECE Modul 5'in spec'idir.
Ana dokumandan (5/21) cikarilmistir.

Bu dosyayi okuyan agent'lar:
- modul-05-musteri.md (gelistirme)
- test-modul-05.md (test)

Diger modulleri referans verirken sadece kisa not dus,
o modulun spec'ini OKUMA.
-->

## Modül 5 - Müşteri Yönetimi

### 5.1 Müşteri Kayıt

**Müşteri Alanları:**

| Alan | Tip | Açıklama |
|------|-----|----------|
| `id` | UUID | Benzersiz kimlik |
| `musteri_adi` | String | Kişi veya kurum adı |
| `musteri_tipi` | Enum | `kurumsal`, `pesincu` |
| `kurumsal_mi` | Boolean | Kurumsal mı? |
| `devlet_mi` | Boolean | Devlet kurumu mu? (Çay-Kur gibi) |
| `kurum_adi` | String (nullable) | Kurum adı |
| `yetkili_kisi` | String (nullable) | İletişim kişisi |
| `telefon` | String | Telefon |
| `email` | String (nullable) | E-posta |
| `adres` | Text | Adres |
| `vergi_dairesi` | String (nullable) | Vergi dairesi |
| `vergi_no` | String (nullable) | Vergi no |
| `odeme_vade_gun` | Integer | Varsayılan ödeme vadesi (gün) |
| `kontenjan_var_mi` | Boolean | Kontenjan uygulanıyor mu? |
| `durum` | Enum | `aktif`, `pasif` |
| `notlar` | Text | Ek notlar |

**Müşteri Tipleri:**

```
Müşteri Tipi Seçimi:
├── "Kurumsal"
│   ├── Devlet Kurumu mu? 
│   │   ├── Evet → Kontenjan sistemi aktif (Çay-Kur vb.)
│   │   └── Hayır → Normal kurumsal (özel fabrikalar)
│   └── Vade süresi belirlenir
└── "Peşinci" (Perakende Alıcı)
    └── Genelde peşin ödeme, vade opsiyonel
```

**İş Kuralları:**
- `devlet_mi = true` olan müşteriler kontenjan sistemini tetikler.
- Peşinci müşteriler peşin ödeme yapar, vade genelde 0.
- Kurumsal müşterilere vade süresi tanımlanabilir.

---