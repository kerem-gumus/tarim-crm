'use client'
import { useState, useEffect } from 'react'

interface MobilKameraHook {
  mobilMi: boolean
  kameraIleYukle: () => Promise<File | null>
}

export function useMobilKamera(): MobilKameraHook {
  const [mobilMi, setMobilMi] = useState(false)

  useEffect(() => {
    // Capacitor native ortamı tespit et
    if (typeof window !== 'undefined') {
      const native = !!(window as unknown as { Capacitor?: { isNativePlatform?: () => boolean } })
        .Capacitor?.isNativePlatform?.()
      setMobilMi(native)
    }
  }, [])

  async function kameraIleYukle(): Promise<File | null> {
    if (!mobilMi) return null

    try {
      // Capacitor Camera plugin'i dinamik import et
      const { Camera, CameraResultType, CameraSource } = await import('@capacitor/camera')
      const foto = await Camera.getPhoto({
        quality: 80,
        allowEditing: true,
        resultType: CameraResultType.DataUrl,
        source: CameraSource.Prompt, // kamera veya galeri seç
      })

      if (!foto.dataUrl) return null

      // Base64 data URL'yi File objesine çevir
      const res = await fetch(foto.dataUrl)
      const blob = await res.blob()
      const dosya = new File([blob], `profil-foto-${Date.now()}.jpg`, { type: 'image/jpeg' })
      return dosya
    } catch (hata) {
      // Kullanıcı iptal etti
      console.log('Kamera iptal edildi:', hata)
      return null
    }
  }

  return { mobilMi, kameraIleYukle }
}
