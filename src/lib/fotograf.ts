import { supabase } from './supabase'

const BUCKET = 'fotograflar'

export async function fotografYukle(
  dosya: File,
  modul: string,
  kayitId: string
): Promise<{ dosyaYolu: string; dosyaAdi: string; boyutKb: number }> {
  // Dosya boyutu kontrolü (max 5MB)
  if (dosya.size > 5 * 1024 * 1024) {
    throw new Error('Dosya boyutu 5MB\'ı geçemez')
  }

  // Benzersiz dosya adı
  const uzanti = dosya.name.split('.').pop()
  const dosyaAdi = dosya.name
  const yol = `${modul}/${kayitId}/${Date.now()}.${uzanti}`

  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(yol, dosya, { cacheControl: '3600', upsert: false })

  if (error) throw new Error(`Yükleme hatası: ${error.message}`)

  return {
    dosyaYolu: yol,
    dosyaAdi: dosyaAdi,
    boyutKb: Math.round(dosya.size / 1024),
  }
}

export function fotografUrlGetir(dosyaYolu: string): string {
  const { data } = supabase.storage.from(BUCKET).getPublicUrl(dosyaYolu)
  return data.publicUrl
}

export async function fotografSil(dosyaYolu: string): Promise<void> {
  await supabase.storage.from(BUCKET).remove([dosyaYolu])
}
