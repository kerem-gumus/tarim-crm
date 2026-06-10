import { aiYanitGetir, type MesajGirdi } from './adaptorler'
import { prisma } from '@/lib/db'

export type RaporTipi =
  | 'hasat'
  | 'finans'
  | 'iscilik'
  | 'envanter'
  | 'arac'
  | 'sezon-karsilastirma'
  | 'hava-durumu'

interface RaporAnalizGirdi {
  tip: RaporTipi
  veri: unknown          // Rapor ham verisi (JSON-serializable)
  ekBaglam?: string     // Ekstra bağlam (dönem, yıl, filtre bilgisi)
}

interface RaporAnalizSonuc {
  analiz: string
  saglayi: string
  model: string
  olusturmaTarihi: string
}

const RAPOR_PROMPT: Record<RaporTipi, string> = {
  hasat: `Sen bir çay tarımı danışmanısın. Verilen hasat raporu verisini analiz et:
- Toplam ve tarla bazlı verim (kg/dönüm) değerlendir
- Düşük/yüksek verimli tarlalar, olası nedenler
- İşçilik maliyeti (kg başına maliyet)
- Dönem karşılaştırması
- 3-5 madde somut öneri (verim artırma, maliyet azaltma)
Yanıtını Türkçe ver, madde madde ve net ol.`,

  finans: `Sen bir tarım muhasebecisisin. Verilen finansal raporu analiz et:
- Gelir/gider dengesi ve net kâr yorumu
- Ödenmemiş alacak/borç risk analizi
- Aylık nakit akışı trendi
- Dikkat edilmesi gereken kalemler
- 3-5 madde öneri (tahsilat, gider kontrolü)
Yanıtını Türkçe ver, sayısal değerlere atıfla.`,

  iscilik: `Sen bir tarım işletmesi danışmanısın. İşçilik raporunu analiz et:
- İşçilik maliyeti kg başına ve toplam değerlendirme
- Ekip performansı karşılaştırması
- Ton işi vs yevmiye maliyet analizi
- Ödenmemiş işçilik borçları
- 3-5 madde öneri (verimlilik, maliyet)
Türkçe, net ve somut ol.`,

  envanter: `Sen bir tarım işletmesi envanter uzmanısın. Stok/ekipman raporunu analiz et:
- Kritik stok seviyeleri ve risk
- Ekipman bakım durumu
- Gider/gelir kalemleri
- Yakıt ve malzeme maliyeti trendi
- 3-5 madde öneri (stok yönetimi, bakım, maliyet azaltma)
Türkçe ve somut öner.`,

  arac: `Sen bir tarım araç-gereç uzmanısın. Araç/ekipman raporunu analiz et:
- Yakıt tüketimi ve km başına maliyet
- Bakım giderleri
- Araç kullanım verimliliği
- Arızalı/bakımda araç riski
- 3-5 madde öneri
Türkçe, kısa ve net.`,

  'sezon-karsilastirma': `Sen bir çay tarımı analisti sin. Sezon karşılaştırma raporunu değerlendir:
- Yıllar arası verim değişimi (artış/düşüş ve olası nedenler)
- En iyi/kötü sezon analizi
- Tarla bazlı tutarlılık
- İklim/fiyat etkisi
- 3-5 madde öngörü ve öneri
Türkçe, karşılaştırmalı yorumla.`,

  'hava-durumu': `Sen bir tarım meteoroloji uzmanısın. Hava verisini analiz et:
- Sıcaklık ve nem trendleri çay kalitesi/verimine etkisi
- Yağış dağılımı analizi
- Don riski değerlendirmesi
- Gelecek 7 gün için hasat/bakım önerisi
- Kritik uyarılar (aşırı sıcak, don, sağanak)
Türkçe, tarih ve değer belirterek.`,
}

// Veriyi token limitini aşmamak için özetle (maks ~3000 karakter ham veri)
function veriOzetle(veri: unknown): string {
  const json = JSON.stringify(veri, null, 2)
  if (json.length <= 3000) return json
  // Çok büyükse sadece özet istatistikleri al
  return json.slice(0, 3000) + '\n... (veri kısaltıldı)'
}

export async function raporAnaliziUret(girdi: RaporAnalizGirdi): Promise<RaporAnalizSonuc> {
  const promptSistemi = RAPOR_PROMPT[girdi.tip] ?? RAPOR_PROMPT.hasat

  const veriMetni = veriOzetle(girdi.veri)
  const kullaniciMesaji =
    `Rapor türü: ${girdi.tip}\n` +
    (girdi.ekBaglam ? `Bağlam: ${girdi.ekBaglam}\n` : '') +
    `\nRapor Verisi:\n${veriMetni}`

  const mesajlar: MesajGirdi[] = [
    { rol: 'sistem', icerik: promptSistemi },
    { rol: 'kullanici', icerik: kullaniciMesaji },
  ]

  // Aktif AI ayarlarından varsayılan sağlayıcı/model al
  const ayar = await prisma.aiAyar.findFirst({
    where: { aktif: true },
    orderBy: { saglayi: 'asc' },
  })

  const saglayi = ayar?.saglayi ?? 'gemini'
  const model = ayar?.varsayilanModel ?? 'gemini-2.0-flash'
  const apiAnahtari = ayar?.apiAnahtari ?? undefined

  const yanit = await aiYanitGetir(saglayi, model, mesajlar, apiAnahtari)

  return {
    analiz: yanit.icerik,
    saglayi: yanit.saglayi ?? saglayi,
    model: yanit.model,
    olusturmaTarihi: new Date().toISOString(),
  }
}
