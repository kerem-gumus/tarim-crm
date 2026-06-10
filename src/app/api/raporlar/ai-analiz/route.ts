export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { raporAnaliziUret, type RaporTipi } from '@/lib/ai/raporUretici'
import { createSupabaseServerClient } from '@/lib/supabase-server'

// POST /api/raporlar/ai-analiz
// Body: { tip: RaporTipi, veri: unknown, ekBaglam?: string }
export async function POST(istek: Request) {
  try {
    // Oturum kontrolü
    const supabase = await createSupabaseServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ hata: 'Oturum gerekli' }, { status: 401 })

    const { tip, veri, ekBaglam } = await istek.json()

    if (!tip || !veri) {
      return NextResponse.json({ hata: 'tip ve veri zorunludur' }, { status: 400 })
    }

    const sonuc = await raporAnaliziUret({
      tip: tip as RaporTipi,
      veri,
      ekBaglam,
    })

    return NextResponse.json(sonuc)
  } catch (hata) {
    const mesaj = hata instanceof Error ? hata.message : 'Bilinmeyen hata'
    const rate429 = mesaj.includes('429') || mesaj.includes('rate') || mesaj.includes('quota')
    return NextResponse.json(
      {
        hata: rate429
          ? 'AI kota doldu, tüm yedek sağlayıcılar denendi. Birkaç dakika sonra tekrar deneyin.'
          : `AI analiz yapılamadı: ${mesaj}`,
      },
      { status: rate429 ? 429 : 500 }
    )
  }
}
