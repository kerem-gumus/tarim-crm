'use client'
import { Suspense } from 'react'
import HasatMobilGirisIcerik from './HasatMobilGirisIcerik'

export default function HasatMobilGirisPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-500">Yükleniyor...</div>
      </div>
    }>
      <HasatMobilGirisIcerik />
    </Suspense>
  )
}
