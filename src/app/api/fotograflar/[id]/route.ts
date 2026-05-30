import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { createSupabaseServerClient } from '@/lib/supabase-server'

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const fotograf = await prisma.fotograf.findUnique({ where: { id } })

    if (!fotograf) {
      return NextResponse.json({ hata: 'Fotoğraf bulunamadı' }, { status: 404 })
    }

    const supabase = await createSupabaseServerClient()
    await supabase.storage.from('fotograflar').remove([fotograf.dosyaYolu])

    await prisma.fotograf.delete({ where: { id } })

    return NextResponse.json({ mesaj: 'Fotoğraf silindi' })
  } catch (hata) {
    console.error('Fotoğraf silme hatası:', hata)
    return NextResponse.json({ hata: 'Fotoğraf silinemedi' }, { status: 500 })
  }
}
