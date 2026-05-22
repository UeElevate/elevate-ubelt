'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Heart, Check, Globe, Users, ShieldCheck, BookOpen, Star } from 'lucide-react'
import type { PrayerRequest, PrayerVisibility } from '@/lib/types'
import type { User } from '@supabase/supabase-js'

// ── constants ────────────────────────────────────────────────────────────────

const AVATAR_COLORS = [
  'bg-orange-100 text-orange-600',
  'bg-blue-100 text-blue-600',
  'bg-purple-100 text-purple-600',
  'bg-green-100 text-green-600',
  'bg-pink-100 text-pink-600',
  'bg-yellow-100 text-yellow-700',
  'bg-teal-100 text-teal-600',
]

const VISIBILITY_OPTIONS: {
  value: PrayerVisibility
  label: string
  description: string
  Icon: React.ElementType
}[] = [
  {
    value: 'everyone',
    label: 'Everyone',
    description: 'Visible to all visitors',
    Icon: Globe,
  },
  {
    value: 'leaders',
    label: 'DGroup Leaders',
    description: 'Only Disciple Group Leaders',
    Icon: ShieldCheck,
  },
  {
    value: 'members',
    label: 'DGroup Members',
    description: 'Only Disciple Group Members',
    Icon: Users,
  },
  {
    value: 'dgroup',
    label: 'Discipleship Group',
    description: 'Only your Discipleship Group',
    Icon: BookOpen,
  },
  {
    value: 'missionary',
    label: 'Campus Missionary',
    description: 'Only Campus Missionaries',
    Icon: Star,
  },
]

const VISIBILITY_BADGE: Record<PrayerVisibility, { label: string; className: string }> = {
  everyone: { label: 'Everyone',            className: 'bg-blue-50 text-blue-600' },
  leaders:  { label: 'DGroup Leaders',      className: 'bg-purple-50 text-purple-600' },
  members:  { label: 'DGroup Members',      className: 'bg-green-50 text-green-600' },
  dgroup:     { label: 'Discipleship Group',  className: 'bg-orange-50 text-orange-600' },
  missionary: { label: 'Campus Missionary',   className: 'bg-yellow-50 text-yellow-700' },
}

// ── helpers ──────────────────────────────────────────────────────────────────

function getInitials(name: string | null, isAnonymous: boolean): string {
  if (isAnonymous || !name) return '?'
  const parts = name.trim().split(' ')
  return parts.length >= 2
    ? (parts[0][0] + parts[1][0]).toUpperCase()
    : parts[0][0].toUpperCase()
}

// ── PrayerCard ───────────────────────────────────────────────────────────────

function PrayerCard({
  prayer,
  colorClass,
  hasPrayed,
  user,
  onPray,
}: {
  prayer: PrayerRequest
  colorClass: string
  hasPrayed: boolean
  user: User | null
  onPray: (id: string) => void
}) {
  const displayName = prayer.is_anonymous ? 'Anonymous' : prayer.name || 'Someone'
  const initials = getInitials(prayer.is_anonymous ? null : prayer.name, prayer.is_anonymous)
  const badge = VISIBILITY_BADGE[prayer.visibility ?? 'everyone']

  return (
    <div className="break-inside-avoid mb-4 rounded-xl border border-border bg-white p-5 relative">
      {prayer.is_answered && (
        <span className="absolute top-3 right-3 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-green-500 text-white">
          <Check className="h-3 w-3" />
          Answered
        </span>
      )}

      {/* Avatar + name */}
      <div className="flex items-center gap-3 mb-3">
        <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold shrink-0 ${colorClass}`}>
          {initials}
        </div>
        <div className="min-w-0">
          <p className="text-sm font-bold text-foreground leading-tight truncate">{displayName}</p>
          <p className="text-xs text-muted-foreground">
            {new Date(prayer.created_at).toLocaleDateString('en-US', {
              month: 'short', day: 'numeric', year: 'numeric',
            })}
          </p>
        </div>
      </div>

      {/* Visibility badge */}
      <span className={`inline-block text-xs font-semibold px-2 py-0.5 rounded-full mb-3 ${badge.className}`}>
        {badge.label}
      </span>

      {/* Request text */}
      <p className="text-sm text-foreground leading-relaxed mb-4">
        {prayer.request}
      </p>

      {/* Admin reply */}
      {prayer.admin_reply && (
        <div className="bg-muted/60 rounded-lg px-3 py-2 mb-3 text-xs text-muted-foreground italic">
          <span className="font-semibold not-italic text-foreground">Ministry: </span>
          {prayer.admin_reply}
        </div>
      )}

      {/* Pray button */}
      <button
        onClick={() => onPray(prayer.id)}
        disabled={!user || hasPrayed}
        className={`inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full border transition-all ${
          hasPrayed
            ? 'border-accent bg-accent/10 text-accent cursor-default'
            : user
            ? 'border-border hover:border-accent hover:text-accent hover:bg-accent/5 cursor-pointer'
            : 'border-border text-muted-foreground cursor-not-allowed'
        }`}
      >
        <Heart className={`h-3.5 w-3.5 ${hasPrayed ? 'fill-accent text-accent' : ''}`} />
        {prayer.prayer_count} {prayer.prayer_count === 1 ? 'Prayer' : 'Prayers'}
      </button>
    </div>
  )
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default function PrayerWallPage() {
  const [prayers, setPrayers] = useState<PrayerRequest[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [user, setUser] = useState<User | null>(null)
  const [prayedFor, setPrayedFor] = useState<Set<string>>(new Set())

  // form
  const [request, setRequest] = useState('')
  const [name, setName] = useState('')
  const [isAnonymous, setIsAnonymous] = useState(false)
  const [visibility, setVisibility] = useState<PrayerVisibility>('everyone')
  const [submitting, setSubmitting] = useState(false)
  const [sent, setSent] = useState(false)

  const supabase = createClient()

  const fetchPrayers = useCallback(async () => {
    const { data } = await supabase
      .from('prayer_requests')
      .select('*')
      .eq('is_public', true)
      .order('created_at', { ascending: false })
    if (data) setPrayers(data as PrayerRequest[])
    setIsLoading(false)
  }, [supabase])

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
      if (user) {
        const { data: counts } = await supabase
          .from('prayer_counts')
          .select('prayer_request_id')
          .eq('user_id', user.id)
        if (counts) setPrayedFor(new Set(counts.map(c => c.prayer_request_id)))
      }
    }
    init()
    fetchPrayers()
  }, [supabase, fetchPrayers])

  const handleSend = async () => {
    if (!request.trim()) return
    setSubmitting(true)
    const { error } = await supabase.from('prayer_requests').insert({
      name: isAnonymous ? null : name || null,
      request: request.trim(),
      is_anonymous: isAnonymous,
      is_public: true,
      visibility,
      user_id: user?.id || null,
    })
    if (!error) {
      setRequest('')
      setName('')
      setIsAnonymous(false)
      setVisibility('everyone')
      setSent(true)
      fetchPrayers()
      setTimeout(() => setSent(false), 3000)
    }
    setSubmitting(false)
  }

  const handlePray = async (prayerId: string) => {
    if (!user || prayedFor.has(prayerId)) return
    setPrayedFor(prev => new Set(prev).add(prayerId))
    setPrayers(prev =>
      prev.map(p => p.id === prayerId ? { ...p, prayer_count: p.prayer_count + 1 } : p)
    )
    const { error: countError } = await supabase
      .from('prayer_counts')
      .insert({ prayer_request_id: prayerId, user_id: user.id })
    if (!countError) {
      await supabase
        .from('prayer_requests')
        .update({ prayer_count: prayers.find(p => p.id === prayerId)!.prayer_count + 1 })
        .eq('id', prayerId)
    } else {
      setPrayedFor(prev => { const n = new Set(prev); n.delete(prayerId); return n })
      fetchPrayers()
    }
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10">

        {/* Heading */}
        <h1 className="text-3xl font-black uppercase tracking-tight text-foreground mb-6">
          PRAYER WALL
        </h1>

        {/* Quote block */}
        <div className="mb-10">
          <blockquote className="text-2xl sm:text-3xl font-black leading-snug text-foreground mb-4">
            &ldquo;Carry each other&apos;s burdens, and in this way you will fulfill the law of Christ.&rdquo;
          </blockquote>
          <p className="text-sm text-muted-foreground">
            <span className="font-semibold text-foreground">Galatians 6:2</span>,&nbsp;Holy Bible
          </p>
        </div>

        {/* Prayer Request form */}
        <div className="mb-12">
          <h2 className="text-xl font-bold text-foreground mb-4">Prayer Request</h2>

          {!isAnonymous && (
            <input
              type="text"
              placeholder="Your name (optional)"
              value={name}
              onChange={e => setName(e.target.value)}
              className="w-full border border-border rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent/30 mb-3"
            />
          )}

          <textarea
            placeholder="Type here..."
            value={request}
            onChange={e => setRequest(e.target.value)}
            rows={7}
            className="w-full border border-border rounded-xl px-4 py-4 text-sm text-foreground placeholder:text-muted-foreground resize-none focus:outline-none focus:ring-2 focus:ring-accent/30 mb-4"
          />

          {/* Visibility selector */}
          <div className="mb-4">
            <p className="text-sm font-semibold text-foreground mb-2">Who can see this?</p>
            <div className="grid grid-cols-2 gap-2">
              {VISIBILITY_OPTIONS.map(({ value, label, description, Icon }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setVisibility(value)}
                  className={`flex items-start gap-3 px-4 py-3 rounded-xl border text-left transition-all ${
                    visibility === value
                      ? 'border-foreground bg-foreground/5'
                      : 'border-border hover:border-muted-foreground/40'
                  }`}
                >
                  <Icon className={`h-4 w-4 mt-0.5 shrink-0 ${visibility === value ? 'text-foreground' : 'text-muted-foreground'}`} />
                  <div>
                    <p className={`text-sm font-semibold leading-tight ${visibility === value ? 'text-foreground' : 'text-muted-foreground'}`}>
                      {label}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Anonymous checkbox */}
          <div className="flex items-center gap-2 mb-5">
            <input
              type="checkbox"
              id="anon"
              checked={isAnonymous}
              onChange={e => setIsAnonymous(e.target.checked)}
              className="rounded"
            />
            <label htmlFor="anon" className="text-sm text-muted-foreground cursor-pointer select-none">
              Submit anonymously
            </label>
          </div>

          {/* Send button */}
          <div className="flex justify-center">
            <button
              onClick={handleSend}
              disabled={submitting || !request.trim()}
              className="px-14 py-2.5 rounded-full border-2 border-foreground text-sm font-bold uppercase tracking-widest text-foreground hover:bg-foreground hover:text-white transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {sent ? 'SENT ✓' : submitting ? 'SENDING...' : 'SEND'}
            </button>
          </div>

          {!user && (
            <p className="text-center text-xs text-muted-foreground mt-3">
              You can submit without signing in. Sign in to track your prayers.
            </p>
          )}
        </div>

        {/* Community prayers — masonry grid */}
        {isLoading ? (
          <div className="columns-2 md:columns-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="break-inside-avoid mb-4 rounded-xl border border-border p-5 animate-pulse">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-9 h-9 rounded-full bg-muted shrink-0" />
                  <div className="flex-1">
                    <div className="h-3 bg-muted rounded w-2/3 mb-1" />
                    <div className="h-3 bg-muted rounded w-1/2" />
                  </div>
                </div>
                <div className="h-5 bg-muted rounded w-1/3 mb-3" />
                <div className="h-16 bg-muted rounded" />
              </div>
            ))}
          </div>
        ) : prayers.length > 0 ? (
          <>
            <h2 className="text-xl font-bold text-foreground mb-1">Community Prayers</h2>
            <p className="text-sm text-muted-foreground mb-6">
              Join our community in lifting these requests up in prayer.
            </p>
            <div className="columns-2 md:columns-3 gap-4">
              {prayers.map((prayer, i) => (
                <PrayerCard
                  key={prayer.id}
                  prayer={prayer}
                  colorClass={AVATAR_COLORS[i % AVATAR_COLORS.length]}
                  hasPrayed={prayedFor.has(prayer.id)}
                  user={user}
                  onPray={handlePray}
                />
              ))}
            </div>
          </>
        ) : (
          <div className="rounded-xl border border-dashed border-border flex flex-col items-center justify-center py-16 text-center">
            <Heart className="h-10 w-10 text-muted-foreground/30 mb-3" />
            <p className="font-semibold text-foreground mb-1">No prayer requests yet</p>
            <p className="text-sm text-muted-foreground">Be the first to share one above.</p>
          </div>
        )}

      </div>
    </div>
  )
}
