export type DGroupRole = 'leader' | 'member' | 'none' | 'missionary'

export interface Profile {
  id: string
  full_name: string | null
  email: string | null
  contact_number: string | null
  dgroup_role: DGroupRole | null
  campus: string | null
  ministry: string | null
  birthday: string | null
  cell_group: string | null
  role: 'user' | 'admin'
  requested_admin: boolean
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface Announcement {
  id: string
  title: string
  description: string
  content: string | null
  image_url: string | null
  category: 'event' | 'reminder' | 'worship' | 'general' | 'calendar'
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

export type PrayerVisibility = 'everyone' | 'leaders' | 'members' | 'dgroup' | 'missionary'

export interface PrayerRequest {
  id: string
  name: string | null
  request: string
  is_public: boolean
  is_anonymous: boolean
  visibility: PrayerVisibility
  prayer_count: number
  is_answered: boolean
  admin_reply: string | null
  user_id: string | null
  created_at: string
}

export type FormFieldType = 'text' | 'textarea' | 'email' | 'number' | 'select' | 'radio' | 'checkbox' | 'date'

export interface Form {
  id: string
  title: string
  description: string | null
  is_active: boolean
  created_by: string | null
  created_at: string
}

export interface FormField {
  id: string
  form_id: string
  label: string
  field_type: FormFieldType
  options: string[] | null
  is_required: boolean
  placeholder: string | null
  display_order: number
}

export interface FormSubmission {
  id: string
  form_id: string
  user_id: string | null
  submitted_data: Record<string, string | boolean>
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
