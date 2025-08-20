import type { NextApiRequest, NextApiResponse } from 'next'

export default function handler(_req: NextApiRequest, res: NextApiResponse) {
  const keys = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    'SUPABASE_SERVICE_ROLE_KEY',
    'NEXT_PUBLIC_DEFAULT_BUSINESS_ID'
  ]

  const status = Object.fromEntries(
    keys.map((k) => [k, process.env[k] ? 'present' : 'missing'])
  ) as Record<string, 'present' | 'missing'>

  res.status(200).json({ status })
}


