'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, Megaphone, Image, Video, Heart, Menu, X, LogIn, User, Shield } from 'lucide-react'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import type { User as SupabaseUser } from '@supabase/supabase-js'

const navItems = [
  { href: '/', label: 'Home', icon: Home },
  { href: '/announcements', label: 'Announcements', icon: Megaphone },
  { href: '/gallery', label: 'Gallery', icon: Image },
  { href: '/videos', label: 'Videos', icon: Video },
  { href: '/prayer-wall', label: 'Prayer Wall', icon: Heart },
]

export function Navigation() {
  const pathname = usePathname()
  const [isOpen, setIsOpen] = useState(false)
  const [user, setUser] = useState<SupabaseUser | null>(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
      
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single()
        setIsAdmin(profile?.role === 'admin')
      }
    }
    getUser()

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
      if (!session?.user) {
        setIsAdmin(false)
      }
    })

    return () => subscription.unsubscribe()
  }, [supabase])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    setUser(null)
    setIsAdmin(false)
  }

  return (
    <>
      {/* Mobile Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-primary text-primary-foreground md:hidden">
        <div className="flex items-center justify-between px-4 h-14">
          <Link href="/" className="text-lg font-bold">
            Youth Ministry
          </Link>
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
          <nav className="absolute top-14 left-0 right-0 bg-primary border-t border-primary-foreground/20 shadow-lg">
            {navItems.map((item) => {
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
                      : 'hover:bg-primary-foreground/10'
                  }`}
                >
                  <Icon className="h-5 w-5" />
                  <span>{item.label}</span>
                </Link>
              )
            })}
            <div className="border-t border-primary-foreground/20 px-4 py-3">
              {user ? (
                <div className="flex flex-col gap-2">
                  {isAdmin && (
                    <Link
                      href="/admin"
                      onClick={() => setIsOpen(false)}
                      className="flex items-center gap-3 py-2 hover:bg-primary-foreground/10 rounded"
                    >
                      <Shield className="h-5 w-5" />
                      <span>Admin Dashboard</span>
                    </Link>
                  )}
                  <Link
                    href="/profile"
                    onClick={() => setIsOpen(false)}
                    className="flex items-center gap-3 py-2 hover:bg-primary-foreground/10 rounded"
                  >
                    <User className="h-5 w-5" />
                    <span>Profile</span>
                  </Link>
                  <Button 
                    variant="outline" 
                    onClick={handleSignOut}
                    className="w-full mt-2 border-primary-foreground/50 text-primary-foreground hover:bg-primary-foreground/10"
                  >
                    Sign Out
                  </Button>
                </div>
              ) : (
                <Link
                  href="/auth/login"
                  onClick={() => setIsOpen(false)}
                  className="flex items-center gap-3 py-2"
                >
                  <LogIn className="h-5 w-5" />
                  <span>Sign In</span>
                </Link>
              )}
            </div>
          </nav>
        )}
      </header>

      {/* Desktop Sidebar */}
      <aside className="hidden md:flex fixed left-0 top-0 bottom-0 w-64 bg-primary text-primary-foreground flex-col z-50">
        <div className="p-6 border-b border-primary-foreground/20">
          <Link href="/" className="text-xl font-bold">
            Youth Ministry
          </Link>
        </div>
        
        <nav className="flex-1 p-4 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                  isActive 
                    ? 'bg-secondary text-secondary-foreground' 
                    : 'hover:bg-primary-foreground/10'
                }`}
              >
                <Icon className="h-5 w-5" />
                <span>{item.label}</span>
              </Link>
            )
          })}
        </nav>

        <div className="p-4 border-t border-primary-foreground/20">
          {user ? (
            <div className="space-y-2">
              {isAdmin && (
                <Link
                  href="/admin"
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                    pathname.startsWith('/admin')
                      ? 'bg-secondary text-secondary-foreground'
                      : 'hover:bg-primary-foreground/10'
                  }`}
                >
                  <Shield className="h-5 w-5" />
                  <span>Admin</span>
                </Link>
              )}
              <Link
                href="/profile"
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                  pathname === '/profile'
                    ? 'bg-secondary text-secondary-foreground'
                    : 'hover:bg-primary-foreground/10'
                }`}
              >
                <User className="h-5 w-5" />
                <span>Profile</span>
              </Link>
              <Button 
                variant="outline" 
                onClick={handleSignOut}
                className="w-full border-primary-foreground/50 text-primary-foreground hover:bg-primary-foreground/10"
              >
                Sign Out
              </Button>
            </div>
          ) : (
            <Link
              href="/auth/login"
              className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-primary-foreground/10 transition-colors"
            >
              <LogIn className="h-5 w-5" />
              <span>Sign In</span>
            </Link>
          )}
        </div>
      </aside>

      {/* Mobile Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-card border-t border-border md:hidden z-50">
        <div className="flex justify-around items-center h-16">
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex flex-col items-center justify-center flex-1 h-full transition-colors ${
                  isActive 
                    ? 'text-primary' 
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <Icon className="h-5 w-5" />
                <span className="text-xs mt-1">{item.label}</span>
              </Link>
            )
          })}
        </div>
      </nav>
    </>
  )
}
