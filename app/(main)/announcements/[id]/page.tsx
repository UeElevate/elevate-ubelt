import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Calendar, Pin } from 'lucide-react'
import { AttendanceButtons } from '@/components/attendance-buttons'
import type { Announcement } from '@/lib/types'

const categoryColors: Record<string, string> = {
  event:    'bg-accent/10 text-accent',
  reminder: 'bg-secondary/20 text-secondary-foreground',
  worship:  'bg-primary/10 text-primary',
  general:  'bg-muted text-muted-foreground',
  calendar: 'bg-green-100 text-green-700',
}

export default async function AnnouncementDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()

  const { data } = await supabase
    .from('announcements')
    .select('*')
    .eq('id', id)
    .single()

  if (!data) notFound()

  const announcement = data as Announcement
  const badgeColor = categoryColors[announcement.category] ?? categoryColors.general

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-10">

        {/* Back */}
        <Link
          href="/announcements"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-8"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Announcements
        </Link>

        {/* Category + pinned */}
        <div className="flex items-center gap-2 mb-4 flex-wrap">
          <span className={`text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full ${badgeColor}`}>
            {announcement.category}
          </span>
          {announcement.is_pinned && (
            <span className="inline-flex items-center gap-1 text-xs font-semibold text-accent">
              <Pin className="h-3 w-3" />
              Pinned
            </span>
          )}
        </div>

        {/* Title */}
        <h1 className="text-3xl sm:text-4xl font-black uppercase leading-tight text-foreground mb-3">
          {announcement.title}
        </h1>

        {/* Date */}
        <p className="flex items-center gap-1.5 text-sm text-muted-foreground mb-8">
          <Calendar className="h-3.5 w-3.5" />
          {new Date(announcement.created_at).toLocaleDateString('en-US', {
            weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
          })}
        </p>

        {/* Full image */}
        {announcement.image_url && (
          <div className="mb-8 rounded-2xl overflow-hidden">
            <img
              src={announcement.image_url}
              alt={announcement.title}
              className="w-full h-auto"
            />
          </div>
        )}

        {/* Content — show full content if available, otherwise show description */}
        {announcement.content ? (
          <div className="text-[15px] text-foreground">
            {announcement.content.split('\n').map((line, i) =>
              line.trim() ? (
                <p key={i} className="mb-4 leading-relaxed">{line}</p>
              ) : (
                <div key={i} className="mb-2" />
              )
            )}
          </div>
        ) : (
          <p className="text-[15px] text-muted-foreground leading-relaxed">
            {announcement.description}
          </p>
        )}

        {/* Attendance — only shown for event category */}
        {announcement.category === 'event' && (
          <div className="mt-10 pt-8 border-t border-border">
            <h3 className="text-xs font-black uppercase tracking-widest text-muted-foreground mb-5">
              Attendance
            </h3>
            <AttendanceButtons announcementId={announcement.id} />
          </div>
        )}

      </div>
    </div>
  )
}
