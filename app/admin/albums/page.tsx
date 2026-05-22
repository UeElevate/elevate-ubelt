'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Plus, Pencil, Trash2, X, Image as ImageIcon, Upload } from 'lucide-react'
import type { Album, Photo } from '@/lib/types'

export default function AdminAlbumsPage() {
  const [albums, setAlbums] = useState<Album[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [selectedAlbum, setSelectedAlbum] = useState<Album | null>(null)
  const [newPhotoCaption, setNewPhotoCaption] = useState('')
  const [urlInput, setUrlInput] = useState('')
  const [urlError, setUrlError] = useState('')
  const [uploading, setUploading] = useState(false)
  const [addingUrl, setAddingUrl] = useState(false)
  const supabase = createClient()

  const convertGoogleDriveUrl = (url: string): string => {
    // Convert sharing link: https://drive.google.com/file/d/FILE_ID/view...
    const fileMatch = url.match(/drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/)
    if (fileMatch) return `https://drive.google.com/uc?export=view&id=${fileMatch[1]}`
    // Already a direct link with id=
    const idMatch = url.match(/[?&]id=([a-zA-Z0-9_-]+)/)
    if (idMatch) return `https://drive.google.com/uc?export=view&id=${idMatch[1]}`
    return url
  }

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: 'event' as Album['category'],
  })

  const fetchAlbums = useCallback(async () => {
    const { data } = await supabase
      .from('albums')
      .select('*, photos(*)')
      .order('created_at', { ascending: false })
    
    if (data) setAlbums(data as Album[])
    setIsLoading(false)
  }, [supabase])

  useEffect(() => {
    fetchAlbums()
  }, [fetchAlbums])

  const resetForm = () => {
    setFormData({ name: '', description: '', category: 'event' })
    setEditingId(null)
    setShowForm(false)
  }

  const handleEdit = (album: Album) => {
    setFormData({
      name: album.name,
      description: album.description || '',
      category: album.category,
    })
    setEditingId(album.id)
    setShowForm(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)

    if (editingId) {
      await supabase
        .from('albums')
        .update({
          name: formData.name,
          description: formData.description || null,
          category: formData.category,
        })
        .eq('id', editingId)
    } else {
      await supabase
        .from('albums')
        .insert({
          name: formData.name,
          description: formData.description || null,
          category: formData.category,
        })
    }

    resetForm()
    fetchAlbums()
    setSubmitting(false)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this album and all its photos?')) return
    
    await supabase.from('albums').delete().eq('id', id)
    fetchAlbums()
  }

  const handleAddUrl = async () => {
    if (!selectedAlbum || !urlInput.trim()) return
    setUrlError('')
    setAddingUrl(true)
    const finalUrl = convertGoogleDriveUrl(urlInput.trim())
    const maxOrder = selectedAlbum.photos?.reduce((max, p) => Math.max(max, p.display_order), -1) ?? -1
    const { error } = await supabase.from('photos').insert({
      album_id: selectedAlbum.id,
      url: finalUrl,
      caption: newPhotoCaption.trim() || null,
      display_order: maxOrder + 1,
    })
    if (error) { setUrlError('Failed to add photo. Check the URL.'); setAddingUrl(false); return }
    setUrlInput('')
    setNewPhotoCaption('')
    const { data: refreshed } = await supabase.from('albums').select('*, photos(*)').eq('id', selectedAlbum.id).single()
    if (refreshed) {
      refreshed.photos = refreshed.photos?.sort((a: Photo, b: Photo) => a.display_order - b.display_order)
      setSelectedAlbum(refreshed as Album)
    }
    fetchAlbums()
    setAddingUrl(false)
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!selectedAlbum) return
    const files = Array.from(e.target.files || [])
    if (!files.length) return

    setUploading(true)
    const maxOrder = selectedAlbum.photos?.reduce((max, p) => Math.max(max, p.display_order), -1) ?? -1

    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      const ext = file.name.split('.').pop()
      const path = `albums/${selectedAlbum.id}/${Date.now()}-${i}.${ext}`
      const { error: uploadError } = await supabase.storage.from('media').upload(path, file)
      if (!uploadError) {
        const { data } = supabase.storage.from('media').getPublicUrl(path)
        await supabase.from('photos').insert({
          album_id: selectedAlbum.id,
          url: data.publicUrl,
          caption: files.length === 1 ? newPhotoCaption.trim() || null : null,
          display_order: maxOrder + 1 + i,
        })
      }
    }

    setNewPhotoCaption('')
    e.target.value = ''
    // Refetch and refresh selected album
    const { data: refreshed } = await supabase
      .from('albums')
      .select('*, photos(*)')
      .eq('id', selectedAlbum.id)
      .single()
    if (refreshed) {
      refreshed.photos = refreshed.photos?.sort((a: Photo, b: Photo) => a.display_order - b.display_order)
      setSelectedAlbum(refreshed as Album)
    }
    fetchAlbums()
    setUploading(false)
  }

  const handleDeletePhoto = async (photoId: string) => {
    if (!confirm('Delete this photo?')) return
    
    await supabase.from('photos').delete().eq('id', photoId)
    fetchAlbums()
  }

  return (
    <div className="pt-14 md:pt-0">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Photo Albums</h1>
          <p className="text-muted-foreground">Manage photo albums and images</p>
        </div>
        <Button onClick={() => setShowForm(!showForm)}>
          {showForm ? <X className="mr-2 h-4 w-4" /> : <Plus className="mr-2 h-4 w-4" />}
          {showForm ? 'Cancel' : 'New Album'}
        </Button>
      </div>

      {/* Form */}
      {showForm && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>{editingId ? 'Edit Album' : 'New Album'}</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="name">Album Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="category">Category *</Label>
                  <Select
                    value={formData.category}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, category: value as Album['category'] }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="event">Event</SelectItem>
                      <SelectItem value="marketing">Marketing</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description (optional)</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  rows={2}
                />
              </div>

              <div className="flex gap-2">
                <Button type="submit" disabled={submitting}>
                  {submitting ? 'Saving...' : editingId ? 'Update' : 'Create'}
                </Button>
                <Button type="button" variant="outline" onClick={resetForm}>
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Photo Management Modal */}
      {selectedAlbum && (
        <Card className="mb-6 border-primary">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Manage Photos: {selectedAlbum.name}</CardTitle>
              <Button variant="ghost" size="sm" onClick={() => setSelectedAlbum(null)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Upload Photos */}
            <div className="rounded-xl border-2 border-dashed border-border p-6 text-center">
              <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
              <p className="text-sm font-semibold text-foreground mb-1">Upload Photos</p>
              <p className="text-xs text-muted-foreground mb-3">You can select multiple photos at once</p>
              <label className="cursor-pointer">
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={handleFileUpload}
                  disabled={uploading}
                />
                <span className={`inline-flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-semibold transition-colors ${
                  uploading
                    ? 'bg-muted text-muted-foreground cursor-not-allowed'
                    : 'bg-foreground text-white hover:bg-foreground/90 cursor-pointer'
                }`}>
                  <Upload className="h-4 w-4" />
                  {uploading ? 'Uploading...' : 'Choose Photos'}
                </span>
              </label>
              {uploading && (
                <p className="text-xs text-muted-foreground mt-2 animate-pulse">Uploading to storage...</p>
              )}
            </div>

            {/* OR — URL / Google Drive */}
            <div className="relative flex items-center gap-3">
              <div className="flex-1 h-px bg-border" />
              <span className="text-xs text-muted-foreground font-medium">OR add from URL</span>
              <div className="flex-1 h-px bg-border" />
            </div>

            <div className="space-y-2">
              <Input
                placeholder="Paste image URL or Google Drive share link..."
                value={urlInput}
                onChange={e => { setUrlInput(e.target.value); setUrlError('') }}
              />
              <Input
                placeholder="Caption (optional)"
                value={newPhotoCaption}
                onChange={e => setNewPhotoCaption(e.target.value)}
              />
              {urlError && <p className="text-xs text-destructive">{urlError}</p>}
              <p className="text-xs text-muted-foreground">
                Google Drive: right-click the file → <strong>Share</strong> → set to <strong>"Anyone with the link"</strong> → copy link and paste here.
              </p>
              <Button
                onClick={handleAddUrl}
                disabled={!urlInput.trim() || addingUrl}
                variant="outline"
                className="w-full"
              >
                {addingUrl ? 'Adding...' : 'Add Photo from URL'}
              </Button>
            </div>

            {/* Photo Grid */}
            {selectedAlbum.photos && selectedAlbum.photos.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {selectedAlbum.photos.map((photo) => (
                  <div key={photo.id} className="relative group">
                    <img
                      src={photo.url}
                      alt={photo.caption || 'Photo'}
                      className="w-full aspect-square object-cover rounded-lg"
                    />
                    <Button
                      variant="destructive"
                      size="sm"
                      className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => handleDeletePhoto(photo.id)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                    {photo.caption && (
                      <p className="text-xs text-muted-foreground mt-1 truncate">{photo.caption}</p>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-8">No photos in this album yet.</p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Albums List */}
      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(3)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <div className="aspect-video bg-muted" />
              <CardContent className="pt-4">
                <div className="h-5 bg-muted rounded w-2/3 mb-2" />
                <div className="h-4 bg-muted rounded w-1/3" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : albums.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {albums.map((album) => (
            <Card key={album.id} className="overflow-hidden">
              <div className="aspect-video bg-muted relative">
                {album.photos && album.photos[0] ? (
                  <img
                    src={album.photos[0].url}
                    alt={album.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <ImageIcon className="h-12 w-12 text-muted-foreground" />
                  </div>
                )}
              </div>
              <CardContent className="pt-4">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="font-semibold text-foreground">{album.name}</h3>
                    <p className="text-sm text-muted-foreground">
                      {album.photos?.length || 0} photos | {album.category}
                    </p>
                  </div>
                  <div className="flex gap-1">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => {
                        const updated = albums.find(a => a.id === album.id)
                        setSelectedAlbum(updated || album)
                      }}
                    >
                      <ImageIcon className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => handleEdit(album)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => handleDelete(album.id)}>
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
          <p className="text-muted-foreground">No albums yet. Create your first one!</p>
        </Card>
      )}
    </div>
  )
}
