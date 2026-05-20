import { createClient } from '@/lib/supabase/server'
import { Card } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Image as ImageIcon } from 'lucide-react'
import Link from 'next/link'
import type { Album } from '@/lib/types'

export default async function GalleryPage() {
  const supabase = await createClient()
  
  const { data: albums } = await supabase
    .from('albums')
    .select('*, photos(*)')
    .order('created_at', { ascending: false })

  const eventAlbums = albums?.filter(a => a.category === 'event') || []
  const marketingAlbums = albums?.filter(a => a.category === 'marketing') || []

  const AlbumGrid = ({ albums }: { albums: Album[] }) => (
    albums.length > 0 ? (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {albums.map((album) => (
          <Link key={album.id} href={`/gallery/${album.id}`}>
            <Card className="overflow-hidden group cursor-pointer hover:shadow-lg transition-all duration-300">
              <div className="aspect-video bg-muted relative overflow-hidden">
                {album.photos && album.photos[0] ? (
                  <img
                    src={album.photos[0].url}
                    alt={album.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <ImageIcon className="h-12 w-12 text-muted-foreground" />
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-4">
                  <h3 className="font-semibold text-white text-lg">{album.name}</h3>
                  <p className="text-sm text-white/80">
                    {album.photos?.length || 0} photos
                  </p>
                  {album.description && (
                    <p className="text-sm text-white/70 line-clamp-1 mt-1">
                      {album.description}
                    </p>
                  )}
                </div>
              </div>
            </Card>
          </Link>
        ))}
      </div>
    ) : (
      <Card className="p-12 text-center">
        <ImageIcon className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
        <h2 className="text-xl font-semibold text-foreground mb-2">No Albums Yet</h2>
        <p className="text-muted-foreground">
          Check back soon for photos from our events and activities.
        </p>
      </Card>
    )
  )

  return (
    <div className="p-4 md:p-6 lg:p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-2">Photo Gallery</h1>
        <p className="text-muted-foreground">Browse photos from our youth ministry events and activities.</p>
      </div>

      {/* Albums with Tabs */}
      <Tabs defaultValue="events" className="w-full">
        <TabsList className="mb-6">
          <TabsTrigger value="events">Events</TabsTrigger>
          <TabsTrigger value="marketing">Marketing</TabsTrigger>
          <TabsTrigger value="all">All Albums</TabsTrigger>
        </TabsList>
        
        <TabsContent value="events">
          <AlbumGrid albums={eventAlbums as Album[]} />
        </TabsContent>
        
        <TabsContent value="marketing">
          <AlbumGrid albums={marketingAlbums as Album[]} />
        </TabsContent>
        
        <TabsContent value="all">
          <AlbumGrid albums={(albums || []) as Album[]} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
