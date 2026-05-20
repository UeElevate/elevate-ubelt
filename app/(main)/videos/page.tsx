import { createClient } from '@/lib/supabase/server'
import { Card } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Video as VideoIcon, Play } from 'lucide-react'
import type { Video } from '@/lib/types'

function getYouTubeEmbedUrl(url: string): string | null {
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/
  const match = url.match(regExp)
  return match && match[2].length === 11
    ? `https://www.youtube.com/embed/${match[2]}`
    : null
}

function getFacebookEmbedUrl(url: string): string | null {
  return `https://www.facebook.com/plugins/video.php?href=${encodeURIComponent(url)}&show_text=false&width=560`
}

function VideoCard({ video }: { video: Video }) {
  const embedUrl = video.video_type === 'youtube' 
    ? getYouTubeEmbedUrl(video.video_url)
    : video.video_type === 'facebook'
    ? getFacebookEmbedUrl(video.video_url)
    : null

  return (
    <Card className="overflow-hidden">
      <div className="aspect-video bg-muted relative">
        {embedUrl ? (
          <iframe
            src={embedUrl}
            title={video.title}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            className="w-full h-full"
          />
        ) : video.thumbnail_url ? (
          <a href={video.video_url} target="_blank" rel="noopener noreferrer" className="block w-full h-full relative group">
            <img
              src={video.thumbnail_url}
              alt={video.title}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center group-hover:bg-black/50 transition-colors">
              <div className="w-16 h-16 rounded-full bg-white/90 flex items-center justify-center">
                <Play className="h-8 w-8 text-primary ml-1" fill="currentColor" />
              </div>
            </div>
          </a>
        ) : (
          <a href={video.video_url} target="_blank" rel="noopener noreferrer" className="w-full h-full flex items-center justify-center group">
            <div className="flex flex-col items-center">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                <Play className="h-8 w-8 text-primary ml-1" fill="currentColor" />
              </div>
              <span className="mt-2 text-sm text-muted-foreground">Click to watch</span>
            </div>
          </a>
        )}
      </div>
      <div className="p-4">
        <h3 className="font-semibold text-foreground line-clamp-2">{video.title}</h3>
        {video.description && (
          <p className="text-sm text-muted-foreground mt-2 line-clamp-2">{video.description}</p>
        )}
        <p className="text-xs text-muted-foreground mt-2">
          {new Date(video.created_at).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          })}
        </p>
      </div>
    </Card>
  )
}

export default async function VideosPage() {
  const supabase = await createClient()
  
  const { data: videos } = await supabase
    .from('videos')
    .select('*')
    .order('created_at', { ascending: false })

  const eventVideos = videos?.filter(v => v.category === 'event') || []
  const marketingVideos = videos?.filter(v => v.category === 'marketing') || []

  const VideoGrid = ({ videos }: { videos: Video[] }) => (
    videos.length > 0 ? (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {videos.map((video) => (
          <VideoCard key={video.id} video={video} />
        ))}
      </div>
    ) : (
      <Card className="p-12 text-center">
        <VideoIcon className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
        <h2 className="text-xl font-semibold text-foreground mb-2">No Videos Yet</h2>
        <p className="text-muted-foreground">
          Check back soon for videos from our events and activities.
        </p>
      </Card>
    )
  )

  return (
    <div className="p-4 md:p-6 lg:p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-2">Videos</h1>
        <p className="text-muted-foreground">Watch videos from our youth ministry events and more.</p>
      </div>

      {/* Videos with Tabs */}
      <Tabs defaultValue="all" className="w-full">
        <TabsList className="mb-6">
          <TabsTrigger value="all">All Videos</TabsTrigger>
          <TabsTrigger value="events">Events</TabsTrigger>
          <TabsTrigger value="marketing">Marketing</TabsTrigger>
        </TabsList>
        
        <TabsContent value="all">
          <VideoGrid videos={(videos || []) as Video[]} />
        </TabsContent>
        
        <TabsContent value="events">
          <VideoGrid videos={eventVideos as Video[]} />
        </TabsContent>
        
        <TabsContent value="marketing">
          <VideoGrid videos={marketingVideos as Video[]} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
