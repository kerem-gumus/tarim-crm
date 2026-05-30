// USD per 1000 token (input/output)
export const TOKEN_FIYATLARI: Record<string, { giris: number; cikis: number }> = {
  // Claude
  'claude-opus-4-6':   { giris: 0.015,   cikis: 0.075 },
  'claude-sonnet-4-6': { giris: 0.003,   cikis: 0.015 },
  'claude-haiku-4-5':  { giris: 0.00025, cikis: 0.00125 },
  // OpenAI
  'gpt-4o':            { giris: 0.005,   cikis: 0.015 },
  'gpt-4o-mini':       { giris: 0.00015, cikis: 0.0006 },
  'gpt-4-turbo':       { giris: 0.01,    cikis: 0.03 },
  // Gemini
  'gemini-1.5-pro':    { giris: 0.00125, cikis: 0.005 },
  'gemini-1.5-flash':  { giris: 0.000075,cikis: 0.0003 },
  'gemini-2.0-flash':  { giris: 0,       cikis: 0 }, // ücretsiz
  // Groq (ücretsiz tier)
  'llama-3.3-70b-versatile': { giris: 0, cikis: 0 },
  'llama-3.1-8b-instant':    { giris: 0, cikis: 0 },
  'mixtral-8x7b-32768':      { giris: 0, cikis: 0 },
  // Ollama (local, ücretsiz)
  'llama3.2': { giris: 0, cikis: 0 },
  'mistral':  { giris: 0, cikis: 0 },
  'gemma2':   { giris: 0, cikis: 0 },
}

export function maliyetHesapla(model: string, girilenToken: number, cikanToken: number): number {
  const fiyat = TOKEN_FIYATLARI[model]
  if (!fiyat) return 0
  return (girilenToken / 1000) * fiyat.giris + (cikanToken / 1000) * fiyat.cikis
}
