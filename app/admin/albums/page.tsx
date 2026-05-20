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
  const [newPhotoUrl, setNewPhotoUrl] = useState('')
  const [newPhotoCaption, setNewPhotoCaption] = useState('')
  const supabase = createClient()

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

  const handleAddPhoto = async () => {
    if (!selectedAlbum || !newPhotoUrl.trim()) return

    const maxOrder = selectedAlbum.photos?.reduce((max, p) => Math.max(max, p.display_order), -1) ?? -1

    await supabase.from('photos').insert({
      album_id: selectedAlbum.id,
      url: newPhotoUrl.trim(),
      caption: newPhotoCaption.trim() || null,
      display_order: maxOrder + 1,
    })

    setNewPhotoUrl('')
    setNewPhotoCaption('')
    fetchAlbums()
    
    // Update selected album
    const updated = albums.find(a => a.id === selectedAlbum.id)
    if (updated) setSelectedAlbum(updated)
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
            {/* Add Photo */}
            <div className="flex flex-col sm:flex-row gap-2">
              <Input
                placeholder="Image URL"
                value={newPhotoUrl}
                onChange={(e) => setNewPhotoUrl(e.target.value)}
                className="flex-1"
              />
              <Input
                placeholder="Caption (optional)"
                value={newPhotoCaption}
                onChange={(e) => setNewPhotoCaption(e.target.value)}
                className="flex-1"
              />
              <Button onClick={handleAddPhoto} disabled={!newPhotoUrl.trim()}>
                <Upload className="mr-2 h-4 w-4" />
                Add
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
