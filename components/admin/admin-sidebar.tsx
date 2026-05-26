'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import {
  LayoutDashboard,
  Megaphone,
  Image,
  Video,
  Heart,
  Users,
  Settings,
  Home,
  Menu,
  X,
  LogOut,
  ShieldCheck,
  ClipboardList,
} from 'lucide-react'
import { useState } from 'react'
import { Button } from '@/components/ui/button'

const adminNavItems = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/announcements', label: 'Announcements', icon: Megaphone },
  { href: '/admin/albums', label: 'Photo Albums', icon: Image },
  { href: '/admin/videos', label: 'Videos', icon: Video },
  { href: '/admin/prayers', label: 'Prayer Requests', icon: Heart },
  { href: '/admin/dgroups', label: 'Discipleship Groups', icon: Users },
  { href: '/admin/forms', label: 'Forms', icon: ClipboardList },
  { href: '/admin/users', label: 'Users', icon: Users },
  { href: '/admin/admin-requests', label: 'Admin Requests', icon: ShieldCheck },
  { href: '/admin/settings', label: 'Settings', icon: Settings },
]

export function AdminSidebar() {
  const pathname = usePathname()
  const [isOpen, setIsOpen] = useState(false)
  const supabase = createClient()

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    window.location.href = '/'
  }

  return (
    <>
      {/* Mobile Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-foreground text-background md:hidden">
        <div className="flex items-center justify-between px-4 h-14">
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold">Admin Panel</span>
            <Link
              href="/"
              className="text-xs font-semibold px-3 py-1 rounded-full bg-background/15 hover:bg-background/25 transition-colors"
            >
              Main Site
            </Link>
          </div>
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="p-2"
            aria-label="Toggle menu"
          >
            {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
        
        {/* Mobile Menu */}
        {isOpen && (
          <nav className="absolute top-14 left-0 right-0 bg-foreground border-t border-background/20 shadow-lg max-h-[calc(100vh-3.5rem)] overflow-y-auto">
            {adminNavItems.map((item) => {
              const Icon = item.icon
              const isActive = pathname === item.href
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setIsOpen(false)}
                  className={`flex items-center gap-3 px-4 py-3 transition-colors ${
                    isActive 
                      ? 'bg-secondary text-secondary-foreground' 
                      : 'hover:bg-background/10'
                  }`}
                >
                  <Icon className="h-5 w-5" />
                  <span>{item.label}</span>
                </Link>
              )
            })}
            <div className="border-t border-background/20 p-4 space-y-2">
              <Link
                href="/"
                onClick={() => setIsOpen(false)}
                className="flex items-center gap-3 px-4 py-2 hover:bg-background/10 rounded"
              >
                <Home className="h-5 w-5" />
                <span>Back to Site</span>
              </Link>
              <button
                onClick={handleSignOut}
                className="flex items-center gap-3 w-full px-4 py-2.5 rounded-lg border border-white/20 text-white text-sm font-medium hover:bg-white/10 transition-colors"
              >
                <LogOut className="h-4 w-4" />
                Sign Out
              </button>
            </div>
          </nav>
        )}
      </header>

      {/* Desktop Sidebar */}
      <aside className="hidden md:flex fixed left-0 top-0 bottom-0 w-64 bg-foreground text-background flex-col z-50">
        <div className="p-4 border-b border-background/20">
          <img src="/elevate_ubelt_logo.png" alt="Elevate UBelt" className="h-8 w-auto mb-3 brightness-0 invert" />
          <span className="block text-center py-2 text-xs font-bold rounded-lg bg-background/10 text-background/80">
            Admin Panel
          </span>
        </div>
        
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {adminNavItems.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                  isActive 
                    ? 'bg-secondary text-secondary-foreground' 
                    : 'hover:bg-background/10'
                }`}
              >
                <Icon className="h-5 w-5" />
                <span>{item.label}</span>
              </Link>
            )
          })}
        </nav>

        <div className="p-4 border-t border-background/20 space-y-2">
          <Link
            href="/"
            className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-background/10 transition-colors"
          >
            <Home className="h-5 w-5" />
            <span>Back to Site</span>
          </Link>
          <button
            onClick={handleSignOut}
            className="flex items-center gap-3 w-full px-4 py-3 rounded-lg border border-white/20 text-white text-sm font-medium hover:bg-white/10 transition-colors"
          >
            <LogOut className="h-5 w-5" />
            Sign Out
          </button>
        </div>
      </aside>
    </>
  )
}
