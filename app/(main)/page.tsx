import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Megaphone, Image, Video, Heart, Calendar, ArrowRight } from 'lucide-react'
import Link from 'next/link'
import type { Announcement, Album } from '@/lib/types'

export default async function HomePage() {
  const supabase = await createClient()
  
  // Fetch latest announcements
  const { data: announcements } = await supabase
    .from('announcements')
    .select('*')
    .order('is_pinned', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(3)

  // Fetch latest albums with photos
  const { data: albums } = await supabase
    .from('albums')
    .select('*, photos(*)')
    .order('created_at', { ascending: false })
    .limit(3)

  const categoryColors = {
    event: 'bg-accent text-accent-foreground',
    reminder: 'bg-secondary text-secondary-foreground',
    worship: 'bg-primary text-primary-foreground',
    general: 'bg-muted text-muted-foreground',
  }

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-8">
      {/* Hero Section */}
      <section className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary to-primary/80 text-primary-foreground p-6 md:p-10">
        <div className="absolute top-0 right-0 w-64 h-64 bg-secondary/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-accent/20 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />
        
        <div className="relative z-10">
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4 text-balance">
            Welcome to Youth Ministry
          </h1>
          <p className="text-lg md:text-xl text-primary-foreground/80 mb-6 max-w-2xl text-pretty">
            Join us as we grow together in faith, build lasting friendships, and make a difference in our community.
          </p>
          <div className="flex flex-wrap gap-3">
            <Button asChild size="lg" className="bg-secondary text-secondary-foreground hover:bg-secondary/90">
              <Link href="/announcements">
                <Calendar className="mr-2 h-5 w-5" />
                View Events
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="border-primary-foreground/50 text-primary-foreground hover:bg-primary-foreground/10">
              <Link href="/prayer-wall">
                <Heart className="mr-2 h-5 w-5" />
                Prayer Wall
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Quick Links */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { href: '/announcements', label: 'Announcements', icon: Megaphone, color: 'bg-accent/10 text-accent hover:bg-accent/20' },
          { href: '/gallery', label: 'Photo Gallery', icon: Image, color: 'bg-primary/10 text-primary hover:bg-primary/20' },
          { href: '/videos', label: 'Videos', icon: Video, color: 'bg-secondary/50 text-secondary-foreground hover:bg-secondary/70' },
          { href: '/prayer-wall', label: 'Prayer Wall', icon: Heart, color: 'bg-accent/10 text-accent hover:bg-accent/20' },
        ].map((item) => {
          const Icon = item.icon
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center p-6 rounded-xl transition-colors ${item.color}`}
            >
              <Icon className="h-8 w-8 mb-2" />
              <span className="font-medium text-center">{item.label}</span>
            </Link>
          )
        })}
      </section>

      {/* Latest Announcements */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-foreground">Latest Announcements</h2>
          <Button asChild variant="ghost">
            <Link href="/announcements">
              View All
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
        
        {announcements && announcements.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {(announcements as Announcement[]).map((announcement) => (
              <Card key={announcement.id} className="overflow-hidden">
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${categoryColors[announcement.category]}`}>
                      {announcement.category}
                    </span>
                    {announcement.is_pinned && (
                      <span className="px-2 py-1 rounded-full text-xs font-medium bg-accent text-accent-foreground">
                        Pinned
                      </span>
                    )}
                  </div>
                  <CardTitle className="line-clamp-2">{announcement.title}</CardTitle>
                  <CardDescription className="line-clamp-2">
                    {announcement.description}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    {new Date(announcement.created_at).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="p-8 text-center">
            <Megaphone className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No announcements yet. Check back soon!</p>
          </Card>
        )}
      </section>

      {/* Recent Photos */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-foreground">Recent Photos</h2>
          <Button asChild variant="ghost">
            <Link href="/gallery">
              View Gallery
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
        
        {albums && albums.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {(albums as Album[]).map((album) => (
              <Link key={album.id} href={`/gallery/${album.id}`}>
                <Card className="overflow-hidden group cursor-pointer hover:shadow-lg transition-shadow">
                  <div className="aspect-video bg-muted relative overflow-hidden">
                    {album.photos && album.photos[0] ? (
                      <img
                        src={album.photos[0].url}
                        alt={album.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Image className="h-12 w-12 text-muted-foreground" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                    <div className="absolute bottom-0 left-0 right-0 p-4">
                      <h3 className="font-semibold text-white">{album.name}</h3>
                      <p className="text-sm text-white/80">
                        {album.photos?.length || 0} photos
                      </p>
                    </div>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        ) : (
          <Card className="p-8 text-center">
            <Image className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No photos yet. Check back soon!</p>
          </Card>
        )}
      </section>

      {/* Call to Action */}
      <section className="rounded-2xl bg-secondary p-6 md:p-10 text-center">
        <h2 className="text-2xl md:text-3xl font-bold text-secondary-foreground mb-4">
          Need Prayer?
        </h2>
        <p className="text-secondary-foreground/80 mb-6 max-w-xl mx-auto">
          Share your prayer requests with our community. We believe in the power of prayer and are here to support you.
        </p>
        <Button asChild size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90">
          <Link href="/prayer-wall">
            <Heart className="mr-2 h-5 w-5" />
            Submit Prayer Request
          </Link>
        </Button>
      </section>
    </div>
  )
}
