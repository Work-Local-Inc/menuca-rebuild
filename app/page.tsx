'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function Home() {
  const router = useRouter()
  
  useEffect(() => {
    // Redirect to restaurant onboarding
    router.push('/restaurant/onboard')
  }, [router])

  return (
    <main className="p-6 text-center">
      <h1 className="text-2xl font-bold">MenuCA</h1>
      <p className="text-gray-600">Redirecting to onboarding...</p>
    </main>
  )
}


