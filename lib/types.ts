export interface Profile {
  id: string
  full_name: string | null
  email: string | null
  birthday: string | null
  cell_group: string | null
  role: 'user' | 'admin'
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface Announcement {
  id: string
  title: string
  description: string
  content: string | null
  category: 'event' | 'reminder' | 'worship' | 'general'
  is_pinned: boolean
  created_by: string | null
  created_at: string
  updated_at: string
}

export interface Album {
  id: string
  name: string
  description: string | null
  category: 'event' | 'marketing'
  created_at: string
  photos?: Photo[]
}

export interface Photo {
  id: string
  album_id: string
  url: string
  caption: string | null
  display_order: number
  created_at: string
}

export interface Video {
  id: string
  title: string
  description: string | null
  thumbnail_url: string | null
  video_url: string
  video_type: 'youtube' | 'facebook' | 'upload'
  category: 'event' | 'marketing'
  created_at: string
}

export interface PrayerRequest {
  id: string
  name: string | null
  request: string
  is_public: boolean
  is_anonymous: boolean
  prayer_count: number
  is_answered: boolean
  admin_reply: string | null
  user_id: string | null
  created_at: string
}

export interface SiteSettings {
  id: string
  church_name: string
  logo_url: string | null
  contact_email: string | null
  contact_phone: string | null
  address: string | null
  facebook_url: string | null
  instagram_url: string | null
  youtube_url: string | null
  tiktok_url: string | null
  updated_at: string
}
