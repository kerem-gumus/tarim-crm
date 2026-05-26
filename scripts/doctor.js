#!/usr/bin/env node
/**
 * TarimCRM Doctor
 * ----------------
 * Cross-platform tani araci. Yeni makineye gecince veya bir sey calismayinca:
 *   npm run doctor
 *
 * Kontrol ettikleri:
 *  - Node.js versiyonu (.nvmrc ile uyumlu mu?)
 *  - npm versiyonu (engines.npm ile uyumlu mu?)
 *  - .env.local var mi, kritik degiskenler dolu mu?
 *  - Prisma client uretilmis mi?
 *  - node_modules kurulu mu?
 *  - Git config dogru mu?
 *  - OS spesifik kontroller (Mac: Xcode CLI, Windows: Git Bash)
 *
 * Calistirma: Mac, Windows, Linux fark etmez.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const os = require('os');

const RENK = {
  yesil: '\x1b[32m',
  kirmizi: '\x1b[31m',
  sari: '\x1b[33m',
  mavi: '\x1b[36m',
  reset: '\x1b[0m',
  kalin: '\x1b[1m',
};

let hataSayisi = 0;
let uyariSayisi = 0;

function basarili(mesaj) {
  console.log(`${RENK.yesil}✓${RENK.reset} ${mesaj}`);
}

function hata(mesaj, cozum) {
  console.log(`${RENK.kirmizi}✗ ${mesaj}${RENK.reset}`);
  if (cozum) console.log(`  ${RENK.mavi}→ Cozum:${RENK.reset} ${cozum}`);
  hataSayisi++;
}

function uyari(mesaj, cozum) {
  console.log(`${RENK.sari}⚠ ${mesaj}${RENK.reset}`);
  if (cozum) console.log(`  ${RENK.mavi}→ Oneri:${RENK.reset} ${cozum}`);
  uyariSayisi++;
}

function baslik(metin) {
  console.log(`\n${RENK.kalin}${RENK.mavi}=== ${metin} ===${RENK.reset}`);
}

function calistir(komut) {
  try {
    return execSync(komut, { encoding: 'utf-8', stdio: ['pipe', 'pipe', 'pipe'] }).trim();
  } catch (err) {
    return null;
  }
}

// =====================================================
// 1. Node.js Versiyon Kontrolu
// =====================================================
baslik('Node.js Versiyonu');

const nvmrcYolu = path.join(__dirname, '..', '.nvmrc');
let beklenenMajor = 20;
if (fs.existsSync(nvmrcYolu)) {
  beklenenMajor = parseInt(fs.readFileSync(nvmrcYolu, 'utf-8').trim(), 10);
}

const mevcutNodeVersion = process.version.replace('v', '');
const mevcutMajor = parseInt(mevcutNodeVersion.split('.')[0], 10);

if (mevcutMajor === beklenenMajor) {
  basarili(`Node.js ${mevcutNodeVersion} (beklenen: ${beklenenMajor}.x)`);
} else {
  hata(
    `Node.js ${mevcutNodeVersion}, beklenen: ${beklenenMajor}.x`,
    `nvm use ${beklenenMajor}  (eger nvm yoksa: https://github.com/nvm-sh/nvm)`,
  );
}

// =====================================================
// 2. npm Versiyon Kontrolu
// =====================================================
baslik('npm Versiyonu');

const npmVersion = calistir('npm --version');
if (npmVersion) {
  const npmMajor = parseInt(npmVersion.split('.')[0], 10);
  if (npmMajor >= 10) {
    basarili(`npm ${npmVersion} (beklenen: >=10.0.0)`);
  } else {
    uyari(`npm ${npmVersion}, beklenen: >=10.0.0`, 'npm install -g npm@latest');
  }
} else {
  hata('npm bulunamadi', 'Node.js kurulumunu kontrol et');
}

// =====================================================
// 3. node_modules Kontrolu
// =====================================================
baslik('Bagimliliklar');

const nodeModulesYolu = path.join(__dirname, '..', 'node_modules');
if (fs.existsSync(nodeModulesYolu)) {
  basarili('node_modules kurulu');
} else {
  hata('node_modules eksik', 'npm ci');
}

const lockYolu = path.join(__dirname, '..', 'package-lock.json');
if (fs.existsSync(lockYolu)) {
  basarili('package-lock.json mevcut');
} else {
  uyari(
    'package-lock.json eksik',
    'Bu cross-platform tutarliligi bozar. npm install ile uret ve commit et.',
  );
}

// =====================================================
// 4. .env.local Kontrolu
// =====================================================
baslik('Ortam Degiskenleri');

const envYolu = path.join(__dirname, '..', '.env.local');
const envSablonYolu = path.join(__dirname, '..', '.env.example');

if (fs.existsSync(envYolu)) {
  basarili('.env.local mevcut');

  const envIcerigi = fs.readFileSync(envYolu, 'utf-8');
  const kritikDegiskenler = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    'DATABASE_URL',
    'NEXTAUTH_SECRET',
  ];

  for (const dvk of kritikDegiskenler) {
    const regex = new RegExp(`^${dvk}=(.+)$`, 'm');
    const eslesme = envIcerigi.match(regex);
    if (eslesme && eslesme[1].trim() !== '' && eslesme[1].trim() !== '""') {
      basarili(`${dvk} dolu`);
    } else {
      hata(`${dvk} bos veya yok`, `.env.local icinde ${dvk}= satirini doldur`);
    }
  }
} else {
  hata(
    '.env.local yok',
    process.platform === 'win32'
      ? 'copy .env.example .env.local  (sonra degerleri doldur)'
      : 'cp .env.example .env.local  (sonra degerleri doldur)',
  );
}

// =====================================================
// 5. Prisma Kontrolu
// =====================================================
baslik('Prisma');

const prismaClientYolu = path.join(__dirname, '..', 'node_modules', '.prisma', 'client');
if (fs.existsSync(prismaClientYolu)) {
  basarili('Prisma client uretilmis');
} else {
  uyari('Prisma client uretilmemis', 'npx prisma generate');
}

const schemaYolu = path.join(__dirname, '..', 'prisma', 'schema.prisma');
if (fs.existsSync(schemaYolu)) {
  basarili('prisma/schema.prisma mevcut');
} else {
  hata('prisma/schema.prisma yok', 'Veritabani semasi olusturulmali');
}

// =====================================================
// 6. Git Kontrolu
// =====================================================
baslik('Git Konfigurasyonu');

const gitUserName = calistir('git config --global user.name');
const gitUserEmail = calistir('git config --global user.email');

if (gitUserName) {
  basarili(`git user.name: ${gitUserName}`);
} else {
  uyari('git user.name ayarli degil', 'git config --global user.name "Adin"');
}

if (gitUserEmail) {
  basarili(`git user.email: ${gitUserEmail}`);
} else {
  uyari('git user.email ayarli degil', 'git config --global user.email "you@example.com"');
}

// CRLF/LF kontrolu (Windows kritik)
if (process.platform === 'win32') {
  const autocrlf = calistir('git config --global core.autocrlf');
  if (autocrlf === 'false') {
    basarili('Windows: core.autocrlf=false (.gitattributes yonetiyor)');
  } else {
    uyari(
      `Windows: core.autocrlf=${autocrlf || '(ayarsiz)'}`,
      'git config --global core.autocrlf false  (.gitattributes ile catismasin)',
    );
  }
}

// =====================================================
// 7. OS Spesifik Kontroller
// =====================================================
baslik(`Isletim Sistemi: ${os.platform()} (${os.arch()})`);

if (process.platform === 'darwin') {
  // Mac
  const xcodeSelect = calistir('xcode-select -p');
  if (xcodeSelect) {
    basarili(`Xcode CLI Tools: ${xcodeSelect}`);
  } else {
    uyari('Xcode CLI Tools yok (iOS build icin gerekli)', 'xcode-select --install');
  }

  if (os.arch() === 'arm64') {
    basarili('Apple Silicon (M1/M2/M3) tespit edildi');
  }
} else if (process.platform === 'win32') {
  // Windows
  const bashVar = calistir('where bash');
  if (bashVar) {
    basarili('Git Bash mevcut');
  } else {
    uyari(
      'Git Bash bulunamadi',
      'Bazi script\'ler PowerShell\'de calismayabilir. Git for Windows kur.',
    );
  }
}

// =====================================================
// 8. Husky Kontrolu
// =====================================================
baslik('Git Hooks (Husky)');

const huskyYolu = path.join(__dirname, '..', '.husky', '_');
if (fs.existsSync(huskyYolu)) {
  basarili('Husky kurulu');
} else {
  uyari('Husky kurulmamis', 'npm run prepare  (veya npx husky install)');
}

// =====================================================
// Ozet
// =====================================================
console.log('\n' + '='.repeat(50));
if (hataSayisi === 0 && uyariSayisi === 0) {
  console.log(`${RENK.yesil}${RENK.kalin}✓ Tum kontroller basarili. Geliştirmeye hazirsin!${RENK.reset}`);
} else {
  console.log(
    `${RENK.kalin}Ozet: ${RENK.kirmizi}${hataSayisi} hata${RENK.reset}${RENK.kalin}, ${RENK.sari}${uyariSayisi} uyari${RENK.reset}`,
  );
  if (hataSayisi > 0) {
    console.log(
      `${RENK.kirmizi}Hatalari cozmeden gelistirmeye baslayamayabilirsin.${RENK.reset}`,
    );
    process.exit(1);
  }
}
