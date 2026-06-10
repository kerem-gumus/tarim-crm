export interface MesajGirdi {
  rol: 'kullanici' | 'asistan' | 'sistem'
  icerik: string
}

export interface AiYanit {
  icerik: string
  girilenToken: number
  cikanToken: number
  model: string
  saglayi?: string
}

// ─── Yardımcı: exponential backoff ile retry ─────────────────────────────────
async function bekle(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

async function retryIle<T>(
  fn: () => Promise<T>,
  maxDeneme = 3,
  beklemeMs = 1000
): Promise<T> {
  let sonHata: Error | null = null
  for (let deneme = 0; deneme < maxDeneme; deneme++) {
    try {
      return await fn()
    } catch (hata) {
      sonHata = hata as Error
      const mesaj = sonHata.message ?? ''
      // 429 Rate Limit → bekle ve tekrar dene
      if (mesaj.includes('429') || mesaj.includes('rate') || mesaj.includes('quota')) {
        const beklemeSuresi = beklemeMs * Math.pow(2, deneme) // 1s, 2s, 4s
        await bekle(beklemeSuresi)
        continue
      }
      // Diğer hatalar → direkt fırlat (retry'a gerek yok)
      throw hata
    }
  }
  throw sonHata ?? new Error('Bilinmeyen hata')
}

// ─── Ücretsiz fallback zinciri: Gemini → Groq ─────────────────────────────────
// Birincil sağlayıcı 429 / hata verince otomatik alternatife geçer.
const UCRETIZ_FALLBACK: Array<{ saglayi: string; model: string }> = [
  { saglayi: 'gemini', model: 'gemini-2.0-flash' },
  { saglayi: 'groq',   model: 'llama-3.3-70b-versatile' },
  { saglayi: 'groq',   model: 'llama-3.1-8b-instant' },
]

// ─── Ana giriş noktası ────────────────────────────────────────────────────────
export async function aiYanitGetir(
  saglayi: string,
  model: string,
  mesajlar: MesajGirdi[],
  apiAnahtari?: string,
  ollamaBaseUrl?: string,
): Promise<AiYanit> {
  const cagir = () => _saglayiciyaCagir(saglayi, model, mesajlar, apiAnahtari, ollamaBaseUrl)

  try {
    // Önce istenen sağlayıcıyı retry ile dene
    return await retryIle(cagir, 3, 1000)
  } catch (birincilHata) {
    const mesaj = (birincilHata as Error).message ?? ''
    const rate429 = mesaj.includes('429') || mesaj.includes('rate') || mesaj.includes('quota')

    // 429 ise ücretsiz fallback zincirine geç
    if (rate429) {
      for (const fb of UCRETIZ_FALLBACK) {
        // Zaten denediğimiz sağlayıcı+modeli atla
        if (fb.saglayi === saglayi && fb.model === model) continue
        try {
          const fbApiAnahtari = process.env[`${fb.saglayi.toUpperCase()}_API_KEY`]
          const yanit = await retryIle(
            () => _saglayiciyaCagir(fb.saglayi, fb.model, mesajlar, fbApiAnahtari),
            2,
            500
          )
          return { ...yanit, saglayi: fb.saglayi }
        } catch {
          // Bu fallback da çalışmadı, bir sonrakini dene
        }
      }
    }

    // Hiçbir sağlayıcı çalışmadı
    throw birincilHata
  }
}

// ─── Sağlayıcı çağrısı ───────────────────────────────────────────────────────
async function _saglayiciyaCagir(
  saglayi: string,
  model: string,
  mesajlar: MesajGirdi[],
  apiAnahtari?: string,
  ollamaBaseUrl?: string,
): Promise<AiYanit> {
  switch (saglayi) {
    case 'claude': return claudeYanitGetir(model, mesajlar, apiAnahtari!)
    case 'openai': return openaiYanitGetir(model, mesajlar, apiAnahtari!)
    case 'gemini': return geminiYanitGetir(model, mesajlar, apiAnahtari)
    case 'groq':   return groqYanitGetir(model, mesajlar, apiAnahtari!)
    case 'ollama': return ollamaYanitGetir(model, mesajlar, ollamaBaseUrl ?? 'http://localhost:11434')
    default: throw new Error(`Bilinmeyen sağlayıcı: ${saglayi}`)
  }
}

// ─── Sağlayıcı implementasyonları ────────────────────────────────────────────

async function claudeYanitGetir(model: string, mesajlar: MesajGirdi[], apiAnahtari: string): Promise<AiYanit> {
  const sistemMesaji = mesajlar.find(m => m.rol === 'sistem')?.icerik
  const sohbetMesajlari = mesajlar.filter(m => m.rol !== 'sistem').map(m => ({
    role: m.rol === 'kullanici' ? 'user' : 'assistant',
    content: m.icerik,
  }))

  const yanit = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': apiAnahtari,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json',
    },
    body: JSON.stringify({ model, max_tokens: 4096, system: sistemMesaji, messages: sohbetMesajlari }),
  })
  if (!yanit.ok) throw new Error(`Claude API hatası: ${yanit.status}`)
  const veri = await yanit.json()
  return {
    icerik: veri.content[0].text,
    girilenToken: veri.usage.input_tokens,
    cikanToken: veri.usage.output_tokens,
    model,
  }
}

async function openaiYanitGetir(model: string, mesajlar: MesajGirdi[], apiAnahtari: string): Promise<AiYanit> {
  const openaiMesajlar = mesajlar.map(m => ({
    role: m.rol === 'kullanici' ? 'user' : m.rol === 'asistan' ? 'assistant' : 'system',
    content: m.icerik,
  }))
  const yanit = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${apiAnahtari}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ model, messages: openaiMesajlar, max_tokens: 4096 }),
  })
  if (!yanit.ok) throw new Error(`OpenAI API hatası: ${yanit.status}`)
  const veri = await yanit.json()
  return {
    icerik: veri.choices[0].message.content,
    girilenToken: veri.usage.prompt_tokens,
    cikanToken: veri.usage.completion_tokens,
    model,
  }
}

async function geminiYanitGetir(model: string, mesajlar: MesajGirdi[], apiAnahtari?: string): Promise<AiYanit> {
  const anahtar = apiAnahtari ?? process.env.GEMINI_API_KEY ?? ''
  const geminiMesajlar = mesajlar
    .filter(m => m.rol !== 'sistem')
    .map(m => ({ role: m.rol === 'kullanici' ? 'user' : 'model', parts: [{ text: m.icerik }] }))
  const sistemMesaji = mesajlar.find(m => m.rol === 'sistem')?.icerik

  const yanit = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${anahtar}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: geminiMesajlar,
        ...(sistemMesaji && { systemInstruction: { parts: [{ text: sistemMesaji }] } }),
        generationConfig: { maxOutputTokens: 4096 },
      }),
    }
  )
  if (!yanit.ok) {
    const hataMetni = await yanit.text().catch(() => '')
    throw new Error(`Gemini API hatası: ${yanit.status} ${hataMetni.slice(0, 100)}`)
  }
  const veri = await yanit.json()
  const icerik = veri.candidates?.[0]?.content?.parts?.[0]?.text
  if (!icerik) throw new Error('Gemini boş yanıt döndü')
  return {
    icerik,
    girilenToken: veri.usageMetadata?.promptTokenCount ?? 0,
    cikanToken: veri.usageMetadata?.candidatesTokenCount ?? 0,
    model,
  }
}

async function groqYanitGetir(model: string, mesajlar: MesajGirdi[], apiAnahtari?: string): Promise<AiYanit> {
  const anahtar = apiAnahtari ?? process.env.GROQ_API_KEY ?? ''
  const groqMesajlar = mesajlar.map(m => ({
    role: m.rol === 'kullanici' ? 'user' : m.rol === 'asistan' ? 'assistant' : 'system',
    content: m.icerik,
  }))
  const yanit = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${anahtar}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ model, messages: groqMesajlar, max_tokens: 4096 }),
  })
  if (!yanit.ok) throw new Error(`Groq API hatası: ${yanit.status}`)
  const veri = await yanit.json()
  return {
    icerik: veri.choices[0].message.content,
    girilenToken: veri.usage.prompt_tokens,
    cikanToken: veri.usage.completion_tokens,
    model,
  }
}

async function ollamaYanitGetir(model: string, mesajlar: MesajGirdi[], baseUrl: string): Promise<AiYanit> {
  const ollamaMesajlar = mesajlar.map(m => ({
    role: m.rol === 'kullanici' ? 'user' : m.rol === 'asistan' ? 'assistant' : 'system',
    content: m.icerik,
  }))
  const yanit = await fetch(`${baseUrl}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ model, messages: ollamaMesajlar, stream: false }),
  })
  if (!yanit.ok) throw new Error(`Ollama hatası: ${yanit.status}`)
  const veri = await yanit.json()
  return {
    icerik: veri.message.content,
    girilenToken: veri.prompt_eval_count ?? 0,
    cikanToken: veri.eval_count ?? 0,
    model,
  }
}
