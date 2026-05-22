'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { Shield } from 'lucide-react'

export default function AdminLoginPage() {
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [error, setError]       = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const router  = useRouter()
  const supabase = createClient()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password })

    if (signInError) {
      setError(signInError.message)
      setIsLoading(false)
      return
    }

    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

      if (profile?.role === 'admin') {
        router.push('/admin')
        router.refresh()
        return
      }

      setError('You do not have admin access.')
      await supabase.auth.signOut()
    }

    setIsLoading(false)
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4"
      style={{ background: 'linear-gradient(160deg, #1a1a2e 0%, #16213e 40%, #0f3460 70%, #0b3a7a 100%)' }}
    >
      <div className="w-full max-w-sm">

        {/* Logo + heading */}
        <div className="flex flex-col items-center mb-8">
          <img src="/elevate_ubelt_logo.png" alt="Elevate UBelt" className="h-14 w-auto mb-6 brightness-0 invert" />
          <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 border border-white/20 mb-2">
            <Shield className="h-4 w-4 text-white" />
            <span className="text-white text-sm font-bold tracking-wide">Admin Access</span>
          </div>
          <p className="text-white/40 text-xs text-center">Restricted to authorized personnel only</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-3xl shadow-2xl px-8 py-10">
          <h2 className="text-xl font-black text-foreground mb-6 text-center">Sign in to Dashboard</h2>

          <form onSubmit={handleLogin} className="space-y-4">
            {error && (
              <div className="p-3 text-xs text-destructive bg-destructive/10 rounded-lg text-center">
                {error}
              </div>
            )}

            <div>
              <label htmlFor="email" className="block text-xs font-semibold text-foreground mb-1.5">
                Email
              </label>
              <input
                id="email"
                type="email"
                placeholder="Admin email..."
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                className="w-full border border-border rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent/30 bg-muted/20"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-xs font-semibold text-foreground mb-1.5">
                Password
              </label>
              <input
                id="password"
                type="password"
                placeholder="Password..."
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                className="w-full border border-border rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent/30 bg-muted/20"
              />
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-2.5 rounded-full bg-foreground text-white text-sm font-bold uppercase tracking-widest hover:bg-foreground/90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                <Shield className="h-4 w-4" />
                {isLoading ? 'Signing in...' : 'Enter Dashboard'}
              </button>
            </div>
          </form>
        </div>

        {/* Links */}
        <div className="mt-5 flex flex-col items-center gap-3">
          <Link
            href="/auth/sign-up"
            className="text-sm font-semibold text-white hover:text-white/80 transition-colors"
          >
            Create an Account
          </Link>
          <Link
            href="/auth/login"
            className="text-sm text-white/40 hover:text-white/70 transition-colors"
          >
            ← Back to regular login
          </Link>
        </div>

      </div>
    </div>
  )
}
