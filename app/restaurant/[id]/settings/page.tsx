'use client'

import React, { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

export default function RestaurantSettingsPage() {
  const params = useParams()
  const restaurantId = params?.id as string

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [delivery_fee_enabled, setDeliveryFeeEnabled] = useState(false)
  const [delivery_fee, setDeliveryFee] = useState<string>('')
  const [out_of_area_fee_enabled, setOutOfAreaFeeEnabled] = useState(false)
  const [out_of_area_fee, setOutOfAreaFee] = useState<string>('')
  const [delivery_radius_km, setDeliveryRadiusKm] = useState<string>('')
  const [latitude, setLatitude] = useState<string>('')
  const [longitude, setLongitude] = useState<string>('')
  const [logoUrl, setLogoUrl] = useState<string>('')
  const [bannerUrl, setBannerUrl] = useState<string>('')
  const [logoUploading, setLogoUploading] = useState(false)
  const [bannerUploading, setBannerUploading] = useState(false)

  useEffect(() => {
    const load = async () => {
      try {
        const r = await fetch(`/api/restaurants/${restaurantId}`)
        const j = await r.json()
        const rest = j.restaurant || {}
        setDeliveryFeeEnabled(!!rest.delivery_fee_enabled)
        setDeliveryFee(rest.delivery_fee != null ? String(rest.delivery_fee) : '')
        setOutOfAreaFeeEnabled(!!rest.out_of_area_fee_enabled)
        setOutOfAreaFee(rest.out_of_area_fee != null ? String(rest.out_of_area_fee) : '')
        setDeliveryRadiusKm(rest.delivery_radius_km != null ? String(rest.delivery_radius_km) : '')
        setLatitude(rest.latitude != null ? String(rest.latitude) : '')
        setLongitude(rest.longitude != null ? String(rest.longitude) : '')
        setLogoUrl(rest.logo_url || '')
        setBannerUrl(rest.banner_url || '')
      } catch {}
      setLoading(false)
    }
    if (restaurantId) void load()
  }, [restaurantId])

  const save = async () => {
    setSaving(true)
    try {
      const payload: any = {
        delivery_fee_enabled,
        out_of_area_fee_enabled,
      }
      if (delivery_fee !== '') payload.delivery_fee = Number(delivery_fee)
      else payload.delivery_fee = null
      if (out_of_area_fee !== '') payload.out_of_area_fee = Number(out_of_area_fee)
      else payload.out_of_area_fee = null
      if (delivery_radius_km !== '') payload.delivery_radius_km = Number(delivery_radius_km)
      else payload.delivery_radius_km = null
      if (latitude !== '') payload.latitude = Number(latitude)
      else payload.latitude = null
      if (longitude !== '') payload.longitude = Number(longitude)
      else payload.longitude = null

      const r = await fetch(`/api/restaurants/${restaurantId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
      if (!r.ok) throw new Error(await r.text())
      alert('Settings saved')
    } catch (e) {
      console.error(e)
      alert('Failed to save settings')
    } finally {
      setSaving(false)
    }
  }

  const uploadImage = async (file: File, setUrl: (v: string) => void) => {
    const reader = new FileReader()
    return new Promise<void>((resolve, reject) => {
      reader.onload = async () => {
        try {
          const base64 = reader.result as string
          const resp = await fetch('/api/upload-image', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ image: base64, filename: file.name, restaurantId })
          })
          if (!resp.ok) throw new Error(await resp.text())
          const data = await resp.json()
          setUrl(data.url)
          resolve()
        } catch (e) {
          console.error(e)
          reject(e)
        }
      }
      reader.onerror = reject
      reader.readAsDataURL(file)
    })
  }

  const saveBranding = async () => {
    try {
      const resp = await fetch(`/api/restaurants/${restaurantId}/images`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ logo_url: logoUrl || null, banner_url: bannerUrl || null })
      })
      if (!resp.ok) throw new Error(await resp.text())
      alert('Branding updated')
    } catch (e) {
      console.error(e)
      alert('Failed to update branding')
    }
  }

  if (loading) return <div className="p-6">Loading…</div>

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Branding</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Logo</label>
            {logoUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={logoUrl} alt="Logo" className="h-16 mb-2 object-contain" />
            )}
            <input
              type="file"
              accept="image/*"
              onChange={async (e) => {
                const file = e.target.files?.[0]
                if (!file) return
                setLogoUploading(true)
                try { await uploadImage(file, setLogoUrl) } finally { setLogoUploading(false) }
              }}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Banner / Hero</label>
            {bannerUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={bannerUrl} alt="Banner" className="h-24 mb-2 object-cover w-full max-w-lg rounded" />
            )}
            <input
              type="file"
              accept="image/*"
              onChange={async (e) => {
                const file = e.target.files?.[0]
                if (!file) return
                setBannerUploading(true)
                try { await uploadImage(file, setBannerUrl) } finally { setBannerUploading(false) }
              }}
            />
          </div>
          <Button onClick={saveBranding} disabled={logoUploading || bannerUploading} className="bg-orange-600 hover:bg-orange-700">
            {logoUploading || bannerUploading ? 'Uploading…' : 'Save Branding'}
          </Button>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Delivery Fees & Radius</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-3">
            <input id="fee-enabled" type="checkbox" checked={delivery_fee_enabled} onChange={e => setDeliveryFeeEnabled(e.target.checked)} />
            <label htmlFor="fee-enabled">Enable base delivery fee</label>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Base delivery fee (CAD)</label>
            <Input value={delivery_fee} onChange={e => setDeliveryFee(e.target.value)} placeholder="e.g., 2.99" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Delivery radius (km)</label>
            <Input value={delivery_radius_km} onChange={e => setDeliveryRadiusKm(e.target.value)} placeholder="e.g., 5" />
          </div>
          <div className="flex items-center gap-3">
            <input id="ooa-enabled" type="checkbox" checked={out_of_area_fee_enabled} onChange={e => setOutOfAreaFeeEnabled(e.target.checked)} />
            <label htmlFor="ooa-enabled">Enable out-of-area fee beyond radius</label>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Out-of-area fee (CAD)</label>
            <Input value={out_of_area_fee} onChange={e => setOutOfAreaFee(e.target.value)} placeholder="e.g., 4.99" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Store Location (for distance)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Latitude</label>
            <Input value={latitude} onChange={e => setLatitude(e.target.value)} placeholder="e.g., 45.4231" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Longitude</label>
            <Input value={longitude} onChange={e => setLongitude(e.target.value)} placeholder="e.g., -75.6831" />
          </div>
        </CardContent>
      </Card>

      <div>
        <Button onClick={save} disabled={saving} className="bg-orange-600 hover:bg-orange-700">
          {saving ? 'Saving…' : 'Save Settings'}
        </Button>
      </div>
    </div>
  )
}


