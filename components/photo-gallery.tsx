'use client'

import { useState, useEffect, useCallback } from 'react'
import { X, ChevronLeft, ChevronRight } from 'lucide-react'
import type { Photo } from '@/lib/types'

interface PhotoWithAlbum extends Photo {
  album_name?: string
}

export function PhotoGallery({ photos }: { photos: PhotoWithAlbum[] }) {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null)

  const closeLightbox = useCallback(() => setLightboxIndex(null), [])

  const prevPhoto = useCallback(() =>
    setLightboxIndex((i) =>
      i !== null ? (i - 1 + photos.length) % photos.length : null
    ), [photos.length])

  const nextPhoto = useCallback(() =>
    setLightboxIndex((i) =>
      i !== null ? (i + 1) % photos.length : null
    ), [photos.length])

  // Keyboard navigation
  useEffect(() => {
    if (lightboxIndex === null) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeLightbox()
      if (e.key === 'ArrowLeft') prevPhoto()
      if (e.key === 'ArrowRight') nextPhoto()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [lightboxIndex, closeLightbox, prevPhoto, nextPhoto])

  if (!photos.length) {
    return (
      <div className="text-center py-24 text-muted-foreground">
        No photos yet — check back soon!
      </div>
    )
  }

  return (
    <>
      {/* Masonry grid */}
      <div className="columns-2 md:columns-3 gap-3">
        {photos.map((photo, i) => (
          <div
            key={photo.id}
            className="break-inside-avoid mb-3 rounded-xl overflow-hidden cursor-pointer group"
            onClick={() => setLightboxIndex(i)}
          >
            <img
              src={photo.url}
              alt={photo.caption ?? ''}
              className="w-full object-cover group-hover:brightness-90 transition-all duration-300"
            />
          </div>
        ))}
      </div>

      {/* Lightbox */}
      {lightboxIndex !== null && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center"
          onClick={closeLightbox}
        >
          {/* Close */}
          <button
            onClick={closeLightbox}
            className="absolute top-4 right-4 p-2 rounded-full text-white hover:bg-white/10 transition-colors"
            aria-label="Close"
          >
            <X className="h-6 w-6" />
          </button>

          {/* Prev */}
          {photos.length > 1 && (
            <button
              onClick={(e) => { e.stopPropagation(); prevPhoto() }}
              className="absolute left-4 top-1/2 -translate-y-1/2 p-2 rounded-full text-white hover:bg-white/10 transition-colors"
              aria-label="Previous photo"
            >
              <ChevronLeft className="h-8 w-8" />
            </button>
          )}

          {/* Image */}
          <img
            src={photos[lightboxIndex].url}
            alt={photos[lightboxIndex].caption ?? ''}
            className="max-h-[85vh] max-w-[85vw] object-contain rounded-lg shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          />

          {/* Next */}
          {photos.length > 1 && (
            <button
              onClick={(e) => { e.stopPropagation(); nextPhoto() }}
              className="absolute right-4 top-1/2 -translate-y-1/2 p-2 rounded-full text-white hover:bg-white/10 transition-colors"
              aria-label="Next photo"
            >
              <ChevronRight className="h-8 w-8" />
            </button>
          )}

          {/* Caption + counter */}
          <div className="absolute bottom-5 inset-x-0 flex flex-col items-center gap-2">
            {photos[lightboxIndex].caption && (
              <p className="text-white/80 text-sm bg-black/50 px-4 py-1.5 rounded-full max-w-sm text-center">
                {photos[lightboxIndex].caption}
              </p>
            )}
            {photos[lightboxIndex].album_name && (
              <p className="text-white/40 text-xs">
                {photos[lightboxIndex].album_name}
              </p>
            )}
            <p className="text-white/30 text-xs">
              {lightboxIndex + 1} / {photos.length}
            </p>
          </div>
        </div>
      )}
    </>
  )
}
