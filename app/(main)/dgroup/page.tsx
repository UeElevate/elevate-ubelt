'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { CheckCircle2, ChevronRight, ChevronLeft } from 'lucide-react'
import Link from 'next/link'

const CAMPUSES = [
  'UE Manila (University of the East)',
  'PLM (Pamantasan ng Lungsod ng Maynila)',
  'FEU (Far Eastern University)',
  'UST (University of Santo Tomas)',
  'CEU (Centro Escolar University)',
  'MLQ (Manuel L. Quezon University)',
  'PUP (Polytechnic University of the Philippines)',
  'TIP (Technological Institute of the Philippines)',
  'NU (National University)',
  'EAC (Emilio Aguinaldo College)',
  'Other',
]

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'ANYDAY']
const TIMES = ['Morning', 'Afternoon', 'Evening', 'ANYTIME']

type FormData = {
  ccf_attendee: string
  joining_through: string
  privacy_agreed: string
  first_name: string
  last_name: string
  mobile_number: string
  email: string
  facebook: string
  age: string
  gender: string
  campus: string
  day_choice_1: string
  time_choice_1: string
  day_choice_2: string
  time_choice_2: string
  mode_of_meeting: string
  language: string
  preferred_campus: string
  landmark: string
  is_first_time: string
  remarks: string
}

const EMPTY: FormData = {
  ccf_attendee: '', joining_through: '', privacy_agreed: '',
  first_name: '', last_name: '', mobile_number: '', email: '',
  facebook: '', age: '', gender: '', campus: '',
  day_choice_1: '', time_choice_1: '', day_choice_2: '', time_choice_2: '',
  mode_of_meeting: '', language: '', preferred_campus: '',
  landmark: '', is_first_time: '', remarks: '',
}

function RadioGroup({ name, options, value, onChange }: {
  name: string
  options: string[]
  value: string
  onChange: (v: string) => void
}) {
  return (
    <div className="space-y-2">
      {options.map(opt => (
        <label key={opt} className="flex items-start gap-3 cursor-pointer group">
          <div className={`mt-0.5 w-4 h-4 shrink-0 rounded-full border-2 transition-colors flex items-center justify-center ${
            value === opt ? 'border-primary bg-primary' : 'border-border group-hover:border-primary/50'
          }`}>
            {value === opt && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
          </div>
          <input type="radio" name={name} value={opt} checked={value === opt}
            onChange={() => onChange(opt)} className="sr-only" />
          <span className="text-sm text-foreground leading-relaxed">{opt}</span>
        </label>
      ))}
    </div>
  )
}

const STEPS = ['CCF Info', 'Personal Details', 'DGroup Preferences', 'Thank You']

export default function DGroupPage() {
  const [step, setStep] = useState(0)
  const [data, setData] = useState<FormData>(EMPTY)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const supabase = createClient()

  const set = (field: keyof FormData, value: string) =>
    setData(prev => ({ ...prev, [field]: value }))

  const validateStep = () => {
    if (step === 0) {
      if (!data.ccf_attendee) return 'Please select your church affiliation.'
      if (!data.joining_through) return 'Please select how you are joining.'
      if (!data.privacy_agreed) return 'Please respond to the privacy policy.'
      if (data.privacy_agreed === 'I do not agree') return 'You must agree to the privacy policy to continue.'
    }
    if (step === 1) {
      if (!data.first_name.trim()) return 'First name is required.'
      if (!data.last_name.trim()) return 'Last name is required.'
      if (!data.mobile_number.trim()) return 'Mobile number is required.'
      if (!data.email.trim()) return 'Email address is required.'
      if (!data.age) return 'Age is required.'
      if (!data.gender) return 'Gender is required.'
      if (!data.campus.trim()) return 'Campus is required.'
    }
    if (step === 2) {
      if (!data.day_choice_1) return 'Please select your first day preference.'
      if (!data.time_choice_1) return 'Please select your first time preference.'
      if (!data.mode_of_meeting) return 'Please select a mode of meeting.'
      if (!data.language) return 'Please select a language preference.'
      if (!data.preferred_campus.trim()) return 'Please indicate your preferred campus.'
      if (!data.is_first_time) return 'Please answer if this is your first time.'
    }
    return ''
  }

  const next = async () => {
    const err = validateStep()
    if (err) { setError(err); return }
    setError('')

    if (step === 2) {
      setSubmitting(true)
      const { error: dbError } = await supabase.from('dgroup_registrations').insert({
        ccf_attendee: data.ccf_attendee,
        joining_through: data.joining_through,
        privacy_agreed: data.privacy_agreed === 'I agree',
        first_name: data.first_name.trim(),
        last_name: data.last_name.trim(),
        mobile_number: data.mobile_number.trim(),
        email: data.email.trim(),
        facebook: data.facebook.trim() || null,
        age: parseInt(data.age) || null,
        gender: data.gender,
        campus: data.campus.trim(),
        day_choice_1: data.day_choice_1,
        time_choice_1: data.time_choice_1,
        day_choice_2: data.day_choice_2 || null,
        time_choice_2: data.time_choice_2 || null,
        mode_of_meeting: data.mode_of_meeting,
        language: data.language,
        preferred_campus: data.preferred_campus.trim(),
        landmark: data.landmark.trim() || null,
        is_first_time: data.is_first_time === 'Yes',
        remarks: data.remarks.trim() || null,
      })
      setSubmitting(false)
      if (dbError) { setError('Something went wrong. Please try again.'); return }
    }
    setStep(s => s + 1)
  }

  const back = () => { setError(''); setStep(s => s - 1) }

  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-50 to-white pt-20 pb-16 px-4">
      <div className="max-w-2xl mx-auto">

        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl sm:text-4xl font-black uppercase text-foreground tracking-tight">
            Join a DGroup
          </h1>
          <p className="text-muted-foreground mt-2">
            Connect with a CCF Discipleship Group and grow in faith together.
          </p>
        </div>

        {/* Step indicators */}
        {step < 3 && (
          <div className="flex items-center justify-center gap-1 mb-8">
            {STEPS.slice(0, 3).map((label, i) => (
              <div key={label} className="flex items-center gap-1">
                <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${
                  i === step
                    ? 'bg-primary text-white'
                    : i < step
                    ? 'bg-primary/20 text-primary'
                    : 'bg-muted text-muted-foreground'
                }`}>
                  <span>{i + 1}</span>
                  <span className="hidden sm:inline">{label}</span>
                </div>
                {i < 2 && <div className={`w-6 h-0.5 ${i < step ? 'bg-primary' : 'bg-border'}`} />}
              </div>
            ))}
          </div>
        )}

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-border p-6 sm:p-8">

          {/* ── STEP 0: CCF INFO ── */}
          {step === 0 && (
            <div className="space-y-8">
              <div>
                <h2 className="text-lg font-bold text-foreground mb-4">Are you a CCF attendee?</h2>
                <RadioGroup
                  name="ccf_attendee"
                  options={[
                    "Yes! It's my first time attending CCF",
                    "Yes! I've been attending CCF for quite some time now",
                    'No, I am from another Christian church',
                    'No, I am not attending CCF or any other church',
                  ]}
                  value={data.ccf_attendee}
                  onChange={v => set('ccf_attendee', v)}
                />
              </div>

              <div>
                <h2 className="text-lg font-bold text-foreground mb-4">
                  I am joining a CCF Discipleship group through
                </h2>
                <RadioGroup
                  name="joining_through"
                  options={['An Event', 'A Friend', 'Campus Movement', 'Elevate UBelt Social Media']}
                  value={data.joining_through}
                  onChange={v => set('joining_through', v)}
                />
              </div>

              <div className="bg-muted/40 rounded-xl p-4 text-sm text-muted-foreground leading-relaxed">
                <p className="font-semibold text-foreground mb-2">CCF Privacy Policy</p>
                <p>
                  Upon accomplishing this "JOIN A DGROUP" FORM, you agree and confirm that all information
                  that you have provided herein has been given by you with your express and informed consent
                  and may be handled by CCF in accordance with{' '}
                  <a href="https://www.ccf.org.ph/privacy-policy/" target="_blank" rel="noopener noreferrer"
                    className="text-primary underline">CCF's Privacy Policy</a>,
                  and should there be any concern with regard to the handling of your information, that you
                  will first bring the same to the attention of CCF for proper remediation at{' '}
                  <a href="mailto:privacy@ccf.org.ph" className="text-primary underline">privacy@ccf.org.ph</a>.
                </p>
                <div className="mt-4">
                  <RadioGroup
                    name="privacy_agreed"
                    options={['I agree', 'I do not agree']}
                    value={data.privacy_agreed}
                    onChange={v => set('privacy_agreed', v)}
                  />
                </div>
              </div>
            </div>
          )}

          {/* ── STEP 1: PERSONAL DETAILS ── */}
          {step === 1 && (
            <div className="space-y-5">
              <h2 className="text-lg font-bold text-foreground">Personal Details</h2>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>First Name <span className="text-destructive">*</span></Label>
                  <Input value={data.first_name} onChange={e => set('first_name', e.target.value)} placeholder="First Name" />
                </div>
                <div className="space-y-1.5">
                  <Label>Last Name <span className="text-destructive">*</span></Label>
                  <Input value={data.last_name} onChange={e => set('last_name', e.target.value)} placeholder="Last Name" />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label>Mobile Number <span className="text-destructive">*</span></Label>
                <Input value={data.mobile_number} onChange={e => set('mobile_number', e.target.value)} placeholder="+63XXXXXXXXXX" />
              </div>

              <div className="space-y-1.5">
                <Label>Email Address <span className="text-destructive">*</span></Label>
                <Input type="email" value={data.email} onChange={e => set('email', e.target.value)} placeholder="email@example.com" />
              </div>

              <div className="space-y-1.5">
                <Label>Facebook Name/Link <span className="text-muted-foreground font-normal text-xs">(Optional)</span></Label>
                <Input value={data.facebook} onChange={e => set('facebook', e.target.value)} placeholder="facebook.com/yourname" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>Age <span className="text-destructive">*</span></Label>
                  <Input type="number" min={1} max={100} value={data.age} onChange={e => set('age', e.target.value)} placeholder="e.g. 20" />
                </div>
                <div className="space-y-1.5">
                  <Label>Gender <span className="text-destructive">*</span></Label>
                  <div className="flex gap-4 pt-2">
                    <RadioGroup name="gender" options={['Male', 'Female']} value={data.gender} onChange={v => set('gender', v)} />
                  </div>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label>Campus <span className="text-destructive">*</span></Label>
                <Input value={data.campus} onChange={e => set('campus', e.target.value)} placeholder="Your university/campus" />
              </div>
            </div>
          )}

          {/* ── STEP 2: DGROUP PREFERENCES ── */}
          {step === 2 && (
            <div className="space-y-7">
              <h2 className="text-lg font-bold text-foreground">DGroup Preferences</h2>

              <div>
                <p className="font-semibold text-sm text-foreground mb-3">
                  Most available DAY & TIME for DGroup meeting
                </p>

                <div className="space-y-4">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-2">First Choice</p>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <Label className="text-xs">Day</Label>
                        <select value={data.day_choice_1} onChange={e => set('day_choice_1', e.target.value)}
                          className="w-full border border-border rounded-md px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring">
                          <option value="">Select day...</option>
                          {DAYS.map(d => <option key={d} value={d}>{d}</option>)}
                        </select>
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs">Time</Label>
                        <select value={data.time_choice_1} onChange={e => set('time_choice_1', e.target.value)}
                          className="w-full border border-border rounded-md px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring">
                          <option value="">Select time...</option>
                          {TIMES.map(t => <option key={t} value={t}>{t}</option>)}
                        </select>
                      </div>
                    </div>
                  </div>

                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-2">Second Choice <span className="text-xs text-muted-foreground">(Optional)</span></p>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <Label className="text-xs">Day</Label>
                        <select value={data.day_choice_2} onChange={e => set('day_choice_2', e.target.value)}
                          className="w-full border border-border rounded-md px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring">
                          <option value="">Select day...</option>
                          {DAYS.map(d => <option key={d} value={d}>{d}</option>)}
                        </select>
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs">Time</Label>
                        <select value={data.time_choice_2} onChange={e => set('time_choice_2', e.target.value)}
                          className="w-full border border-border rounded-md px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring">
                          <option value="">Select time...</option>
                          {TIMES.map(t => <option key={t} value={t}>{t}</option>)}
                        </select>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <Label className="mb-3 block font-semibold">Mode of Meeting <span className="text-destructive">*</span></Label>
                <RadioGroup
                  name="mode"
                  options={['Online', 'Physical', 'Hybrid (Online & Physical)']}
                  value={data.mode_of_meeting}
                  onChange={v => set('mode_of_meeting', v)}
                />
              </div>

              <div>
                <Label className="mb-3 block font-semibold">Language <span className="text-destructive">*</span></Label>
                <RadioGroup
                  name="language"
                  options={['Filipino/English', 'English Only', 'Filipino Only', 'Other']}
                  value={data.language}
                  onChange={v => set('language', v)}
                />
              </div>

              <div className="space-y-1.5">
                <Label>I would like to be connected to a DGroup in (Campus) <span className="text-destructive">*</span></Label>
                <select value={data.preferred_campus} onChange={e => set('preferred_campus', e.target.value)}
                  className="w-full border border-border rounded-md px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring">
                  <option value="">Select campus...</option>
                  {CAMPUSES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>

              <div className="space-y-1.5">
                <Label>Landmark/Area accessible to me <span className="text-muted-foreground font-normal text-xs">(Location for DGroup meeting)</span></Label>
                <Input value={data.landmark} onChange={e => set('landmark', e.target.value)} placeholder="e.g. Near Morayta, España Blvd..." />
              </div>

              <div>
                <Label className="mb-3 block font-semibold">Is it your first time to join a CCF DGroup? <span className="text-destructive">*</span></Label>
                <RadioGroup
                  name="is_first_time"
                  options={['Yes', 'No']}
                  value={data.is_first_time}
                  onChange={v => set('is_first_time', v)}
                />
              </div>

              <div className="space-y-1.5">
                <Label>
                  Please share with us any information that may help us in connecting you to a DGroup.{' '}
                  <span className="text-muted-foreground font-normal text-xs">(Not required)</span>
                </Label>
                <Textarea
                  value={data.remarks}
                  onChange={e => set('remarks', e.target.value)}
                  placeholder="Remarks/Comments"
                  rows={3}
                />
              </div>
            </div>
          )}

          {/* ── STEP 3: THANK YOU ── */}
          {step === 3 && (
            <div className="py-8 text-center">
              <CheckCircle2 className="h-16 w-16 text-green-500 mx-auto mb-4" />
              <h2 className="text-2xl font-black uppercase text-foreground mb-2">Thank You!</h2>
              <p className="text-muted-foreground max-w-sm mx-auto leading-relaxed">
                We've received your DGroup connection request. Our team will reach out to you soon. God bless!
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center mt-8">
                <Link href="/">
                  <Button variant="outline">Back to Home</Button>
                </Link>
                <Button onClick={() => { setData(EMPTY); setStep(0) }}>Submit Another</Button>
              </div>
            </div>
          )}

          {/* Error */}
          {error && (
            <p className="mt-4 text-sm text-destructive bg-destructive/10 rounded-lg px-4 py-2.5">{error}</p>
          )}

          {/* Navigation */}
          {step < 3 && (
            <div className="flex justify-between items-center mt-8 pt-6 border-t border-border">
              {step > 0 ? (
                <Button variant="outline" onClick={back} className="gap-1.5">
                  <ChevronLeft className="h-4 w-4" /> Back
                </Button>
              ) : (
                <div />
              )}
              <Button onClick={next} disabled={submitting} className="gap-1.5">
                {submitting ? 'Submitting...' : step === 2 ? 'Connect' : 'Next'}
                {!submitting && step < 2 && <ChevronRight className="h-4 w-4" />}
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
