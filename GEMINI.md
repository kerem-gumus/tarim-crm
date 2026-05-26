# TarimCRM - Antigravity Baglam Dosyasi

> Bu dosya Antigravity'nin proje basinda otomatik okudugu ana baglam dosyasidir.
> Cross-tool uyumluluk icin ayni kurallar AGENTS.md'de de var (Antigravity oncelik GEMINI.md'ye verir).

## Proje Ozeti

**TarimCRM**: Cay tarimi yonetim sistemi. 21 modul, Next.js 14 + Supabase + Prisma + Capacitor.
Detayli proje dokumantasyonu icin: `docs/moduller/` klasoru (her modul ayri spec dosyasi).

## ANTIGRAVITY KULLANIM TALIMATI

Bu proje **modüler skill mimarisi** ile kurulmustur. Her modul ve test icin ayri bir skill var.
Sen (Gemini/Claude/herhangi bir Antigravity agent'i) bir gorev aldiginda:

1. **Skill'leri ezbere okuma.** Antigravity skill'leri ihtiyac duyuldugunda otomatik yukler.
2. **Dogru skill'i sec.** `.agents/skills/<skill-adi>/SKILL.md` formatinda 49 skill var:
   - 1 `orchestrator` (merkez dagitici)
   - 21 modul skill'i: `modul-01-hasat` -> `modul-21-mobil`
   - 21 test skill'i: `test-modul-01` -> `test-modul-21`
   - 6 yatay skill: `yatay-prisma`, `yatay-ui`, `yatay-api`, `yatay-auth`, `yatay-mobil`, `yatay-devops`
3. **Modul agent'i bittikten sonra:** otomatik olarak test skill'i yuklenir, kod denetlenir.

## Skill Yonlendirme Tablosu

| Anahtar Kelime | Skill |
|---------------|-------|
| hasat, donem, surgun, tartim | `modul-01-hasat` |
| isci, ekip, yevmiye, ton isi | `modul-02-iscilik` |
| tarla, donum, verimlilik, koordinat | `modul-03-tarla` |
| ciftci, cay-kur no | `modul-04-ciftci` |
| musteri, alici, kurumsal, pesincu | `modul-05-musteri` |
| kontenjan, bakiye, devir | `modul-06-kontenjan` |
| finans, gelir, gider, alacak, borc | `modul-07-finans` |
| malzeme, stok, envanter, ekipman | `modul-08-envanter` |
| ai, asistan, analiz | `modul-09-asistan` |
| rapor, dashboard, grafik | `modul-10-raporlama` |
| hava, sicaklik, yagis | `modul-11-hava-durumu` |
| bildirim, uyari, hatirlatma | `modul-12-bildirim` |
| kullanici, rol, yetki, login | `modul-13-kullanici` |
| aktivite log, denetim | `modul-14-aktivite-log` |
| harita, leaflet | `modul-15-harita` |
| fotograf, upload | `modul-16-fotograf` |
| sezon karsilastirma | `modul-17-sezon-karsilastirma` |
| yedek, export, import | `modul-18-yedekleme` |
| kalite, nem, yaprak | `modul-19-cay-kalite` |
| qr kod | `modul-20-qr-kod` |
| mobil, ios, android, capacitor | `modul-21-mobil` |
| prisma, schema, db model | `yatay-prisma` |
| ui komponent, shadcn | `yatay-ui` |
| api route, endpoint | `yatay-api` |
| supabase auth, session | `yatay-auth` |
| capacitor build, ios/android build | `yatay-mobil` |
| build hatasi, deploy, hostinger | `yatay-devops` |

## Workflow'lar

`.agents/workflows/` klasorunde slash komutlar tanimli:
- `/yeni-modul <modul-no>` -> ilgili modulu sirayla gelistirir + test eder
- `/duzelt <modul-no>` -> ilgili modul kodunu duzeltir
- `/test-tum` -> tum testleri sirayla calistir

## Zorunlu Kodlama Kurallari

Tum kod %100 Turkce yazilir (ASCII karakterler):
- Degisken: `toplamMiktar`, `hasatGirisi` (camelCase)
- Fonksiyon: `kontenjanHesapla()`, `hasatGirisiOlustur()`
- DB tablo/sutun: `hasat_girisleri`, `tartim_miktari_kg` (snake_case)
- Component: `HasatGirisFormu.tsx` (PascalCase)
- Hook: `useHasatGirisi.ts`
- Enum degeri: `ton_isi`, `odeme_bekleniyor`
- Yorum, hata mesaji, string: Turkce karakter SERBESTtir (ı,ş,ç,ö,ü,ğ)
- Dosya/klasor adi: ASCII Turkce (cay-kalite, hasat-girisi)

## Hizli Komutlar

```bash
npm run doctor              # Sistem tani (yeni makinede ilk komut)
npm ci                      # Bagimliliklari kur (lock'a uyumlu)
npm run dev                 # localhost:3000
npm run build               # Production build
npx prisma generate         # Prisma client yenile
npx prisma db push          # Schema'yi DB'ye uygula
npx prisma studio           # DB gorsel arayuz
```

## Cross-Platform Notlari

- Mac M2 ve Windows PC arasinda gecis: `git pull && npm ci` yeterli
- iOS build SADECE Mac'te calisir, Windows'ta sadece Android + web
- Path'lerde her zaman `path.join`, asla hardcoded `/` veya `\`
- Sorun cikarsa: `npm run doctor` ilk yapilacak

## Anahtar Dosyalar (Konum)

- Modul spec'leri: `docs/moduller/XX-NAME-spec.md`
- Skill tanimlari: `.agents/skills/<skill-adi>/SKILL.md`
- Team personas: `.agents/agents.md`
- Workflow'lar: `.agents/workflows/`
- Prisma schema: `prisma/schema.prisma`
- Doctor: `scripts/doctor.js`
- Hostinger server: `server.js`
