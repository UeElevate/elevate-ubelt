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
import { Plus, Pencil, Trash2, X, ImageIcon } from 'lucide-react'
import type { Announcement } from '@/lib/types'

export default function AdminAnnouncementsPage() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [imageUploading, setImageUploading] = useState(false)
  const supabase = createClient()

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    content: '',
    image_url: '',
    category: 'general' as Announcement['category'],
    is_pinned: false,
  })

  const fetchAnnouncements = useCallback(async () => {
    const { data } = await supabase
      .from('announcements')
      .select('*')
      .order('is_pinned', { ascending: false })
      .order('created_at', { ascending: false })
    if (data) setAnnouncements(data as Announcement[])
    setIsLoading(false)
  }, [supabase])

  useEffect(() => {
    fetchAnnouncements()
  }, [fetchAnnouncements])

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

  const categoryColors: Record<string, string> = {
    event:    'bg-accent text-accent-foreground',
    reminder: 'bg-secondary text-secondary-foreground',
    worship:  'bg-primary text-primary-foreground',
    general:  'bg-muted text-muted-foreground',
    calendar: 'bg-green-100 text-green-800',
  }

  return (
    <div>
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

              {/* Image Upload */}
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
    </div>
  )
}
