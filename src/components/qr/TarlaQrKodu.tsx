'use client'

import QRCode from 'qrcode'
import { useEffect, useRef } from 'react'

interface Props {
  tarlaId: string
  tarlaAdi: string
}

export default function TarlaQrKodu({ tarlaId, tarlaAdi }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const icerik = `tarimcrm://hasat-giris?tarla_id=${tarlaId}`

  useEffect(() => {
    if (canvasRef.current) {
      QRCode.toCanvas(canvasRef.current, icerik, { width: 200, margin: 2 })
    }
  }, [icerik])

  function indir() {
    const canvas = canvasRef.current
    if (!canvas) return
    const link = document.createElement('a')
    link.download = `qr-${tarlaAdi}.png`
    link.href = canvas.toDataURL()
    link.click()
  }

  return (
    <div className="flex flex-col items-center gap-3">
      <canvas ref={canvasRef} />
      <p className="text-sm font-medium text-gray-700">{tarlaAdi}</p>
      <button
        onClick={indir}
        className="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 transition-colors"
      >
        İndir
      </button>
    </div>
  )
}
