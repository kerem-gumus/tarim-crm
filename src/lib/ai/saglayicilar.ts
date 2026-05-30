export interface AiModel {
  id: string
  ad: string
  saglayi: string
  ucretsiz: boolean
  aciklama: string
}

export const AI_MODELLER: AiModel[] = [
  // Claude
  { id: 'claude-opus-4-6',   ad: 'Claude Opus 4.6',   saglayi: 'claude', ucretsiz: false, aciklama: 'En güçlü, karmaşık analizler için' },
  { id: 'claude-sonnet-4-6', ad: 'Claude Sonnet 4.6',  saglayi: 'claude', ucretsiz: false, aciklama: 'Hız/kalite dengesi' },
  { id: 'claude-haiku-4-5',  ad: 'Claude Haiku 4.5',   saglayi: 'claude', ucretsiz: false, aciklama: 'Hızlı ve ekonomik' },
  // OpenAI
  { id: 'gpt-4o',            ad: 'GPT-4o',             saglayi: 'openai', ucretsiz: false, aciklama: 'OpenAI en güncel multimodal' },
  { id: 'gpt-4o-mini',       ad: 'GPT-4o Mini',        saglayi: 'openai', ucretsiz: false, aciklama: 'Hızlı ve ekonomik' },
  // Gemini
  { id: 'gemini-2.0-flash',  ad: 'Gemini 2.0 Flash',   saglayi: 'gemini', ucretsiz: true,  aciklama: 'Ücretsiz, hızlı' },
  { id: 'gemini-1.5-pro',    ad: 'Gemini 1.5 Pro',     saglayi: 'gemini', ucretsiz: false, aciklama: 'Uzun context, güçlü' },
  { id: 'gemini-1.5-flash',  ad: 'Gemini 1.5 Flash',   saglayi: 'gemini', ucretsiz: false, aciklama: 'Hızlı Gemini' },
  // Groq (ücretsiz)
  { id: 'llama-3.3-70b-versatile', ad: 'LLaMA 3.3 70B', saglayi: 'groq', ucretsiz: true, aciklama: 'Ücretsiz, çok hızlı' },
  { id: 'llama-3.1-8b-instant',    ad: 'LLaMA 3.1 8B',  saglayi: 'groq', ucretsiz: true, aciklama: 'Ücretsiz, en hızlı' },
  { id: 'mixtral-8x7b-32768',      ad: 'Mixtral 8x7B',  saglayi: 'groq', ucretsiz: true, aciklama: 'Ücretsiz, uzun context' },
  // Ollama (local)
  { id: 'llama3.2', ad: 'LLaMA 3.2 (Local)', saglayi: 'ollama', ucretsiz: true, aciklama: 'Yerel, internet gerektirmez' },
  { id: 'mistral',  ad: 'Mistral (Local)',    saglayi: 'ollama', ucretsiz: true, aciklama: 'Yerel, internet gerektirmez' },
  { id: 'gemma2',   ad: 'Gemma 2 (Local)',    saglayi: 'ollama', ucretsiz: true, aciklama: 'Yerel, Google modeli' },
]
