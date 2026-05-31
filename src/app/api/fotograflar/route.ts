export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const modul = searchParams.get('modul')
    const kayitId = searchParams.get('kayitId')

    if (!modul || !kayitId) {
      return NextResponse.json(
        { hata: 'modul ve kayitId parametreleri zorunludur' },
        { status: 400 }
      )
    }

    const fotograflar = await prisma.fotograf.findMany({
      where: {
        modul: modul as 'hasat' | 'tarla' | 'ekipman' | 'malzeme',
        kayitId,
      },
      orderBy: { yuklemeTarihi: 'desc' },
    })

    return NextResponse.json(fotograflar)
  } catch (hata) {
    console.error('Fotoğraf listesi hatası:', hata)
    return NextResponse.json({ hata: 'Fotoğraflar getirilemedi' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const govde = await request.json()
    const { modul, kayitId, dosyaYolu, dosyaAdi, boyutKb, aciklama } = govde

    if (!modul || !kayitId || !dosyaYolu || !dosyaAdi || boyutKb === undefined) {
      return NextResponse.json(
        { hata: 'modul, kayitId, dosyaYolu, dosyaAdi ve boyutKb zorunludur' },
        { status: 400 }
      )
    }

    const fotograf = await prisma.fotograf.create({
      data: {
        modul,
        kayitId,
        dosyaYolu,
        dosyaAdi,
        boyutKb,
        aciklama: aciklama ?? null,
      },
    })

    return NextResponse.json(fotograf, { status: 201 })
  } catch (hata) {
    console.error('Fotoğraf kayıt hatası:', hata)
    return NextResponse.json({ hata: 'Fotoğraf kaydedilemedi' }, { status: 500 })
  }
}
