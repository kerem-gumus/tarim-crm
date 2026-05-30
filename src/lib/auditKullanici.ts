import { createSupabaseServerClient } from '@/lib/supabase-server'
import { prisma } from '@/lib/db'

export interface AuditBilgi {
  olusturanId?: string
  olusturanAdi?: string
  guncelleyenId?: string
  guncelleyenAdi?: string
  guncellemeTarihi?: Date
}

let _cache: { supabaseId: string; bilgi: AuditBilgi; tarih: number } | null = null

export async function auditOlustur(): Promise<AuditBilgi> {
  try {
    const supabase = await createSupabaseServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return {}

    // Basit in-request cache (aynı request içinde tekrar DB sorgusu yapma)
    if (_cache && _cache.supabaseId === user.id && Date.now() - _cache.tarih < 5000) {
      return { olusturanId: user.id, olusturanAdi: _cache.bilgi.olusturanAdi }
    }

    const kullanici = await prisma.kullanici.findUnique({
      where: { supabaseId: user.id },
      select: { adSoyad: true }
    })

    const adSoyad = kullanici?.adSoyad ?? user.email?.split('@')[0] ?? 'Sistem'
    _cache = { supabaseId: user.id, bilgi: { olusturanAdi: adSoyad }, tarih: Date.now() }

    return { olusturanId: user.id, olusturanAdi: adSoyad }
  } catch {
    return {}
  }
}

export async function auditGuncelle(): Promise<AuditBilgi> {
  try {
    const supabase = await createSupabaseServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { guncellemeTarihi: new Date() }

    const kullanici = await prisma.kullanici.findUnique({
      where: { supabaseId: user.id },
      select: { adSoyad: true }
    })

    const adSoyad = kullanici?.adSoyad ?? user.email?.split('@')[0] ?? 'Sistem'

    return {
      guncelleyenId: user.id,
      guncelleyenAdi: adSoyad,
      guncellemeTarihi: new Date(),
    }
  } catch {
    return { guncellemeTarihi: new Date() }
  }
}
