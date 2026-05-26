# TarimCRM - Universal Agent Kurallari

> Bu dosya Antigravity, Claude Code, Cursor, Windsurf, OpenCode gibi cross-tool standardini
> destekleyen AI gelistirme araclarinin hepsi tarafindan okunur. Tool-spesifik kurallar
> her aracin kendi dosyasinda (GEMINI.md, CLAUDE.md, .cursorrules vb.). GEMINI.md cakisma
> durumunda oncelik kazanir.

## Proje

TarimCRM - Cay tarimi yonetim sistemi. Next.js 14 + Supabase + Prisma + Capacitor + 21 modul.

## Mimari

Modüler skill mimarisi. 49 skill `.agents/skills/<ad>/SKILL.md` formatinda. 21 modul spec'i
`docs/moduller/XX-NAME-spec.md`. Detaylar GEMINI.md'de.

## Kodlama Kurallari (Kritik)

### Dil: %100 Turkce ASCII
- Degisken/fonksiyon: camelCase Turkce (`toplamMiktar`, `hasatGirisiOlustur`)
- Component/type: PascalCase Turkce (`HasatGirisFormu`)
- DB tablo/sutun: snake_case Turkce (`hasat_girisleri`, `tartim_miktari_kg`)
- Enum degeri: snake_case (`ton_isi`, `odeme_bekleniyor`)
- Dosya/klasor: kebab-case ASCII (`hasat-girisi`, `cay-kalite`)
- Yorum/string/hata: Turkce karakter SERBESTtir (ı,ş,ç,ö,ü,ğ)

### Stack
- Next.js 14 App Router (server components default, "use client" minimum)
- Prisma ORM + Supabase PostgreSQL
- TanStack Query + Zustand (state)
- Tailwind + shadcn/ui (UI)
- Zod (validation)
- Vitest (test)

### Dosya Konumlari
- Sayfa: `src/app/(dashboard)/<modul>/...`
- API: `src/app/api/<modul>/...`
- Component: `src/components/<modul>/...`
- Type: `src/types/<modul>.ts`
- Yardimci: `src/lib/<modul>.ts`

## Cross-Platform (Mac M2 + Windows)

- Node 20 (zorunlu, `.nvmrc` + `engines`)
- `npm ci` kullan, asla `npm install`
- `package-lock.json` mutlaka commit
- Path'lerde `path.join`, asla hardcoded `/` veya `\`
- Script'lerde env degiskeni icin `cross-env`
- iOS build sadece Mac'te calisir

## Sorun Cikarsa

```bash
npm run doctor    # Tam tani
```

## Yapma Listesi (Tum Tool'lar Icin)

- Ana TarimCRM_Proje_Dokumani.md'yi OKUMA (2050 satir). Onun yerine ilgili
  `docs/moduller/XX-spec.md` dosyasini oku.
- Birden fazla modul ayni anda degistirme. Once orchestrator/dagitici sirasinda gelir.
- Naming convention'larini kirma. ASCII Turkce zorunlu.
- Test yazimini atla. Her modul kendi vitest test'iyle birlikte gelmeli.
