'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Settings } from 'lucide-react'
import type { SiteSettings } from '@/lib/types'

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<SiteSettings | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const supabase = createClient()

  const fetchSettings = useCallback(async () => {
    const { data } = await supabase
      .from('site_settings')
      .select('*')
      .single()
    
    if (data) setSettings(data as SiteSettings)
    setIsLoading(false)
  }, [supabase])

  useEffect(() => {
    fetchSettings()
  }, [fetchSettings])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!settings) return

    setIsSaving(true)
    setSaved(false)

    await supabase
      .from('site_settings')
      .update({
        church_name: settings.church_name,
        logo_url: settings.logo_url || null,
        contact_email: settings.contact_email || null,
        contact_phone: settings.contact_phone || null,
        address: settings.address || null,
        facebook_url: settings.facebook_url || null,
        instagram_url: settings.instagram_url || null,
        youtube_url: settings.youtube_url || null,
        tiktok_url: settings.tiktok_url || null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', settings.id)

    setIsSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  const updateField = (field: keyof SiteSettings, value: string) => {
    if (!settings) return
    setSettings(prev => prev ? { ...prev, [field]: value } : null)
  }

  if (isLoading) {
    return (
      <div className="pt-14 md:pt-0">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-muted rounded w-1/3" />
          <Card>
            <CardContent className="pt-6 space-y-4">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-10 bg-muted rounded" />
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  if (!settings) {
    return (
      <div className="pt-14 md:pt-0">
        <Card className="p-8 text-center">
          <Settings className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground">No settings found. Please contact support.</p>
        </Card>
      </div>
    )
  }

  return (
    <div className="pt-14 md:pt-0">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-foreground">Site Settings</h1>
        <p className="text-muted-foreground">Configure your ministry website</p>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="space-y-6">
          {/* General Settings */}
          <Card>
            <CardHeader>
              <CardTitle>General Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="church_name">Ministry Name</Label>
                  <Input
                    id="church_name"
                    value={settings.church_name}
                    onChange={(e) => updateField('church_name', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="logo_url">Logo URL</Label>
                  <Input
                    id="logo_url"
                    value={settings.logo_url || ''}
                    onChange={(e) => updateField('logo_url', e.target.value)}
                    placeholder="https://..."
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Contact Information */}
          <Card>
            <CardHeader>
              <CardTitle>Contact Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="contact_email">Contact Email</Label>
                  <Input
                    id="contact_email"
                    type="email"
                    value={settings.contact_email || ''}
                    onChange={(e) => updateField('contact_email', e.target.value)}
                    placeholder="contact@church.org"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="contact_phone">Contact Phone</Label>
                  <Input
                    id="contact_phone"
                    value={settings.contact_phone || ''}
                    onChange={(e) => updateField('contact_phone', e.target.value)}
                    placeholder="+1 (555) 123-4567"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="address">Address</Label>
                <Input
                  id="address"
                  value={settings.address || ''}
                  onChange={(e) => updateField('address', e.target.value)}
                  placeholder="123 Church Street, City, State 12345"
                />
              </div>
            </CardContent>
          </Card>

          {/* Social Media */}
          <Card>
            <CardHeader>
              <CardTitle>Social Media Links</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="facebook_url">Facebook URL</Label>
                  <Input
                    id="facebook_url"
                    value={settings.facebook_url || ''}
                    onChange={(e) => updateField('facebook_url', e.target.value)}
                    placeholder="https://facebook.com/..."
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="instagram_url">Instagram URL</Label>
                  <Input
                    id="instagram_url"
                    value={settings.instagram_url || ''}
                    onChange={(e) => updateField('instagram_url', e.target.value)}
                    placeholder="https://instagram.com/..."
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="youtube_url">YouTube URL</Label>
                  <Input
                    id="youtube_url"
                    value={settings.youtube_url || ''}
                    onChange={(e) => updateField('youtube_url', e.target.value)}
                    placeholder="https://youtube.com/..."
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="tiktok_url">TikTok URL</Label>
                  <Input
                    id="tiktok_url"
                    value={settings.tiktok_url || ''}
                    onChange={(e) => updateField('tiktok_url', e.target.value)}
                    placeholder="https://tiktok.com/..."
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="flex items-center gap-4">
            <Button type="submit" disabled={isSaving}>
              {isSaving ? 'Saving...' : 'Save Settings'}
            </Button>
            {saved && (
              <span className="text-sm text-green-600">Settings saved successfully!</span>
            )}
          </div>
        </div>
      </form>
    </div>
  )
}
