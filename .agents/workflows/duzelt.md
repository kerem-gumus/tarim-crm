---
name: duzelt
description: Belirtilen modulde sorun cikti, kullanicinin tarif ettigi bug'i bul ve duzelt, sonra testi tekrar calistir.
trigger: /duzelt
parameters:
  - name: modul_no
    description: Sorunlu modul numarasi
    required: true
  - name: aciklama
    description: Sorunun aciklamasi
    required: true
---

# Workflow: Modul Duzeltme

## Adim 1: Modul Skill'ini Yukle

`modul-{modul_no}-*` skill'ini yukle. Spec'i oku.

## Adim 2: Sorunlu Kodu Bul

Kullanicinin {aciklama} parametresinde verdigi tarife gore:
- Grep ile ilgili dosyalari bul
- Spec ile karsilastir

## Adim 3: Duzelt

Sorunu duzelt. Naming convention'larini koru.

## Adim 4: Test

`test-modul-{modul_no:02d}` skill'ini yukle. Calistir.

## Adim 5: Rapor

Ne degisti, hangi dosyada, test sonucu - kisaca.
