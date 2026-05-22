'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import {
  Plus, Pencil, Trash2, X, ImageIcon, Users,
  Check, UserPlus, Download, CheckCircle2, Circle,
} from 'lucide-react'
import type { Announcement } from '@/lib/types'

// ── Local types ───────────────────────────────────────────────────────────────

interface AttendanceRecord {
  id: string
  user_id: string
  status: 'going' | 'cant_go'
  attended: boolean
  full_name: string | null
  email: string | null
  created_at: string
}

interface WalkinRecord {
  id: string
  announcement_id: string
  name: string
  notes: string | null
  created_at: string
}

type AttendanceTab = 'going' | 'cant_go' | 'walkins'

// ── Page ──────────────────────────────────────────────────────────────────────

export default function AdminAnnouncementsPage() {
  const supabase = createClient()

  // Announcements list
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [imageUploading, setImageUploading] = useState(false)

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    content: '',
    image_url: '',
    category: 'general' as Announcement['category'],
    is_pinned: false,
  })

  // Attendance dialog
  const [attendanceDialog, setAttendanceDialog] = useState<Announcement | null>(null)
  const [loadingAttendance, setLoadingAttendance] = useState(false)
  const [attendanceTab, setAttendanceTab] = useState<AttendanceTab>('going')
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([])
  const [walkins, setWalkins] = useState<WalkinRecord[]>([])

  // Walk-in form
  const [walkinName, setWalkinName] = useState('')
  const [walkinNotes, setWalkinNotes] = useState('')
  const [addingWalkin, setAddingWalkin] = useState(false)

  // ── Announcement CRUD ────────────────────────────────────────────────────────

  const fetchAnnouncements = useCallback(async () => {
    const { data } = await supabase
      .from('announcements')
      .select('*')
      .order('is_pinned', { ascending: false })
      .order('created_at', { ascending: false })
    if (data) setAnnouncements(data as Announcement[])
    setIsLoading(false)
  }, [supabase])

  useEffect(() => { fetchAnnouncements() }, [fetchAnnouncements])

  const resetForm = () => {
    setFormData({ title: '', description: '', content: '', image_url: '', category: 'general', is_pinned: false })
    setEditingId(null)
    setShowForm(false)
  }

  const handleEdit = (a: Announcement) => {
    setFormData({
      title: a.title,
      description: a.description,
      content: a.content || '',
      image_url: a.image_url || '',
      category: a.category,
      is_pinned: a.is_pinned,
    })
    setEditingId(a.id)
    setShowForm(true)
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setImageUploading(true)
    const ext = file.name.split('.').pop()
    const path = `announcements/${Date.now()}.${ext}`
    const { error } = await supabase.storage.from('media').upload(path, file)
    if (!error) {
      const { data } = supabase.storage.from('media').getPublicUrl(path)
      setFormData(prev => ({ ...prev, image_url: data.publicUrl }))
    }
    setImageUploading(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    const { data: { user } } = await supabase.auth.getUser()
    const payload = {
      title: formData.title,
      description: formData.description,
      content: formData.content || null,
      image_url: formData.image_url || null,
      category: formData.category,
      is_pinned: formData.is_pinned,
    }
    if (editingId) {
      await supabase.from('announcements').update({ ...payload, updated_at: new Date().toISOString() }).eq('id', editingId)
    } else {
      await supabase.from('announcements').insert({ ...payload, created_by: user?.id })
    }
    resetForm()
    fetchAnnouncements()
    setSubmitting(false)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this announcement?')) return
    await supabase.from('announcements').delete().eq('id', id)
    fetchAnnouncements()
  }

  // ── Attendance ───────────────────────────────────────────────────────────────

  const openAttendance = async (a: Announcement) => {
    setAttendanceDialog(a)
    setAttendanceTab('going')
    setLoadingAttendance(true)
    setWalkinName('')
    setWalkinNotes('')

    const [{ data: records }, { data: walkinsData }] = await Promise.all([
      supabase
        .from('event_attendance')
        .select('id, user_id, status, attended, created_at')
        .eq('announcement_id', a.id),
      supabase
        .from('event_walkins')
        .select('*')
        .eq('announcement_id', a.id)
        .order('created_at', { ascending: true }),
    ])

    if (records && records.length > 0) {
      const userIds = records.map((r: any) => r.user_id)
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, full_name, email')
        .in('id', userIds)
      const profileMap = Object.fromEntries(
        (profiles ?? []).map((p: any) => [p.id, p])
      )
      setAttendanceRecords(
        records.map((r: any) => ({
          id: r.id,
          user_id: r.user_id,
          status: r.status,
          attended: r.attended ?? false,
          full_name: profileMap[r.user_id]?.full_name ?? 'Unknown',
          email: profileMap[r.user_id]?.email ?? null,
          created_at: r.created_at,
        }))
      )
    } else {
      setAttendanceRecords([])
    }

    setWalkins((walkinsData ?? []) as WalkinRecord[])
    setLoadingAttendance(false)
  }

  const toggleConfirmed = async (recordId: string, current: boolean) => {
    await supabase
      .from('event_attendance')
      .update({ attended: !current })
      .eq('id', recordId)
    setAttendanceRecords(prev =>
      prev.map(r => r.id === recordId ? { ...r, attended: !current } : r)
    )
  }

  const addWalkin = async () => {
    if (!walkinName.trim() || !attendanceDialog) return
    setAddingWalkin(true)
    const { data: { user } } = await supabase.auth.getUser()
    const { data } = await supabase
      .from('event_walkins')
      .insert({
        announcement_id: attendanceDialog.id,
        name: walkinName.trim(),
        notes: walkinNotes.trim() || null,
        added_by: user?.id ?? null,
      })
      .select()
      .single()
    if (data) setWalkins(prev => [...prev, data as WalkinRecord])
    setWalkinName('')
    setWalkinNotes('')
    setAddingWalkin(false)
  }

  const deleteWalkin = async (id: string) => {
    if (!confirm('Remove this walk-in entry?')) return
    await supabase.from('event_walkins').delete().eq('id', id)
    setWalkins(prev => prev.filter(w => w.id !== id))
  }

  const exportToCSV = () => {
    if (!attendanceDialog) return
    const rows: string[][] = [
      ['Name', 'Email', 'Type', 'RSVP Status', 'Confirmed Present', 'Date'],
    ]
    for (const r of attendanceRecords) {
      rows.push([
        r.full_name ?? 'Unknown',
        r.email ?? '',
        'Online RSVP',
        r.status === 'going' ? 'Going' : "Can't Go",
        r.attended ? 'Yes' : 'No',
        new Date(r.created_at).toLocaleDateString(),
      ])
    }
    for (const w of walkins) {
      rows.push([
        w.name,
        '',
        'Walk-in',
        'N/A',
        'Yes',
        new Date(w.created_at).toLocaleDateString(),
      ])
    }
    const csv = rows
      .map(row => row.map(cell => `"${cell.replace(/"/g, '""')}"`).join(','))
      .join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `${attendanceDialog.title.replace(/[^a-z0-9]/gi, '_')}_attendance.csv`
    link.click()
    URL.revokeObjectURL(url)
  }

  // ── Derived counts ────────────────────────────────────────────────────────────

  const goingRecords = attendanceRecords.filter(r => r.status === 'going')
  const cantGoRecords = attendanceRecords.filter(r => r.status === 'cant_go')
  const confirmedCount = attendanceRecords.filter(r => r.attended).length
  const totalPresent = confirmedCount + walkins.length

  // ── Styles ───────────────────────────────────────────────────────────────────

  const categoryColors: Record<string, string> = {
    event:    'bg-accent text-accent-foreground',
    reminder: 'bg-secondary text-secondary-foreground',
    worship:  'bg-primary text-primary-foreground',
    general:  'bg-muted text-muted-foreground',
    calendar: 'bg-green-100 text-green-800',
  }

  // ── Render ────────────────────────────────────────────────────────────────────

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Announcements</h1>
          <p className="text-muted-foreground">Manage ministry announcements</p>
        </div>
        <Button onClick={() => { setShowForm(!showForm); if (showForm) resetForm() }}>
          {showForm ? <X className="mr-2 h-4 w-4" /> : <Plus className="mr-2 h-4 w-4" />}
          {showForm ? 'Cancel' : 'New Announcement'}
        </Button>
      </div>

      {/* Announcement form */}
      {showForm && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>{editingId ? 'Edit Announcement' : 'New Announcement'}</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="title">Title *</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="category">Category *</Label>
                  <Select
                    value={formData.category}
                    onValueChange={(v) => setFormData(prev => ({ ...prev, category: v as Announcement['category'] }))}
                  >
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="event">Event</SelectItem>
                      <SelectItem value="reminder">Reminder</SelectItem>
                      <SelectItem value="worship">Worship</SelectItem>
                      <SelectItem value="general">General</SelectItem>
                      <SelectItem value="calendar">Calendar</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Short Description *</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  rows={2}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="content">Full Content (optional)</Label>
                <Textarea
                  id="content"
                  value={formData.content}
                  onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
                  rows={4}
                />
              </div>
              <div className="space-y-2">
                <Label>Cover Image (optional)</Label>
                <div className="flex items-start gap-4">
                  <div className="flex-1">
                    <Input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      disabled={imageUploading}
                      className="cursor-pointer"
                    />
                    <p className="text-xs text-muted-foreground mt-1">Or paste an image URL below</p>
                    <Input
                      placeholder="https://..."
                      value={formData.image_url}
                      onChange={(e) => setFormData(prev => ({ ...prev, image_url: e.target.value }))}
                      className="mt-2"
                    />
                  </div>
                  {formData.image_url ? (
                    <div className="relative w-24 h-24 rounded-lg overflow-hidden border border-border shrink-0">
                      <img src={formData.image_url} alt="Preview" className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, image_url: '' }))}
                        className="absolute top-1 right-1 p-0.5 bg-black/60 rounded-full text-white hover:bg-black/80"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ) : (
                    <div className="w-24 h-24 rounded-lg border border-dashed border-border flex items-center justify-center shrink-0 text-muted-foreground">
                      <ImageIcon className="h-6 w-6" />
                    </div>
                  )}
                </div>
                {imageUploading && <p className="text-sm text-muted-foreground">Uploading image...</p>}
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="pinned"
                  checked={formData.is_pinned}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_pinned: checked as boolean }))}
                />
                <Label htmlFor="pinned" className="cursor-pointer">Pin this announcement</Label>
              </div>
              <div className="flex gap-2">
                <Button type="submit" disabled={submitting || imageUploading}>
                  {submitting ? 'Saving...' : editingId ? 'Update' : 'Create'}
                </Button>
                <Button type="button" variant="outline" onClick={resetForm}>Cancel</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Announcements list */}
      {isLoading ? (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="pt-6">
                <div className="h-6 bg-muted rounded w-1/3 mb-2" />
                <div className="h-4 bg-muted rounded w-2/3" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : announcements.length > 0 ? (
        <div className="space-y-4">
          {announcements.map((a) => (
            <Card key={a.id}>
              <CardContent className="pt-6">
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                  <div className="flex items-start gap-4 flex-1 min-w-0">
                    {a.image_url && (
                      <img src={a.image_url} alt={a.title} className="w-16 h-16 rounded-lg object-cover shrink-0" />
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${categoryColors[a.category]}`}>
                          {a.category}
                        </span>
                        {a.is_pinned && (
                          <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-accent text-accent-foreground">
                            Pinned
                          </span>
                        )}
                      </div>
                      <h3 className="font-semibold text-foreground truncate">{a.title}</h3>
                      <p className="text-sm text-muted-foreground line-clamp-1">{a.description}</p>
                      <p className="text-xs text-muted-foreground mt-1">{new Date(a.created_at).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    {a.category === 'event' && (
                      <Button variant="outline" size="sm" onClick={() => openAttendance(a)}>
                        <Users className="h-4 w-4 mr-1.5" />
                        Attendance
                      </Button>
                    )}
                    <Button variant="outline" size="sm" onClick={() => handleEdit(a)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => handleDelete(a.id)}>
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
          <p className="text-muted-foreground">No announcements yet. Create your first one!</p>
        </Card>
      )}

      {/* ── Attendance Dialog ─────────────────────────────────────────────── */}
      <Dialog open={!!attendanceDialog} onOpenChange={open => { if (!open) setAttendanceDialog(null) }}>
        <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col gap-0 p-0">
          {/* Dialog header */}
          <DialogHeader className="px-6 pt-6 pb-4 border-b border-border shrink-0">
            <DialogTitle className="text-lg font-bold pr-6 leading-snug">
              {attendanceDialog?.title}
            </DialogTitle>
            <p className="text-xs text-muted-foreground font-semibold uppercase tracking-widest">
              Attendance Management
            </p>
          </DialogHeader>

          {loadingAttendance ? (
            <div className="flex-1 py-12 text-center text-muted-foreground">
              Loading attendance data...
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto">
              {/* Summary stats */}
              <div className="grid grid-cols-4 gap-px bg-border mx-6 mt-5 rounded-xl overflow-hidden border border-border">
                {[
                  { label: 'Going', value: goingRecords.length, color: 'text-blue-600', bg: 'bg-blue-50' },
                  { label: "Can't Go", value: cantGoRecords.length, color: 'text-red-500', bg: 'bg-red-50' },
                  { label: 'Confirmed', value: confirmedCount, color: 'text-green-600', bg: 'bg-green-50' },
                  { label: 'Walk-ins', value: walkins.length, color: 'text-purple-600', bg: 'bg-purple-50' },
                ].map(stat => (
                  <div key={stat.label} className={`${stat.bg} px-3 py-3 text-center`}>
                    <p className={`text-2xl font-black ${stat.color}`}>{stat.value}</p>
                    <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wide mt-0.5">
                      {stat.label}
                    </p>
                  </div>
                ))}
              </div>

              {/* Total present callout */}
              <div className="mx-6 mt-3 flex items-center justify-between px-4 py-2.5 bg-foreground text-background rounded-lg">
                <span className="text-sm font-bold">Total Present (Confirmed + Walk-ins)</span>
                <span className="text-xl font-black">{totalPresent}</span>
              </div>

              {/* Tabs */}
              <div className="flex gap-1 bg-muted rounded-lg p-1 mx-6 mt-4">
                {([
                  { key: 'going', label: `Going (${goingRecords.length})` },
                  { key: 'cant_go', label: `Can't Go (${cantGoRecords.length})` },
                  { key: 'walkins', label: `Walk-ins (${walkins.length})` },
                ] as { key: AttendanceTab; label: string }[]).map(tab => (
                  <button
                    key={tab.key}
                    onClick={() => setAttendanceTab(tab.key)}
                    className={`flex-1 py-1.5 rounded-md text-sm font-semibold transition-colors ${
                      attendanceTab === tab.key
                        ? 'bg-white text-foreground shadow-sm'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Tab content */}
              <div className="px-6 mt-4 pb-4 space-y-2 min-h-[200px]">

                {/* ── Going tab ── */}
                {attendanceTab === 'going' && (
                  goingRecords.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-10">
                      No one has RSVPed as going yet.
                    </p>
                  ) : (
                    goingRecords.map(record => (
                      <div
                        key={record.id}
                        className={`flex items-center justify-between p-3 rounded-lg border transition-colors ${
                          record.attended
                            ? 'bg-green-50 border-green-200'
                            : 'bg-card border-border hover:bg-muted/30'
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 text-sm font-bold ${
                            record.attended ? 'bg-green-500 text-white' : 'bg-muted text-muted-foreground'
                          }`}>
                            {(record.full_name ?? 'U')[0].toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-foreground truncate">
                              {record.full_name ?? 'Unknown'}
                            </p>
                            {record.email && (
                              <p className="text-xs text-muted-foreground truncate">{record.email}</p>
                            )}
                          </div>
                        </div>
                        <button
                          onClick={() => toggleConfirmed(record.id, record.attended)}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all shrink-0 ml-3 ${
                            record.attended
                              ? 'bg-green-500 text-white hover:bg-green-600'
                              : 'bg-muted text-muted-foreground hover:bg-green-100 hover:text-green-700 border border-border'
                          }`}
                        >
                          {record.attended ? (
                            <><CheckCircle2 className="h-3.5 w-3.5" /> Confirmed</>
                          ) : (
                            <><Circle className="h-3.5 w-3.5" /> Confirm</>
                          )}
                        </button>
                      </div>
                    ))
                  )
                )}

                {/* ── Can't Go tab ── */}
                {attendanceTab === 'cant_go' && (
                  cantGoRecords.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-10">
                      No one has marked Can&apos;t Go yet.
                    </p>
                  ) : (
                    cantGoRecords.map(record => (
                      <div key={record.id} className="flex items-center gap-3 p-3 rounded-lg border border-border bg-card hover:bg-muted/30 transition-colors">
                        <div className="w-9 h-9 rounded-full bg-red-100 text-red-600 flex items-center justify-center shrink-0 text-sm font-bold">
                          {(record.full_name ?? 'U')[0].toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-foreground truncate">
                            {record.full_name ?? 'Unknown'}
                          </p>
                          {record.email && (
                            <p className="text-xs text-muted-foreground truncate">{record.email}</p>
                          )}
                        </div>
                        <span className="ml-auto shrink-0 px-2 py-0.5 rounded-full bg-red-100 text-red-600 text-xs font-semibold">
                          Can&apos;t Go
                        </span>
                      </div>
                    ))
                  )
                )}

                {/* ── Walk-ins tab ── */}
                {attendanceTab === 'walkins' && (
                  <div className="space-y-3">
                    {/* Add walk-in form */}
                    <div className="border border-dashed border-border rounded-xl p-4 bg-muted/20">
                      <p className="text-sm font-semibold text-foreground mb-3 flex items-center gap-1.5">
                        <UserPlus className="h-4 w-4" />
                        Add Walk-in / Manual Entry
                      </p>
                      <div className="grid gap-2 sm:grid-cols-2">
                        <div className="space-y-1">
                          <Label className="text-xs">Name *</Label>
                          <Input
                            value={walkinName}
                            onChange={e => setWalkinName(e.target.value)}
                            placeholder="Full name"
                            onKeyDown={e => e.key === 'Enter' && addWalkin()}
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">Notes (optional)</Label>
                          <Input
                            value={walkinNotes}
                            onChange={e => setWalkinNotes(e.target.value)}
                            placeholder="e.g. From another campus"
                          />
                        </div>
                      </div>
                      <Button
                        size="sm"
                        className="mt-3"
                        onClick={addWalkin}
                        disabled={addingWalkin || !walkinName.trim()}
                      >
                        <Plus className="h-4 w-4 mr-1.5" />
                        {addingWalkin ? 'Adding...' : 'Add Person'}
                      </Button>
                    </div>

                    {/* Walk-in list */}
                    {walkins.length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-6">
                        No walk-ins added yet.
                      </p>
                    ) : (
                      walkins.map((w, i) => (
                        <div
                          key={w.id}
                          className="flex items-center justify-between p-3 rounded-lg border border-purple-200 bg-purple-50 hover:bg-purple-100/60 transition-colors"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="w-9 h-9 rounded-full bg-purple-200 text-purple-700 flex items-center justify-center shrink-0 text-sm font-bold">
                              {w.name[0].toUpperCase()}
                            </div>
                            <div className="min-w-0">
                              <p className="text-sm font-semibold text-foreground truncate">{w.name}</p>
                              {w.notes ? (
                                <p className="text-xs text-muted-foreground truncate">{w.notes}</p>
                              ) : (
                                <p className="text-xs text-muted-foreground">Walk-in #{i + 1}</p>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-2 shrink-0 ml-3">
                            <span className="px-2 py-0.5 rounded-full bg-purple-200 text-purple-700 text-xs font-semibold">
                              Present
                            </span>
                            <button
                              onClick={() => deleteWalkin(w.id)}
                              className="p-1.5 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Dialog footer — Export button */}
          <div className="px-6 py-4 border-t border-border shrink-0 flex items-center justify-between gap-3 bg-muted/30">
            <p className="text-xs text-muted-foreground">
              {totalPresent} total present · {attendanceRecords.length + walkins.length} total responses
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={exportToCSV}
              disabled={attendanceRecords.length === 0 && walkins.length === 0}
              className="gap-2"
            >
              <Download className="h-4 w-4" />
              Export to Excel
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
