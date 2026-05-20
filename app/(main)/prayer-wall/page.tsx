'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Heart, Plus, X, Check, MessageSquare, User as UserIcon } from 'lucide-react'
import type { PrayerRequest } from '@/lib/types'
import type { User } from '@supabase/supabase-js'

export default function PrayerWallPage() {
  const [prayers, setPrayers] = useState<PrayerRequest[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [user, setUser] = useState<User | null>(null)
  const [prayedFor, setPrayedFor] = useState<Set<string>>(new Set())
  const [submitting, setSubmitting] = useState(false)
  const supabase = createClient()

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    request: '',
    isAnonymous: false,
  })

  const fetchPrayers = useCallback(async () => {
    const { data } = await supabase
      .from('prayer_requests')
      .select('*')
      .eq('is_public', true)
      .order('created_at', { ascending: false })
    
    if (data) {
      setPrayers(data as PrayerRequest[])
    }
    setIsLoading(false)
  }, [supabase])

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)

      // Get prayers the user has already prayed for
      if (user) {
        const { data: counts } = await supabase
          .from('prayer_counts')
          .select('prayer_request_id')
          .eq('user_id', user.id)
        
        if (counts) {
          setPrayedFor(new Set(counts.map(c => c.prayer_request_id)))
        }
      }
    }
    
    getUser()
    fetchPrayers()
  }, [supabase, fetchPrayers])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)

    const { error } = await supabase
      .from('prayer_requests')
      .insert({
        name: formData.isAnonymous ? null : formData.name || null,
        request: formData.request,
        is_anonymous: formData.isAnonymous,
        is_public: true,
        user_id: user?.id || null,
      })

    if (!error) {
      setFormData({ name: '', request: '', isAnonymous: false })
      setShowForm(false)
      fetchPrayers()
    }
    setSubmitting(false)
  }

  const handlePray = async (prayerId: string) => {
    if (!user || prayedFor.has(prayerId)) return

    // Optimistic update
    setPrayedFor(prev => new Set(prev).add(prayerId))
    setPrayers(prev => 
      prev.map(p => 
        p.id === prayerId 
          ? { ...p, prayer_count: p.prayer_count + 1 }
          : p
      )
    )

    // Insert prayer count
    const { error: countError } = await supabase
      .from('prayer_counts')
      .insert({
        prayer_request_id: prayerId,
        user_id: user.id,
      })

    if (!countError) {
      // Update the prayer count
      await supabase
        .from('prayer_requests')
        .update({ prayer_count: prayers.find(p => p.id === prayerId)!.prayer_count + 1 })
        .eq('id', prayerId)
    } else {
      // Revert on error
      setPrayedFor(prev => {
        const next = new Set(prev)
        next.delete(prayerId)
        return next
      })
      fetchPrayers()
    }
  }

  return (
    <div className="p-4 md:p-6 lg:p-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-2">Prayer Wall</h1>
            <p className="text-muted-foreground">Share your prayer requests and pray for others in our community.</p>
          </div>
          <Button 
            onClick={() => setShowForm(!showForm)}
            className="bg-primary text-primary-foreground hover:bg-primary/90"
          >
            {showForm ? <X className="mr-2 h-4 w-4" /> : <Plus className="mr-2 h-4 w-4" />}
            {showForm ? 'Cancel' : 'Submit Prayer Request'}
          </Button>
        </div>
      </div>

      {/* Prayer Request Form */}
      {showForm && (
        <Card className="mb-8 border-primary/20">
          <CardHeader>
            <h2 className="text-xl font-semibold text-foreground">Submit a Prayer Request</h2>
            <p className="text-sm text-muted-foreground">
              Share your prayer request with our community. We believe in the power of prayer.
            </p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {!formData.isAnonymous && (
                <div className="space-y-2">
                  <Label htmlFor="name">Your Name (optional)</Label>
                  <Input
                    id="name"
                    placeholder="Enter your name"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  />
                </div>
              )}
              
              <div className="space-y-2">
                <Label htmlFor="request">Prayer Request *</Label>
                <Textarea
                  id="request"
                  placeholder="Share your prayer request..."
                  rows={4}
                  value={formData.request}
                  onChange={(e) => setFormData(prev => ({ ...prev, request: e.target.value }))}
                  required
                />
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="anonymous"
                  checked={formData.isAnonymous}
                  onCheckedChange={(checked) => 
                    setFormData(prev => ({ ...prev, isAnonymous: checked as boolean }))
                  }
                />
                <Label htmlFor="anonymous" className="text-sm cursor-pointer">
                  Submit anonymously
                </Label>
              </div>

              <Button type="submit" disabled={submitting || !formData.request.trim()}>
                {submitting ? 'Submitting...' : 'Submit Prayer Request'}
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Prayer Requests */}
      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="p-6 animate-pulse">
              <div className="h-4 bg-muted rounded w-1/3 mb-4" />
              <div className="h-20 bg-muted rounded mb-4" />
              <div className="h-8 bg-muted rounded w-1/2" />
            </Card>
          ))}
        </div>
      ) : prayers.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {prayers.map((prayer) => (
            <Card key={prayer.id} className={`relative overflow-hidden ${prayer.is_answered ? 'border-green-500 border-2' : ''}`}>
              {prayer.is_answered && (
                <div className="absolute top-0 right-0 bg-green-500 text-white text-xs px-3 py-1 rounded-bl-lg flex items-center gap-1">
                  <Check className="h-3 w-3" />
                  Answered
                </div>
              )}
              <CardContent className="pt-6">
                <div className="flex items-center gap-2 mb-3 text-sm text-muted-foreground">
                  <UserIcon className="h-4 w-4" />
                  <span>{prayer.is_anonymous ? 'Anonymous' : prayer.name || 'Someone'}</span>
                </div>
                
                <p className="text-foreground mb-4 whitespace-pre-wrap">{prayer.request}</p>

                {prayer.admin_reply && (
                  <div className="bg-muted/50 rounded-lg p-3 mb-4">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                      <MessageSquare className="h-4 w-4" />
                      <span>Response from Ministry</span>
                    </div>
                    <p className="text-sm text-foreground">{prayer.admin_reply}</p>
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <p className="text-xs text-muted-foreground">
                    {new Date(prayer.created_at).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </p>
                  
                  <Button
                    variant={prayedFor.has(prayer.id) ? 'secondary' : 'outline'}
                    size="sm"
                    onClick={() => handlePray(prayer.id)}
                    disabled={!user || prayedFor.has(prayer.id)}
                    className={prayedFor.has(prayer.id) ? 'bg-accent/20 text-accent border-accent' : ''}
                  >
                    <Heart 
                      className={`mr-1 h-4 w-4 ${prayedFor.has(prayer.id) ? 'fill-accent text-accent' : ''}`} 
                    />
                    {prayer.prayer_count} {prayer.prayer_count === 1 ? 'Prayer' : 'Prayers'}
                  </Button>
                </div>

                {!user && (
                  <p className="text-xs text-muted-foreground mt-2 text-center">
                    Sign in to pray for this request
                  </p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="p-12 text-center">
          <Heart className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
          <h2 className="text-xl font-semibold text-foreground mb-2">No Prayer Requests Yet</h2>
          <p className="text-muted-foreground mb-4">
            Be the first to share a prayer request with our community.
          </p>
          <Button onClick={() => setShowForm(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Submit Prayer Request
          </Button>
        </Card>
      )}
    </div>
  )
}
