// TarimCRM — Simge oluşturucu (canvas'sız)
// node scripts/icon-olustur.mjs

import { writeFileSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');

function svgOlustur(boyut, metinGoster = true) {
  const m = boyut / 2;
  const yaprakBoy = boyut * 0.36;
  const yaziBoyut = Math.round(boyut * 0.10);
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${boyut}" height="${boyut}" viewBox="0 0 ${boyut} ${boyut}">
  <defs>
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#1a6b1a"/>
      <stop offset="100%" stop-color="#2da02d"/>
    </linearGradient>
    <linearGradient id="leafGrad" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#ffffff" stop-opacity="0.97"/>
      <stop offset="45%" stop-color="#d4f5d4" stop-opacity="0.93"/>
      <stop offset="100%" stop-color="#ffffff" stop-opacity="0.87"/>
    </linearGradient>
    <filter id="shadow">
      <feDropShadow dx="0" dy="${boyut * 0.02}" stdDeviation="${boyut * 0.025}" flood-color="rgba(0,0,0,0.25)"/>
    </filter>
  </defs>

  <!-- Arka plan -->
  <rect width="${boyut}" height="${boyut}" rx="${boyut * 0.22}" ry="${boyut * 0.22}" fill="url(#bgGrad)"/>

  <!-- Yaprak (döndürülmüş, merkez) -->
  <g transform="translate(${m},${metinGoster ? m - boyut * 0.04 : m}) rotate(-25)" filter="url(#shadow)">
    <!-- Ana yaprak şekli -->
    <path d="M0,${-yaprakBoy} C${yaprakBoy * 0.72},${-yaprakBoy * 0.55} ${yaprakBoy * 0.72},${yaprakBoy * 0.55} 0,${yaprakBoy} C${-yaprakBoy * 0.72},${yaprakBoy * 0.55} ${-yaprakBoy * 0.72},${-yaprakBoy * 0.55} 0,${-yaprakBoy} Z" fill="url(#leafGrad)"/>
    <!-- Orta damar -->
    <line x1="0" y1="${-yaprakBoy * 0.85}" x2="0" y2="${yaprakBoy * 0.85}" stroke="#2d7a2d" stroke-width="${boyut * 0.022}" stroke-opacity="0.45"/>
    <!-- Yan damarlar -->
    <line x1="0" y1="${-yaprakBoy * 0.35}" x2="${yaprakBoy * 0.52}" y2="${-yaprakBoy * 0.55}" stroke="#2d7a2d" stroke-width="${boyut * 0.013}" stroke-opacity="0.3"/>
    <line x1="0" y1="${-yaprakBoy * 0.35}" x2="${-yaprakBoy * 0.52}" y2="${-yaprakBoy * 0.55}" stroke="#2d7a2d" stroke-width="${boyut * 0.013}" stroke-opacity="0.3"/>
    <line x1="0" y1="${yaprakBoy * 0.05}" x2="${yaprakBoy * 0.58}" y2="${-yaprakBoy * 0.15}" stroke="#2d7a2d" stroke-width="${boyut * 0.013}" stroke-opacity="0.3"/>
    <line x1="0" y1="${yaprakBoy * 0.05}" x2="${-yaprakBoy * 0.58}" y2="${-yaprakBoy * 0.15}" stroke="#2d7a2d" stroke-width="${boyut * 0.013}" stroke-opacity="0.3"/>
    <line x1="0" y1="${yaprakBoy * 0.42}" x2="${yaprakBoy * 0.50}" y2="${yaprakBoy * 0.22}" stroke="#2d7a2d" stroke-width="${boyut * 0.013}" stroke-opacity="0.3"/>
    <line x1="0" y1="${yaprakBoy * 0.42}" x2="${-yaprakBoy * 0.50}" y2="${yaprakBoy * 0.22}" stroke="#2d7a2d" stroke-width="${boyut * 0.013}" stroke-opacity="0.3"/>
  </g>

  ${metinGoster && boyut >= 64 ? `<!-- Metin -->
  <text x="${m}" y="${boyut * 0.91}" text-anchor="middle" font-family="Arial,Helvetica,sans-serif" font-weight="900" font-size="${yaziBoyut}" fill="rgba(255,255,255,0.90)" letter-spacing="${boyut * 0.005}">TARIMCRM</text>` : ''}
</svg>`;
}

// SVG boyutları kaydet
const SVG_HEDEFLER = [
  { yol: 'public/tarimcrm-icon.svg', boyut: 512, metin: true },
  { yol: 'public/icon-192.svg', boyut: 192, metin: false },
  { yol: 'public/favicon.svg', boyut: 64, metin: false },
];

for (const { yol, boyut, metin } of SVG_HEDEFLER) {
  writeFileSync(join(ROOT, yol), svgOlustur(boyut, metin));
  console.log(`✅ ${yol}`);
}

// Android adaptive icon arka plan rengi
const VALUES_DIR = join(ROOT, 'android', 'app', 'src', 'main', 'res', 'values');
mkdirSync(VALUES_DIR, { recursive: true });
writeFileSync(join(VALUES_DIR, 'ic_launcher_background.xml'),
`<?xml version="1.0" encoding="utf-8"?>
<resources>
    <color name="ic_launcher_background">#1a6b1a</color>
</resources>`);
console.log('✅ Android arka plan rengi: #1a6b1a (koyu yeşil)');

// Android adaptive icon XML
const ANYDPI_DIR = join(ROOT, 'android', 'app', 'src', 'main', 'res', 'mipmap-anydpi-v26');
mkdirSync(ANYDPI_DIR, { recursive: true });
const adpXml = `<?xml version="1.0" encoding="utf-8"?>
<adaptive-icon xmlns:android="http://schemas.android.com/apk/res/android">
    <background android:drawable="@color/ic_launcher_background"/>
    <foreground android:drawable="@mipmap/ic_launcher_foreground"/>
</adaptive-icon>`;
writeFileSync(join(ANYDPI_DIR, 'ic_launcher.xml'), adpXml);
writeFileSync(join(ANYDPI_DIR, 'ic_launcher_round.xml'), adpXml);
console.log('✅ Android adaptive icon XML');

// Web manifest icon bilgisi
writeFileSync(join(ROOT, 'public', 'site.webmanifest'),
JSON.stringify({
  name: 'TarımCRM',
  short_name: 'TarımCRM',
  description: 'Çay Tarımı Yönetim Sistemi',
  theme_color: '#1a6b1a',
  background_color: '#ffffff',
  display: 'standalone',
  start_url: '/dashboard',
  icons: [
    { src: '/icon-192.svg', sizes: '192x192', type: 'image/svg+xml', purpose: 'any maskable' },
    { src: '/tarimcrm-icon.svg', sizes: '512x512', type: 'image/svg+xml', purpose: 'any maskable' },
  ],
}, null, 2));
console.log('✅ Web manifest: public/site.webmanifest');

console.log('\n📱 Android PNG ikonları için:');
console.log('   Android Studio → Arka planı koyu yeşil (#1a6b1a) olarak göreceksiniz');
console.log('   Özel PNG için: npm install canvas && node scripts/icon-olustur.mjs');
console.log('\n✅ Tamamlandı!');
