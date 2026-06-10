import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { aiYanitGetir } from '@/lib/ai/adaptorler'
import { TARIM_SISTEM_PROMPT, baglamliPromptOlustur } from '@/lib/ai/sistemPrompt'
import { maliyetHesapla } from '@/lib/ai/tokenFiyatlari'

// POST: yeni mesaj gönder
export async function POST(istek: Request) {
  try {
    const { sohbetId, mesaj, saglayi, model, dbBaglami } = await istek.json()

    // API anahtarını DB'den al
    const ayar = await prisma.aiAyar.findUnique({ where: { saglayi } })
    const apiAnahtari = ayar?.apiAnahtari ?? undefined
    const ollamaUrl = (ayar?.ayarlar as { baseUrl?: string } | null)?.baseUrl

    // Mevcut sohbet mesajlarını al
    let aktifSohbetId = sohbetId
    if (!aktifSohbetId) {
      const yeniSohbet = await prisma.asistanSohbet.create({
        data: { saglayi, model, baslik: mesaj.slice(0, 50) },
      })
      aktifSohbetId = yeniSohbet.id
    }

    // Kullanıcı mesajını kaydet
    await prisma.asistanMesaj.create({
      data: { sohbetId: aktifSohbetId, rol: 'kullanici', icerik: mesaj },
    })

    // Tüm sohbet geçmişini al
    const gecmis = await prisma.asistanMesaj.findMany({
      where: { sohbetId: aktifSohbetId },
      orderBy: { olusturmaTarihi: 'asc' },
    })

    const mesajlar = [
      { rol: 'sistem' as const, icerik: TARIM_SISTEM_PROMPT },
      ...gecmis.map(m => ({
        rol: m.rol === 'kullanici' ? 'kullanici' as const : 'asistan' as const,
        icerik:
          m.rol === 'kullanici' && m.id === gecmis[gecmis.length - 1].id && dbBaglami
            ? baglamliPromptOlustur(m.icerik, dbBaglami)
            : m.icerik,
      })),
    ]

    // AI yanıtı al
    const yanit = await aiYanitGetir(saglayi, model, mesajlar, apiAnahtari, ollamaUrl)

    // Yanıtı kaydet
    const asistanMesaj = await prisma.asistanMesaj.create({
      data: {
        sohbetId: aktifSohbetId,
        rol: 'asistan',
        icerik: yanit.icerik,
        girilenToken: yanit.girilenToken,
        cikanToken: yanit.cikanToken,
      },
    })

    // Token kullanımı kaydet
    const maliyet = maliyetHesapla(model, yanit.girilenToken, yanit.cikanToken)
    await prisma.tokenKullanim.create({
      data: {
        sohbetId: aktifSohbetId,
        saglayi,
        model,
        girilenToken: yanit.girilenToken,
        cikanToken: yanit.cikanToken,
        toplamToken: yanit.girilenToken + yanit.cikanToken,
        tahminiMaliyet: maliyet > 0 ? maliyet : null,
      },
    })

    return NextResponse.json({
      sohbetId: aktifSohbetId,
      yanit: yanit.icerik,
      mesajId: asistanMesaj.id,
      tokenKullanim: { girilen: yanit.girilenToken, cikan: yanit.cikanToken, maliyet },
    })
  } catch (hata) {
    const mesaj = hata instanceof Error ? hata.message : 'Bilinmeyen hata'
    const rate429 = mesaj.includes('429') || mesaj.includes('rate') || mesaj.includes('quota')

    // Tüm sağlayıcılar başarısız → uygulama çökmez, anlamlı hata mesajı döner
    return NextResponse.json(
      {
        hata: rate429
          ? 'AI kotası doldu ve yedek sağlayıcılar da yanıt veremedi. Birkaç dakika sonra tekrar deneyin.'
          : `AI şu an kullanılamıyor: ${mesaj}`,
        rate429,
      },
      { status: rate429 ? 429 : 500 }
    )
  }
}
