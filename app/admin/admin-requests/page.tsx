'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { ShieldCheck, ShieldX, Clock, Users, MapPin, BookOpen, Star } from 'lucide-react'
import type { Profile } from '@/lib/types'

const ROLE_LABEL: Record<string, string> = {
  leader:     'DGroup Leader',
  member:     'DGroup Member',
  missionary: 'Campus Missionary',
  none:       'Not in a DGroup',
}

const ROLE_PILL: Record<string, string> = {
  leader:     'bg-purple-100 text-purple-700',
  member:     'bg-blue-100 text-blue-700',
  missionary: 'bg-yellow-100 text-yellow-700',
  none:       'bg-muted text-muted-foreground',
}

function getInitials(name: string | null) {
  if (!name) return '?'
  const p = name.trim().split(' ')
  return p.length >= 2 ? (p[0][0] + p[1][0]).toUpperCase() : p[0][0].toUpperCase()
}

export default function AdminRequestsPage() {
  const [requests, setRequests] = useState<Profile[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [processing, setProcessing] = useState<string | null>(null)
  const supabase = createClient()

  const fetchRequests = useCallback(async () => {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('requested_admin', true)
      .order('created_at', { ascending: false })
    if (data) setRequests(data as Profile[])
    setIsLoading(false)
  }, [supabase])

  useEffect(() => { fetchRequests() }, [fetchRequests])

  const approve = async (profile: Profile) => {
    setProcessing(profile.id)
    await supabase
      .from('profiles')
      .update({ role: 'admin', requested_admin: false })
      .eq('id', profile.id)
    setRequests(prev => prev.filter(r => r.id !== profile.id))
    setProcessing(null)
  }

  const reject = async (profile: Profile) => {
    setProcessing(profile.id)
    await supabase
      .from('profiles')
      .update({ requested_admin: false })
      .eq('id', profile.id)
    setRequests(prev => prev.filter(r => r.id !== profile.id))
    setProcessing(null)
  }

  return (
    <div className="pt-14 md:pt-0">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground">Admin Requests</h1>
        <p className="text-muted-foreground">Review and approve members applying for admin access.</p>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="rounded-xl border border-border p-5 animate-pulse">
              <div className="flex items-center gap-4">
                <div className="w-11 h-11 rounded-full bg-muted shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-muted rounded w-1/3" />
                  <div className="h-3 bg-muted rounded w-1/2" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : requests.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border flex flex-col items-center justify-center py-20 text-center">
          <ShieldCheck className="h-12 w-12 text-muted-foreground/30 mb-4" />
          <p className="font-semibold text-foreground mb-1">No pending requests</p>
          <p className="text-sm text-muted-foreground">Admin access requests from members will appear here.</p>
        </div>
      ) : (
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground mb-4">
            <span className="font-semibold text-foreground">{requests.length}</span> pending {requests.length === 1 ? 'request' : 'requests'}
          </p>
          {requests.map(profile => (
            <div key={profile.id} className="rounded-xl border border-border bg-white p-5">
              <div className="flex items-start gap-4">
                {/* Avatar */}
                <div className="w-11 h-11 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center font-bold text-sm shrink-0">
                  {getInitials(profile.full_name)}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-3 flex-wrap">
                    <div>
                      <p className="font-bold text-foreground">{profile.full_name || 'Unnamed'}</p>
                      <p className="text-sm text-muted-foreground">{profile.email}</p>
                    </div>
                    <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-amber-50 text-amber-600 border border-amber-200 shrink-0">
                      <Clock className="h-3 w-3" />
                      Pending
                    </span>
                  </div>

                  {/* Details */}
                  <div className="flex flex-wrap gap-2 mt-3">
                    {profile.campus && (
                      <span className="inline-flex items-center gap-1 text-xs text-muted-foreground bg-muted px-2.5 py-1 rounded-full">
                        <MapPin className="h-3 w-3" />
                        {profile.campus}
                      </span>
                    )}
                    {profile.dgroup_role && (
                      <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full ${ROLE_PILL[profile.dgroup_role]}`}>
                        {ROLE_LABEL[profile.dgroup_role]}
                      </span>
                    )}
                    {profile.ministry && (
                      <span className="inline-flex items-center gap-1 text-xs text-muted-foreground bg-muted px-2.5 py-1 rounded-full">
                        <BookOpen className="h-3 w-3" />
                        {profile.ministry}
                      </span>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 mt-4">
                    <button
                      onClick={() => approve(profile)}
                      disabled={processing === profile.id}
                      className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-foreground text-white text-sm font-semibold hover:bg-foreground/90 transition-colors disabled:opacity-50"
                    >
                      <ShieldCheck className="h-4 w-4" />
                      Approve
                    </button>
                    <button
                      onClick={() => reject(profile)}
                      disabled={processing === profile.id}
                      className="flex items-center gap-1.5 px-4 py-2 rounded-lg border border-border text-sm font-semibold text-muted-foreground hover:text-destructive hover:border-destructive transition-colors disabled:opacity-50"
                    >
                      <ShieldX className="h-4 w-4" />
                      Reject
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
