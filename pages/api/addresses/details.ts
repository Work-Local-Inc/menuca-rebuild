import type { NextApiRequest, NextApiResponse } from 'next'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' })
  try {
    const id = String(req.query.id || '')
    if (!id) return res.status(400).json({ error: 'Missing id' })

    const key = process.env.CANADA_POST_API_KEY
    if (!key) return res.status(500).json({ error: 'Missing CANADA_POST_API_KEY' })

    const url = new URL('https://ws1.postescanada-canadapost.ca/AddressComplete/interactive/Retrieve/v2.10/json3.ws')
    url.searchParams.set('Key', key)
    url.searchParams.set('Id', id)

    const resp = await fetch(url.toString())
    if (!resp.ok) {
      const text = await resp.text().catch(() => '')
      return res.status(502).json({ error: 'Upstream error', details: text })
    }
    const json: any = await resp.json()

    const item = Array.isArray(json?.Items) ? json.Items.find((i: any) => !i.Error) : null
    if (!item) return res.status(404).json({ error: 'Address not found' })

    const result = {
      line1: item.Line1 || '',
      line2: item.Line2 || '',
      city: item.City || '',
      province: item.ProvinceName || item.Province || '',
      postalCode: item.PostalCode || '',
      country: item.CountryName || 'Canada',
      latitude: item.Latitude ? Number(item.Latitude) : undefined,
      longitude: item.Longitude ? Number(item.Longitude) : undefined,
      formatted: item.Label || `${item.Line1} ${item.Line2 ? item.Line2 + ' ' : ''}${item.City}, ${item.Province} ${item.PostalCode}`.trim()
    }

    return res.status(200).json({ address: result })
  } catch (e: any) {
    return res.status(500).json({ error: 'Internal error', details: e?.message || String(e) })
  }
}
