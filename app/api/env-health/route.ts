import { NextResponse } from 'next/server'

export async function GET() {
  const keys = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    'SUPABASE_SERVICE_ROLE_KEY',
    'NEXT_PUBLIC_DEFAULT_BUSINESS_ID'
  ]

  const status = Object.fromEntries(
    keys.map((k) => [k, process.env[k] ? 'present' : 'missing'])
  )

  return NextResponse.json({ status }, { status: 200 })
}


