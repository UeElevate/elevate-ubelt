'use client'

import { useState } from 'react'
import { ChevronLeft, ChevronRight, Play, X } from 'lucide-react'
import type { Video } from '@/lib/types'

function getYouTubeId(url: string): string | null {
  const m = url.match(/^.*(youtu\.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/)
  return m && m[2].length === 11 ? m[2] : null
}

function getThumbnail(video: Video): string | null {
  if (video.thumbnail_url) return video.thumbnail_url
  if (video.video_type === 'youtube') {
    const id = getYouTubeId(video.video_url)
    if (id) return `https://img.youtube.com/vi/${id}/maxresdefault.jpg`
  }
  return null
}

function getEmbedUrl(video: Video): string | null {
  if (video.video_type === 'youtube') {
    const id = getYouTubeId(video.video_url)
    return id ? `https://www.youtube.com/embed/${id}?autoplay=1` : null
  }
  if (video.video_type === 'facebook') {
    return `https://www.facebook.com/plugins/video.php?href=${encodeURIComponent(video.video_url)}&show_text=false&autoplay=1`
  }
  return video.video_url
}

export function VideoFeatured({ videos }: { videos: Video[] }) {
  const [index, setIndex] = useState(0)
  const [playing, setPlaying] = useState(false)

  if (!videos.length) return null

  const video = videos[index]
  const thumbnail = getThumbnail(video)
  const embedUrl = getEmbedUrl(video)

  const prev = () => { setPlaying(false); setIndex((i) => (i - 1 + videos.length) % videos.length) }
  const next = () => { setPlaying(false); setIndex((i) => (i + 1) % videos.length) }

  return (
    <div className="relative mb-10">
      {/* Left arrow */}
      {videos.length > 1 && (
        <button
          onClick={prev}
          className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 z-10 w-10 h-10 rounded-full bg-white shadow-md border border-border flex items-center justify-center hover:bg-muted transition-colors"
          aria-label="Previous video"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
      )}

      {/* Video area */}
      <div className="rounded-xl overflow-hidden bg-black" style={{ aspectRatio: '16/9' }}>
        {playing && embedUrl ? (
          <iframe
            src={embedUrl}
            title={video.title}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            className="w-full h-full"
          />
        ) : thumbnail ? (
          <div
            className="relative w-full h-full cursor-pointer group"
            onClick={() => setPlaying(true)}
          >
            <img
              src={thumbnail}
              alt={video.title}
              className="w-full h-full object-cover"
            />
            {/* Play button overlay */}
            <div className="absolute inset-0 flex items-center justify-center bg-black/20 group-hover:bg-black/30 transition-colors">
              <div className="w-16 h-16 rounded-full bg-white/90 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                <Play className="h-7 w-7 text-foreground ml-1" fill="currentColor" />
              </div>
            </div>
          </div>
        ) : (
          <div
            className="w-full h-full flex items-center justify-center cursor-pointer group"
            style={{ background: 'linear-gradient(135deg, #FF6D1B 0%, #0b4ea2 100%)' }}
            onClick={() => setPlaying(true)}
          >
            <div className="w-16 h-16 rounded-full bg-white/90 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
              <Play className="h-7 w-7 text-foreground ml-1" fill="currentColor" />
            </div>
          </div>
        )}
      </div>

      {/* Right arrow */}
      {videos.length > 1 && (
        <button
          onClick={next}
          className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 z-10 w-10 h-10 rounded-full bg-white shadow-md border border-border flex items-center justify-center hover:bg-muted transition-colors"
          aria-label="Next video"
        >
          <ChevronRight className="h-5 w-5" />
        </button>
      )}

      {/* Dots */}
      {videos.length > 1 && (
        <div className="flex justify-center items-center gap-2 mt-4">
          {videos.map((_, i) => (
            <button
              key={i}
              onClick={() => { setPlaying(false); setIndex(i) }}
              className={`rounded-full transition-all duration-300 ${
                i === index ? 'w-6 h-2 bg-foreground' : 'w-2 h-2 bg-muted-foreground/30 hover:bg-muted-foreground/60'
              }`}
            />
          ))}
        </div>
      )}
    </div>
  )
}
