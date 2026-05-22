import { createClient } from '@/lib/supabase/server'
import { PhotoGallery } from '@/components/photo-gallery'
import type { Photo } from '@/lib/types'

interface PhotoWithAlbum extends Photo {
  album_name?: string
}

export default async function GalleryPage() {
  const supabase = await createClient()

  const { data: albums } = await supabase
    .from('albums')
    .select('*, photos(*)')
    .order('created_at', { ascending: false })

  // Flatten all photos across every album, preserving display_order within each
  const photos: PhotoWithAlbum[] = (albums ?? []).flatMap((album) =>
    ((album.photos as Photo[]) ?? [])
      .sort((a, b) => a.display_order - b.display_order)
      .map((photo) => ({ ...photo, album_name: album.name }))
  )

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12">

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground leading-snug">
            Highlight what&apos;s great in pictures
          </h1>
          <p className="text-muted-foreground mt-1.5 text-sm">
            This is what makes these images special.
          </p>
        </div>

        {/* Masonry photo grid + lightbox */}
        <PhotoGallery photos={photos} />

      </div>
    </div>
  )
}
