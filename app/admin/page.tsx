'use client'

import React, { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

type Restaurant = {
  id: string
  name: string
  logo_url?: string | null
  status?: string | null
}

export default function AdminPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [authorized, setAuthorized] = useState(false)
  const [restaurants, setRestaurants] = useState<Restaurant[]>([])

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
        return
      }
      const email = (user.email || '').toLowerCase().trim()
      let ok = email === 'brian@worklocal.ca'

      if (!ok) {
        // Also allow users with admin role
        const { data: roles } = await supabase
          .from('user_restaurant_roles')
          .select('role')
          .eq('user_id', user.id)
          .eq('role', 'admin')
          .limit(1)
        ok = !!roles && roles.length > 0
      }

      if (!ok) {
        router.push('/login')
        return
      }
      setAuthorized(true)
      const { data, error } = await supabase
        .from('restaurants')
        .select('id, name, logo_url, status')
        .order('created_at', { ascending: false })
      if (!error && data) setRestaurants(data as any)
      setLoading(false)
    })()
  }, [router])

  if (loading) return <div className="p-6">Loading…</div>
  if (!authorized) return null

  return (
    <div className="max-w-5xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">All Restaurants</h1>
      <RecentImports />
      {restaurants.length > 0 && (
        <div className="mb-4 flex justify-end">
          <button
            className="px-3 py-2 rounded bg-red-600 text-white"
            onClick={async () => {
              if (!confirm('Delete ALL restaurants? This cannot be undone.')) return
              for (const r of restaurants) {
                await fetch(`/api/restaurants/${r.id}`, { method: 'DELETE' })
              }
              setRestaurants([])
            }}
          >
            Delete All
          </button>
        </div>
      )}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {restaurants.map(r => (
          <div key={r.id} className="border rounded-lg p-4 flex items-center gap-3">
            {r.logo_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              (<img src={r.logo_url} alt={r.name} className="h-10 max-w-[160px] object-contain" />)
            ) : (
              <div className="h-10 min-w-[80px] bg-gray-100" />
            )}
            <div className="flex-1">
              <div className="font-semibold">{r.name}</div>
              <div className="text-xs text-gray-500">{r.status || 'active'}</div>
            </div>
            <button className="px-3 py-1 rounded bg-black text-white" onClick={() => router.push(`/restaurant/${r.id}/dashboard`)}>Dashboard</button>
            <button className="px-3 py-1 rounded bg-white ring-1 ring-black/10" onClick={() => router.push(`/menu/${r.id}`)}>View</button>
            <button
              className="px-3 py-1 rounded bg-red-600 text-white"
              onClick={async () => {
                if (!confirm(`Delete ${r.name}?`)) return
                await fetch(`/api/restaurants/${r.id}`, { method: 'DELETE' })
                setRestaurants(prev => prev.filter(x => x.id !== r.id))
              }}
            >
              Delete
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

function RecentImports() {
  const [rows, setRows] = React.useState<any[] | null>(null)
  React.useEffect(() => {
    ;(async () => {
      try {
        const resp = await fetch('/api/admin/menu-imports')
        const json = await resp.json()
        setRows(json.imports || [])
      } catch {}
    })()
  }, [])
  if (!rows) return null
  if (rows.length === 0) return null
  return (
    <div className="mb-6">
      <div className="text-lg font-semibold mb-2">Recent Menu Imports</div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm border">
          <thead>
            <tr className="bg-gray-50 text-left">
              <th className="p-2 border">Started</th>
              <th className="p-2 border">Restaurant</th>
              <th className="p-2 border">Status</th>
              <th className="p-2 border">Totals</th>
              <th className="p-2 border">Processed</th>
              <th className="p-2 border">Failed</th>
              <th className="p-2 border">Cost</th>
              <th className="p-2 border">Source</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className="hover:bg-gray-50">
                <td className="p-2 border whitespace-nowrap">{new Date(r.started_at).toLocaleString()}</td>
                <td className="p-2 border">
                  <a className="text-blue-600 underline" href={`/restaurant/${r.restaurant_id}/dashboard`}>{r.restaurant_id}</a>
                </td>
                <td className="p-2 border">{r.status}</td>
                <td className="p-2 border">{r.total_categories}/{r.total_items}</td>
                <td className="p-2 border">{r.processed_categories}/{r.processed_items}</td>
                <td className="p-2 border">{r.items_failed || 0}</td>
                <td className="p-2 border">{r.agent_cost_usd != null ? `$${Number(r.agent_cost_usd).toFixed(4)}` : '-'}</td>
                <td className="p-2 border max-w-[280px] truncate" title={r.source_url}>
                  <div className="flex items-center gap-2">
                    <span className="truncate">{r.source_url}</span>
                    <a className="text-blue-600 underline whitespace-nowrap" href={`/admin/imports/${r.id}`}>View</a>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}


