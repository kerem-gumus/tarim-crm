export interface MesajGirdi {
  rol: 'kullanici' | 'asistan' | 'sistem'
  icerik: string
}

export interface AiYanit {
  icerik: string
  girilenToken: number
  cikanToken: number
  model: string
}

export async function aiYanitGetir(
  saglayi: string,
  model: string,
  mesajlar: MesajGirdi[],
  apiAnahtari?: string,
  ollamaBaseUrl?: string,
): Promise<AiYanit> {
  switch (saglayi) {
    case 'claude':
      return claudeYanitGetir(model, mesajlar, apiAnahtari!)
    case 'openai':
      return openaiYanitGetir(model, mesajlar, apiAnahtari!)
    case 'gemini':
      return geminiYanitGetir(model, mesajlar, apiAnahtari)
    case 'groq':
      return groqYanitGetir(model, mesajlar, apiAnahtari!)
    case 'ollama':
      return ollamaYanitGetir(model, mesajlar, ollamaBaseUrl ?? 'http://localhost:11434')
    default:
      throw new Error(`Bilinmeyen sağlayıcı: ${saglayi}`)
  }
}

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
    body: JSON.stringify({
      model,
      max_tokens: 4096,
      system: sistemMesaji,
      messages: sohbetMesajlari,
    }),
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
  // Gemini 2.0 Flash ücretsiz, API key opsiyonel
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
  if (!yanit.ok) throw new Error(`Gemini API hatası: ${yanit.status}`)
  const veri = await yanit.json()
  const girilenToken = veri.usageMetadata?.promptTokenCount ?? 0
  const cikanToken = veri.usageMetadata?.candidatesTokenCount ?? 0
  return {
    icerik: veri.candidates[0].content.parts[0].text,
    girilenToken,
    cikanToken,
    model,
  }
}

async function groqYanitGetir(model: string, mesajlar: MesajGirdi[], apiAnahtari: string): Promise<AiYanit> {
  const groqMesajlar = mesajlar.map(m => ({
    role: m.rol === 'kullanici' ? 'user' : m.rol === 'asistan' ? 'assistant' : 'system',
    content: m.icerik,
  }))

  const yanit = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${apiAnahtari}`, 'Content-Type': 'application/json' },
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
