import { createSupabaseServerClient } from '@/lib/supabase-server'
import { prisma } from '@/lib/db'

export type Rol = 'admin' | 'muhasebeci' | 'tarimci' | 'izleyici'

export async function mevcutKullaniciyiGetir() {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  return prisma.kullanici.findUnique({ where: { supabaseId: user.id } })
}

export async function rolKontrol(gerekenRoller: Rol[]): Promise<boolean> {
  const kullanici = await mevcutKullaniciyiGetir()
  if (!kullanici) return false
  return gerekenRoller.includes(kullanici.rol as Rol)
}

// Sayfa erişim kuralları
export const SAYFA_ROLLERI: Record<string, Rol[]> = {
  '/kullanicilar': ['admin'],
  '/finans': ['admin', 'muhasebeci'],
  '/raporlar': ['admin', 'muhasebeci'],
  '/hasat': ['admin', 'tarimci'],
  '/tarlalar': ['admin', 'tarimci'],
  '/envanter': ['admin', 'tarimci', 'muhasebeci'],
}
