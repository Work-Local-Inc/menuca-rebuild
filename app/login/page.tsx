'use client'

import React, { useState } from 'react'
import { supabase } from '@/lib/supabase'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const sendLink = async () => {
    setError(null)
    try {
      const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || (typeof window !== 'undefined' ? window.location.origin : '')
      const redirectTo = `${siteUrl}/auth/continue`
      const { error } = await supabase.auth.signInWithOtp({ email, options: { emailRedirectTo: redirectTo } })
      if (error) throw error
      setSent(true)
    } catch (e: any) {
      setError(e?.message || 'Failed to send link')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md bg-white shadow rounded-xl p-8">
        <h1 className="text-2xl font-bold mb-2">Sign in</h1>
        <p className="text-gray-600 mb-6">We’ll email you a magic link to sign in.</p>

        {sent ? (
          <div className="text-green-700 bg-green-50 border border-green-200 rounded p-4">
            Check your inbox for the sign-in link.
          </div>
        ) : (
          <>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@restaurant.com"
              className="w-full border rounded px-3 py-2 mb-3"
            />
            <button
              onClick={sendLink}
              disabled={!email}
              className="w-full bg-orange-600 hover:bg-orange-700 text-white rounded px-4 py-2"
            >
              Send magic link
            </button>
            {error && <p className="text-red-600 text-sm mt-3">{error}</p>}
          </>
        )}
      </div>
    </div>
  )
}


