import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

type BusinessRecord = {
  id: string
  slug?: string | null
  name: string
  phone?: string | null
  timezone?: string | null
  currency?: string | null
  is_open?: boolean | null
  order_limit?: number | null
  address?: Record<string, unknown> | null
}

function getBusinessIdFromRequest(req: Request): string | null {
  const url = new URL(req.url)
  const idFromQuery = url.searchParams.get('business_id') || ''
  if (idFromQuery) return idFromQuery
  const idFromHeader = (req.headers.get('x-business-id') as string) || ''
  if (idFromHeader) return idFromHeader
  const idFromEnv = process.env.NEXT_PUBLIC_DEFAULT_BUSINESS_ID || ''
  if (idFromEnv) return idFromEnv
  return null
}

export async function GET(req: Request) {
  const businessId = getBusinessIdFromRequest(req)
  if (!businessId) {
    return NextResponse.json({
      error: 'missing_business_id',
      message:
        'No business identifier provided. Pass ?business_id=... or header x-business-id, or set NEXT_PUBLIC_DEFAULT_BUSINESS_ID.'
    }, { status: 400 })
  }

  const allowedId = process.env.NEXT_PUBLIC_DEFAULT_BUSINESS_ID
  if (allowedId && businessId !== allowedId) {
    return NextResponse.json({ error: 'forbidden', message: 'Business not permitted in this environment' }, { status: 403 })
  }

  const { data, error } = await supabaseAdmin
    .from<BusinessRecord>('businesses')
    .select('*')
    .eq('id', businessId)
    .single()

  if (error) {
    const message = error.message || 'Unknown error'
    const code = (error as any).code || ''
    if (message.includes('Could not find the table') || code === '42P01') {
      return NextResponse.json({
        error: 'missing_table',
        message:
          "Table 'public.businesses' does not exist. Run the migration in sql/create-businesses-table.sql on your Supabase project.",
      }, { status: 424 })
    }
    return NextResponse.json({ error: 'query_failed', message }, { status: 500 })
  }

  return NextResponse.json({ business: data }, { status: 200 })
}

export async function PUT(req: Request) {
  const businessId = getBusinessIdFromRequest(req)
  if (!businessId) {
    return NextResponse.json({ error: 'missing_business_id' }, { status: 400 })
  }

  const allowedId = process.env.NEXT_PUBLIC_DEFAULT_BUSINESS_ID
  if (allowedId && businessId !== allowedId) {
    return NextResponse.json({ error: 'forbidden', message: 'Business not permitted in this environment' }, { status: 403 })
  }

  const payload = await req.json() as Partial<BusinessRecord>
  const upsertRecord: Partial<BusinessRecord> = {
    id: businessId,
    name: payload.name ?? '',
    phone: payload.phone ?? null,
    timezone: payload.timezone ?? null,
    currency: payload.currency ?? 'CAD',
    is_open: payload.is_open ?? true,
    order_limit: payload.order_limit ?? 0,
    address: payload.address ?? null,
    slug: payload.slug ?? null,
  }

  const { data, error } = await supabaseAdmin
    .from<BusinessRecord>('businesses')
    .upsert(upsertRecord, { onConflict: 'id' })
    .select('*')
    .single()

  if (error) {
    const message = error.message || 'Unknown error'
    const code = (error as any).code || ''
    if (message.includes('Could not find the table') || code === '42P01') {
      return NextResponse.json({
        error: 'missing_table',
        message:
          "Table 'public.businesses' does not exist. Run the migration in sql/create-businesses-table.sql on your Supabase project.",
      }, { status: 424 })
    }
    return NextResponse.json({ error: 'mutation_failed', message }, { status: 500 })
  }

  return NextResponse.json({ business: data }, { status: 200 })
}

export const POST = PUT


