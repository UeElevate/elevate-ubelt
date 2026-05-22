import { createClient } from '@/lib/supabase/server'
import { AnnouncementCarousel } from '@/components/announcement-carousel'
import type { Announcement } from '@/lib/types'

export default async function AnnouncementsPage() {
  const supabase = await createClient()

  const [{ data: posts }, { data: calendarPosts }] = await Promise.all([
    supabase
      .from('announcements')
      .select('*')
      .neq('category', 'calendar')
      .order('is_pinned', { ascending: false })
      .order('created_at', { ascending: false }),
    supabase
      .from('announcements')
      .select('*')
      .eq('category', 'calendar')
      .order('created_at', { ascending: false })
      .limit(1),
  ])

  const calendarPost = (calendarPosts as Announcement[] | null)?.[0] ?? null

  return (
    <div className="min-h-screen bg-[#f8f8f8]">
      <div className="max-w-2xl mx-auto px-6 py-12">

        {/* Page header */}
        <div className="mb-10">
          <h1 className="text-3xl font-black text-foreground leading-tight">
            Stay updated with what&apos;s happening
          </h1>
          <p className="text-muted-foreground mt-2 text-sm leading-relaxed">
            Check out the latest announcements, events, and reminders from Elevate UBelt.
          </p>
        </div>

        {/* Carousel */}
        <AnnouncementCarousel announcements={(posts ?? []) as Announcement[]} />

        {/* Calendar section */}
        {calendarPost && (
          <div className="mt-16">
            <h2 className="text-xl font-black uppercase tracking-wide text-foreground mb-4">
              CALENDAR
            </h2>
            {calendarPost.image_url ? (
              <div className="rounded-xl overflow-hidden">
                <img
                  src={calendarPost.image_url}
                  alt="Church Calendar"
                  className="w-full object-cover"
                />
              </div>
            ) : (
              <p className="text-muted-foreground text-sm">No calendar posted yet.</p>
            )}
            {calendarPost.description && (
              <p className="mt-3 text-sm text-muted-foreground">{calendarPost.description}</p>
            )}
          </div>
        )}

      </div>
    </div>
  )
}
