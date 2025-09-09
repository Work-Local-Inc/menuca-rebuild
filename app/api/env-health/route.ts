import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'
export const revalidate = 0

export async function GET() {
  const keys = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    'SUPABASE_SERVICE_ROLE_KEY',
    'NEXT_PUBLIC_DEFAULT_BUSINESS_ID',
    'AGENT_PROVIDER',
    'LLM_API_KEY',
    'OPENAI_API_KEY',
    'LLM_MODEL',
    'PLAYWRIGHT_ENABLED',
    'BROWSERLESS_WS',
    'AGENT_INTERNAL_SECRET'
  ]

  const status = Object.fromEntries(
    keys.map((k) => [k, process.env[k] ? 'present' : 'missing'])
  )

  return NextResponse.json({ status }, { status: 200 })
}


