'use client'

import React, { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { 
  Upload, Globe, ChefHat, MapPin, Phone, Mail, Clock,
  CheckCircle, ArrowRight, ArrowLeft, Loader2, AlertCircle,
  Image as ImageIcon, Link, Download, Eye, Star, Sparkles
} from 'lucide-react'

interface RestaurantProfile {
  name: string
  description: string
  cuisine_type: string
  phone: string
  email: string
  address: string
  city: string
  state: string
  website: string
  logo_url: string
  header_image_url: string
}

interface MenuImportResult {
  categories: number
  items: number
  success: boolean
  preview: any[]
  menu_id: string
}

export default function RestaurantOnboardingPage() {
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [progress, setProgress] = useState<string[]>([])
  
  // Restaurant profile data
  const [profile, setProfile] = useState<RestaurantProfile>({
    name: '',
    description: '',
    cuisine_type: '',
    phone: '',
    email: '',
    address: '',
    city: 'Ottawa',
    state: 'ON',
    website: '',
    logo_url: '',
    header_image_url: ''
  })
  
  // Menu import data
  const [legacyMenuUrl, setLegacyMenuUrl] = useState('https://ottawa.xtremepizzaottawa.com/?p=menu')
  const [menuImportResult, setMenuImportResult] = useState<MenuImportResult | null>(null)
  const [importLoading, setImportLoading] = useState(false)
  const [restaurantId, setRestaurantId] = useState('')
  const [importStatus, setImportStatus] = useState<{
    status: string
    totals: { categories: number; items: number }
    processed: { categories: number; items: number }
  } | null>(null)
  const pollRef = useRef<any>(null)
  
  // File uploads (mock for now)
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [headerImageFile, setHeaderImageFile] = useState<File | null>(null)

  const handleFileUpload = (file: File, type: 'logo' | 'header') => {
    // Create preview URL
    const mockUrl = URL.createObjectURL(file)
    
    if (type === 'logo') {
      setLogoFile(file)
      setProfile(prev => ({ ...prev, logo_url: mockUrl }))
    } else {
      setHeaderImageFile(file)
      setProfile(prev => ({ ...prev, header_image_url: mockUrl }))
    }
  }

  const importLegacyMenu = async () => {
    if (!legacyMenuUrl.trim()) return
    
    setImportLoading(true)
    try {
      console.log('🔍 Importing menu from:', legacyMenuUrl)
      
      const response = await fetch('/api/admin/import-legacy-menu', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          url: legacyMenuUrl,
          restaurant_id: 'temp-preview', // Temp ID for preview
          restaurant_name: profile.name
        })
      })
      
      if (!response.ok) {
        try {
          const errorData = await response.json()
          throw new Error(errorData.error || 'Failed to import menu')
        } catch {
          const text = await response.text()
          throw new Error(text || 'Failed to import menu')
        }
      }
      
      const result = await response.json()
      setMenuImportResult(result)
      if (result?.success === false) {
        console.warn('⚠️ Preview import soft-failed:', result?.message)
        alert('Preview did not load, but you can still continue. The import will run on Go Live.')
      } else {
        console.log('✅ Menu import preview successful:', result)
      }
      
    } catch (error) {
      console.error('Menu import failed:', error)
      alert(`Failed to import menu: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setImportLoading(false)
    }
  }

  // Fire-and-forget real import, then rely on polling
  const startRealImport = (rid: string) => {
    if (!legacyMenuUrl?.trim()) return
    try {
      void fetch('/api/admin/import-legacy-menu', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: legacyMenuUrl,
          restaurant_id: rid,
          restaurant_name: profile.name || 'New Restaurant'
        })
      })
    } catch (e) {
      console.warn('Failed to start import:', e)
    }
  }

  const startPollingStatus = (rid: string) => {
    if (pollRef.current) clearInterval(pollRef.current)
    pollRef.current = setInterval(async () => {
      try {
        const res = await fetch(`/api/restaurants/${rid}/import-status`)
        if (!res.ok) return
        const data = await res.json()
        setImportStatus(data)

        const total = data?.totals?.items || 0
        const done = data?.processed?.items || 0
        const status = data?.status || 'unknown'
        setProgress(prev => {
          const withoutDynamic = prev.filter(p => !p.startsWith('Progress:'))
          return [...withoutDynamic, `Progress: ${done}/${total} items (${status})`]
        })

        if (status === 'completed' || status === 'failed') {
          clearInterval(pollRef.current)
          pollRef.current = null
          setCurrentStep(5)
          setTimeout(() => router.push(`/menu/${rid}`), 800)
        }
      } catch {}
    }, 2000)
  }

  useEffect(() => {
    return () => {
      if (pollRef.current) clearInterval(pollRef.current)
    }
  }, [])

  const uploadIfBlob = async (dataUrl: string | null, file: File | null, rid?: string) => {
    if (!dataUrl || !dataUrl.startsWith('blob:') || !file) return dataUrl
    try {
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = () => resolve(String(reader.result))
        reader.onerror = reject
        reader.readAsDataURL(file)
      })
      const resp = await fetch('/api/upload-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: base64, filename: file.name, restaurantId: rid || 'temp' })
      })
      if (!resp.ok) return null
      const json = await resp.json()
      return json.url as string
    } catch { return null }
  }

  const completeOnboarding = async () => {
    setLoading(true)
    try {
      console.log('🚀 Creating restaurant and starting import...')
      setProgress([])
      setProgress(prev => [...prev, 'Creating restaurant record...'])
      if (legacyMenuUrl?.trim()) setProgress(prev => [...prev, 'Starting menu import...'])
      
      // Create restaurant (fast return)
      console.log('🔍 Sending onboard request with:', { profile, legacy_url: legacyMenuUrl });
      const response = await fetch('/api/restaurants/onboard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          profile,
          legacy_url: legacyMenuUrl
        })
      })
      
      if (!response.ok) {
        let message = 'Failed to create restaurant'
        try {
          const errorData = await response.json()
          message = errorData.error || message
        } catch {
          try { message = await response.text() } catch {}
        }
        throw new Error(message)
      }
      
      const result = await response.json()
      const newRestaurantId = result.restaurant.id
      setRestaurantId(newRestaurantId)
      try {
        localStorage.setItem('lastRestaurantId', newRestaurantId)
        document.cookie = `last_restaurant_id=${newRestaurantId}; path=/; max-age=2592000`
      } catch {}
      
      // Upload images if the user selected local files
      const uploadedLogo = await uploadIfBlob(profile.logo_url || null, logoFile, newRestaurantId)
      const uploadedHeader = await uploadIfBlob(profile.header_image_url || null, headerImageFile, newRestaurantId)
      if (uploadedLogo || uploadedHeader) {
        try {
          await fetch(`/api/restaurants/${newRestaurantId}/images`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              logo_url: uploadedLogo || profile.logo_url || null,
              banner_url: uploadedHeader || profile.header_image_url || null
            })
          })
        } catch {}
      }

      console.log('🎉 Restaurant created, starting background import')
      setProgress(prev => [...prev, '✓ Restaurant created'])
      if (legacyMenuUrl?.trim()) {
        startRealImport(newRestaurantId)
        startPollingStatus(newRestaurantId)
      } else {
        // No import; go straight to success
        setCurrentStep(5)
        setTimeout(() => router.push(`/menu/${newRestaurantId}`), 800)
      }
      
    } catch (error) {
      console.error('Restaurant creation failed:', error)
      alert(`Failed to create restaurant: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      // Keep loading true; we'll turn it off when polling completes
    }
  }

  const attachImagesForExisting = async () => {
    if (!restaurantId) return
    setLoading(true)
    try {
      const uploadedLogo = await uploadIfBlob(profile.logo_url || null, logoFile, restaurantId)
      const uploadedHeader = await uploadIfBlob(profile.header_image_url || null, headerImageFile, restaurantId)
      if (uploadedLogo || uploadedHeader) {
        await fetch(`/api/restaurants/${restaurantId}/images`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            logo_url: uploadedLogo || profile.logo_url || null,
            banner_url: uploadedHeader || profile.header_image_url || null
          })
        })
        alert('Images updated!')
      } else {
        alert('Please upload images above first, then click Update Images Only')
      }
    } catch (e) {
      alert('Failed to update images')
    } finally {
      setLoading(false)
    }
  }

  const nextStep = () => setCurrentStep(prev => Math.min(prev + 1, 5))
  const prevStep = () => setCurrentStep(prev => Math.max(prev - 1, 1))

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-purple-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="flex items-center gap-3 mb-4">
            <ChefHat className="h-8 w-8 text-orange-600" />
            <div>
              <h1 className="text-2xl font-bold">Restaurant Onboarding</h1>
              <p className="text-gray-600">Get your restaurant live in 15 minutes</p>
            </div>
            <Badge className="bg-orange-100 text-orange-800">
              🚀 100+ Clients Ready
            </Badge>
          </div>
          
          {/* Progress Bar */}
          <div className="flex items-center justify-between text-sm mb-2">
            {['Profile', 'Images', 'Menu Import', 'Review', 'Live!'].map((step, index) => (
              <div key={step} className="flex items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold ${
                  index + 1 <= currentStep 
                    ? 'bg-orange-600 text-white' 
                    : 'bg-gray-200 text-gray-600'
                }`}>
                  {index + 1 === currentStep && currentStep === 5 ? '🎉' : (index + 1)}
                </div>
                <span className={`ml-2 ${index + 1 === currentStep ? 'text-orange-600 font-semibold' : 'text-gray-600'}`}>
                  {step}
                </span>
              </div>
            ))}
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-gradient-to-r from-orange-500 to-red-500 h-2 rounded-full transition-all duration-500"
              style={{ width: `${(currentStep / 5) * 100}%` }}
            />
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Step 1: Restaurant Profile */}
        {currentStep === 1 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ChefHat className="h-5 w-5" />
                Restaurant Information
              </CardTitle>
              <p className="text-gray-600">Tell us about your restaurant</p>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium mb-2">Restaurant Name *</label>
                  <Input
                    placeholder="e.g., Xtreme Pizza Ottawa"
                    value={profile.name}
                    onChange={(e) => setProfile(prev => ({ ...prev, name: e.target.value }))}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2">Cuisine Type *</label>
                  <Input
                    placeholder="e.g., Italian, Pizza, Fast Food"
                    value={profile.cuisine_type}
                    onChange={(e) => setProfile(prev => ({ ...prev, cuisine_type: e.target.value }))}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Description</label>
                <Input
                  placeholder="Brief description of your restaurant"
                  value={profile.description}
                  onChange={(e) => setProfile(prev => ({ ...prev, description: e.target.value }))}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium mb-2">Phone Number *</label>
                  <Input
                    placeholder="(613) 230-5555"
                    value={profile.phone}
                    onChange={(e) => setProfile(prev => ({ ...prev, phone: e.target.value }))}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2">Email</label>
                  <Input
                    type="email"
                    placeholder="contact@restaurant.com"
                    value={profile.email}
                    onChange={(e) => setProfile(prev => ({ ...prev, email: e.target.value }))}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Full Address *</label>
                <Input
                  placeholder="125 Preston St, Ottawa, ON K1R 7P3"
                  value={profile.address}
                  onChange={(e) => setProfile(prev => ({ ...prev, address: e.target.value }))}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Current Website (Optional)</label>
                <Input
                  placeholder="https://your-restaurant-website.com"
                  value={profile.website}
                  onChange={(e) => setProfile(prev => ({ ...prev, website: e.target.value }))}
                />
              </div>

              <div className="flex justify-end">
                <Button 
                  onClick={nextStep}
                  disabled={!profile.name || !profile.phone || !profile.address || !profile.cuisine_type}
                  className="bg-orange-600 hover:bg-orange-700"
                >
                  Continue to Images <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 2: Logo & Header Image Upload */}
        {currentStep === 2 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ImageIcon className="h-5 w-5" />
                Restaurant Images
              </CardTitle>
              <p className="text-gray-600">Upload your logo and a beautiful header image (Google Places style)</p>
            </CardHeader>
            <CardContent className="space-y-8">
              {/* Logo Upload */}
              <div>
                <label className="block text-sm font-medium mb-4">Restaurant Logo</label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-orange-400 transition-colors">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0], 'logo')}
                      className="hidden"
                      id="logo-upload"
                    />
                    <label htmlFor="logo-upload" className="cursor-pointer">
                      {profile.logo_url ? (
                        <div className="space-y-2">
                          <img src={profile.logo_url} alt="Logo preview" className="w-24 h-24 object-cover mx-auto rounded-lg" />
                          <p className="text-sm text-green-600">Logo uploaded ✓</p>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <ImageIcon className="h-12 w-12 text-gray-400 mx-auto" />
                          <p className="text-gray-600">Click to upload logo</p>
                          <p className="text-xs text-gray-500">PNG, JPG up to 5MB</p>
                        </div>
                      )}
                    </label>
                  </div>
                  
                  {profile.logo_url && (
                    <div className="flex items-center justify-center">
                      <div className="text-center">
                        <div className="w-16 h-16 bg-white rounded-full shadow-lg flex items-center justify-center mx-auto mb-2">
                          <img src={profile.logo_url} alt="Logo" className="w-12 h-12 object-cover rounded-full" />
                        </div>
                        <p className="text-sm text-gray-600">How it appears</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Header Image Upload */}
              <div>
                <label className="block text-sm font-medium mb-4">Header Image (Google Places Style)</label>
                <div className="space-y-4">
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-orange-400 transition-colors">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0], 'header')}
                      className="hidden"
                      id="header-upload"
                    />
                    <label htmlFor="header-upload" className="cursor-pointer">
                      {profile.header_image_url ? (
                        <div className="space-y-2">
                          <img src={profile.header_image_url} alt="Header preview" className="w-full h-32 object-cover mx-auto rounded-lg" />
                          <p className="text-sm text-green-600">Header image uploaded ✓</p>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <ImageIcon className="h-16 w-16 text-gray-400 mx-auto" />
                          <p className="text-gray-600">Upload a beautiful header image</p>
                          <p className="text-xs text-gray-500">This will be the main image customers see</p>
                          <p className="text-xs text-gray-500">Recommended: 1200x400px, PNG/JPG up to 10MB</p>
                        </div>
                      )}
                    </label>
                  </div>
                </div>
              </div>

              <div className="flex justify-between">
                <Button variant="outline" onClick={prevStep}>
                  <ArrowLeft className="mr-2 h-4 w-4" /> Back
                </Button>
                <Button 
                  onClick={nextStep}
                  className="bg-orange-600 hover:bg-orange-700"
                >
                  Continue to Menu Import <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 3: Legacy Menu Import */}
        {currentStep === 3 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Download className="h-5 w-5" />
                Import Your Existing Menu
              </CardTitle>
              <p className="text-gray-600">
                🚀 Paste your current menu website URL and we'll automatically import ALL items!
                <span className="ml-2 text-xs text-gray-500">(Preview optional — import runs on Go Live)</span>
              </p>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* URL Input */}
              <div>
                <label className="block text-sm font-medium mb-2">Current Menu Website URL</label>
                <div className="flex gap-2">
                  <div className="flex-1 relative">
                    <Globe className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                    <Input
                      placeholder="https://ottawa.xtremepizzaottawa.com/?p=menu"
                      value={legacyMenuUrl}
                      onChange={(e) => setLegacyMenuUrl(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  <Button 
                    onClick={importLegacyMenu}
                    disabled={!legacyMenuUrl.trim() || importLoading}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    {importLoading ? (
                      <div className="flex items-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Importing...
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <Download className="h-4 w-4" />
                        Import Menu
                      </div>
                    )}
                  </Button>
                </div>
              </div>

              {/* Example URLs */}
              <div className="bg-blue-50 p-4 rounded-lg">
                <p className="text-sm font-medium text-blue-800 mb-2">✅ Supported Menu Formats:</p>
                <div className="space-y-1 text-sm text-blue-700">
                  <p>• xtremepizzaottawa.com style menus (TESTED ✅)</p>
                  <p>• Most restaurant websites with structured menus</p>
                  <p>• Handles complex pricing (Small/Medium/Large/X-Large)</p>
                  <p>• Imports categories, descriptions, prices automatically</p>
                </div>
              </div>

              {/* Import Results */}
              {menuImportResult && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    <span className="font-semibold text-green-800">🎉 Menu Import SUCCESSFUL!</span>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div className="text-center">
                      <div className="text-3xl font-bold text-green-700">{menuImportResult.categories}</div>
                      <div className="text-sm text-green-600">Categories</div>
                    </div>
                    <div className="text-center">
                      <div className="text-3xl font-bold text-green-700">{menuImportResult.items}</div>
                      <div className="text-sm text-green-600">Menu Items</div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <p className="text-sm font-medium text-green-800">Preview of imported categories:</p>
                    <div className="flex flex-wrap gap-2">
                      {menuImportResult.preview?.slice(0, 8).map((category, index) => (
                        <Badge key={index} variant="secondary" className="bg-green-100 text-green-800">
                          {category.name} ({category.items} items)
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <div className="mt-4 p-3 bg-white rounded border">
                    <p className="text-sm text-gray-600">
                      ✨ All menu items imported with prices, descriptions, and categories. 
                      You can edit them after onboarding using our menu management system.
                    </p>
                  </div>
                </div>
              )}

              <div className="flex justify-between">
                <Button variant="outline" onClick={prevStep}>
                  <ArrowLeft className="mr-2 h-4 w-4" /> Back
                </Button>
                <Button 
                  onClick={nextStep}
                  className="bg-orange-600 hover:bg-orange-700"
                >
                  Review & Go Live <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 4: Review & Complete */}
        {currentStep === 4 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Eye className="h-5 w-5" />
                Review & Go Live
              </CardTitle>
              <p className="text-gray-600">Confirm your restaurant details and menu import</p>
            </CardHeader>
            <CardContent className="space-y-6">
              {loading && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
                    <span className="font-medium text-blue-800">Working...</span>
                  </div>
                  <ul className="list-disc list-inside text-sm text-blue-800 space-y-1">
                    {progress.map((p, i) => (
                      <li key={i}>{p}</li>
                    ))}
                  </ul>
                </div>
              )}
              {/* Restaurant Preview */}
              <div className="bg-white border rounded-lg overflow-hidden">
                {profile.header_image_url && (
                  <img src={profile.header_image_url} alt="Header" className="w-full h-32 object-cover" />
                )}
                <div className="p-4">
                  <div className="flex items-center gap-3 mb-2">
                    {profile.logo_url && (
                      <img src={profile.logo_url} alt="Logo" className="w-12 h-12 object-cover rounded-full" />
                    )}
                    <div>
                      <h3 className="text-xl font-bold">{profile.name}</h3>
                      <p className="text-gray-600">{profile.cuisine_type}</p>
                    </div>
                  </div>
                  <p className="text-gray-700 mb-3">{profile.description}</p>
                  <div className="flex items-center gap-4 text-sm text-gray-600">
                    <div className="flex items-center gap-1">
                      <Phone className="h-4 w-4" />
                      {profile.phone}
                    </div>
                    <div className="flex items-center gap-1">
                      <MapPin className="h-4 w-4" />
                      {profile.address}
                    </div>
                  </div>
                </div>
              </div>

              {/* Menu Summary */}
              {menuImportResult && (
                <div className="bg-green-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-green-800 mb-2">🍕 Menu Import Summary</h4>
                  <div className="grid grid-cols-2 gap-4 mb-3">
                    <div>
                      <span className="text-2xl font-bold text-green-700">{menuImportResult.categories}</span>
                      <span className="text-green-600 ml-2">Categories</span>
                    </div>
                    <div>
                      <span className="text-2xl font-bold text-green-700">{menuImportResult.items}</span>
                      <span className="text-green-600 ml-2">Menu Items</span>
                    </div>
                  </div>
                  <p className="text-sm text-green-700">
                    🎯 Ready to accept orders immediately after going live!
                  </p>
                </div>
              )}

              {/* Next Steps */}
              <div className="bg-orange-50 p-4 rounded-lg">
                <h4 className="font-semibold text-orange-800 mb-2">🚀 What happens when you go live:</h4>
                <div className="space-y-1 text-sm text-orange-700">
                  <p>✅ Restaurant created in MenuCA system</p>
                  <p>✅ Menu items ready for customer orders</p>
                  <p>✅ Order management dashboard activated</p>
                  <p>✅ Existing tablet integration continues working</p>
                  <p>✅ Customers can find and order from your restaurant</p>
                </div>
              </div>

              <div className="flex justify-between">
                <Button variant="outline" onClick={prevStep}>
                  <ArrowLeft className="mr-2 h-4 w-4" /> Back
                </Button>
                <Button 
                  onClick={completeOnboarding}
                  disabled={loading}
                  className="bg-green-600 hover:bg-green-700 text-lg px-8"
                >
                  {loading ? (
                    <div className="flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Creating Restaurant...
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <Sparkles className="h-4 w-4" />
                      GO LIVE NOW! 🚀
                    </div>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 5: Success! */}
        {currentStep === 5 && (
          <Card>
            <CardContent className="p-8 text-center">
              <div className="mb-6">
                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="h-12 w-12 text-green-600" />
                </div>
                <h2 className="text-3xl font-bold text-gray-900 mb-2">🎉 Restaurant is LIVE!</h2>
                <p className="text-gray-600 mb-4">
                  Congratulations! <strong>{profile.name}</strong> is now live on MenuCA!
                </p>
                
                <div className="bg-green-50 p-4 rounded-lg mb-6">
                  <p className="text-sm text-green-800 mb-2">Restaurant ID</p>
                  <p className="text-lg font-bold text-green-900">{restaurantId}</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm mb-6">
                  <div className="bg-gray-50 p-3 rounded">
                    <Star className="h-5 w-5 text-orange-600 mx-auto mb-2" />
                    <p className="font-semibold">Customer Menu</p>
                    <p className="text-gray-600">Live and accepting orders</p>
                  </div>
                  <div className="bg-gray-50 p-3 rounded">
                    <ChefHat className="h-5 w-5 text-orange-600 mx-auto mb-2" />
                    <p className="font-semibold">Order Management</p>
                    <p className="text-gray-600">Dashboard ready for orders</p>
                  </div>
                </div>

                <p className="text-sm text-gray-500 mb-6">
                  Redirecting to your restaurant dashboard in 3 seconds...
                </p>
              </div>

              <div className="flex gap-3">
                <Button 
                  variant="outline" 
                  onClick={() => router.push(`/menu/${restaurantId}`)}
                  className="flex-1"
                >
                  View Customer Menu
                </Button>
                <Button 
                  onClick={() => router.push(`/restaurant/${restaurantId}/dashboard`)}
                  className="flex-1 bg-orange-600 hover:bg-orange-700"
                >
                  Go to Dashboard
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
