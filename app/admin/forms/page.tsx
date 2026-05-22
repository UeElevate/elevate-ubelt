'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import {
  Plus, Pencil, Trash2, ArrowLeft, ClipboardList, Eye, Settings2,
} from 'lucide-react'
import type { Form, FormField, FormFieldType, FormSubmission } from '@/lib/types'

const FIELD_TYPES: { value: FormFieldType; label: string }[] = [
  { value: 'text', label: 'Short Text' },
  { value: 'textarea', label: 'Long Text' },
  { value: 'email', label: 'Email' },
  { value: 'number', label: 'Number' },
  { value: 'select', label: 'Dropdown' },
  { value: 'radio', label: 'Multiple Choice' },
  { value: 'checkbox', label: 'Checkbox' },
  { value: 'date', label: 'Date' },
]

export default function AdminFormsPage() {
  const supabase = createClient()

  // View
  const [view, setView] = useState<'list' | 'builder'>('list')

  // Forms list
  const [forms, setForms] = useState<Form[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // Form editor (create / edit metadata)
  const [showFormEditor, setShowFormEditor] = useState(false)
  const [editingForm, setEditingForm] = useState<Form | null>(null)
  const [formTitle, setFormTitle] = useState('')
  const [formDescription, setFormDescription] = useState('')
  const [formActive, setFormActive] = useState(true)
  const [savingForm, setSavingForm] = useState(false)

  // Field manager (builder view)
  const [selectedForm, setSelectedForm] = useState<Form | null>(null)
  const [formFields, setFormFields] = useState<FormField[]>([])
  const [loadingFields, setLoadingFields] = useState(false)

  // Add-field panel
  const [showAddField, setShowAddField] = useState(false)
  const [fieldLabel, setFieldLabel] = useState('')
  const [fieldType, setFieldType] = useState<FormFieldType>('text')
  const [fieldRequired, setFieldRequired] = useState(false)
  const [fieldPlaceholder, setFieldPlaceholder] = useState('')
  const [fieldOptions, setFieldOptions] = useState('')
  const [savingField, setSavingField] = useState(false)

  // Submissions dialog
  const [submissionsOpen, setSubmissionsOpen] = useState(false)
  const [submissionsForm, setSubmissionsForm] = useState<Form | null>(null)
  const [submissionsFields, setSubmissionsFields] = useState<FormField[]>([])
  const [submissions, setSubmissions] = useState<FormSubmission[]>([])
  const [loadingSubmissions, setLoadingSubmissions] = useState(false)

  // ── fetchers ──────────────────────────────────────────────────────────────

  const fetchForms = useCallback(async () => {
    const { data } = await supabase
      .from('forms')
      .select('*')
      .order('created_at', { ascending: false })
    if (data) setForms(data as Form[])
    setIsLoading(false)
  }, [supabase])

  const fetchFields = useCallback(async (formId: string) => {
    setLoadingFields(true)
    const { data } = await supabase
      .from('form_fields')
      .select('*')
      .eq('form_id', formId)
      .order('display_order', { ascending: true })
    if (data) setFormFields(data as FormField[])
    setLoadingFields(false)
  }, [supabase])

  useEffect(() => {
    fetchForms()
  }, [fetchForms])

  // ── form editor ────────────────────────────────────────────────────────────

  const openFormEditor = (form?: Form) => {
    setEditingForm(form ?? null)
    setFormTitle(form?.title ?? '')
    setFormDescription(form?.description ?? '')
    setFormActive(form?.is_active ?? true)
    setShowFormEditor(true)
  }

  const closeFormEditor = () => {
    setShowFormEditor(false)
    setEditingForm(null)
    setFormTitle('')
    setFormDescription('')
    setFormActive(true)
  }

  const saveForm = async () => {
    if (!formTitle.trim()) return
    setSavingForm(true)
    const { data: { user } } = await supabase.auth.getUser()
    const payload = {
      title: formTitle.trim(),
      description: formDescription.trim() || null,
      is_active: formActive,
    }
    if (editingForm) {
      await supabase.from('forms').update(payload).eq('id', editingForm.id)
      if (selectedForm?.id === editingForm.id) {
        setSelectedForm(prev => prev ? { ...prev, ...payload } : prev)
      }
      closeFormEditor()
      fetchForms()
    } else {
      const { data: newForm } = await supabase
        .from('forms')
        .insert({ ...payload, created_by: user?.id ?? null })
        .select()
        .single()
      closeFormEditor()
      await fetchForms()
      if (newForm) {
        setSelectedForm(newForm as Form)
        setView('builder')
        await fetchFields(newForm.id)
      }
    }
    setSavingForm(false)
  }

  // ── field manager ──────────────────────────────────────────────────────────

  const openFieldManager = async (form: Form) => {
    setSelectedForm(form)
    setView('builder')
    resetFieldForm()
    await fetchFields(form.id)
  }

  const backToList = () => {
    setView('list')
    setSelectedForm(null)
    setFormFields([])
    setShowAddField(false)
    setShowFormEditor(false)
  }

  const resetFieldForm = () => {
    setFieldLabel('')
    setFieldType('text')
    setFieldRequired(false)
    setFieldPlaceholder('')
    setFieldOptions('')
    setShowAddField(false)
    setSavingField(false)
  }

  const addField = async () => {
    if (!fieldLabel.trim() || !selectedForm) return
    setSavingField(true)
    const options = ['select', 'radio'].includes(fieldType)
      ? fieldOptions.split(',').map(s => s.trim()).filter(Boolean)
      : null
    await supabase.from('form_fields').insert({
      form_id: selectedForm.id,
      label: fieldLabel.trim(),
      field_type: fieldType,
      options,
      is_required: fieldRequired,
      placeholder: fieldPlaceholder.trim() || null,
      display_order: formFields.length,
    })
    resetFieldForm()
    await fetchFields(selectedForm.id)
    setSavingField(false)
  }

  const deleteField = async (fieldId: string) => {
    if (!confirm('Remove this field?')) return
    await supabase.from('form_fields').delete().eq('id', fieldId)
    if (selectedForm) fetchFields(selectedForm.id)
  }

  const deleteForm = async (formId: string) => {
    if (!confirm('Delete this form and all its submissions? This cannot be undone.')) return
    await supabase.from('forms').delete().eq('id', formId)
    fetchForms()
  }

  const toggleActive = async (form: Form) => {
    await supabase.from('forms').update({ is_active: !form.is_active }).eq('id', form.id)
    fetchForms()
  }

  // ── submissions ────────────────────────────────────────────────────────────

  const viewSubmissions = async (form: Form) => {
    setSubmissionsForm(form)
    setSubmissionsOpen(true)
    setLoadingSubmissions(true)
    const [fieldsRes, subsRes] = await Promise.all([
      supabase.from('form_fields').select('*').eq('form_id', form.id).order('display_order'),
      supabase.from('form_submissions').select('*').eq('form_id', form.id).order('created_at', { ascending: false }),
    ])
    if (fieldsRes.data) setSubmissionsFields(fieldsRes.data as FormField[])
    if (subsRes.data) setSubmissions(subsRes.data as FormSubmission[])
    setLoadingSubmissions(false)
  }

  const needsOptions = fieldType === 'select' || fieldType === 'radio'

  // ── BUILDER VIEW ───────────────────────────────────────────────────────────

  if (view === 'builder' && selectedForm) {
    return (
      <div className="pt-14 md:pt-0">
        <button
          onClick={backToList}
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Forms
        </button>

        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-foreground">{selectedForm.title}</h1>
            {selectedForm.description && (
              <p className="text-muted-foreground">{selectedForm.description}</p>
            )}
            <span className={`inline-flex mt-1 px-2 py-0.5 rounded-full text-xs font-medium ${
              selectedForm.is_active ? 'bg-green-100 text-green-700' : 'bg-muted text-muted-foreground'
            }`}>
              {selectedForm.is_active ? 'Active' : 'Inactive'}
            </span>
          </div>
          <Button variant="outline" size="sm" onClick={() => openFormEditor(selectedForm)}>
            <Pencil className="h-4 w-4 mr-1.5" />
            Edit Details
          </Button>
        </div>

        {/* Edit form details (inline) */}
        {showFormEditor && (
          <Card className="mb-6">
            <CardHeader><CardTitle>Edit Form Details</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Title *</Label>
                  <Input value={formTitle} onChange={e => setFormTitle(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Description</Label>
                  <Textarea value={formDescription} onChange={e => setFormDescription(e.target.value)} rows={2} />
                </div>
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="edit_active"
                    checked={formActive}
                    onCheckedChange={v => setFormActive(v as boolean)}
                  />
                  <Label htmlFor="edit_active" className="cursor-pointer">Active (visible to public)</Label>
                </div>
                <div className="flex gap-2">
                  <Button onClick={saveForm} disabled={savingForm || !formTitle.trim()}>
                    {savingForm ? 'Saving...' : 'Save Changes'}
                  </Button>
                  <Button variant="outline" onClick={closeFormEditor}>Cancel</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Fields builder */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Form Fields</CardTitle>
                <p className="text-sm text-muted-foreground mt-1">
                  {formFields.length} {formFields.length === 1 ? 'field' : 'fields'} — drag or reorder by deleting and re-adding
                </p>
              </div>
              {!showAddField && (
                <Button size="sm" onClick={() => setShowAddField(true)}>
                  <Plus className="h-4 w-4 mr-1.5" />
                  Add Field
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {/* Add field form */}
            {showAddField && (
              <div className="border border-border rounded-lg p-4 mb-4 bg-muted/30">
                <p className="font-medium text-sm mb-3">New Field</p>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label>Label *</Label>
                    <Input
                      value={fieldLabel}
                      onChange={e => setFieldLabel(e.target.value)}
                      placeholder="e.g. Full Name"
                      autoFocus
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Field Type</Label>
                    <Select value={fieldType} onValueChange={v => setFieldType(v as FormFieldType)}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {FIELD_TYPES.map(t => (
                          <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {needsOptions && (
                    <div className="space-y-1.5 sm:col-span-2">
                      <Label>Options <span className="text-muted-foreground font-normal">(comma-separated)</span></Label>
                      <Input
                        value={fieldOptions}
                        onChange={e => setFieldOptions(e.target.value)}
                        placeholder="Option 1, Option 2, Option 3"
                      />
                    </div>
                  )}

                  {!['checkbox', 'date', 'select', 'radio'].includes(fieldType) && (
                    <div className="space-y-1.5 sm:col-span-2">
                      <Label>Placeholder <span className="text-muted-foreground font-normal">(optional)</span></Label>
                      <Input
                        value={fieldPlaceholder}
                        onChange={e => setFieldPlaceholder(e.target.value)}
                        placeholder="e.g. Enter your name..."
                      />
                    </div>
                  )}

                  <div className="flex items-center gap-2 sm:col-span-2">
                    <Checkbox
                      id="field_required"
                      checked={fieldRequired}
                      onCheckedChange={v => setFieldRequired(v as boolean)}
                    />
                    <Label htmlFor="field_required" className="cursor-pointer">Required field</Label>
                  </div>
                </div>

                <div className="flex gap-2 mt-4">
                  <Button size="sm" onClick={addField} disabled={savingField || !fieldLabel.trim()}>
                    {savingField ? 'Adding...' : 'Add Field'}
                  </Button>
                  <Button size="sm" variant="outline" onClick={resetFieldForm}>Cancel</Button>
                </div>
              </div>
            )}

            {/* Fields list */}
            {loadingFields ? (
              <div className="space-y-2">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="h-14 bg-muted rounded-lg animate-pulse" />
                ))}
              </div>
            ) : formFields.length === 0 && !showAddField ? (
              <div className="text-center py-10 text-muted-foreground">
                <p>No fields yet. Click <strong>Add Field</strong> to start building your form.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {formFields.map((field, idx) => (
                  <div
                    key={field.id}
                    className="flex items-center justify-between p-3 rounded-lg border border-border bg-card hover:bg-muted/20 transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="text-xs text-muted-foreground w-5 text-center shrink-0">{idx + 1}</span>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="text-sm font-medium text-foreground truncate">{field.label}</span>
                          {field.is_required && (
                            <span className="text-xs text-destructive font-semibold">*</span>
                          )}
                        </div>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className="text-xs text-muted-foreground">
                            {FIELD_TYPES.find(t => t.value === field.field_type)?.label}
                          </span>
                          {field.options && field.options.length > 0 && (
                            <span className="text-xs text-muted-foreground truncate max-w-48">
                              · {field.options.join(', ')}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => deleteField(field.id)}
                      className="p-1.5 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors shrink-0"
                      title="Remove field"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    )
  }

  // ── LIST VIEW ──────────────────────────────────────────────────────────────

  return (
    <div className="pt-14 md:pt-0">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Forms</h1>
          <p className="text-muted-foreground">Create and manage ministry forms</p>
        </div>
        <Button onClick={() => { setView('list'); openFormEditor() }}>
          <Plus className="mr-2 h-4 w-4" />
          New Form
        </Button>
      </div>

      {/* Form creation / edit card */}
      {showFormEditor && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>{editingForm ? 'Edit Form' : 'New Form'}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Title *</Label>
                <Input
                  value={formTitle}
                  onChange={e => setFormTitle(e.target.value)}
                  placeholder="e.g. Event Registration, Feedback Form"
                  autoFocus
                />
              </div>
              <div className="space-y-2">
                <Label>Description <span className="text-muted-foreground font-normal">(optional)</span></Label>
                <Textarea
                  value={formDescription}
                  onChange={e => setFormDescription(e.target.value)}
                  placeholder="Brief description shown to members..."
                  rows={2}
                />
              </div>
              <div className="flex items-center gap-2">
                <Checkbox
                  id="new_active"
                  checked={formActive}
                  onCheckedChange={v => setFormActive(v as boolean)}
                />
                <Label htmlFor="new_active" className="cursor-pointer">
                  Active (visible on the public Forms page)
                </Label>
              </div>
              <div className="flex gap-2">
                <Button onClick={saveForm} disabled={savingForm || !formTitle.trim()}>
                  {savingForm ? 'Saving...' : editingForm ? 'Update' : 'Create & Add Fields'}
                </Button>
                <Button variant="outline" onClick={closeFormEditor}>Cancel</Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Forms list */}
      {isLoading ? (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="pt-6">
                <div className="h-6 bg-muted rounded w-1/3 mb-2" />
                <div className="h-4 bg-muted rounded w-2/3" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : forms.length === 0 ? (
        <Card className="p-10 text-center">
          <ClipboardList className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground">No forms yet. Create your first one above!</p>
        </Card>
      ) : (
        <div className="space-y-4">
          {forms.map(form => (
            <Card key={form.id}>
              <CardContent className="pt-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                      <ClipboardList className="h-5 w-5 text-primary" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <h3 className="font-semibold text-foreground truncate">{form.title}</h3>
                        <button
                          onClick={() => toggleActive(form)}
                          className={`px-2 py-0.5 rounded-full text-xs font-medium cursor-pointer transition-colors ${
                            form.is_active
                              ? 'bg-green-100 text-green-700 hover:bg-green-200'
                              : 'bg-muted text-muted-foreground hover:bg-muted/80'
                          }`}
                          title="Click to toggle active status"
                        >
                          {form.is_active ? 'Active' : 'Inactive'}
                        </button>
                      </div>
                      {form.description && (
                        <p className="text-sm text-muted-foreground line-clamp-1">{form.description}</p>
                      )}
                      <p className="text-xs text-muted-foreground mt-1">
                        Created {new Date(form.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2 shrink-0">
                    <Button variant="outline" size="sm" onClick={() => openFieldManager(form)}>
                      <Settings2 className="h-4 w-4 mr-1.5" />
                      Manage Fields
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => viewSubmissions(form)}>
                      <Eye className="h-4 w-4 mr-1.5" />
                      Submissions
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => openFormEditor(form)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => deleteForm(form.id)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Submissions dialog */}
      <Dialog open={submissionsOpen} onOpenChange={setSubmissionsOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Submissions — {submissionsForm?.title}</DialogTitle>
          </DialogHeader>
          {loadingSubmissions ? (
            <div className="py-10 text-center text-muted-foreground">Loading submissions...</div>
          ) : submissions.length === 0 ? (
            <div className="py-10 text-center text-muted-foreground">
              No submissions yet for this form.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-10">#</TableHead>
                    <TableHead>Date</TableHead>
                    {submissionsFields.map(f => (
                      <TableHead key={f.id}>{f.label}</TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {submissions.map((sub, idx) => (
                    <TableRow key={sub.id}>
                      <TableCell className="text-muted-foreground text-sm">
                        {submissions.length - idx}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                        {new Date(sub.created_at).toLocaleDateString()}
                      </TableCell>
                      {submissionsFields.map(f => {
                        const val = sub.submitted_data[f.id]
                        return (
                          <TableCell key={f.id} className="text-sm max-w-xs">
                            {val === true ? '✓' : val === false ? '—' : (val as string) || '—'}
                          </TableCell>
                        )
                      })}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <p className="text-xs text-muted-foreground mt-3 text-right">
                {submissions.length} total {submissions.length === 1 ? 'submission' : 'submissions'}
              </p>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
