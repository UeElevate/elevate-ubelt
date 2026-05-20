'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Check, Heart, MessageSquare, Trash2, Eye, EyeOff } from 'lucide-react'
import type { PrayerRequest } from '@/lib/types'

export default function AdminPrayersPage() {
  const [prayers, setPrayers] = useState<PrayerRequest[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [replyingTo, setReplyingTo] = useState<string | null>(null)
  const [replyText, setReplyText] = useState('')
  const [filter, setFilter] = useState<'all' | 'unanswered' | 'answered'>('all')
  const supabase = createClient()

  const fetchPrayers = useCallback(async () => {
    let query = supabase
      .from('prayer_requests')
      .select('*')
      .order('created_at', { ascending: false })
    
    if (filter === 'answered') {
      query = query.eq('is_answered', true)
    } else if (filter === 'unanswered') {
      query = query.eq('is_answered', false)
    }

    const { data } = await query
    if (data) setPrayers(data as PrayerRequest[])
    setIsLoading(false)
  }, [supabase, filter])

  useEffect(() => {
    fetchPrayers()
  }, [fetchPrayers])

  const handleMarkAnswered = async (id: string, isAnswered: boolean) => {
    await supabase
      .from('prayer_requests')
      .update({ is_answered: !isAnswered })
      .eq('id', id)
    fetchPrayers()
  }

  const handleToggleVisibility = async (id: string, isPublic: boolean) => {
    await supabase
      .from('prayer_requests')
      .update({ is_public: !isPublic })
      .eq('id', id)
    fetchPrayers()
  }

  const handleReply = async (id: string) => {
    if (!replyText.trim()) return

    await supabase
      .from('prayer_requests')
      .update({ admin_reply: replyText.trim() })
      .eq('id', id)
    
    setReplyingTo(null)
    setReplyText('')
    fetchPrayers()
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this prayer request?')) return
    
    await supabase.from('prayer_requests').delete().eq('id', id)
    fetchPrayers()
  }

  return (
    <div className="pt-14 md:pt-0">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Prayer Requests</h1>
          <p className="text-muted-foreground">Manage and respond to prayer requests</p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant={filter === 'all' ? 'default' : 'outline'} 
            size="sm"
            onClick={() => setFilter('all')}
          >
            All
          </Button>
          <Button 
            variant={filter === 'unanswered' ? 'default' : 'outline'} 
            size="sm"
            onClick={() => setFilter('unanswered')}
          >
            Unanswered
          </Button>
          <Button 
            variant={filter === 'answered' ? 'default' : 'outline'} 
            size="sm"
            onClick={() => setFilter('answered')}
          >
            Answered
          </Button>
        </div>
      </div>

      {/* Prayers List */}
      {isLoading ? (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="pt-6">
                <div className="h-4 bg-muted rounded w-1/4 mb-3" />
                <div className="h-16 bg-muted rounded mb-3" />
                <div className="h-8 bg-muted rounded w-1/3" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : prayers.length > 0 ? (
        <div className="space-y-4">
          {prayers.map((prayer) => (
            <Card key={prayer.id} className={`${prayer.is_answered ? 'border-green-500 border-2' : ''} ${!prayer.is_public ? 'opacity-75' : ''}`}>
              <CardContent className="pt-6">
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                  <div className="flex-1">
                    {/* Status badges */}
                    <div className="flex flex-wrap items-center gap-2 mb-3">
                      {prayer.is_answered && (
                        <span className="flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-green-500 text-white">
                          <Check className="h-3 w-3" />
                          Answered
                        </span>
                      )}
                      {!prayer.is_public && (
                        <span className="flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-muted text-muted-foreground">
                          <EyeOff className="h-3 w-3" />
                          Hidden
                        </span>
                      )}
                      <span className="flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-accent/20 text-accent">
                        <Heart className="h-3 w-3" />
                        {prayer.prayer_count} prayers
                      </span>
                    </div>

                    {/* Prayer info */}
                    <p className="text-sm text-muted-foreground mb-2">
                      From: {prayer.is_anonymous ? 'Anonymous' : prayer.name || 'Unknown'}
                    </p>
                    <p className="text-foreground whitespace-pre-wrap mb-3">{prayer.request}</p>

                    {/* Admin reply */}
                    {prayer.admin_reply && (
                      <div className="bg-muted/50 rounded-lg p-3 mb-3">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                          <MessageSquare className="h-4 w-4" />
                          <span>Your Response</span>
                        </div>
                        <p className="text-sm text-foreground">{prayer.admin_reply}</p>
                      </div>
                    )}

                    {/* Reply form */}
                    {replyingTo === prayer.id && (
                      <div className="space-y-2 mt-3">
                        <Label>Write a response</Label>
                        <Textarea
                          value={replyText}
                          onChange={(e) => setReplyText(e.target.value)}
                          placeholder="Write an encouraging response..."
                          rows={3}
                        />
                        <div className="flex gap-2">
                          <Button size="sm" onClick={() => handleReply(prayer.id)}>
                            Send Reply
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => {
                            setReplyingTo(null)
                            setReplyText('')
                          }}>
                            Cancel
                          </Button>
                        </div>
                      </div>
                    )}

                    <p className="text-xs text-muted-foreground mt-3">
                      {new Date(prayer.created_at).toLocaleDateString('en-US', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })}
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-wrap gap-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => {
                        setReplyingTo(prayer.id)
                        setReplyText(prayer.admin_reply || '')
                      }}
                    >
                      <MessageSquare className="h-4 w-4 mr-1" />
                      Reply
                    </Button>
                    <Button 
                      variant={prayer.is_answered ? 'secondary' : 'outline'} 
                      size="sm"
                      onClick={() => handleMarkAnswered(prayer.id, prayer.is_answered)}
                    >
                      <Check className="h-4 w-4 mr-1" />
                      {prayer.is_answered ? 'Unmark' : 'Mark Answered'}
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleToggleVisibility(prayer.id, prayer.is_public)}
                    >
                      {prayer.is_public ? (
                        <><EyeOff className="h-4 w-4 mr-1" /> Hide</>
                      ) : (
                        <><Eye className="h-4 w-4 mr-1" /> Show</>
                      )}
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleDelete(prayer.id)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="p-8 text-center">
          <Heart className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground">No prayer requests found.</p>
        </Card>
      )}
    </div>
  )
}
