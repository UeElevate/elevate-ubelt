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
  LogOut
} from 'lucide-react'
import { useState } from 'react'
import { Button } from '@/components/ui/button'

const adminNavItems = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/announcements', label: 'Announcements', icon: Megaphone },
  { href: '/admin/albums', label: 'Photo Albums', icon: Image },
  { href: '/admin/videos', label: 'Videos', icon: Video },
  { href: '/admin/prayers', label: 'Prayer Requests', icon: Heart },
  { href: '/admin/users', label: 'Users', icon: Users },
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
          <span className="text-lg font-bold">Admin Panel</span>
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
              <Button 
                variant="outline" 
                onClick={handleSignOut}
                className="w-full border-background/50 text-background hover:bg-background/10"
              >
                <LogOut className="mr-2 h-4 w-4" />
                Sign Out
              </Button>
            </div>
          </nav>
        )}
      </header>

      {/* Desktop Sidebar */}
      <aside className="hidden md:flex fixed left-0 top-0 bottom-0 w-64 bg-foreground text-background flex-col z-50">
        <div className="p-6 border-b border-background/20">
          <h1 className="text-xl font-bold">Admin Panel</h1>
          <p className="text-sm text-background/60">Youth Ministry</p>
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
          <Button 
            variant="outline" 
            onClick={handleSignOut}
            className="w-full border-background/50 text-background hover:bg-background/10"
          >
            <LogOut className="mr-2 h-4 w-4" />
            Sign Out
          </Button>
        </div>
      </aside>
    </>
  )
}
