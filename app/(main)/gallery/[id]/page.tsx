'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ArrowLeft, X, ChevronLeft, ChevronRight, Image as ImageIcon } from 'lucide-react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import type { Album, Photo } from '@/lib/types'

export default function AlbumPage() {
  const params = useParams()
  const albumId = params.id as string
  const [album, setAlbum] = useState<Album | null>(null)
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    const fetchAlbum = async () => {
      const { data } = await supabase
        .from('albums')
        .select('*, photos(*)')
        .eq('id', albumId)
        .single()
      
      if (data) {
        // Sort photos by display_order
        data.photos = data.photos?.sort((a: Photo, b: Photo) => a.display_order - b.display_order) || []
        setAlbum(data as Album)
      }
      setIsLoading(false)
    }
    fetchAlbum()
  }, [albumId, supabase])

  const openLightbox = (index: number) => {
    setLightboxIndex(index)
    document.body.style.overflow = 'hidden'
  }

  const closeLightbox = () => {
    setLightboxIndex(null)
    document.body.style.overflow = 'unset'
  }

  const navigateLightbox = (direction: 'prev' | 'next') => {
    if (lightboxIndex === null || !album?.photos) return
    
    if (direction === 'prev') {
      setLightboxIndex(lightboxIndex === 0 ? album.photos.length - 1 : lightboxIndex - 1)
    } else {
      setLightboxIndex(lightboxIndex === album.photos.length - 1 ? 0 : lightboxIndex + 1)
    }
  }

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (lightboxIndex === null) return
      
      if (e.key === 'Escape') closeLightbox()
      if (e.key === 'ArrowLeft') navigateLightbox('prev')
      if (e.key === 'ArrowRight') navigateLightbox('next')
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [lightboxIndex])

  if (isLoading) {
    return (
      <div className="p-4 md:p-6 lg:p-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-1/3" />
          <div className="h-4 bg-muted rounded w-1/2" />
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mt-8">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="aspect-square bg-muted rounded-lg" />
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (!album) {
    return (
      <div className="p-4 md:p-6 lg:p-8">
        <Card className="p-12 text-center">
          <ImageIcon className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
          <h2 className="text-xl font-semibold text-foreground mb-2">Album Not Found</h2>
          <p className="text-muted-foreground mb-4">
            The album you&apos;re looking for doesn&apos;t exist or has been removed.
          </p>
          <Button asChild>
            <Link href="/gallery">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Gallery
            </Link>
          </Button>
        </Card>
      </div>
    )
  }

  return (
    <div className="p-4 md:p-6 lg:p-8">
      {/* Header */}
      <div className="mb-8">
        <Button asChild variant="ghost" className="mb-4">
          <Link href="/gallery">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Gallery
          </Link>
        </Button>
        <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-2">{album.name}</h1>
        {album.description && (
          <p className="text-muted-foreground">{album.description}</p>
        )}
        <p className="text-sm text-muted-foreground mt-2">
          {album.photos?.length || 0} photos
        </p>
      </div>

      {/* Photo Grid */}
      {album.photos && album.photos.length > 0 ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {album.photos.map((photo, index) => (
            <button
              key={photo.id}
              onClick={() => openLightbox(index)}
              className="aspect-square bg-muted rounded-lg overflow-hidden group cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <img
                src={photo.url}
                alt={photo.caption || `Photo ${index + 1}`}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
            </button>
          ))}
        </div>
      ) : (
        <Card className="p-12 text-center">
          <ImageIcon className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
          <h2 className="text-xl font-semibold text-foreground mb-2">No Photos Yet</h2>
          <p className="text-muted-foreground">
            This album doesn&apos;t have any photos yet.
          </p>
        </Card>
      )}

      {/* Lightbox */}
      {lightboxIndex !== null && album.photos && (
        <div 
          className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center"
          onClick={closeLightbox}
        >
          <button
            onClick={closeLightbox}
            className="absolute top-4 right-4 p-2 text-white hover:bg-white/10 rounded-full transition-colors"
            aria-label="Close lightbox"
          >
            <X className="h-8 w-8" />
          </button>

          <button
            onClick={(e) => {
              e.stopPropagation()
              navigateLightbox('prev')
            }}
            className="absolute left-4 p-2 text-white hover:bg-white/10 rounded-full transition-colors"
            aria-label="Previous photo"
          >
            <ChevronLeft className="h-8 w-8" />
          </button>

          <button
            onClick={(e) => {
              e.stopPropagation()
              navigateLightbox('next')
            }}
            className="absolute right-4 p-2 text-white hover:bg-white/10 rounded-full transition-colors"
            aria-label="Next photo"
          >
            <ChevronRight className="h-8 w-8" />
          </button>

          <div 
            className="max-w-5xl max-h-[90vh] mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={album.photos[lightboxIndex].url}
              alt={album.photos[lightboxIndex].caption || `Photo ${lightboxIndex + 1}`}
              className="max-w-full max-h-[85vh] object-contain"
            />
            {album.photos[lightboxIndex].caption && (
              <p className="text-white text-center mt-4 text-lg">
                {album.photos[lightboxIndex].caption}
              </p>
            )}
            <p className="text-white/60 text-center mt-2">
              {lightboxIndex + 1} / {album.photos.length}
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
