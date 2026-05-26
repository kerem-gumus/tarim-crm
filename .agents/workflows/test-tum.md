---
name: test-tum
description: Tum modullerin testlerini sirayla calistir, gecmis/dusmus raporu ver.
trigger: /test-tum
---

# Workflow: Tum Modul Testleri

## Adim 1: Genel Kalite Kontrolu

```bash
npm run typecheck
npm run lint
npm run format:check
```

## Adim 2: Birim Testler

```bash
npx vitest run
```

## Adim 3: Rapor

Hangi modulun testi gecti, hangisi dustu - tablo formatinda:

```
| Modul | Test | Sonuc |
|-------|------|-------|
| 01-hasat | 12 test | ✓ tum |
| 02-iscilik | 8 test | ✗ 2 dustu |
| ... |
```

Dusen testler icin: hangi assertion, hangi dosya, hangi satir.

## Adim 4: Onerilen Sonraki Adim

Birden fazla modul dustuyse oncelik sirasi onerisi. Tek modul dustuyse direkt
`/duzelt` workflow'unu cagirmayi oner.
