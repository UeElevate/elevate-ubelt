import { createClient } from '@/lib/supabase/server'
import { VideoFeatured } from '@/components/video-featured'
import { Play } from 'lucide-react'
import Link from 'next/link'
import type { Video } from '@/lib/types'

function getYouTubeId(url: string): string | null {
  const m = url.match(/^.*(youtu\.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/)
  return m && m[2].length === 11 ? m[2] : null
}

function getCardThumbnail(video: Video): string | null {
  if (video.thumbnail_url) return video.thumbnail_url
  if (video.video_type === 'youtube') {
    const id = getYouTubeId(video.video_url)
    if (id) return `https://img.youtube.com/vi/${id}/mqdefault.jpg`
  }
  return null
}

function VideoCard({ video }: { video: Video }) {
  const thumbnail = getCardThumbnail(video)
  const href = video.video_url

  return (
    <div className="flex flex-col">
      {/* Thumbnail */}
      <a href={href} target="_blank" rel="noopener noreferrer" className="block group">
        <div className="rounded-xl overflow-hidden bg-muted relative" style={{ aspectRatio: '4/3' }}>
          {thumbnail ? (
            <>
              <img
                src={thumbnail}
                alt={video.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
              <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <div className="w-12 h-12 rounded-full bg-white/90 flex items-center justify-center">
                  <Play className="h-5 w-5 text-foreground ml-0.5" fill="currentColor" />
                </div>
              </div>
            </>
          ) : (
            <div
              className="w-full h-full flex items-center justify-center group-hover:opacity-90 transition-opacity"
              style={{ background: 'linear-gradient(135deg, #FF6D1B 0%, #0b4ea2 100%)' }}
            >
              <Play className="h-10 w-10 text-white/80" fill="currentColor" />
            </div>
          )}
        </div>
      </a>

      {/* Info */}
      <div className="mt-3">
        <h3 className="font-bold text-foreground leading-snug line-clamp-2">
          {video.title}
        </h3>
        {video.description && (
          <p className="text-sm text-muted-foreground mt-1 line-clamp-3 leading-relaxed">
            {video.description}
          </p>
        )}
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 mt-3 text-sm font-semibold text-foreground hover:text-accent transition-colors"
        >
          Watch video
          <span aria-hidden>→</span>
        </a>
      </div>
    </div>
  )
}

export default async function VideosPage() {
  const supabase = await createClient()

  const { data: videos } = await supabase
    .from('videos')
    .select('*')
    .order('created_at', { ascending: false })

  const allVideos = (videos ?? []) as Video[]

  // First 5 go into the featured carousel; all videos show in the grid
  const featuredVideos = allVideos.slice(0, 5)

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10">

        {/* Heading */}
        <h1 className="text-3xl font-black uppercase tracking-tight text-foreground mb-6">
          VIDEOS
        </h1>

        {/* Featured carousel */}
        {featuredVideos.length > 0 ? (
          <VideoFeatured videos={featuredVideos} />
        ) : (
          <div className="rounded-xl bg-muted flex items-center justify-center text-muted-foreground mb-10" style={{ aspectRatio: '16/9' }}>
            No videos yet — check back soon!
          </div>
        )}

        {/* All videos grid */}
        {allVideos.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 mt-2">
            {allVideos.map((video) => (
              <VideoCard key={video.id} video={video} />
            ))}
          </div>
        )}

      </div>
    </div>
  )
}
