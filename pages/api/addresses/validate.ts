import type { NextApiRequest, NextApiResponse } from 'next'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })
  try {
    const { query } = req.body as { query?: string }
    if (!query || query.trim().length < 3) return res.status(400).json({ error: 'Query too short' })

    const key = process.env.CANADA_POST_API_KEY
    if (!key) return res.status(500).json({ error: 'Missing CANADA_POST_API_KEY' })

    const url = new URL('https://ws1.postescanada-canadapost.ca/AddressComplete/interactive/Find/v2.10/json3.ws')
    url.searchParams.set('Key', key)
    url.searchParams.set('Text', query)
    url.searchParams.set('Country', 'CAN')
    url.searchParams.set('MaxResults', '8')

    const resp = await fetch(url.toString())
    if (!resp.ok) {
      const text = await resp.text().catch(() => '')
      return res.status(502).json({ error: 'Upstream error', details: text })
    }
    const json: any = await resp.json()

    const suggestions = Array.isArray(json?.Items)
      ? json.Items.filter((i: any) => !i.Error).map((i: any) => ({
          id: i.Id,
          text: i.Text,
          description: i.Description,
        }))
      : []

    return res.status(200).json({ suggestions })
  } catch (e: any) {
    return res.status(500).json({ error: 'Internal error', details: e?.message || String(e) })
  }
}
