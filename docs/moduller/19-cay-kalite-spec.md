<!--
TarimCRM Modul 19 Spec Dosyasi
========================================
Bu dosya SADECE Modul 19'in spec'idir.
Ana dokumandan (19/21) cikarilmistir.

Bu dosyayi okuyan agent'lar:
- modul-19-cay-kalite.md (gelistirme)
- test-modul-19.md (test)

Diger modulleri referans verirken sadece kisa not dus,
o modulun spec'ini OKUMA.
-->

## Modül 19 - Çay Kalite Takibi

### 19.1 Amaç

Toplanan çayın kalite parametrelerini kayıt altına alarak AI analizlerini güçlendirmek.

### 19.2 Kalite Parametreleri

| Alan | Tip | Açıklama |
|------|-----|----------|
| `id` | UUID | Benzersiz kimlik |
| `hasat_giris_id` | FK | Bağlı hasat girişi |
| `nem_orani` | Decimal (nullable) | Yaş çay nem oranı (%) |
| `yaprak_boyutu` | Enum (nullable) | `kucuk`, `orta`, `buyuk` |
| `yaprak_rengi` | Enum (nullable) | `acik_yesil`, `yesil`, `koyu_yesil` |
| `dal_orani` | Decimal (nullable) | Dal/yaprak oranı (%) |
| `hastalık_var_mi` | Boolean | Hastalık belirtisi var mı |
| `hastalik_turu` | String (nullable) | Hastalık türü |
| `genel_kalite` | Enum | `cok_iyi`, `iyi`, `orta`, `dusuk` |
| `notlar` | Text | Ek gözlemler |

**İş Kuralları:**
- Hasat girişinde opsiyonel olarak kalite bilgisi eklenebilir.
- AI asistan kalite-verimlilik korelasyonu analizi yapabilir.
- Kalite düşüşü trendi tespit edildiğinde uyarı.

---