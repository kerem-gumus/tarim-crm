import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { randomUUID } from 'crypto';

// =====================================================
// Dekont dosyası yükleme — Supabase Storage (fotograflar bucket)
// POST /api/dekont-yukle  (multipart/form-data, alan adı: "dosya")
// Response: { url: string, dosyaYolu: string, dosyaAdi: string }
// Desteklenen: PDF, JPG, JPEG, PNG — maks 10 MB
// =====================================================

const IZINLI_UZANTILAR = ['pdf', 'jpg', 'jpeg', 'png'];
const MAKS_BOYUT = 10 * 1024 * 1024; // 10 MB
const BUCKET = 'fotograflar';

function supabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );
}

export async function POST(istek: NextRequest) {
  try {
    const formData = await istek.formData();
    const dosya = formData.get('dosya') as File | null;

    if (!dosya || dosya.size === 0) {
      return NextResponse.json({ hata: 'Dosya bulunamadı' }, { status: 400 });
    }

    const ext = dosya.name.split('.').pop()?.toLowerCase() ?? '';
    if (!IZINLI_UZANTILAR.includes(ext)) {
      return NextResponse.json(
        { hata: 'Sadece PDF, JPG ve PNG dosyaları yüklenebilir' },
        { status: 400 }
      );
    }

    if (dosya.size > MAKS_BOYUT) {
      return NextResponse.json({ hata: "Dosya boyutu 10 MB'yi geçemez" }, { status: 400 });
    }

    const benzersizAd = `${randomUUID()}.${ext}`;
    const depoYolu = `dekontlar/${benzersizAd}`;

    const bytes = await dosya.arrayBuffer();
    const supabase = supabaseAdmin();

    const { error } = await supabase.storage
      .from(BUCKET)
      .upload(depoYolu, Buffer.from(bytes), {
        contentType: dosya.type || 'application/octet-stream',
        cacheControl: '3600',
        upsert: false,
      });

    if (error) {
      console.error('[dekont-yukle] Storage hatası:', error);
      return NextResponse.json({ hata: 'Dosya yüklenemedi: ' + error.message }, { status: 500 });
    }

    const { data: pubData } = supabase.storage.from(BUCKET).getPublicUrl(depoYolu);

    return NextResponse.json({
      url: pubData.publicUrl,
      dosyaYolu: depoYolu,
      dosyaAdi: dosya.name,
    });
  } catch (err) {
    console.error('[dekont-yukle]', err);
    return NextResponse.json({ hata: 'Dosya yüklenemedi' }, { status: 500 });
  }
}
