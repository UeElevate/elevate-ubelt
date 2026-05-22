'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import {
  Heart, Send, MessageSquare, MapPin, Mail, Phone,
  ChevronRight, ArrowLeft, Check, Users, Star, ShieldCheck, Shield, Clock,
} from 'lucide-react'
import Link from 'next/link'
import type { Profile, PrayerRequest } from '@/lib/types'
import type { User as SupabaseUser } from '@supabase/supabase-js'

// ── types ─────────────────────────────────────────────────────────────────────

type Tab = 'dgroup' | 'prayers' | 'messages'

interface Message {
  id: string
  sender_id: string
  recipient_id: string
  content: string
  is_read: boolean
  created_at: string
}

// ── constants ─────────────────────────────────────────────────────────────────

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

const ROLE_ICON: Record<string, React.ElementType> = {
  leader:     ShieldCheck,
  member:     Users,
  missionary: Star,
}

const AVATAR_COLORS = [
  'bg-orange-100 text-orange-600',
  'bg-blue-100 text-blue-600',
  'bg-purple-100 text-purple-600',
  'bg-green-100 text-green-600',
  'bg-pink-100 text-pink-600',
  'bg-yellow-100 text-yellow-700',
  'bg-teal-100 text-teal-600',
]

const VISIBILITY_LABEL: Record<string, string> = {
  everyone:   'Everyone',
  leaders:    'DGroup Leaders',
  members:    'DGroup Members',
  dgroup:     'Discipleship Group',
  missionary: 'Campus Missionary',
}

const VISIBILITY_COLOR: Record<string, string> = {
  everyone:   'bg-blue-50 text-blue-600',
  leaders:    'bg-purple-50 text-purple-600',
  members:    'bg-green-50 text-green-600',
  dgroup:     'bg-orange-50 text-orange-600',
  missionary: 'bg-yellow-50 text-yellow-700',
}

// ── helpers ───────────────────────────────────────────────────────────────────

function getInitials(name: string | null) {
  if (!name) return '?'
  const p = name.trim().split(' ')
  return p.length >= 2 ? (p[0][0] + p[1][0]).toUpperCase() : p[0][0].toUpperCase()
}

// ── Avatar ────────────────────────────────────────────────────────────────────

function Avatar({ name, colorIndex = 0, size = 'md' }: {
  name: string | null; colorIndex?: number; size?: 'sm' | 'md' | 'lg'
}) {
  const sz = size === 'sm' ? 'w-8 h-8 text-xs' : size === 'lg' ? 'w-16 h-16 text-xl' : 'w-10 h-10 text-sm'
  return (
    <div className={`${sz} rounded-full flex items-center justify-center font-bold shrink-0 ${AVATAR_COLORS[colorIndex % AVATAR_COLORS.length]}`}>
      {getInitials(name)}
    </div>
  )
}

// ── ConnectionCard ────────────────────────────────────────────────────────────

function ConnectionCard({ profile, index, onMessage }: {
  profile: Profile; index: number; onMessage: () => void
}) {
  const RoleIcon = profile.dgroup_role ? ROLE_ICON[profile.dgroup_role] : Users
  return (
    <div className="flex items-center gap-3 p-4 rounded-xl border border-border">
      <Avatar name={profile.full_name} colorIndex={index} />
      <div className="flex-1 min-w-0">
        <p className="font-bold text-foreground leading-tight truncate">{profile.full_name || 'Unnamed'}</p>
        <p className="text-xs text-muted-foreground truncate">{profile.email}</p>
        {profile.campus && <p className="text-xs text-muted-foreground">{profile.campus}</p>}
      </div>
      <div className="flex items-center gap-2 shrink-0">
        {profile.dgroup_role && (
          <span className={`hidden sm:inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full ${ROLE_PILL[profile.dgroup_role]}`}>
            <RoleIcon className="h-3 w-3" />
            {ROLE_LABEL[profile.dgroup_role]}
          </span>
        )}
        <button
          onClick={onMessage}
          className="p-2 rounded-lg border border-border hover:bg-muted transition-colors"
          title="Send message"
        >
          <MessageSquare className="h-3.5 w-3.5 text-muted-foreground" />
        </button>
      </div>
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function ProfilePage() {
  const [authUser, setAuthUser] = useState<SupabaseUser | null>(null)
  const [profile, setProfile]   = useState<Profile | null>(null)
  const [connections, setConnections] = useState<Profile[]>([])
  const [prayers, setPrayers]   = useState<PrayerRequest[]>([])
  const [tab, setTab]           = useState<Tab>('dgroup')
  const [isLoading, setIsLoading] = useState(true)

  // messages state
  const [activeContact, setActiveContact] = useState<Profile | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [draft, setDraft]       = useState('')
  const [sending, setSending]   = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  const router  = useRouter()
  const supabase = createClient()

  const loadProfile = useCallback(async (uid: string) => {
    const { data } = await supabase.from('profiles').select('*').eq('id', uid).single()
    if (data) setProfile(data as Profile)
  }, [supabase])

  const loadConnections = useCallback(async (p: Profile) => {
    if (!p.campus) return
    const { data } = await supabase
      .from('profiles').select('*').eq('campus', p.campus).neq('id', p.id)
    if (data) setConnections(data as Profile[])
  }, [supabase])

  const loadPrayers = useCallback(async (uid: string) => {
    const { data } = await supabase
      .from('prayer_requests').select('*').eq('user_id', uid).order('created_at', { ascending: false })
    if (data) setPrayers(data as PrayerRequest[])
  }, [supabase])

  const loadMessages = useCallback(async (uid: string, contactId: string) => {
    const { data } = await supabase
      .from('messages')
      .select('*')
      .or(`and(sender_id.eq.${uid},recipient_id.eq.${contactId}),and(sender_id.eq.${contactId},recipient_id.eq.${uid})`)
      .order('created_at', { ascending: true })
    if (data) setMessages(data as Message[])
    await supabase.from('messages').update({ is_read: true })
      .eq('recipient_id', uid).eq('sender_id', contactId)
  }, [supabase])

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/auth/login'); return }
      setAuthUser(user)
      await Promise.all([loadProfile(user.id), loadPrayers(user.id)])
      setIsLoading(false)
    }
    init()
  }, [supabase, router, loadProfile, loadPrayers])

  useEffect(() => { if (profile) loadConnections(profile) }, [profile, loadConnections])

  useEffect(() => {
    if (activeContact && authUser) loadMessages(authUser.id, activeContact.id)
  }, [activeContact, authUser, loadMessages])

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages])

  const openChat = (contact: Profile) => { setActiveContact(contact); setTab('messages') }

  const sendMessage = async () => {
    if (!draft.trim() || !activeContact || !authUser) return
    setSending(true)
    await supabase.from('messages').insert({
      sender_id: authUser.id,
      recipient_id: activeContact.id,
      content: draft.trim(),
    })
    setDraft('')
    await loadMessages(authUser.id, activeContact.id)
    setSending(false)
  }

  const leaders      = connections.filter(c => c.dgroup_role === 'leader')
  const members      = connections.filter(c => c.dgroup_role === 'member')
  const missionaries = connections.filter(c => c.dgroup_role === 'missionary')

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center text-sm text-muted-foreground">
        Loading profile...
      </div>
    )
  }
  if (!profile) return null

  const RoleIcon = profile.dgroup_role ? ROLE_ICON[profile.dgroup_role] : null

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10">

        {/* Profile header */}
        <div className="flex items-start gap-5 mb-8 pb-8 border-b border-border">
          <Avatar name={profile.full_name} size="lg" colorIndex={0} />
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl font-black text-foreground mb-1">{profile.full_name || 'No name set'}</h1>
            {profile.dgroup_role && (
              <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full mb-2 ${ROLE_PILL[profile.dgroup_role]}`}>
                {RoleIcon && <RoleIcon className="h-3.5 w-3.5" />}
                {ROLE_LABEL[profile.dgroup_role]}
              </span>
            )}
            <div className="flex flex-col gap-1 text-sm text-muted-foreground mt-1">
              {profile.email && <span className="flex items-center gap-1.5"><Mail className="h-3.5 w-3.5 shrink-0" />{profile.email}</span>}
              {profile.contact_number && <span className="flex items-center gap-1.5"><Phone className="h-3.5 w-3.5 shrink-0" />{profile.contact_number}</span>}
              {profile.campus && <span className="flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5 shrink-0" />{profile.campus}</span>}
            </div>

            {profile.role === 'admin' ? (
              <Link
                href="/admin"
                className="inline-flex items-center gap-2 mt-4 px-4 py-2 rounded-xl bg-foreground text-white text-sm font-bold hover:bg-foreground/90 transition-colors"
              >
                <Shield className="h-4 w-4" />
                Admin Dashboard
              </Link>
            ) : profile.requested_admin ? (
              <span className="inline-flex items-center gap-2 mt-4 px-4 py-2 rounded-xl bg-amber-50 border border-amber-200 text-amber-700 text-sm font-semibold">
                <Clock className="h-4 w-4" />
                Admin Request Pending
              </span>
            ) : (
              <button
                onClick={async () => {
                  if (!authUser) return
                  await supabase.from('profiles').update({ requested_admin: true }).eq('id', authUser.id)
                  setProfile(prev => prev ? { ...prev, requested_admin: true } : prev)
                }}
                className="inline-flex items-center gap-2 mt-4 px-4 py-2 rounded-xl border border-border text-sm font-semibold text-muted-foreground hover:border-foreground hover:text-foreground transition-colors"
              >
                <ShieldCheck className="h-4 w-4" />
                Apply for Admin Access
              </button>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-0 mb-6 border-b border-border overflow-x-auto">
          {([
            { id: 'dgroup',   label: 'My DGroup' },
            { id: 'prayers',  label: 'Prayer History' },
            { id: 'messages', label: 'Messages' },
          ] as { id: Tab; label: string }[]).map(t => (
            <button key={t.id}
              onClick={() => { setTab(t.id); if (t.id !== 'messages') setActiveContact(null) }}
              className={`px-5 py-2.5 text-sm font-semibold border-b-2 -mb-px transition-colors whitespace-nowrap ${
                tab === t.id ? 'border-foreground text-foreground' : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >{t.label}</button>
          ))}
          {profile.role === 'admin' && (
            <Link
              href="/admin"
              className="px-5 py-2.5 text-sm font-semibold border-b-2 border-transparent text-muted-foreground hover:text-foreground -mb-px whitespace-nowrap flex items-center gap-1.5 transition-colors"
            >
              <Shield className="h-3.5 w-3.5" />
              Admin
            </Link>
          )}
        </div>

        {/* ── DGroup tab ──────────────────────────────────────────────────── */}
        {tab === 'dgroup' && (
          <div className="space-y-8">
            {/* Leader(s) — for members / missionaries / none */}
            {profile.dgroup_role !== 'leader' && leaders.length > 0 && (
              <section>
                <h2 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-3">
                  Discipleship Group Leader{leaders.length > 1 ? 's' : ''}
                </h2>
                <div className="space-y-2">
                  {leaders.map((c, i) => <ConnectionCard key={c.id} profile={c} index={i + 2} onMessage={() => openChat(c)} />)}
                </div>
              </section>
            )}

            {/* Members — for leaders */}
            {profile.dgroup_role === 'leader' && (
              <section>
                <h2 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-3">Your DGroup Members</h2>
                {members.length > 0
                  ? <div className="space-y-2">{members.map((c, i) => <ConnectionCard key={c.id} profile={c} index={i + 1} onMessage={() => openChat(c)} />)}</div>
                  : <p className="text-sm text-muted-foreground">No members in your campus yet.</p>
                }
              </section>
            )}

            {/* Missionaries — for everyone */}
            {missionaries.length > 0 && (
              <section>
                <h2 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-3">Campus Missionaries</h2>
                <div className="space-y-2">
                  {missionaries.map((c, i) => <ConnectionCard key={c.id} profile={c} index={i + 4} onMessage={() => openChat(c)} />)}
                </div>
              </section>
            )}

            {/* Members — for missionaries/none */}
            {(profile.dgroup_role === 'missionary' || profile.dgroup_role === 'none') && members.length > 0 && (
              <section>
                <h2 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-3">DGroup Members in {profile.campus}</h2>
                <div className="space-y-2">
                  {members.map((c, i) => <ConnectionCard key={c.id} profile={c} index={i + 1} onMessage={() => openChat(c)} />)}
                </div>
              </section>
            )}

            {connections.length === 0 && (
              <div className="text-center py-16 text-sm text-muted-foreground">
                <Users className="h-10 w-10 mx-auto mb-3 opacity-30" />
                <p className="font-semibold text-foreground mb-1">No connections yet</p>
                <p>Others from <strong>{profile.campus || 'your campus'}</strong> will appear here once they sign up.</p>
              </div>
            )}
          </div>
        )}

        {/* ── Prayer History tab ──────────────────────────────────────────── */}
        {tab === 'prayers' && (
          <div className="space-y-4">
            {prayers.length > 0 ? prayers.map(p => (
              <div key={p.id} className={`rounded-xl border p-5 ${p.is_answered ? 'border-green-400 bg-green-50/30' : 'border-border'}`}>
                <div className="flex items-center justify-between mb-3 gap-2 flex-wrap">
                  <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${VISIBILITY_COLOR[p.visibility ?? 'everyone']}`}>
                    {VISIBILITY_LABEL[p.visibility ?? 'everyone']}
                  </span>
                  {p.is_answered && (
                    <span className="inline-flex items-center gap-1 text-xs font-semibold text-green-600">
                      <Check className="h-3 w-3" /> Answered
                    </span>
                  )}
                </div>
                <p className="text-sm text-foreground leading-relaxed mb-3">{p.request}</p>
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>{new Date(p.created_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</span>
                  <span className="flex items-center gap-1"><Heart className="h-3 w-3" />{p.prayer_count} {p.prayer_count === 1 ? 'prayer' : 'prayers'}</span>
                </div>
                {p.admin_reply && (
                  <div className="mt-3 bg-muted/60 rounded-lg px-3 py-2 text-xs">
                    <span className="font-semibold text-foreground">Ministry reply: </span>
                    <span className="text-muted-foreground">{p.admin_reply}</span>
                  </div>
                )}
              </div>
            )) : (
              <div className="text-center py-16 text-sm text-muted-foreground">
                <Heart className="h-10 w-10 mx-auto mb-3 opacity-30" />
                <p className="font-semibold text-foreground mb-1">No prayer requests yet</p>
                <p>Your submitted prayer requests will appear here.</p>
              </div>
            )}
          </div>
        )}

        {/* ── Messages tab ────────────────────────────────────────────────── */}
        {tab === 'messages' && (
          <>
            {!activeContact ? (
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-4">
                  {connections.length} connection{connections.length !== 1 ? 's' : ''} — {profile.campus}
                </p>
                {connections.length > 0 ? (
                  <div className="space-y-1">
                    {leaders.length > 0 && <>
                      <p className="text-xs font-semibold text-muted-foreground pt-2 pb-1">Leaders</p>
                      {leaders.map((c, i) => (
                        <button key={c.id} onClick={() => setActiveContact(c)}
                          className="w-full flex items-center gap-3 p-4 rounded-xl border border-border hover:border-foreground/20 hover:bg-muted/30 transition-all text-left">
                          <Avatar name={c.full_name} colorIndex={i + 2} />
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-foreground text-sm truncate">{c.full_name}</p>
                            <p className="text-xs text-muted-foreground truncate">{c.email}</p>
                          </div>
                          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full shrink-0 ${ROLE_PILL.leader}`}>Leader</span>
                          <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                        </button>
                      ))}
                    </>}
                    {members.length > 0 && <>
                      <p className="text-xs font-semibold text-muted-foreground pt-3 pb-1">Members</p>
                      {members.map((c, i) => (
                        <button key={c.id} onClick={() => setActiveContact(c)}
                          className="w-full flex items-center gap-3 p-4 rounded-xl border border-border hover:border-foreground/20 hover:bg-muted/30 transition-all text-left">
                          <Avatar name={c.full_name} colorIndex={i + 1} />
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-foreground text-sm truncate">{c.full_name}</p>
                            <p className="text-xs text-muted-foreground truncate">{c.email}</p>
                          </div>
                          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full shrink-0 ${ROLE_PILL.member}`}>Member</span>
                          <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                        </button>
                      ))}
                    </>}
                    {missionaries.length > 0 && <>
                      <p className="text-xs font-semibold text-muted-foreground pt-3 pb-1">Campus Missionaries</p>
                      {missionaries.map((c, i) => (
                        <button key={c.id} onClick={() => setActiveContact(c)}
                          className="w-full flex items-center gap-3 p-4 rounded-xl border border-border hover:border-foreground/20 hover:bg-muted/30 transition-all text-left">
                          <Avatar name={c.full_name} colorIndex={i + 4} />
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-foreground text-sm truncate">{c.full_name}</p>
                            <p className="text-xs text-muted-foreground truncate">{c.email}</p>
                          </div>
                          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full shrink-0 ${ROLE_PILL.missionary}`}>Missionary</span>
                          <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                        </button>
                      ))}
                    </>}
                  </div>
                ) : (
                  <div className="text-center py-16 text-sm text-muted-foreground">
                    <MessageSquare className="h-10 w-10 mx-auto mb-3 opacity-30" />
                    <p className="font-semibold text-foreground mb-1">No connections yet</p>
                    <p>Members from <strong>{profile.campus}</strong> will appear here once they sign up.</p>
                  </div>
                )}
              </div>
            ) : (
              // Chat thread
              <div className="flex flex-col" style={{ height: '65vh' }}>
                {/* Header */}
                <div className="flex items-center gap-3 pb-4 mb-4 border-b border-border">
                  <button onClick={() => { setActiveContact(null); setMessages([]) }}
                    className="p-1.5 rounded-lg hover:bg-muted transition-colors">
                    <ArrowLeft className="h-4 w-4" />
                  </button>
                  <Avatar name={activeContact.full_name} colorIndex={1} size="sm" />
                  <div>
                    <p className="font-bold text-foreground text-sm leading-tight">{activeContact.full_name}</p>
                    {activeContact.dgroup_role && (
                      <p className="text-xs text-muted-foreground">{ROLE_LABEL[activeContact.dgroup_role]}</p>
                    )}
                  </div>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto space-y-2 pr-1">
                  {messages.length === 0 && (
                    <div className="text-center py-10 text-sm text-muted-foreground">
                      Start a conversation with {activeContact.full_name?.split(' ')[0]}
                    </div>
                  )}
                  {messages.map(m => {
                    const isMe = m.sender_id === authUser?.id
                    return (
                      <div key={m.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[75%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                          isMe ? 'bg-foreground text-white rounded-br-sm' : 'bg-muted text-foreground rounded-bl-sm'
                        }`}>
                          {m.content}
                          <p className={`text-[10px] mt-1 ${isMe ? 'text-white/50' : 'text-muted-foreground'}`}>
                            {new Date(m.created_at).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                          </p>
                        </div>
                      </div>
                    )
                  })}
                  <div ref={bottomRef} />
                </div>

                {/* Input */}
                <div className="flex items-center gap-2 pt-4 border-t border-border mt-2">
                  <input
                    type="text"
                    placeholder={`Message ${activeContact.full_name?.split(' ')[0]}...`}
                    value={draft}
                    onChange={e => setDraft(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage() } }}
                    className="flex-1 border border-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-accent/30"
                  />
                  <button onClick={sendMessage} disabled={sending || !draft.trim()}
                    className="p-2.5 rounded-xl bg-foreground text-white hover:bg-foreground/90 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
                    <Send className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}

      </div>
    </div>
  )
}
