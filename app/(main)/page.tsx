import { createClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'
import { ArrowRight, Heart } from 'lucide-react'
import Link from 'next/link'
import type { Announcement, Album, Video } from '@/lib/types'

// ── helpers ────────────────────────────────────────────────────────────────

function getYouTubeEmbedUrl(url: string): string | null {
  const m = url.match(/^.*(youtu\.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/)
  return m && m[2].length === 11 ? `https://www.youtube.com/embed/${m[2]}` : null
}

const categoryGradients: Record<string, string> = {
  event:    'from-accent to-primary',
  reminder: 'from-secondary to-accent',
  worship:  'from-primary to-accent',
  general:  'from-muted-foreground to-foreground',
}

// ── sub-components ─────────────────────────────────────────────────────────

function AnnouncementRow({
  announcement,
  index,
}: {
  announcement: Announcement
  index: number
}) {
  const isEven = index % 2 === 0
  const gradient = categoryGradients[announcement.category] ?? categoryGradients.general

  const image = announcement.image_url ? (
    <img
      src={announcement.image_url}
      alt={announcement.title}
      className="w-full h-full object-cover"
    />
  ) : (
    <div className={`w-full h-full bg-linear-to-br ${gradient} flex items-center justify-center`}>
      <span className="text-white/30 text-7xl font-black uppercase tracking-tighter">
        {announcement.category[0]}
      </span>
    </div>
  )

  return (
    <div className={`flex flex-col ${isEven ? 'md:flex-row' : 'md:flex-row-reverse'} gap-0 border-b border-border`}>
      {/* Image — full photo, no crop */}
      <div className="w-full md:w-[45%]">
        {announcement.image_url ? (
          <img
            src={announcement.image_url}
            alt={announcement.title}
            className="w-full h-auto"
          />
        ) : (
          <div className={`w-full aspect-4/3 bg-gradient-to-br ${gradient} flex items-center justify-center`}>
            <span className="text-white/30 text-7xl font-black uppercase tracking-tighter">
              {announcement.category[0]}
            </span>
          </div>
        )}
      </div>

      {/* Text */}
      <div className="flex-1 flex flex-col justify-center px-6 md:px-12 py-10 md:py-16">
        <span className="inline-block text-xs font-bold uppercase tracking-widest text-accent mb-3">
          {announcement.category}
          {announcement.is_pinned && (
            <span className="ml-2 text-primary">· Pinned</span>
          )}
        </span>
        <h2 className="text-2xl md:text-3xl font-black uppercase leading-tight text-foreground mb-3">
          {announcement.title}
        </h2>
        <p className="text-muted-foreground leading-relaxed mb-6 max-w-md">
          {announcement.description}
        </p>
        <div>
          <Link href={`/announcements/${announcement.id}`}>
            <Button variant="outline" className="rounded-sm font-semibold tracking-wide whitespace-nowrap">
              For More Details
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}

function VideoEmbed({ url, title }: { url: string; title: string }) {
  const embedUrl = getYouTubeEmbedUrl(url)
  if (!embedUrl) return null
  return (
    <div className="aspect-video w-full max-w-3xl mx-auto rounded-xl overflow-hidden shadow-lg">
      <iframe
        src={embedUrl}
        title={title}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
        className="w-full h-full"
      />
    </div>
  )
}

// ── page ───────────────────────────────────────────────────────────────────

export default async function HomePage() {
  const supabase = await createClient()

  const [{ data: announcements }, { data: albums }, { data: videos }] = await Promise.all([
    supabase
      .from('announcements')
      .select('*')
      .order('is_pinned', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(4),
    supabase
      .from('albums')
      .select('*, photos(*)')
      .order('created_at', { ascending: false })
      .limit(1),
    supabase
      .from('videos')
      .select('*')
      .eq('video_type', 'youtube')
      .order('created_at', { ascending: false })
      .limit(2),
  ])

  const latestAlbumPhotos =
    albums?.[0]?.photos?.slice(0, 7) ?? []

  const featuredVideo = (videos as Video[] | null)?.[0] ?? null
  const secondVideo   = (videos as Video[] | null)?.[1] ?? null

  return (
    <div className="w-full">
      {/* ── HERO ──────────────────────────────────────────────────────── */}
      <section
        className="relative flex items-center justify-center text-center"
        style={{
          minHeight: 'clamp(320px, 55vh, 520px)',
          background: 'linear-gradient(170deg, #FF8C00 0%, #FF6D1B 25%, #C45000 50%, #0b3a7a 75%, #061e3d 100%)',
        }}
      >
        {/* subtle noise overlay */}
        <div className="absolute inset-0 opacity-[0.06] pointer-events-none"
          style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'4\' height=\'4\'%3E%3Crect width=\'1\' height=\'1\' fill=\'white\'/%3E%3C/svg%3E")' }}
        />

        <div className="relative z-10 px-4 py-16">
          <h1 className="text-6xl sm:text-7xl md:text-8xl lg:text-9xl font-black tracking-tight text-white uppercase leading-none italic">
            ELEVATE
          </h1>
          <h2 className="text-xl sm:text-2xl md:text-3xl font-black tracking-[0.15em] text-white uppercase leading-none mt-1">
            UNIVERSITY BELT
          </h2>
          <p className="text-white/60 font-semibold tracking-[0.2em] uppercase text-xs mt-4">
            Faith · Fellowship · Purpose
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3 mt-8">
            <Link href="/auth/sign-up">
              <button className="px-7 py-3 rounded-sm bg-white text-foreground text-sm font-bold uppercase tracking-widest hover:bg-white/90 transition-colors">
                Be Part of a DGroup
              </button>
            </Link>
            <Link href="/prayer-wall">
              <button className="px-7 py-3 rounded-sm border-2 border-white text-white text-sm font-bold uppercase tracking-widest hover:bg-white hover:text-foreground transition-colors">
                Prayer Request
              </button>
            </Link>
          </div>
        </div>
      </section>

      {/* ── ANNOUNCEMENTS ─────────────────────────────────────────────── */}
      {announcements && announcements.length > 0 && (
        <section>
          {(announcements as Announcement[]).map((a, i) => (
            <AnnouncementRow key={a.id} announcement={a} index={i} />
          ))}
          <div className="flex justify-center py-8 border-b border-border">
            <Link href="/announcements">
              <Button variant="ghost" className="gap-2 font-semibold">
                See all announcements
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </section>
      )}

      {/* ── FEATURED VIDEO + PHOTO GRID ───────────────────────────────── */}
      {(featuredVideo || latestAlbumPhotos.length > 0) && (
        <section className="py-16 px-4 sm:px-6">
          <div className="max-w-5xl mx-auto space-y-12">
            {featuredVideo && (
              <div>
                <VideoEmbed url={featuredVideo.video_url} title={featuredVideo.title} />
              </div>
            )}

            {latestAlbumPhotos.length > 0 && (
              <div>
                <h2 className="text-3xl md:text-4xl font-black uppercase text-foreground mb-2">
                  LET&apos;S SHARE THE GOSPEL
                </h2>
                <p className="text-muted-foreground mb-8">
                  {albums?.[0]?.description ?? 'Moments from our community.'}
                </p>

                {/* Photo mosaic */}
                <div className="grid grid-cols-3 gap-2">
                  {latestAlbumPhotos.map((photo, i) => (
                    <Link
                      key={photo.id}
                      href={`/gallery/${albums![0].id}`}
                      className={`overflow-hidden rounded-lg group ${
                        i === 0 ? 'row-span-2' : ''
                      }`}
                    >
                      <img
                        src={photo.url}
                        alt={photo.caption ?? ''}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        style={{ aspectRatio: i === 0 ? '3/4' : '4/3' }}
                      />
                    </Link>
                  ))}
                </div>

                <div className="flex justify-center mt-6">
                  <Link href="/gallery">
                    <Button variant="ghost" className="gap-2 font-semibold">
                      View all photos
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </Link>
                </div>
              </div>
            )}
          </div>
        </section>
      )}

      {/* ── PRAYER CTA ────────────────────────────────────────────────── */}
      <section className="border-t border-b border-border py-16 px-4 sm:px-6">
        <div className="max-w-3xl mx-auto">
          <blockquote className="text-2xl md:text-3xl font-black text-foreground leading-snug mb-8">
            &ldquo;A community that prays together, stays together. Share what&apos;s on your heart.&rdquo;
          </blockquote>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <p className="text-sm text-muted-foreground">
              <span className="font-semibold text-foreground">Elevate UBelt</span> — Youth Ministry
            </p>
            <Link href="/prayer-wall">
              <Button variant="outline" className="gap-2 rounded-sm font-semibold tracking-wide">
                <Heart className="h-4 w-4" />
                PRAYER REQUEST
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* ── SECOND VIDEO ──────────────────────────────────────────────── */}
      {secondVideo && (
        <section className="py-16 px-4 sm:px-6">
          <div className="max-w-5xl mx-auto">
            <VideoEmbed url={secondVideo.video_url} title={secondVideo.title} />
            {secondVideo.title && (
              <p className="text-center text-muted-foreground mt-4 font-medium">{secondVideo.title}</p>
            )}
          </div>
        </section>
      )}
    </div>
  )
}
