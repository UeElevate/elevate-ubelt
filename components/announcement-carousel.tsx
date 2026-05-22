'use client'

import { useState } from 'react'
import { ChevronLeft, ChevronRight, Pin } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import type { Announcement } from '@/lib/types'

const categoryLabel: Record<string, string> = {
  event:    'EVENT',
  reminder: 'REMINDER',
  worship:  'WORSHIP NIGHT',
  general:  'GENERAL',
  calendar: 'CALENDAR',
}

const categoryColor: Record<string, string> = {
  event:    'text-accent',
  reminder: 'text-primary',
  worship:  'text-primary',
  general:  'text-muted-foreground',
  calendar: 'text-secondary-foreground',
}

export function AnnouncementCarousel({
  announcements,
}: {
  announcements: Announcement[]
}) {
  const [index, setIndex] = useState(0)

  if (!announcements.length) {
    return (
      <div className="text-center py-20 text-muted-foreground">
        No announcements yet. Check back soon!
      </div>
    )
  }

  const prev = () => setIndex((i) => (i - 1 + announcements.length) % announcements.length)
  const next = () => setIndex((i) => (i + 1) % announcements.length)

  const a = announcements[index]

  return (
    <div className="relative">
      {/* Left arrow */}
      {announcements.length > 1 && (
        <button
          onClick={prev}
          aria-label="Previous"
          className="absolute left-0 top-[calc(40%-20px)] -translate-x-5 z-10 w-10 h-10 rounded-full bg-white shadow-md border border-border flex items-center justify-center hover:bg-muted transition-colors"
        >
          <ChevronLeft className="h-5 w-5 text-foreground" />
        </button>
      )}

      {/* Right arrow */}
      {announcements.length > 1 && (
        <button
          onClick={next}
          aria-label="Next"
          className="absolute right-0 top-[calc(40%-20px)] translate-x-5 z-10 w-10 h-10 rounded-full bg-white shadow-md border border-border flex items-center justify-center hover:bg-muted transition-colors"
        >
          <ChevronRight className="h-5 w-5 text-foreground" />
        </button>
      )}

      {/* Card */}
      <div className="overflow-hidden rounded-xl">
        {/* Image */}
        <div className="w-full overflow-hidden rounded-xl bg-muted" style={{ aspectRatio: '16/9' }}>
          {a.image_url ? (
            <img
              src={a.image_url}
              alt={a.title}
              className="w-full h-full object-cover"
            />
          ) : (
            <div
              className="w-full h-full flex items-center justify-center"
              style={{
                background: 'linear-gradient(135deg, #FF6D1B 0%, #0b4ea2 100%)',
              }}
            >
              <span className="text-white/20 font-black text-9xl uppercase leading-none">
                {a.title[0]}
              </span>
            </div>
          )}
        </div>

        {/* Info */}
        <div className="pt-5 pb-2">
          {/* Category + Pinned */}
          <div className="flex items-center gap-3 mb-2">
            <span className={`text-xs font-black uppercase tracking-widest ${categoryColor[a.category]}`}>
              {categoryLabel[a.category] ?? a.category.toUpperCase()}
            </span>
            {a.is_pinned && (
              <span className="flex items-center gap-1 text-xs font-semibold text-accent">
                <Pin className="h-3 w-3" />
                Pinned
              </span>
            )}
          </div>

          <h2 className="text-2xl font-black uppercase leading-tight text-foreground">
            {a.title}
          </h2>

          <p className="mt-2 text-muted-foreground leading-relaxed text-sm">
            {a.description}
          </p>

          <div className="flex items-center justify-between mt-4">
            <span className="text-xs text-muted-foreground">
              {new Date(a.created_at).toLocaleDateString('en-US', {
                month: 'long',
                day: 'numeric',
                year: 'numeric',
              })}
            </span>
            <Link href={`/announcements/${a.id}`}>
              <Button variant="outline" size="sm" className="rounded-sm font-semibold text-xs tracking-wide">
                For More Details
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Pagination dots */}
      {announcements.length > 1 && (
        <div className="flex justify-center items-center gap-2 mt-6">
          {announcements.map((_, i) => (
            <button
              key={i}
              onClick={() => setIndex(i)}
              aria-label={`Go to announcement ${i + 1}`}
              className={`rounded-full transition-all duration-300 ${
                i === index
                  ? 'w-6 h-2 bg-foreground'
                  : 'w-2 h-2 bg-muted-foreground/30 hover:bg-muted-foreground/60'
              }`}
            />
          ))}
        </div>
      )}
    </div>
  )
}
