export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import QRCode from 'qrcode'

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const icerik = `tarimcrm://hasat-giris?tarla_id=${id}`
    const pngBuffer = await QRCode.toBuffer(icerik, { width: 300, margin: 2 })
    return new Response(pngBuffer as unknown as BodyInit, {
      headers: { 'Content-Type': 'image/png' },
    })
  } catch {
    return NextResponse.json({ hata: 'QR kod oluşturulamadı' }, { status: 500 })
  }
}
