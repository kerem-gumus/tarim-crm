import { NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import { prisma } from '@/lib/db'
import { fotografYukle, fotografUrlGetir } from '@/lib/fotograf'

export async function POST(istek: Request) {
  try {
    const supabase = await createSupabaseServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ hata: 'Oturum yok' }, { status: 401 })

    const formVeri = await istek.formData()
    const dosya = formVeri.get('foto') as File | null

    if (!dosya) return NextResponse.json({ hata: 'Dosya seçilmedi' }, { status: 400 })
    if (!dosya.type.startsWith('image/')) return NextResponse.json({ hata: 'Sadece resim dosyası yüklenebilir' }, { status: 400 })

    // Kullanıcıyı bul
    const kullanici = await prisma.kullanici.findUnique({ where: { supabaseId: user.id } })
    if (!kullanici) return NextResponse.json({ hata: 'Kullanıcı bulunamadı' }, { status: 404 })

    // Eski fotoğrafı sil (varsa)
    if (kullanici.profilFotoUrl) {
      try {
        // URL'den dosya yolunu çıkar: .../fotograflar/kullanici/ID/xxx.jpg → kullanici/ID/xxx.jpg
        const url = new URL(kullanici.profilFotoUrl)
        const yol = url.pathname.split('/fotograflar/')[1]
        if (yol) {
          await supabase.storage.from('fotograflar').remove([yol])
        }
      } catch { /* eski dosya silinemedi, devam et */ }
    }

    // Yeni fotoğrafı yükle
    const { dosyaYolu } = await fotografYukle(dosya, 'kullanici', kullanici.id)
    const publicUrl = fotografUrlGetir(dosyaYolu)

    // DB'ye kaydet
    const guncellendi = await prisma.kullanici.update({
      where: { id: kullanici.id },
      data: { profilFotoUrl: publicUrl, guncellemeTarihi: new Date() }
    })

    // Fotograf tablosuna da kaydet
    await prisma.fotograf.create({
      data: {
        modul: 'kullanici',
        kayitId: kullanici.id,
        dosyaYolu,
        dosyaAdi: dosya.name,
        boyutKb: Math.round(dosya.size / 1024),
        aciklama: 'Profil fotoğrafı',
      }
    })

    return NextResponse.json({ profilFotoUrl: guncellendi.profilFotoUrl })
  } catch (hata) {
    const mesaj = hata instanceof Error ? hata.message : 'Bilinmeyen hata'
    return NextResponse.json({ hata: `Fotoğraf yüklenemedi: ${mesaj}` }, { status: 500 })
  }
}

// DELETE: profil fotoğrafını kaldır
export async function DELETE() {
  try {
    const supabase = await createSupabaseServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ hata: 'Oturum yok' }, { status: 401 })

    const kullanici = await prisma.kullanici.findUnique({ where: { supabaseId: user.id } })
    if (!kullanici) return NextResponse.json({ hata: 'Kullanıcı bulunamadı' }, { status: 404 })

    if (kullanici.profilFotoUrl) {
      try {
        const url = new URL(kullanici.profilFotoUrl)
        const yol = url.pathname.split('/fotograflar/')[1]
        if (yol) await supabase.storage.from('fotograflar').remove([yol])
      } catch { /* devam et */ }
    }

    await prisma.kullanici.update({
      where: { id: kullanici.id },
      data: { profilFotoUrl: null, guncellemeTarihi: new Date() }
    })

    return NextResponse.json({ basarili: true })
  } catch {
    return NextResponse.json({ hata: 'Fotoğraf kaldırılamadı' }, { status: 500 })
  }
}
