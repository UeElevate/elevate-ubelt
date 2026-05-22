'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { Shield } from 'lucide-react'

export default function LoginPage() {
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [agreed, setAgreed]     = useState(false)
  const [error, setError]       = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const router  = useRouter()
  const supabase = createClient()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!agreed) { setError('Please agree to the Terms & Conditions.'); return }
    setIsLoading(true)
    setError(null)

    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password })

    if (signInError) {
      setError(signInError.message)
      setIsLoading(false)
      return
    }

    router.push('/')
    router.refresh()
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4"
      style={{ background: 'linear-gradient(170deg, #FF8C00 0%, #FF6D1B 30%, #C45000 55%, #0b3a7a 80%, #061e3d 100%)' }}
    >
      <div className="w-full max-w-sm bg-white rounded-3xl shadow-2xl px-8 py-10">
        <div className="flex justify-center mb-8">
          <img src="/elevate_ubelt_logo.png" alt="Elevate UBelt" className="h-16 w-auto" />
        </div>

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
              placeholder="Type your email..."
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
              placeholder="Type your password..."
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              className="w-full border border-border rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent/30 bg-muted/20"
            />
          </div>

          {/* Terms */}
          <div className="flex items-start gap-2 pt-1">
            <input
              type="checkbox"
              id="agree"
              checked={agreed}
              onChange={e => setAgreed(e.target.checked)}
              className="mt-0.5 rounded shrink-0"
            />
            <label htmlFor="agree" className="text-xs text-muted-foreground leading-relaxed cursor-pointer select-none">
              I agree to the{' '}
              <span className="text-foreground font-semibold">Terms &amp; Conditions</span>
              {' '}and{' '}
              <span className="text-foreground font-semibold">Privacy Policy</span>
            </label>
          </div>

          {/* Submit */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-2.5 rounded-full border-2 border-foreground text-sm font-bold uppercase tracking-widest text-foreground hover:bg-foreground hover:text-white transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Signing in...' : 'CONFIRM'}
            </button>
          </div>
        </form>

        {/* Sign up link */}
        <div className="mt-5 text-center">
          <Link
            href="/auth/sign-up"
            className="text-sm font-semibold text-foreground hover:text-accent transition-colors"
          >
            Create an Account
          </Link>
        </div>

        {/* Admin dashboard button */}
        <div className="mt-4 pt-4 border-t border-border">
          <Link
            href="/auth/admin-login"
            className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl bg-foreground text-white text-sm font-bold tracking-wide hover:bg-foreground/90 transition-colors"
          >
            <Shield className="h-4 w-4" />
            Admin Dashboard
          </Link>
        </div>
      </div>
    </div>
  )
}
