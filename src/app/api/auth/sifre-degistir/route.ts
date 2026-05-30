import { NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase-server'

export async function POST(istek: Request) {
  try {
    const { yeniSifre } = await istek.json()

    if (!yeniSifre || yeniSifre.length < 6) {
      return NextResponse.json({ hata: 'Şifre en az 6 karakter olmalıdır' }, { status: 400 })
    }

    const supabase = await createSupabaseServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ hata: 'Oturum yok' }, { status: 401 })

    const { error } = await supabase.auth.updateUser({ password: yeniSifre })
    if (error) return NextResponse.json({ hata: error.message }, { status: 400 })

    return NextResponse.json({ basarili: true })
  } catch {
    return NextResponse.json({ hata: 'Şifre değiştirilemedi' }, { status: 500 })
  }
}
