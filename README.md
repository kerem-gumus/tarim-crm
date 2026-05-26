# 🌿 TarımCRM

Çay tarımı yönetim sistemi. **Antigravity** üzerinde modüler agent mimarisi ile geliştirilir. Next.js 14 + Supabase + Prisma + Capacitor.

---

## ⚡ Hızlı Başlangıç (Mac veya Windows)

İlk kurulum:

```bash
# 1. Repo'yu klonla
git clone <repo-url>
cd tarim-crm

# 2. Node 20 kullan (otomatik .nvmrc okur)
nvm use

# 3. Bağımlılıkları kur (lock'a tam uyumlu)
npm ci

# 4. Ortam değişkenlerini ayarla
cp .env.example .env.local   # Mac/Linux
copy .env.example .env.local # Windows CMD

# 5. Sistem tanısı
npm run doctor

# 6. Antigravity'de projeyi aç
# - Antigravity'yi başlat
# - "New Project" → klasörü ekle (tarim-crm/)
# - GEMINI.md otomatik okunur
```

Sonraki günlerde:

```bash
git pull && npm ci
# Antigravity Manager view'dan göreve devam et
```

---

## 🤖 Antigravity Agent Mimarisi

Bu projenin merkezindeki fikir: **Antigravity orchestrator'ı kullanıcının isteğini analiz eder, doğru skill'i otomatik yükler.**

### Yapı

```
tarim-crm/
├── GEMINI.md                    ← Antigravity ana bağlam dosyası
├── AGENTS.md                    ← Cross-tool universal kurallar
├── .agents/
│   ├── agents.md                ← AI takım personaları (4 rol)
│   ├── skills/                  ← 49 skill, her biri klasör
│   │   ├── orchestrator/SKILL.md
│   │   ├── modul-01-hasat/SKILL.md
│   │   ├── ...
│   │   ├── test-modul-01/SKILL.md
│   │   ├── ...
│   │   └── yatay-prisma/SKILL.md
│   └── workflows/               ← Slash komutlar
│       ├── yeni-modul.md        ← /yeni-modul <no>
│       ├── duzelt.md            ← /duzelt <no> <aciklama>
│       └── test-tum.md          ← /test-tum
├── docs/moduller/               ← 21 modül spec dosyası
├── prisma/schema.prisma
└── src/...
```

### Personalar (4)

| Persona | Görev |
|---------|-------|
| Orchestrator | Dağıtıcı (kod yazmaz, yönlendirir) |
| Modül Geliştirici | Bir modülün kod yazımı |
| Test Denetleyici | Kod kalitesi kontrolü (kod yazmaz) |
| Altyapı Uzmanı | Yatay altyapı (DB, UI, API, Auth, Mobil, DevOps) |

### Skills (49)

| Tip | Sayı |
|-----|------|
| `orchestrator` | 1 |
| `modul-01-hasat` ... `modul-21-mobil` | 21 |
| `test-modul-01` ... `test-modul-21` | 21 |
| `yatay-prisma`, `yatay-ui`, `yatay-api`, `yatay-auth`, `yatay-mobil`, `yatay-devops` | 6 |

### Workflow Örnekleri

```
/yeni-modul 4
→ Çiftçi modülünü baştan sona geliştir (spec oku → DB → API → UI → test → rapor)

/duzelt 1 "ton işi hesaplaması yanlış sonuç veriyor"
→ Modül 1'i bul, sorunu çöz, test et

/test-tum
→ Tüm modüllerin testlerini çalıştır, tablo raporu ver
```

---

## 🖥️ Cross-Platform Geliştirme

Mac M2 ↔ Windows PC arasında geçişte sorun yaşamamak için:

| Sorun | Çözüm |
|-------|-------|
| Farklı Node versiyonu | `.nvmrc` + `package.json#engines` + `engineStrict` |
| Bağımlılık farkı | `package-lock.json` git'te + `npm ci` (asla `npm install`) |
| CRLF/LF satır sonu | `.gitattributes` → `* text=auto eol=lf` |
| ENV scripti farkı | `cross-env` paketi |
| Path ayırıcı (/ vs \\) | Her yerde `path.join` |
| Prisma client farkı | `postinstall: prisma generate` (otomatik) |
| iOS build Mac'te zorunlu | Windows'ta sadece `dev` + Android |

Geçişte yapılacak tek şey: `git pull && npm ci`. Sorun çıkarsa: `npm run doctor`.

---

## 🔑 Kodlama Kuralları (Özet)

Tam liste için `AGENTS.md` ve `GEMINI.md`.

- **Dil: %100 Türkçe** (`toplamMiktar`, `hasatGirisiOlustur`, `HasatGirisFormu`)
- **Karakterler: ASCII** (dosya/değişken isminde ı,ş,ç,ö,ü,ğ YOK; yorum/string'de serbest)
- **Naming:** camelCase (değişken/fonksiyon), PascalCase (component/type), snake_case (DB)

---

## 📋 Sık Kullanılan Komutlar

```bash
# Geliştirme
npm run dev                    # localhost:3000
npm run build                  # Production build
npm run typecheck              # TypeScript kontrolü
npm run lint                   # ESLint
npm run doctor                 # Sistem tanısı

# Test
npm test                       # Vitest

# Veritabanı
npx prisma generate            # Client yenile
npx prisma db push             # Şemayı DB'ye uygula
npx prisma studio              # Görsel DB arayüzü

# Mobil
npm run cap:sync               # Web → native kopyala
npm run cap:open:ios           # Xcode (sadece Mac)
npm run cap:open:android       # Android Studio
```

---

## 🔄 Başka Tool'a Geçiş

Antigravity'den Claude Code'a, Cursor'a veya başka bir agent IDE'ye geçmek istersen:

| Tool | Okuyacağı dosya |
|------|----------------|
| Antigravity | `GEMINI.md` (öncelik) + `AGENTS.md` |
| Claude Code | Önce `CLAUDE.md` ekle (içerik AGENTS.md kopyası) + `.claude/agents/*.md` yapısına dönüştür |
| Cursor | `.cursorrules` ekle (içerik AGENTS.md kopyası) |
| Diğer | `AGENTS.md` (universal standart) okur |

`AGENTS.md` cross-tool standardındadır — tüm modern agent IDE'leri bunu okur.

---

## ❓ Olası Sorunlar

| Sorun | Çözüm |
|-------|-------|
| `npm install` hata veriyor | `npm ci` kullan, `npm install` değil |
| Prisma client hatası | `npx prisma generate` |
| Port 3000 meşgul | `npx kill-port 3000` |
| Mac'te `nvm: command not found` | `source ~/.zshrc` |
| Windows'ta path hatası | Git Bash kullan |
| Antigravity skill'i tetiklemiyor | `.agents/skills/<ad>/SKILL.md` frontmatter'ında `description` kullanıcı isteğiyle uyumlu mu kontrol et |
| Hiçbir şey çalışmıyor | `npm run doctor` |

---

## 📄 Lisans

Bu proje kişisel kullanım amaçlıdır.
