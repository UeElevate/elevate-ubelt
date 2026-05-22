import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Megaphone, Image, Video, Heart, Users, ShieldCheck, ClipboardList } from 'lucide-react'
import Link from 'next/link'

export default async function AdminDashboard() {
  const supabase = await createClient()

  // Fetch counts
  const [announcements, albums, videos, prayers, users, adminReqs, forms] = await Promise.all([
    supabase.from('announcements').select('id', { count: 'exact', head: true }),
    supabase.from('albums').select('id', { count: 'exact', head: true }),
    supabase.from('videos').select('id', { count: 'exact', head: true }),
    supabase.from('prayer_requests').select('id', { count: 'exact', head: true }),
    supabase.from('profiles').select('id', { count: 'exact', head: true }),
    supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('requested_admin', true),
    supabase.from('forms').select('id', { count: 'exact', head: true }),
  ])

  const stats = [
    {
      label: 'Announcements',
      count: announcements.count || 0,
      icon: Megaphone,
      href: '/admin/announcements',
      color: 'bg-accent/10 text-accent'
    },
    {
      label: 'Photo Albums',
      count: albums.count || 0,
      icon: Image,
      href: '/admin/albums',
      color: 'bg-primary/10 text-primary'
    },
    {
      label: 'Videos',
      count: videos.count || 0,
      icon: Video,
      href: '/admin/videos',
      color: 'bg-secondary text-secondary-foreground'
    },
    {
      label: 'Prayer Requests',
      count: prayers.count || 0,
      icon: Heart,
      href: '/admin/prayers',
      color: 'bg-accent/10 text-accent'
    },
    {
      label: 'Users',
      count: users.count || 0,
      icon: Users,
      href: '/admin/users',
      color: 'bg-muted text-muted-foreground'
    },
    {
      label: 'Admin Requests',
      count: adminReqs.count || 0,
      icon: ShieldCheck,
      href: '/admin/admin-requests',
      color: 'bg-amber-50 text-amber-600',
      highlight: (adminReqs.count || 0) > 0,
    },
    {
      label: 'Forms',
      count: forms.count || 0,
      icon: ClipboardList,
      href: '/admin/forms',
      color: 'bg-indigo-50 text-indigo-600',
    },
  ]

  return (
    <div className="pt-14 md:pt-0">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
        <p className="text-muted-foreground">Welcome to the Youth Ministry admin panel.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4 mb-8">
        {stats.map((stat) => {
          const Icon = stat.icon
          return (
            <Link key={stat.label} href={stat.href}>
              <Card className={`hover:shadow-md transition-shadow cursor-pointer ${(stat as any).highlight ? 'ring-2 ring-amber-400' : ''}`}>
                <CardContent className="pt-6">
                  <div className={`w-12 h-12 rounded-lg ${stat.color} flex items-center justify-center mb-3`}>
                    <Icon className="h-6 w-6" />
                  </div>
                  <p className="text-2xl font-bold text-foreground">{stat.count}</p>
                  <p className="text-sm text-muted-foreground">{stat.label}</p>
                </CardContent>
              </Card>
            </Link>
          )
        })}
      </div>

      {/* Quick Actions */}
      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Common administrative tasks</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-2">
            <Link 
              href="/admin/announcements?action=new" 
              className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted transition-colors"
            >
              <Megaphone className="h-5 w-5 text-accent" />
              <span>Create New Announcement</span>
            </Link>
            <Link 
              href="/admin/albums?action=new" 
              className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted transition-colors"
            >
              <Image className="h-5 w-5 text-primary" />
              <span>Create New Album</span>
            </Link>
            <Link 
              href="/admin/videos?action=new" 
              className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted transition-colors"
            >
              <Video className="h-5 w-5 text-secondary-foreground" />
              <span>Add New Video</span>
            </Link>
            <Link
              href="/admin/prayers"
              className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted transition-colors"
            >
              <Heart className="h-5 w-5 text-accent" />
              <span>Manage Prayer Requests</span>
            </Link>
            <Link
              href="/admin/forms"
              className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted transition-colors"
            >
              <ClipboardList className="h-5 w-5 text-indigo-600" />
              <span>Create New Form</span>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Getting Started</CardTitle>
            <CardDescription>Tips for managing your youth ministry site</CardDescription>
          </CardHeader>
          <CardContent className="prose prose-sm text-muted-foreground">
            <ul className="space-y-2 list-disc pl-4">
              <li>Create announcements to keep your community informed about upcoming events.</li>
              <li>Upload photos from events to the gallery for members to view and share.</li>
              <li>Add YouTube or Facebook videos to showcase ministry activities.</li>
              <li>Monitor and respond to prayer requests to support your community.</li>
              <li>Manage user roles to give trusted members admin access.</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
