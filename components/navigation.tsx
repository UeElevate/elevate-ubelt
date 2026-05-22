'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Menu, X, LogIn, User, Shield } from 'lucide-react'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import type { User as SupabaseUser } from '@supabase/supabase-js'

const navItems = [
  { href: '/', label: 'Home' },
  { href: '/announcements', label: 'Announcements' },
  { href: '/gallery', label: 'Photos' },
  { href: '/videos', label: 'Videos' },
  { href: '/prayer-wall', label: 'Prayer Wall' },
]

export function Navigation() {
  const pathname = usePathname()
  const [isOpen, setIsOpen] = useState(false)
  const [user, setUser] = useState<SupabaseUser | null>(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [scrolled, setScrolled] = useState(false)
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
      if (!session?.user) setIsAdmin(false)
    })

    const handleScroll = () => setScrolled(window.scrollY > 8)
    window.addEventListener('scroll', handleScroll)

    return () => {
      subscription.unsubscribe()
      window.removeEventListener('scroll', handleScroll)
    }
  }, [supabase])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    setUser(null)
    setIsAdmin(false)
    setIsOpen(false)
  }

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-200 ${
        scrolled ? 'bg-white/95 backdrop-blur-sm shadow-sm' : 'bg-white'
      }`}
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center shrink-0">
          <img src="/elevate_ubelt_logo.png" alt="Elevate UBelt" className="h-8 w-auto" />
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-0.5">
          {navItems.map((item) => {
            const isActive = pathname === item.href
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                  isActive
                    ? 'text-primary'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                }`}
              >
                {item.label}
              </Link>
            )
          })}
        </nav>

        {/* Desktop Auth */}
        <div className="hidden md:flex items-center gap-2 shrink-0">
          {user ? (
            <>
              {isAdmin && (
                <Link href="/admin">
                  <Button variant="ghost" size="sm" className="gap-1.5">
                    <Shield className="h-3.5 w-3.5" />
                    Admin
                  </Button>
                </Link>
              )}
              <Link href="/profile">
                <Button variant="ghost" size="sm" className="gap-1.5">
                  <User className="h-3.5 w-3.5" />
                  Profile
                </Button>
              </Link>
              <Button variant="outline" size="sm" onClick={handleSignOut}>
                Sign Out
              </Button>
            </>
          ) : (
            <Link href="/auth/login">
              <Button variant="outline" size="sm">
                Sign In
              </Button>
            </Link>
          )}
        </div>

        {/* Mobile Hamburger */}
        <button
          className="md:hidden p-2 rounded-lg hover:bg-muted/50 transition-colors"
          onClick={() => setIsOpen(!isOpen)}
          aria-label="Toggle menu"
        >
          {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* Mobile Dropdown */}
      {isOpen && (
        <div className="md:hidden bg-white border-t border-border shadow-lg">
          <nav className="px-3 py-3 space-y-0.5">
            {navItems.map((item) => {
              const isActive = pathname === item.href
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setIsOpen(false)}
                  className={`flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-colors ${
                    isActive
                      ? 'text-primary bg-primary/5'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                  }`}
                >
                  {item.label}
                </Link>
              )
            })}
            <div className="border-t border-border mt-2 pt-2 space-y-0.5">
              {user ? (
                <>
                  {isAdmin && (
                    <Link
                      href="/admin"
                      onClick={() => setIsOpen(false)}
                      className="flex items-center gap-2 px-3 py-2.5 text-sm font-medium text-muted-foreground hover:text-foreground rounded-lg"
                    >
                      <Shield className="h-4 w-4" />
                      Admin Dashboard
                    </Link>
                  )}
                  <Link
                    href="/profile"
                    onClick={() => setIsOpen(false)}
                    className="flex items-center gap-2 px-3 py-2.5 text-sm font-medium text-muted-foreground hover:text-foreground rounded-lg"
                  >
                    <User className="h-4 w-4" />
                    Profile
                  </Link>
                  <button
                    onClick={handleSignOut}
                    className="flex items-center w-full px-3 py-2.5 text-sm font-medium text-destructive hover:bg-destructive/5 rounded-lg transition-colors"
                  >
                    Sign Out
                  </button>
                </>
              ) : (
                <Link
                  href="/auth/login"
                  onClick={() => setIsOpen(false)}
                  className="flex items-center gap-2 px-3 py-2.5 text-sm font-medium text-muted-foreground hover:text-foreground rounded-lg"
                >
                  <LogIn className="h-4 w-4" />
                  Sign In
                </Link>
              )}
            </div>
          </nav>
        </div>
      )}
    </header>
  )
}
