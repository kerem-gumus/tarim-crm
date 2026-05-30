import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { randomUUID } from 'crypto';

// =====================================================
// Dekont dosyası yükleme
// POST /api/dekont-yukle  (multipart/form-data, alan adı: "dosya")
// Response: { url: string, dosyaAdi: string }
// Desteklenen: PDF, JPG, JPEG, PNG — maks 10 MB
// =====================================================

const IZINLI_UZANTILAR = ['pdf', 'jpg', 'jpeg', 'png'];
const MAKS_BOYUT = 10 * 1024 * 1024; // 10 MB

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
      return NextResponse.json({ hata: 'Dosya boyutu 10 MB\'yi geçemez' }, { status: 400 });
    }

    const benzersizAd = `${randomUUID()}.${ext}`;
    const klasor = join(process.cwd(), 'public', 'uploads', 'dekontlar');

    await mkdir(klasor, { recursive: true });
    const bytes = await dosya.arrayBuffer();
    await writeFile(join(klasor, benzersizAd), Buffer.from(bytes));

    return NextResponse.json({
      url: `/uploads/dekontlar/${benzersizAd}`,
      dosyaAdi: dosya.name,
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ hata: 'Dosya yüklenemedi' }, { status: 500 });
  }
}
