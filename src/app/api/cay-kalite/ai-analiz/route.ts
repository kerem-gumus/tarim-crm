export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

// POST /api/cay-kalite/ai-analiz
// Body: multipart/form-data — "foto" alanında resim
// Gemini Vision ile çay yaprağı fotoğrafını analiz eder,
// form alanlarını otomatik doldurmak için öneri döner.

export async function POST(istek: NextRequest) {
  try {
    const formData = await istek.formData()
    const foto = formData.get('foto') as File | null

    if (!foto || foto.size === 0) {
      return NextResponse.json({ hata: 'Fotoğraf bulunamadı' }, { status: 400 })
    }

    // Maksimum 5 MB
    if (foto.size > 5 * 1024 * 1024) {
      return NextResponse.json({ hata: "Fotoğraf boyutu 5 MB'yi geçemez" }, { status: 400 })
    }

    // Gemini Vision API anahtarı
    const ayar = await prisma.aiAyar.findFirst({
      where: { saglayi: 'gemini', aktif: true },
    })
    const apiAnahtari = ayar?.apiAnahtari ?? process.env.GEMINI_API_KEY ?? ''

    if (!apiAnahtari) {
      return NextResponse.json(
        { hata: 'Gemini API anahtarı tanımlı değil. AI Ayarları sayfasından Gemini API anahtarı ekleyin.' },
        { status: 503 }
      )
    }

    // Fotoğrafı base64'e çevir
    const bytes = await foto.arrayBuffer()
    const base64 = Buffer.from(bytes).toString('base64')
    const mimeType = foto.type || 'image/jpeg'

    const prompt = `Bu fotoğrafta çay yaprağı görüyorsun. Türk çayı tarımı bağlamında analiz et ve JSON formatında yanıt ver:

{
  "yaprakNotu": <1-5 arası tam sayı, yaprak kalitesi: 5=mükemmel genç tomurcuk, 1=kaba yaşlı yaprak>,
  "genelNot": <1-5 arası tam sayı, genel kalite skoru>,
  "renk": "<yaprak rengi: açık yeşil / koyu yeşil / solgun / sarımtırak>",
  "koku": "<tahmini koku niteliği: taze / normal / bayat / yok>",
  "fizikselHata": <0-100 arası tahmini hata yüzdesi, fiziksel hasar>,
  "nemOrani": <null veya tahmini nem yüzdesi>,
  "aciklama": "<kısa Türkçe analiz notu>"
}

Eğer fotoğrafta çay yaprağı yoksa veya emin değilsen aciklama alanında belirt ve diğer alanları null yap.
SADECE JSON döndür, başka metin ekleme.`

    // Gemini Vision API çağrısı
    const yanit = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiAnahtari}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [
              { text: prompt },
              { inline_data: { mime_type: mimeType, data: base64 } },
            ],
          }],
          generationConfig: { maxOutputTokens: 512, temperature: 0.1 },
        }),
      }
    )

    if (!yanit.ok) {
      const hataMetni = await yanit.text().catch(() => '')
      if (yanit.status === 429) {
        return NextResponse.json(
          { hata: 'Gemini kota doldu. Birkaç dakika sonra tekrar deneyin.' },
          { status: 429 }
        )
      }
      return NextResponse.json(
        { hata: `Gemini Vision hatası: ${yanit.status} ${hataMetni.slice(0, 100)}` },
        { status: 500 }
      )
    }

    const veri = await yanit.json()
    const icerik = veri.candidates?.[0]?.content?.parts?.[0]?.text ?? ''

    // JSON parse
    const jsonEsle = icerik.match(/\{[\s\S]*\}/)
    if (!jsonEsle) {
      return NextResponse.json(
        { hata: 'AI geçerli JSON döndürmedi. Manuel giriş yapın.', ham: icerik },
        { status: 422 }
      )
    }

    const oneri = JSON.parse(jsonEsle[0])

    return NextResponse.json({
      oneri: {
        yaprakNotu: oneri.yaprakNotu ?? null,
        genelNot: oneri.genelNot ?? null,
        renk: oneri.renk ?? null,
        koku: oneri.koku ?? null,
        fizikselHata: oneri.fizikselHata ?? null,
        nemOrani: oneri.nemOrani ?? null,
      },
      aciklama: oneri.aciklama ?? '',
    })
  } catch (hata) {
    console.error('[cay-kalite ai-analiz]', hata)
    return NextResponse.json(
      { hata: 'Fotoğraf analiz edilemedi: ' + (hata instanceof Error ? hata.message : 'Bilinmeyen hata') },
      { status: 500 }
    )
  }
}
