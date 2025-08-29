'use client'

import React, { useEffect, useMemo, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ChefHat, AlertCircle, Save, RotateCcw, Search } from 'lucide-react'

interface MenuItemRow {
  id: string
  name: string
  description: string
  price: number
  image_url?: string | null
  is_active: boolean
  category: string
  category_id: string
}

export default function RestaurantMenuEditor() {
  const params = useParams()
  const router = useRouter()
  const restaurantId = params?.id as string

  const [loading, setLoading] = useState(true)
  const [authed, setAuthed] = useState(false)
  const [restaurantName, setRestaurantName] = useState<string>('')
  const [items, setItems] = useState<MenuItemRow[]>([])
  const [drafts, setDrafts] = useState<Record<string, Partial<MenuItemRow>>>({})
  const [saving, setSaving] = useState<Record<string, boolean>>({})
  const [filter, setFilter] = useState('')
  const [categoryDrafts, setCategoryDrafts] = useState<Record<string, string>>({})
  const [savingCategory, setSavingCategory] = useState<Record<string, boolean>>({})

  useEffect(() => {
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        router.replace('/login')
        return
      }
      setAuthed(true)
      try {
        const res = await fetch(`/api/restaurants/${restaurantId}`)
        if (res.ok) {
          const json = await res.json()
          setRestaurantName(json.restaurant?.name || '')
        }
      } catch {}
      await loadMenu()
      setLoading(false)
    }
    void init()
  }, [restaurantId])

  const loadMenu = async () => {
    try {
      const res = await fetch(`/api/restaurants/${restaurantId}/menu`)
      if (!res.ok) throw new Error('Failed to load menu')
      const json = await res.json()
      setItems(json.menu || [])
      setDrafts({})
      setCategoryDrafts({})
    } catch (e) {
      console.error(e)
    }
  }

  const grouped = useMemo(() => {
    const m: Record<string, MenuItemRow[]> = {}
    items
      .filter(i => {
        if (!filter.trim()) return true
        const q = filter.toLowerCase()
        return (
          i.name.toLowerCase().includes(q) ||
          i.description.toLowerCase().includes(q) ||
          i.category.toLowerCase().includes(q)
        )
      })
      .forEach(i => {
        m[i.category || 'Other'] = m[i.category || 'Other'] || []
        m[i.category || 'Other'].push(i)
      })
    return m
  }, [items, filter])

  const getDraft = (id: string) => drafts[id] || {}
  const setField = (id: string, field: keyof MenuItemRow, value: any) => {
    setDrafts(prev => ({ ...prev, [id]: { ...prev[id], [field]: value } }))
  }
  const resetDraft = (id: string) => setDrafts(prev => { const { [id]: _, ...rest } = prev; return rest })

  const saveItem = async (id: string) => {
    const changes = drafts[id]
    if (!changes || Object.keys(changes).length === 0) return
    setSaving(prev => ({ ...prev, [id]: true }))
    try {
      const body: any = {}
      if (typeof changes.name === 'string') body.name = changes.name
      if (typeof changes.description === 'string') body.description = changes.description
      if (typeof changes.price !== 'undefined') body.price = Number(changes.price)
      if (typeof changes.is_active === 'boolean') body.is_active = changes.is_active

      const res = await fetch(`/api/restaurants/${restaurantId}/menu/items/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      })
      if (!res.ok) {
        const t = await res.text()
        throw new Error(t || 'Failed to save item')
      }
      const { item } = await res.json()
      setItems(prev => prev.map(p => (
        p.id === id
          ? { ...p, ...item, category: p.category, category_id: p.category_id }
          : p
      )))
      resetDraft(id)
    } catch (e) {
      console.error(e)
      alert('Failed to save. Please try again.')
    } finally {
      setSaving(prev => ({ ...prev, [id]: false }))
    }
  }

  const saveCategory = async (categoryId: string, newName: string) => {
    if (!newName.trim()) return
    setSavingCategory(prev => ({ ...prev, [categoryId]: true }))
    try {
      const res = await fetch(`/api/restaurants/${restaurantId}/menu/categories/${categoryId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newName })
      })
      if (!res.ok) {
        const t = await res.text()
        throw new Error(t || 'Failed to update category')
      }
      // Update local items' category name
      setItems(prev => prev.map(p => (p.category_id === categoryId ? { ...p, category: newName } : p)))
      setCategoryDrafts(prev => { const { [categoryId]: _, ...rest } = prev; return rest })
    } catch (e) {
      console.error(e)
      alert('Failed to update category. Please try again.')
    } finally {
      setSavingCategory(prev => ({ ...prev, [categoryId]: false }))
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <ChefHat className="h-12 w-12 text-orange-600 animate-bounce mx-auto mb-4" />
          <p className="text-lg text-gray-600">Loading menu editor...</p>
        </div>
      </div>
    )
  }

  if (!authed) return null

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Edit Menu {restaurantName ? `— ${restaurantName}` : ''}</h2>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => router.push(`/menu/${restaurantId}`)}>View Live Menu</Button>
            <Button onClick={() => router.push(`/restaurant/${restaurantId}/dashboard`)}>Back to Dashboard</Button>
          </div>
        </div>

        <div className="mb-4 flex items-center gap-2">
          <Search className="h-4 w-4 text-gray-400" />
          <Input placeholder="Search items or categories..." value={filter} onChange={(e) => setFilter(e.target.value)} />
        </div>

        {Object.keys(grouped).length === 0 && (
          <Card className="mb-4">
            <CardContent className="p-4">
              <div className="flex items-start gap-2 text-yellow-800 bg-yellow-50 border border-yellow-200 rounded p-3">
                <AlertCircle className="h-5 w-5" />
                <div>No items match your search.</div>
              </div>
            </CardContent>
          </Card>
        )}

        {Object.entries(grouped).map(([categoryName, rows]) => {
          const categoryId = rows[0]?.category_id
          const draftName = categoryDrafts[categoryId] ?? categoryName
          const savingCat = !!savingCategory[categoryId]
          return (
            <Card key={categoryId || categoryName} className="mb-6">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Input
                    value={draftName}
                    onChange={(e) => setCategoryDrafts(prev => ({ ...prev, [categoryId]: e.target.value }))}
                    className="max-w-sm"
                  />
                  <Button size="sm" disabled={savingCat || draftName === categoryName} onClick={() => saveCategory(categoryId, draftName)} className="bg-orange-600 hover:bg-orange-700">
                    <Save className="h-4 w-4 mr-1" /> {savingCat ? 'Saving...' : 'Save'}
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {rows.map(row => {
                  const draft = getDraft(row.id)
                  const name = draft.name ?? row.name
                  const description = draft.description ?? row.description
                  const price = draft.price ?? row.price
                  const is_active = typeof draft.is_active === 'boolean' ? draft.is_active : row.is_active
                  const dirty = !!draft && Object.keys(draft).length > 0
                  const savingNow = saving[row.id]
                  return (
                    <div key={row.id} className="border rounded p-3">
                      <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-start">
                        <div className="md:col-span-3">
                          <label className="text-xs text-gray-500">Name</label>
                          <Input value={name} onChange={(e) => setField(row.id, 'name', e.target.value)} />
                        </div>
                        <div className="md:col-span-6">
                          <label className="text-xs text-gray-500">Description</label>
                          <Input value={description} onChange={(e) => setField(row.id, 'description', e.target.value)} />
                        </div>
                        <div className="md:col-span-2">
                          <label className="text-xs text-gray-500">Price</label>
                          <Input value={String(price)} onChange={(e) => setField(row.id, 'price', e.target.value)} />
                        </div>
                        <div className="md:col-span-1">
                          <label className="text-xs text-gray-500">Active</label>
                          <div>
                            <input type="checkbox" checked={!!is_active} onChange={(e) => setField(row.id, 'is_active', e.target.checked)} />
                          </div>
                        </div>
                      </div>
                      {dirty && (
                        <div className="mt-2 flex gap-2">
                          <Button size="sm" onClick={() => saveItem(row.id)} disabled={savingNow} className="bg-orange-600 hover:bg-orange-700">
                            <Save className="h-4 w-4 mr-1" /> {savingNow ? 'Saving...' : 'Save'}
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => resetDraft(row.id)}>
                            <RotateCcw className="h-4 w-4 mr-1" /> Undo
                          </Button>
                        </div>
                      )}
                    </div>
                  )
                })}
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
