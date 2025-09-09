'use client'

import React from 'react'
import { useParams, useRouter } from 'next/navigation'

export default function ImportDetailPage() {
  const params = useParams()
  const router = useRouter()
  const id = (params?.id as string) || ''
  const [row, setRow] = React.useState<any | null>(null)
  const [loading, setLoading] = React.useState(true)

  React.useEffect(() => {
    if (!id) return
    ;(async () => {
      try {
        const resp = await fetch(`/api/admin/menu-imports/${id}`)
        const json = await resp.json()
        setRow(json.import || null)
      } catch {}
      setLoading(false)
    })()
  }, [id])

  if (loading) return <div className="p-6">Loading…</div>
  if (!row) return <div className="p-6">Not found</div>

  return (
    <div className="max-w-5xl mx-auto p-6">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Import {row.id}</h1>
        <button className="px-3 py-2 rounded bg-black text-white" onClick={() => router.push('/admin')}>Back</button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <Info label="Restaurant" value={row.restaurant_id} link={`/restaurant/${row.restaurant_id}/dashboard`} />
        <Info label="Status" value={row.status} />
        <Info label="Totals" value={`${row.total_categories}/${row.total_items}`} />
        <Info label="Processed" value={`${row.processed_categories}/${row.processed_items}`} />
        <Info label="Failed" value={`${row.items_failed || 0}`} />
        <Info label="Cost" value={row.agent_cost_usd != null ? `$${Number(row.agent_cost_usd).toFixed(4)}` : '-'} />
        <Info label="Started" value={row.started_at ? new Date(row.started_at).toLocaleString() : '-'} />
        <Info label="Completed" value={row.completed_at ? new Date(row.completed_at).toLocaleString() : '-'} />
      </div>
      <div className="mb-2 text-lg font-semibold">Logs</div>
      <pre className="text-xs bg-gray-50 p-4 border rounded overflow-x-auto">
        {JSON.stringify(row.logs || [], null, 2)}
      </pre>
      <div className="mt-4 text-sm">
        <div className="font-medium">Source URL</div>
        <a className="text-blue-600 underline break-all" href={row.source_url} target="_blank" rel="noreferrer">{row.source_url}</a>
      </div>
    </div>
  )
}

function Info({ label, value, link }: { label: string; value: React.ReactNode; link?: string }) {
  const content = <span>{value}</span>
  return (
    <div className="p-3 border rounded">
      <div className="text-xs text-gray-500">{label}</div>
      <div className="font-medium">
        {link ? <a className="text-blue-600 underline" href={link as string}>{content}</a> : content}
      </div>
    </div>
  )
}


