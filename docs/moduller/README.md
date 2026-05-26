# TarimCRM Modul Spec'leri - Index

Bu klasor 21 modulun spec dosyalarini icerir. Her dosya ana dokumanin bir modulunu icerir.

Antigravity skill'leri SADECE kendi spec dosyalarini okur (token tasarrufu).

| No | Modul | Spec Dosyasi | Skill |
|----|-------|--------------|-------|
| 1 | Hasat Yonetimi | `01-hasat-spec.md` | `.agents/skills/modul-01-hasat/` |
| 2 | Iscilik ve Ekip Yonetimi | `02-iscilik-spec.md` | `.agents/skills/modul-02-iscilik/` |
| 3 | Tarla Yonetimi | `03-tarla-spec.md` | `.agents/skills/modul-03-tarla/` |
| 4 | Ciftci Yonetimi | `04-ciftci-spec.md` | `.agents/skills/modul-04-ciftci/` |
| 5 | Musteri Yonetimi | `05-musteri-spec.md` | `.agents/skills/modul-05-musteri/` |
| 6 | Kontenjan ve Satis Sistemi | `06-kontenjan-spec.md` | `.agents/skills/modul-06-kontenjan/` |
| 7 | Finans ve Odeme Yonetimi | `07-finans-spec.md` | `.agents/skills/modul-07-finans/` |
| 8 | Malzeme ve Envanter Yonetimi | `08-envanter-spec.md` | `.agents/skills/modul-08-envanter/` |
| 9 | Akilli Asistan (AI) | `09-asistan-spec.md` | `.agents/skills/modul-09-asistan/` |
| 10 | Raporlama ve Dashboard | `10-raporlama-spec.md` | `.agents/skills/modul-10-raporlama/` |
| 11 | Hava Durumu Entegrasyonu | `11-hava-durumu-spec.md` | `.agents/skills/modul-11-hava-durumu/` |
| 12 | Bildirim ve Uyari Sistemi | `12-bildirim-spec.md` | `.agents/skills/modul-12-bildirim/` |
| 13 | Kullanici ve Yetkilendirme | `13-kullanici-spec.md` | `.agents/skills/modul-13-kullanici/` |
| 14 | Aktivite Logu / Denetim Izi | `14-aktivite-log-spec.md` | `.agents/skills/modul-14-aktivite-log/` |
| 15 | Tarla Harita Gorunumu | `15-harita-spec.md` | `.agents/skills/modul-15-harita/` |
| 16 | Fotograf Yonetimi | `16-fotograf-spec.md` | `.agents/skills/modul-16-fotograf/` |
| 17 | Sezonluk Karsilastirma | `17-sezon-karsilastirma-spec.md` | `.agents/skills/modul-17-sezon-karsilastirma/` |
| 18 | Veri Yedekleme ve Disa Aktarma | `18-yedekleme-spec.md` | `.agents/skills/modul-18-yedekleme/` |
| 19 | Cay Kalite Takibi | `19-cay-kalite-spec.md` | `.agents/skills/modul-19-cay-kalite/` |
| 20 | QR Kod ile Hizli Tarla Secimi | `20-qr-kod-spec.md` | `.agents/skills/modul-20-qr-kod/` |
| 21 | Mobil Uygulama (iOS + Android) | `21-mobil-spec.md` | `.agents/skills/modul-21-mobil/` |

## Onerilen Gelistirme Sirasi

Doc'taki kritik onceliklere gore:

1. **Faz 1 - Altyapi:** Modul 13 (Auth) -> Modul 14 (Log altyapisi) -> Modul 4 (Ciftci) -> Modul 3 (Tarla) -> Modul 2 (Isci) -> Modul 5 (Musteri)
2. **Faz 2 - Cekirdek:** Modul 1 (Hasat) -> Modul 6 (Kontenjan)
3. **Faz 3 - Finans:** Modul 7 (Finans)
4. **Faz 4 - Envanter:** Modul 8 (Envanter) -> Modul 16 (Fotograf)
5. **Faz 5 - Raporlama:** Modul 10 (Dashboard) -> Modul 17 (Sezon Karsilastirma) -> Modul 18 (Yedekleme)
6. **Faz 6 - Yardimcilar:** Modul 11 (Hava) -> Modul 12 (Bildirim) -> Modul 15 (Harita) -> Modul 19 (Kalite) -> Modul 20 (QR)
7. **Faz 7 - Mobil:** Modul 21 (Capacitor)
8. **Faz 8 - AI:** Modul 9 (Asistan)

## Antigravity'de Kullanim

Antigravity Manager view'da gorev yazarken anahtar kelimeleri kullan:

```
"Ciftci CRUD sayfasini olustur"
-> Orchestrator skill'i devreye girer
-> modul-04-ciftci skill'i yuklenir
-> 04-ciftci-spec.md okunur
-> Kod yazilir
-> test-modul-04 skill'i otomatik calisir
-> Rapor verilir
```

Veya direkt slash komut:
```
/yeni-modul 4
```
