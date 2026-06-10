export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { aiYanitGetir } from '@/lib/ai/adaptorler'

// POST /api/toprak-analiz/[id]/ai — Lab sonucunu AI ile analiz et ve öneri üret
export async function POST(_istek: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params

    const numune = await prisma.toprakNumune.findUnique({
      where: { id },
      include: {
        sonuc: true,
        tarla: { select: { tarlaAdi: true, konumIl: true, konumIlce: true, cayCesidi: true } },
      },
    })

    if (!numune?.sonuc) {
      return NextResponse.json({ hata: 'Önce lab sonucu girilmelidir' }, { status: 400 })
    }

    const s = numune.sonuc

    const analizMetni = `
Tarla: ${numune.tarla.tarlaAdi} (${numune.tarla.konumIl}/${numune.tarla.konumIlce})
Yıl: ${numune.yil}, Numune No: ${numune.numuneNo}
Çay Çeşidi: ${numune.tarla.cayCesidi ?? 'Belirtilmemiş'}

Lab Sonuçları:
- pH: ${s.ph ?? 'ölçülmedi'}
- Organik Madde: ${s.organikMadde != null ? `%${s.organikMadde}` : 'ölçülmedi'}
- Azot (N): ${s.azot ?? 'ölçülmedi'} mg/kg
- Fosfor (P): ${s.fosfor ?? 'ölçülmedi'} mg/kg
- Potasyum (K): ${s.potasyum ?? 'ölçülmedi'} mg/kg
- Kalsiyum: ${s.kalsiyum ?? 'ölçülmedi'} mg/kg
- Magnezyum: ${s.magnezyum ?? 'ölçülmedi'} mg/kg
`

    const prompt = `Sen bir çay tarımı toprak uzmanısın. Aşağıdaki toprak analiz sonuçlarını değerlendir:

${analizMetni}

Şunları anlat:
1. **Toprak Durumu**: pH, organik madde ve besin maddeleri yeterli mi? (çay için ideal pH: 4.5-5.5)
2. **Eksiklikler**: Hangi besin maddeleri kritik seviyede düşük?
3. **Gübre Önerileri**: Ne zaman, hangi gübre, ne kadar? (Türk çayı için)
4. **Verim Etkisi**: Bu toprak durumu verimi nasıl etkiliyor?
5. **Acil Önlem**: Varsa, ilk yapılacak şey ne?

Yanıtın kısa, pratik ve Türkçe olsun. Madde madde yaz.`

    const ayar = await prisma.aiAyar.findFirst({ where: { aktif: true } })
    const saglayi = ayar?.saglayi ?? 'gemini'
    const model = ayar?.varsayilanModel ?? 'gemini-2.0-flash'
    const apiAnahtari = ayar?.apiAnahtari ?? undefined

    const yanit = await aiYanitGetir(saglayi, model, [
      { rol: 'kullanici', icerik: prompt },
    ], apiAnahtari)

    // AI analizini kaydet
    const guncellenmis = await prisma.toprakAnaliz.update({
      where: { id: s.id },
      data: {
        aiAnaliz: yanit.icerik,
        aiOneriler: yanit.icerik, // Ayrı alan istemiyorsa aynı içerik
      },
    })

    return NextResponse.json({ analiz: guncellenmis.aiAnaliz })
  } catch (err) {
    console.error('[toprak ai POST]', err)
    return NextResponse.json({ hata: 'AI analizi başarısız: ' + (err instanceof Error ? err.message : 'Bilinmeyen hata') }, { status: 500 })
  }
}
