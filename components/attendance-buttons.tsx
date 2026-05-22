'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Check, X } from 'lucide-react'
import Link from 'next/link'

type RSVPStatus = 'going' | 'cant_go'

interface AttendanceButtonsProps {
  announcementId: string
  compact?: boolean
}

export function AttendanceButtons({ announcementId, compact = false }: AttendanceButtonsProps) {
  const [goingCount, setGoingCount] = useState(0)
  const [cantGoCount, setCantGoCount] = useState(0)
  const [userStatus, setUserStatus] = useState<RSVPStatus | null>(null)
  const [userId, setUserId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUserId(user?.id ?? null)

      const { data: records } = await supabase
        .from('event_attendance')
        .select('status')
        .eq('announcement_id', announcementId)

      const list: { status: string }[] = records ?? []
      setGoingCount(list.filter(r => r.status === 'going').length)
      setCantGoCount(list.filter(r => r.status === 'cant_go').length)

      if (user) {
        const { data: mine } = await supabase
          .from('event_attendance')
          .select('status')
          .eq('announcement_id', announcementId)
          .eq('user_id', user.id)
          .maybeSingle()
        setUserStatus((mine?.status as RSVPStatus) ?? null)
      }

      setLoading(false)
    }
    load()
  }, [announcementId])

  const handleRSVP = async (status: RSVPStatus) => {
    if (!userId) return
    setUpdating(true)

    if (userStatus === status) {
      await supabase
        .from('event_attendance')
        .delete()
        .eq('announcement_id', announcementId)
        .eq('user_id', userId)
      if (status === 'going') setGoingCount(c => Math.max(0, c - 1))
      else setCantGoCount(c => Math.max(0, c - 1))
      setUserStatus(null)
    } else {
      await supabase
        .from('event_attendance')
        .upsert(
          { announcement_id: announcementId, user_id: userId, status },
          { onConflict: 'announcement_id,user_id' }
        )
      if (userStatus === 'going') setGoingCount(c => Math.max(0, c - 1))
      else if (userStatus === 'cant_go') setCantGoCount(c => Math.max(0, c - 1))
      if (status === 'going') setGoingCount(c => c + 1)
      else setCantGoCount(c => c + 1)
      setUserStatus(status)
    }

    setUpdating(false)
  }

  if (loading) {
    return <div className="h-8 w-44 bg-muted animate-pulse rounded-lg" />
  }

  // ── Compact mode (carousel / list) ────────────────────────────────────────
  if (compact) {
    return (
      <div className="flex items-center gap-2 flex-wrap">
        <button
          onClick={() => handleRSVP('going')}
          disabled={!userId || updating}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
            userStatus === 'going'
              ? 'bg-green-500 text-white shadow-sm'
              : 'bg-green-50 text-green-700 hover:bg-green-100 border border-green-200'
          } ${!userId || updating ? 'opacity-60 cursor-default' : 'cursor-pointer'}`}
        >
          <Check className="h-3.5 w-3.5" />
          Going
          {goingCount > 0 && (
            <span className="bg-white/30 rounded px-1 font-bold">{goingCount}</span>
          )}
        </button>
        <button
          onClick={() => handleRSVP('cant_go')}
          disabled={!userId || updating}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
            userStatus === 'cant_go'
              ? 'bg-red-500 text-white shadow-sm'
              : 'bg-red-50 text-red-600 hover:bg-red-100 border border-red-200'
          } ${!userId || updating ? 'opacity-60 cursor-default' : 'cursor-pointer'}`}
        >
          <X className="h-3.5 w-3.5" />
          Can&apos;t Go
          {cantGoCount > 0 && (
            <span className="bg-white/30 rounded px-1 font-bold">{cantGoCount}</span>
          )}
        </button>
        {!userId && (
          <Link
            href="/auth/login"
            className="text-xs text-muted-foreground hover:text-primary underline underline-offset-2 transition-colors"
          >
            Sign in to RSVP
          </Link>
        )}
      </div>
    )
  }

  // ── Full mode (detail page) ────────────────────────────────────────────────
  return (
    <div className="space-y-5">
      {/* Counter */}
      <div className="flex items-center gap-8">
        <div className="text-center">
          <p className="text-3xl font-black text-green-600">{goingCount}</p>
          <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mt-0.5">Going</p>
        </div>
        <div className="w-px h-10 bg-border" />
        <div className="text-center">
          <p className="text-3xl font-black text-red-500">{cantGoCount}</p>
          <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mt-0.5">Can&apos;t Go</p>
        </div>
      </div>

      {/* RSVP buttons */}
      {userId ? (
        <div className="flex items-center gap-3">
          <button
            onClick={() => handleRSVP('going')}
            disabled={updating}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold transition-all duration-150 ${
              userStatus === 'going'
                ? 'bg-green-500 text-white shadow-md ring-2 ring-green-300'
                : 'bg-green-50 text-green-700 hover:bg-green-100 border border-green-200'
            }`}
          >
            <Check className="h-4 w-4" />
            {userStatus === 'going' ? "I'm Going ✓" : "I'm Going"}
          </button>
          <button
            onClick={() => handleRSVP('cant_go')}
            disabled={updating}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold transition-all duration-150 ${
              userStatus === 'cant_go'
                ? 'bg-red-500 text-white shadow-md ring-2 ring-red-300'
                : 'bg-red-50 text-red-600 hover:bg-red-100 border border-red-200'
            }`}
          >
            <X className="h-4 w-4" />
            {userStatus === 'cant_go' ? "Can't Go ✓" : "Can't Go"}
          </button>
        </div>
      ) : (
        <Link
          href="/auth/login"
          className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold bg-primary/10 text-primary hover:bg-primary/20 transition-colors border border-primary/20"
        >
          Sign in to RSVP for this event
        </Link>
      )}
    </div>
  )
}
