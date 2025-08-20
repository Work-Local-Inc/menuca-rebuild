"use client"
import React, { useEffect, useState } from 'react'

type Business = {
  id: string
  name: string
  phone?: string | null
  timezone?: string | null
  currency?: string | null
  is_open?: boolean | null
  order_limit?: number | null
}

const DEFAULT_BUSINESS_ID = process.env.NEXT_PUBLIC_DEFAULT_BUSINESS_ID || ''

export default function SettingsClient() {
  const [businessId, setBusinessId] = useState<string>(DEFAULT_BUSINESS_ID)
  const [form, setForm] = useState<Business | null>(null)
  const [loading, setLoading] = useState<boolean>(false)
  const [saving, setSaving] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  useEffect(() => {
    const id = businessId
    if (!id) return
    setLoading(true)
    setError(null)
    fetch(`/api/business-settings?business_id=${encodeURIComponent(id)}`)
      .then(async (r) => {
        if (!r.ok) {
          const body = await r.json().catch(() => ({}))
          throw new Error(body?.message || `Failed to load settings (${r.status})`)
        }
        return r.json()
      })
      .then((data) => {
        setForm(data.business)
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }, [businessId])

  const onSave = async () => {
    if (!form) return
    setSaving(true)
    setError(null)
    setSuccess(null)
    try {
      const res = await fetch(`/api/business-settings?business_id=${encodeURIComponent(form.id)}` , {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      })
      const body = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(body?.message || `Failed to save (${res.status})`)
      setForm(body.business)
      setSuccess('Saved')
    } catch (e: any) {
      setError(e?.message || String(e))
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <h1 className="text-3xl font-bold">Business Settings</h1>

      {!DEFAULT_BUSINESS_ID && (
        <div className="p-3 rounded bg-yellow-50 text-yellow-800">
          Set <code>NEXT_PUBLIC_DEFAULT_BUSINESS_ID</code> to auto-load a business, or pass <code>?business_id=</code>.
        </div>
      )}

      <div className="flex gap-2 items-center">
        <input
          className="border px-3 py-2 rounded w-full"
          placeholder="Business ID"
          value={businessId}
          onChange={(e) => setBusinessId(e.target.value)}
        />
        <button
          onClick={() => setBusinessId(businessId)}
          className="px-4 py-2 bg-blue-600 text-white rounded"
        >
          Load
        </button>
      </div>

      {loading && <div>Loading...</div>}
      {error && <div className="p-3 rounded bg-red-50 text-red-700">{error}</div>}
      {success && <div className="p-3 rounded bg-green-50 text-green-700">{success}</div>}

      {form && (
        <div className="space-y-4 bg-white p-4 rounded shadow">
          <div>
            <label className="block text-sm text-gray-600 mb-1">Name</label>
            <input
              className="border px-3 py-2 rounded w-full"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">Phone</label>
            <input
              className="border px-3 py-2 rounded w-full"
              value={form.phone || ''}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm text-gray-600 mb-1">Timezone</label>
              <input
                className="border px-3 py-2 rounded w-full"
                value={form.timezone || ''}
                onChange={(e) => setForm({ ...form, timezone: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">Currency</label>
              <input
                className="border px-3 py-2 rounded w-full"
                value={form.currency || ''}
                onChange={(e) => setForm({ ...form, currency: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">Order Limit</label>
              <input
                type="number"
                className="border px-3 py-2 rounded w-full"
                value={form.order_limit || 0}
                onChange={(e) => setForm({ ...form, order_limit: Number(e.target.value) })}
              />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <input
              id="is_open"
              type="checkbox"
              checked={!!form.is_open}
              onChange={(e) => setForm({ ...form, is_open: e.target.checked })}
            />
            <label htmlFor="is_open">Open for orders</label>
          </div>
          <div className="flex gap-2">
            <button
              onClick={onSave}
              disabled={saving}
              className="px-4 py-2 bg-blue-600 text-white rounded"
            >
              {saving ? 'Saving...' : 'Save'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}


