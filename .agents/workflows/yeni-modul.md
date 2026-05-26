---
name: yeni-modul
description: Belirtilen modul numarasi icin sifirdan gelistirme yapar. Spec'i okur, Prisma modeli kontrol eder, sayfa+API+form olusturur, test calistirir.
trigger: /yeni-modul
parameters:
  - name: modul_no
    description: Gelistirilecek modul numarasi (1-21)
    required: true
---

# Workflow: Yeni Modul Gelistirme

Bu workflow `/yeni-modul <no>` slash komutuyla tetiklenir. Antigravity asagidaki adimlari
sirayla autonom olarak yurutur.

## Adim 1: Spec Okuma

```
docs/moduller/{modul_no}-*-spec.md dosyasini bul ve oku
```

Spec'teki tum alanlari, is kurallarini, ekran akislarini cikar.

## Adim 2: DB Schema Kontrol

`prisma/schema.prisma` icinde bu modulun modeli var mi?
- VAR -> Adim 3'e gec
- YOK -> `yatay-prisma` skill'ini cagir, modeli ekle, `npx prisma db push` calistir

## Adim 3: Modul Gelistirme

`modul-{modul_no}-*` skill'ini yukle. Spec'e gore:
- API route: `src/app/api/{modul-adi}/route.ts`
- Sayfa: `src/app/(dashboard)/{modul-adi}/page.tsx`
- Form: `src/components/{modul-adi}/{ModulAdi}Formu.tsx`
- Type: `src/types/{modul-adi}.ts`
- Yardimci: `src/lib/{modul-adi}.ts`
- Zod validator: `src/lib/validators.ts`'a ekle

Naming kurallari (AGENTS.md'den):
- camelCase Turkce ASCII degisken/fonksiyon
- PascalCase Turkce component/type
- snake_case DB
- Yorum/string Turkce karakter serbest

## Adim 4: Vitest Birim Test Yaz

`src/lib/{modul-adi}.test.ts` icinde:
- Is kurallarinin her birini test eden bir vitest case'i
- Hesaplama formulu olan modullerde formul testi (ornek: kontenjan bakiye devri)

## Adim 5: Test Denetimi

`test-modul-{modul_no:02d}` skill'ini yukle. Calistir:
```bash
npm run typecheck
npm run lint
npx vitest run src/lib/{modul-adi}.test.ts
```

Hata varsa Adim 3'e geri don, duzelt. Maksimum 3 dene.

## Adim 6: Rapor

Sonucu su formatta dondür:
```
Modul {no} ({ad}) gelistirildi.
- Eklenen dosyalar: ...
- Test sonucu: X/Y gecti
- Bilinen eksikler: ...
- Sonraki adim: ...
```
