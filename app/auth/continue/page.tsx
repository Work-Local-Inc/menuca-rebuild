'use client'

import { useEffect } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'

export default function AuthContinue() {
  const params = useSearchParams()
  const router = useRouter()

  useEffect(() => {
    const ridParam = params ? params.get('rid') : null
    const rid = ridParam || (typeof window !== 'undefined' ? (localStorage.getItem('lastRestaurantId') || document.cookie.match(/last_restaurant_id=([^;]+)/)?.[1] || '') : '')
    if (rid) router.replace(`/restaurant/${rid}/dashboard`)
    else router.replace('/restaurant/onboard')
  }, [])

  return null
}


