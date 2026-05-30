'use client'

import { useOturumSuresi } from '@/hooks/useOturumSuresi'

export default function OturumKorucu({ children }: { children: React.ReactNode }) {
  useOturumSuresi()
  return <>{children}</>
}
