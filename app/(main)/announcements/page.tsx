import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Megaphone, Pin } from 'lucide-react'
import type { Announcement } from '@/lib/types'

export default async function AnnouncementsPage() {
  const supabase = await createClient()
  
  const { data: announcements } = await supabase
    .from('announcements')
    .select('*')
    .order('is_pinned', { ascending: false })
    .order('created_at', { ascending: false })

  const categoryColors = {
    event: 'bg-accent text-accent-foreground',
    reminder: 'bg-secondary text-secondary-foreground',
    worship: 'bg-primary text-primary-foreground',
    general: 'bg-muted text-muted-foreground',
  }

  const categoryIcons = {
    event: '📅',
    reminder: '🔔',
    worship: '🙏',
    general: '📢',
  }

  return (
    <div className="p-4 md:p-6 lg:p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-2">Announcements</h1>
        <p className="text-muted-foreground">Stay updated with the latest news and events from our youth ministry.</p>
      </div>

      {/* Announcements List */}
      {announcements && announcements.length > 0 ? (
        <div className="space-y-4">
          {(announcements as Announcement[]).map((announcement) => (
            <Card key={announcement.id} className={`overflow-hidden ${announcement.is_pinned ? 'border-accent border-2' : ''}`}>
              <CardHeader>
                <div className="flex flex-wrap items-center gap-2 mb-2">
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${categoryColors[announcement.category]}`}>
                    {categoryIcons[announcement.category]} {announcement.category.charAt(0).toUpperCase() + announcement.category.slice(1)}
                  </span>
                  {announcement.is_pinned && (
                    <span className="flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium bg-accent text-accent-foreground">
                      <Pin className="h-3 w-3" />
                      Pinned
                    </span>
                  )}
                </div>
                <CardTitle className="text-xl md:text-2xl">{announcement.title}</CardTitle>
                <CardDescription className="text-base">
                  {announcement.description}
                </CardDescription>
              </CardHeader>
              {announcement.content && (
                <CardContent>
                  <div className="prose prose-sm max-w-none text-foreground">
                    <p className="whitespace-pre-wrap">{announcement.content}</p>
                  </div>
                </CardContent>
              )}
              <CardContent className="pt-0">
                <p className="text-sm text-muted-foreground">
                  Posted on {new Date(announcement.created_at).toLocaleDateString('en-US', {
                    weekday: 'long',
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
        <Card className="p-12 text-center">
          <Megaphone className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
          <h2 className="text-xl font-semibold text-foreground mb-2">No Announcements Yet</h2>
          <p className="text-muted-foreground">
            Check back soon for updates and news from our youth ministry.
          </p>
        </Card>
      )}
    </div>
  )
}
