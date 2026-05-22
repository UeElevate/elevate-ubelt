'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { ClipboardList, CheckCircle2 } from 'lucide-react'
import type { Form, FormField } from '@/lib/types'

export default function FormsPage() {
  const [forms, setForms] = useState<Form[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedForm, setSelectedForm] = useState<Form | null>(null)
  const [formFields, setFormFields] = useState<FormField[]>([])
  const [loadingFields, setLoadingFields] = useState(false)
  const [answers, setAnswers] = useState<Record<string, string | boolean>>({})
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    const fetchForms = async () => {
      const { data } = await supabase
        .from('forms')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false })
      if (data) setForms(data as Form[])
      setIsLoading(false)
    }
    fetchForms()
  }, [])

  const openForm = async (form: Form) => {
    setSelectedForm(form)
    setAnswers({})
    setSubmitted(false)
    setDialogOpen(true)
    setLoadingFields(true)
    const { data } = await supabase
      .from('form_fields')
      .select('*')
      .eq('form_id', form.id)
      .order('display_order', { ascending: true })
    if (data) setFormFields(data as FormField[])
    setLoadingFields(false)
  }

  const handleSubmit = async () => {
    if (!selectedForm) return
    for (const field of formFields) {
      if (field.is_required) {
        const val = answers[field.id]
        if (val === undefined || val === null || val === '' || val === false) {
          alert(`"${field.label}" is required.`)
          return
        }
      }
    }
    setSubmitting(true)
    const { data: { user } } = await supabase.auth.getUser()
    await supabase.from('form_submissions').insert({
      form_id: selectedForm.id,
      user_id: user?.id ?? null,
      submitted_data: answers,
    })
    setSubmitted(true)
    setSubmitting(false)
  }

  const update = (fieldId: string, val: string | boolean) =>
    setAnswers(prev => ({ ...prev, [fieldId]: val }))

  const renderField = (field: FormField) => {
    const htmlId = `f_${field.id}`
    const strVal = (answers[field.id] as string) ?? ''

    switch (field.field_type) {
      case 'textarea':
        return (
          <Textarea
            id={htmlId}
            value={strVal}
            onChange={e => update(field.id, e.target.value)}
            placeholder={field.placeholder ?? ''}
            rows={3}
          />
        )
      case 'email':
        return (
          <Input
            id={htmlId}
            type="email"
            value={strVal}
            onChange={e => update(field.id, e.target.value)}
            placeholder={field.placeholder ?? ''}
          />
        )
      case 'number':
        return (
          <Input
            id={htmlId}
            type="number"
            value={strVal}
            onChange={e => update(field.id, e.target.value)}
            placeholder={field.placeholder ?? ''}
          />
        )
      case 'date':
        return (
          <Input
            id={htmlId}
            type="date"
            value={strVal}
            onChange={e => update(field.id, e.target.value)}
          />
        )
      case 'select':
        return (
          <select
            id={htmlId}
            value={strVal}
            onChange={e => update(field.id, e.target.value)}
            className="w-full border border-border rounded-md px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="">Select an option...</option>
            {(field.options ?? []).map(opt => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>
        )
      case 'radio':
        return (
          <div className="space-y-2">
            {(field.options ?? []).map(opt => (
              <label key={opt} className="flex items-center gap-2.5 cursor-pointer">
                <input
                  type="radio"
                  name={htmlId}
                  value={opt}
                  checked={strVal === opt}
                  onChange={() => update(field.id, opt)}
                  className="accent-primary"
                />
                <span className="text-sm">{opt}</span>
              </label>
            ))}
          </div>
        )
      case 'checkbox':
        return (
          <label className="flex items-center gap-2.5 cursor-pointer">
            <input
              type="checkbox"
              checked={(answers[field.id] as boolean) ?? false}
              onChange={e => update(field.id, e.target.checked)}
              className="accent-primary h-4 w-4"
            />
            <span className="text-sm text-muted-foreground">Yes</span>
          </label>
        )
      default:
        return (
          <Input
            id={htmlId}
            type="text"
            value={strVal}
            onChange={e => update(field.id, e.target.value)}
            placeholder={field.placeholder ?? ''}
          />
        )
    }
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-10 pt-24">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground">Forms</h1>
        <p className="text-muted-foreground mt-1">Fill out forms shared by the ministry.</p>
      </div>

      {isLoading ? (
        <div className="grid sm:grid-cols-2 gap-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="rounded-xl border border-border p-6 animate-pulse">
              <div className="h-5 bg-muted rounded w-2/3 mb-3" />
              <div className="h-4 bg-muted rounded w-full mb-1.5" />
              <div className="h-4 bg-muted rounded w-3/4" />
            </div>
          ))}
        </div>
      ) : forms.length === 0 ? (
        <div className="text-center py-20">
          <ClipboardList className="h-14 w-14 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-foreground mb-1">No forms available</h3>
          <p className="text-muted-foreground">Check back later for forms shared by the ministry.</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 gap-4">
          {forms.map(form => (
            <div
              key={form.id}
              className="rounded-xl border border-border p-6 hover:shadow-md transition-shadow bg-card"
            >
              <div className="flex items-start gap-3 mb-4">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <ClipboardList className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">{form.title}</h3>
                  {form.description && (
                    <p className="text-sm text-muted-foreground mt-0.5">{form.description}</p>
                  )}
                </div>
              </div>
              <Button onClick={() => openForm(form)} className="w-full" size="sm">
                Fill Out Form
              </Button>
            </div>
          ))}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={open => { if (!open) setDialogOpen(false) }}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selectedForm?.title}</DialogTitle>
            {selectedForm?.description && (
              <p className="text-sm text-muted-foreground">{selectedForm.description}</p>
            )}
          </DialogHeader>

          {submitted ? (
            <div className="py-10 text-center">
              <CheckCircle2 className="h-14 w-14 text-green-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-1">Response Submitted!</h3>
              <p className="text-muted-foreground">Thank you for filling out this form.</p>
              <Button className="mt-6" variant="outline" onClick={() => setDialogOpen(false)}>
                Close
              </Button>
            </div>
          ) : loadingFields ? (
            <div className="py-10 text-center text-muted-foreground">Loading form...</div>
          ) : formFields.length === 0 ? (
            <div className="py-10 text-center text-muted-foreground">
              This form has no fields yet.
            </div>
          ) : (
            <div className="space-y-5 py-2">
              {formFields.map(field => (
                <div key={field.id} className="space-y-1.5">
                  <Label htmlFor={`f_${field.id}`}>
                    {field.label}
                    {field.is_required && (
                      <span className="text-destructive ml-1">*</span>
                    )}
                  </Label>
                  {renderField(field)}
                </div>
              ))}
              <Button
                onClick={handleSubmit}
                disabled={submitting}
                className="w-full mt-2"
              >
                {submitting ? 'Submitting...' : 'Submit'}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
