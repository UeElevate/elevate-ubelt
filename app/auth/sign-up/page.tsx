'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import type { DGroupRole } from '@/lib/types'

const DGROUP_ROLES: { value: DGroupRole; label: string }[] = [
  { value: 'leader',     label: 'DGroup Leader' },
  { value: 'member',     label: 'DGroup Member' },
  { value: 'none',       label: 'Not part of a DGroup yet' },
  { value: 'missionary', label: 'Campus Missionary' },
]

const CAMPUSES = [
  'UST',
  'UE',
  'FEU',
  'NU',
  'NTC',
  'CEU',
  'TIP',
  'AU',
  'STI',
  'PUP',
]

const MINISTRIES = [
  'Worship',
  'Prayer',
  'Media & Tech',
  'Ushering & Hospitality',
  'Outreach',
  'Discipleship',
  'Campus Ministry',
  'Others',
]

function ElevateLogo() {
  return (
    <div className="flex justify-center mb-8">
      <img src="/elevate_ubelt_logo.png" alt="Elevate UBelt" className="h-16 w-auto" />
    </div>
  )
}

function Field({
  id, label, type = 'text', placeholder, value, onChange, required = false,
}: {
  id: string
  label: string
  type?: string
  placeholder?: string
  value: string
  onChange: (v: string) => void
  required?: boolean
}) {
  return (
    <div>
      <label htmlFor={id} className="block text-xs font-semibold text-foreground mb-1.5">
        {label}
      </label>
      <input
        id={id}
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={e => onChange(e.target.value)}
        required={required}
        className="w-full border border-border rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent/30 bg-muted/20"
      />
    </div>
  )
}

export default function SignUpPage() {
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [contact, setContact] = useState('')
  const [dgroupRole, setDgroupRole] = useState<DGroupRole | ''>('')
  const [campus, setCampus] = useState('')
  const [ministry, setMinistry] = useState('')
  const [password, setPassword] = useState('')
  const [agreed, setAgreed] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!agreed) { setError('Please agree to the Terms & Conditions.'); return }
    if (!dgroupRole) { setError('Please select your DGroup role.'); return }
    if (!campus) { setError('Please select your campus.'); return }

    setIsLoading(true)
    setError(null)

    const { error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
        data: {
          full_name: fullName,
          contact_number: contact,
          dgroup_role: dgroupRole,
          campus,
          ministry,
        },
      },
    })

    if (signUpError) {
      setError(signUpError.message)
      setIsLoading(false)
      return
    }

    router.push('/auth/sign-up-success')
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4 py-10"
      style={{ background: 'linear-gradient(170deg, #FF8C00 0%, #FF6D1B 30%, #C45000 55%, #0b3a7a 80%, #061e3d 100%)' }}
    >
      <div className="w-full max-w-sm bg-white rounded-3xl shadow-2xl px-8 py-10">
        <ElevateLogo />

        <form onSubmit={handleSignUp} className="space-y-4">
          {error && (
            <div className="p-3 text-xs text-destructive bg-destructive/10 rounded-lg text-center">
              {error}
            </div>
          )}

          <Field
            id="fullName"
            label="Full Name"
            placeholder="Type your full name..."
            value={fullName}
            onChange={setFullName}
            required
          />

          <Field
            id="email"
            label="Email"
            type="email"
            placeholder="Type your email..."
            value={email}
            onChange={setEmail}
            required
          />

          <Field
            id="contact"
            label="Contact Number"
            type="tel"
            placeholder="+63 9XX XXX XXXX"
            value={contact}
            onChange={setContact}
          />

          {/* DGroup Role */}
          <div>
            <p className="text-xs font-semibold text-foreground mb-2">I am a...</p>
            <div className="space-y-2">
              {DGROUP_ROLES.map(({ value, label }) => (
                <label
                  key={value}
                  className={`flex items-center gap-3 px-4 py-2.5 rounded-xl border cursor-pointer transition-all ${
                    dgroupRole === value
                      ? 'border-foreground bg-foreground/5'
                      : 'border-border hover:border-muted-foreground/40'
                  }`}
                >
                  <input
                    type="radio"
                    name="dgroup_role"
                    value={value}
                    checked={dgroupRole === value}
                    onChange={() => setDgroupRole(value)}
                    className="shrink-0"
                  />
                  <span className={`text-sm font-medium ${dgroupRole === value ? 'text-foreground' : 'text-muted-foreground'}`}>
                    {label}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* Campus */}
          <div>
            <label htmlFor="campus" className="block text-xs font-semibold text-foreground mb-1.5">
              Campus
            </label>
            <select
              id="campus"
              value={campus}
              onChange={e => setCampus(e.target.value)}
              className="w-full border border-border rounded-xl px-4 py-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-accent/30 bg-muted/20 appearance-none"
            >
              <option value="" disabled>Select your campus...</option>
              {CAMPUSES.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          {/* Ministry */}
          <div>
            <label htmlFor="ministry" className="block text-xs font-semibold text-foreground mb-1.5">
              What ministry are you in?
            </label>
            <select
              id="ministry"
              value={ministry}
              onChange={e => setMinistry(e.target.value)}
              className="w-full border border-border rounded-xl px-4 py-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-accent/30 bg-muted/20 appearance-none"
            >
              <option value="">Select your ministry (optional)...</option>
              {MINISTRIES.map(m => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          </div>

          <Field
            id="password"
            label="Password"
            type="password"
            placeholder="Create a password (min 6 characters)"
            value={password}
            onChange={setPassword}
            required
          />

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
              {isLoading ? 'Creating account...' : 'CONFIRM'}
            </button>
          </div>
        </form>

        {/* Sign in link */}
        <div className="mt-5 text-center">
          <Link
            href="/auth/login"
            className="text-sm font-semibold text-foreground hover:text-accent transition-colors"
          >
            Already have an account? Sign In
          </Link>
        </div>
      </div>
    </div>
  )
}
