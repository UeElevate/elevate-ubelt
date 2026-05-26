'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  Users, Eye, Trash2, Plus, UserCheck, X, ChevronDown, ChevronUp
} from 'lucide-react'

type DGroup = {
  id: string
  name: string
  leader_name: string | null
  campus_missionary: string | null
  campus: string | null
  schedule_day: string | null
  schedule_time: string | null
  mode: string | null
  created_at: string
}

type Registration = {
  id: string
  first_name: string
  last_name: string
  email: string
  mobile_number: string
  campus: string
  day_choice_1: string
  time_choice_1: string
  mode_of_meeting: string
  language: string
  preferred_campus: string
  is_first_time: boolean
  ccf_attendee: string
  joining_through: string
  gender: string
  age: number | null
  facebook: string | null
  landmark: string | null
  remarks: string | null
  assigned_dgroup_id: string | null
  created_at: string
}

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'ANYDAY']
const TIMES = ['Morning', 'Afternoon', 'Evening', 'ANYTIME']
const MODES = ['Online', 'Physical', 'Hybrid (Online & Physical)']

const TABS = ['Registrations', 'DGroups'] as const

export default function AdminDGroupsPage() {
  const supabase = createClient()
  const [tab, setTab] = useState<typeof TABS[number]>('Registrations')

  // ── registrations ──
  const [registrations, setRegistrations] = useState<Registration[]>([])
  const [loadingRegs, setLoadingRegs] = useState(true)
  const [viewReg, setViewReg] = useState<Registration | null>(null)
  const [assigningReg, setAssigningReg] = useState<Registration | null>(null)
  const [assignTarget, setAssignTarget] = useState('')
  const [assigning, setAssigning] = useState(false)

  // ── dgroups ──
  const [dgroups, setDgroups] = useState<DGroup[]>([])
  const [loadingGroups, setLoadingGroups] = useState(true)
  const [expandedGroup, setExpandedGroup] = useState<string | null>(null)
  const [groupMembers, setGroupMembers] = useState<Record<string, Registration[]>>({})

  // ── new/edit dgroup form ──
  const [showForm, setShowForm] = useState(false)
  const [editingGroup, setEditingGroup] = useState<DGroup | null>(null)
  const [formName, setFormName] = useState('')
  const [formLeader, setFormLeader] = useState('')
  const [formMissionary, setFormMissionary] = useState('')
  const [formCampus, setFormCampus] = useState('')
  const [formDay, setFormDay] = useState('')
  const [formTime, setFormTime] = useState('')
  const [formMode, setFormMode] = useState('')
  const [saving, setSaving] = useState(false)

  // ── fetchers ──
  const fetchRegs = useCallback(async () => {
    const { data } = await supabase
      .from('dgroup_registrations')
      .select('*')
      .order('created_at', { ascending: false })
    if (data) setRegistrations(data as Registration[])
    setLoadingRegs(false)
  }, [supabase])

  const fetchGroups = useCallback(async () => {
    const { data } = await supabase
      .from('dgroups')
      .select('*')
      .order('created_at', { ascending: false })
    if (data) setDgroups(data as DGroup[])
    setLoadingGroups(false)
  }, [supabase])

  const fetchGroupMembers = async (groupId: string) => {
    const { data } = await supabase
      .from('dgroup_registrations')
      .select('*')
      .eq('assigned_dgroup_id', groupId)
    if (data) setGroupMembers(prev => ({ ...prev, [groupId]: data as Registration[] }))
  }

  useEffect(() => { fetchRegs(); fetchGroups() }, [fetchRegs, fetchGroups])

  const toggleExpand = async (groupId: string) => {
    if (expandedGroup === groupId) {
      setExpandedGroup(null)
    } else {
      setExpandedGroup(groupId)
      if (!groupMembers[groupId]) await fetchGroupMembers(groupId)
    }
  }

  // ── assign reg to group ──
  const openAssign = (reg: Registration) => {
    setAssigningReg(reg)
    setAssignTarget(reg.assigned_dgroup_id ?? '')
  }

  const confirmAssign = async () => {
    if (!assigningReg) return
    setAssigning(true)
    await supabase
      .from('dgroup_registrations')
      .update({ assigned_dgroup_id: assignTarget || null })
      .eq('id', assigningReg.id)
    await fetchRegs()
    // refresh members for affected groups
    if (assignTarget) await fetchGroupMembers(assignTarget)
    if (assigningReg.assigned_dgroup_id) await fetchGroupMembers(assigningReg.assigned_dgroup_id)
    setAssigningReg(null)
    setAssigning(false)
  }

  // ── remove member from group ──
  const removeMember = async (regId: string, groupId: string) => {
    if (!confirm('Remove this member from the group?')) return
    await supabase.from('dgroup_registrations').update({ assigned_dgroup_id: null }).eq('id', regId)
    await fetchGroupMembers(groupId)
    await fetchRegs()
  }

  // ── create/edit dgroup ──
  const openForm = (group?: DGroup) => {
    setEditingGroup(group ?? null)
    setFormName(group?.name ?? '')
    setFormLeader(group?.leader_name ?? '')
    setFormMissionary(group?.campus_missionary ?? '')
    setFormCampus(group?.campus ?? '')
    setFormDay(group?.schedule_day ?? '')
    setFormTime(group?.schedule_time ?? '')
    setFormMode(group?.mode ?? '')
    setShowForm(true)
  }

  const saveGroup = async () => {
    if (!formName.trim()) return
    setSaving(true)
    const payload = {
      name: formName.trim(),
      leader_name: formLeader.trim() || null,
      campus_missionary: formMissionary.trim() || null,
      campus: formCampus.trim() || null,
      schedule_day: formDay || null,
      schedule_time: formTime || null,
      mode: formMode || null,
    }
    if (editingGroup) {
      await supabase.from('dgroups').update(payload).eq('id', editingGroup.id)
    } else {
      await supabase.from('dgroups').insert(payload)
    }
    await fetchGroups()
    setShowForm(false)
    setSaving(false)
  }

  const deleteGroup = async (id: string) => {
    if (!confirm('Delete this DGroup? Members will be unassigned.')) return
    await supabase.from('dgroup_registrations').update({ assigned_dgroup_id: null }).eq('assigned_dgroup_id', id)
    await supabase.from('dgroups').delete().eq('id', id)
    fetchGroups()
    fetchRegs()
  }

  const unassigned = registrations.filter(r => !r.assigned_dgroup_id)
  const assigned = registrations.filter(r => r.assigned_dgroup_id)

  return (
    <div className="pt-14 md:pt-0">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Discipleship Groups</h1>
          <p className="text-muted-foreground">Manage DGroups, leaders, missionaries, and members</p>
        </div>
        {tab === 'DGroups' && (
          <Button onClick={() => openForm()}>
            <Plus className="h-4 w-4 mr-1.5" /> New DGroup
          </Button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-muted rounded-lg p-1 w-fit mb-6">
        {TABS.map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              tab === t ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {t}
            {t === 'Registrations' && (
              <span className="ml-1.5 text-xs bg-muted-foreground/20 px-1.5 py-0.5 rounded-full">
                {registrations.length}
              </span>
            )}
            {t === 'DGroups' && (
              <span className="ml-1.5 text-xs bg-muted-foreground/20 px-1.5 py-0.5 rounded-full">
                {dgroups.length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ── REGISTRATIONS TAB ── */}
      {tab === 'Registrations' && (
        <div>
          {loadingRegs ? (
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <Card key={i} className="animate-pulse"><CardContent className="pt-5 h-20" /></Card>
              ))}
            </div>
          ) : registrations.length === 0 ? (
            <Card className="p-12 text-center">
              <Users className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground">No registrations yet.</p>
            </Card>
          ) : (
            <div className="space-y-6">
              {/* Unassigned */}
              {unassigned.length > 0 && (
                <div>
                  <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
                    Unassigned ({unassigned.length})
                  </h2>
                  <div className="space-y-3">
                    {unassigned.map(reg => (
                      <RegCard
                        key={reg.id}
                        reg={reg}
                        dgroups={dgroups}
                        onView={() => setViewReg(reg)}
                        onAssign={() => openAssign(reg)}
                        onDelete={async () => {
                          if (!confirm('Delete this registration?')) return
                          await supabase.from('dgroup_registrations').delete().eq('id', reg.id)
                          fetchRegs()
                        }}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Assigned */}
              {assigned.length > 0 && (
                <div>
                  <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
                    Assigned to a Group ({assigned.length})
                  </h2>
                  <div className="space-y-3">
                    {assigned.map(reg => {
                      const group = dgroups.find(g => g.id === reg.assigned_dgroup_id)
                      return (
                        <RegCard
                          key={reg.id}
                          reg={reg}
                          dgroups={dgroups}
                          groupName={group?.name}
                          onView={() => setViewReg(reg)}
                          onAssign={() => openAssign(reg)}
                          onDelete={async () => {
                            if (!confirm('Delete this registration?')) return
                            await supabase.from('dgroup_registrations').delete().eq('id', reg.id)
                            fetchRegs()
                          }}
                        />
                      )
                    })}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ── DGROUPS TAB ── */}
      {tab === 'DGroups' && (
        <div>
          {loadingGroups ? (
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <Card key={i} className="animate-pulse"><CardContent className="pt-5 h-24" /></Card>
              ))}
            </div>
          ) : dgroups.length === 0 ? (
            <Card className="p-12 text-center">
              <Users className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground">No DGroups yet. Create your first one!</p>
            </Card>
          ) : (
            <div className="space-y-4">
              {dgroups.map(group => {
                const members = groupMembers[group.id] ?? []
                const isExpanded = expandedGroup === group.id
                const memberCount = registrations.filter(r => r.assigned_dgroup_id === group.id).length

                return (
                  <Card key={group.id}>
                    <CardContent className="pt-5">
                      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap mb-2">
                            <h3 className="font-bold text-foreground text-lg">{group.name}</h3>
                            <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full font-medium">
                              {memberCount} {memberCount === 1 ? 'member' : 'members'}
                            </span>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-x-6 gap-y-1 text-sm">
                            <div>
                              <span className="text-muted-foreground">Leader: </span>
                              <span className="font-medium">{group.leader_name ?? '—'}</span>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Missionary: </span>
                              <span className="font-medium">{group.campus_missionary ?? '—'}</span>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Campus: </span>
                              <span className="font-medium">{group.campus ?? '—'}</span>
                            </div>
                            {(group.schedule_day || group.schedule_time) && (
                              <div>
                                <span className="text-muted-foreground">Schedule: </span>
                                <span className="font-medium">{[group.schedule_day, group.schedule_time].filter(Boolean).join(' ')}</span>
                              </div>
                            )}
                            {group.mode && (
                              <div>
                                <span className="text-muted-foreground">Mode: </span>
                                <span className="font-medium">{group.mode}</span>
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="flex gap-2 shrink-0">
                          <Button variant="outline" size="sm" onClick={() => toggleExpand(group.id)}>
                            {isExpanded ? <ChevronUp className="h-4 w-4 mr-1" /> : <ChevronDown className="h-4 w-4 mr-1" />}
                            Members
                          </Button>
                          <Button variant="outline" size="sm" onClick={() => openForm(group)}>
                            Edit
                          </Button>
                          <Button variant="outline" size="sm" onClick={() => deleteGroup(group.id)}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </div>

                      {/* Members list */}
                      {isExpanded && (
                        <div className="mt-4 pt-4 border-t border-border">
                          {members.length === 0 ? (
                            <p className="text-sm text-muted-foreground text-center py-4">
                              No members yet. Assign registrations from the Registrations tab.
                            </p>
                          ) : (
                            <div className="space-y-2">
                              {members.map(m => (
                                <div key={m.id} className="flex items-center justify-between p-2.5 rounded-lg bg-muted/40">
                                  <div className="flex items-center gap-2.5">
                                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xs font-bold shrink-0">
                                      {m.first_name[0]}{m.last_name[0]}
                                    </div>
                                    <div>
                                      <p className="text-sm font-medium">{m.first_name} {m.last_name}</p>
                                      <p className="text-xs text-muted-foreground">{m.email} · {m.campus}</p>
                                    </div>
                                  </div>
                                  <button
                                    onClick={() => removeMember(m.id, group.id)}
                                    className="p-1 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                                    title="Remove from group"
                                  >
                                    <X className="h-4 w-4" />
                                  </button>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* ── VIEW REGISTRATION DIALOG ── */}
      <Dialog open={!!viewReg} onOpenChange={open => { if (!open) setViewReg(null) }}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{viewReg?.first_name} {viewReg?.last_name}</DialogTitle>
          </DialogHeader>
          {viewReg && (
            <div className="space-y-5 text-sm">
              <Section title="CCF Info">
                <Row label="CCF Attendee" value={viewReg.ccf_attendee} />
                <Row label="Joining Through" value={viewReg.joining_through} />
              </Section>
              <Section title="Personal Details">
                <Row label="Mobile" value={viewReg.mobile_number} />
                <Row label="Email" value={viewReg.email} />
                {viewReg.facebook && <Row label="Facebook" value={viewReg.facebook} />}
                <Row label="Age" value={viewReg.age?.toString() ?? '—'} />
                <Row label="Gender" value={viewReg.gender} />
                <Row label="Campus" value={viewReg.campus} />
              </Section>
              <Section title="DGroup Preferences">
                <Row label="1st Choice" value={`${viewReg.day_choice_1}, ${viewReg.time_choice_1}`} />
                <Row label="Mode" value={viewReg.mode_of_meeting} />
                <Row label="Language" value={viewReg.language} />
                <Row label="Preferred Campus" value={viewReg.preferred_campus} />
                {viewReg.landmark && <Row label="Landmark" value={viewReg.landmark} />}
                <Row label="First Time" value={viewReg.is_first_time ? 'Yes' : 'No'} />
                {viewReg.remarks && <Row label="Remarks" value={viewReg.remarks} />}
              </Section>
              {viewReg.assigned_dgroup_id && (
                <Section title="Assignment">
                  <Row label="DGroup" value={dgroups.find(g => g.id === viewReg.assigned_dgroup_id)?.name ?? '—'} />
                </Section>
              )}
              <p className="text-xs text-muted-foreground">
                Submitted {new Date(viewReg.created_at).toLocaleString()}
              </p>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ── ASSIGN DIALOG ── */}
      <Dialog open={!!assigningReg} onOpenChange={open => { if (!open) setAssigningReg(null) }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Assign to DGroup</DialogTitle>
          </DialogHeader>
          {assigningReg && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Assigning <strong>{assigningReg.first_name} {assigningReg.last_name}</strong> to a DGroup.
              </p>
              <div className="space-y-1.5">
                <Label>Select DGroup</Label>
                <select
                  value={assignTarget}
                  onChange={e => setAssignTarget(e.target.value)}
                  className="w-full border border-border rounded-md px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  <option value="">— Unassign —</option>
                  {dgroups.map(g => (
                    <option key={g.id} value={g.id}>{g.name}{g.leader_name ? ` (${g.leader_name})` : ''}</option>
                  ))}
                </select>
              </div>
              <div className="flex gap-2">
                <Button onClick={confirmAssign} disabled={assigning} className="flex-1">
                  {assigning ? 'Saving...' : 'Confirm'}
                </Button>
                <Button variant="outline" onClick={() => setAssigningReg(null)}>Cancel</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ── CREATE/EDIT DGROUP DIALOG ── */}
      <Dialog open={showForm} onOpenChange={open => { if (!open) setShowForm(false) }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingGroup ? 'Edit DGroup' : 'New DGroup'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>Group Name <span className="text-destructive">*</span></Label>
              <Input value={formName} onChange={e => setFormName(e.target.value)} placeholder="e.g. Monday Morning Group" autoFocus />
            </div>
            <div className="space-y-1.5">
              <Label>DGroup Leader</Label>
              <Input value={formLeader} onChange={e => setFormLeader(e.target.value)} placeholder="Leader's name" />
            </div>
            <div className="space-y-1.5">
              <Label>Campus Missionary</Label>
              <Input value={formMissionary} onChange={e => setFormMissionary(e.target.value)} placeholder="Missionary's name" />
            </div>
            <div className="space-y-1.5">
              <Label>Campus</Label>
              <Input value={formCampus} onChange={e => setFormCampus(e.target.value)} placeholder="e.g. UE Manila" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Schedule Day</Label>
                <select value={formDay} onChange={e => setFormDay(e.target.value)}
                  className="w-full border border-border rounded-md px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring">
                  <option value="">Select...</option>
                  {DAYS.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
              <div className="space-y-1.5">
                <Label>Schedule Time</Label>
                <select value={formTime} onChange={e => setFormTime(e.target.value)}
                  className="w-full border border-border rounded-md px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring">
                  <option value="">Select...</option>
                  {TIMES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Mode of Meeting</Label>
              <select value={formMode} onChange={e => setFormMode(e.target.value)}
                className="w-full border border-border rounded-md px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring">
                <option value="">Select...</option>
                {MODES.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>
            <div className="flex gap-2 pt-2">
              <Button onClick={saveGroup} disabled={saving || !formName.trim()} className="flex-1">
                {saving ? 'Saving...' : editingGroup ? 'Save Changes' : 'Create DGroup'}
              </Button>
              <Button variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function RegCard({ reg, dgroups, groupName, onView, onAssign, onDelete }: {
  reg: Registration
  dgroups: DGroup[]
  groupName?: string
  onView: () => void
  onAssign: () => void
  onDelete: () => void
}) {
  return (
    <Card>
      <CardContent className="pt-5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0 text-primary font-bold text-sm">
              {reg.first_name[0]}{reg.last_name[0]}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <p className="font-semibold text-foreground">{reg.first_name} {reg.last_name}</p>
                {reg.is_first_time && (
                  <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">First Timer</span>
                )}
                {groupName && (
                  <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full font-medium">{groupName}</span>
                )}
              </div>
              <p className="text-sm text-muted-foreground">{reg.email} · {reg.mobile_number}</p>
              <div className="flex flex-wrap gap-1.5 mt-1.5">
                <span className="text-xs bg-muted text-muted-foreground px-2 py-0.5 rounded">{reg.campus}</span>
                <span className="text-xs bg-muted text-muted-foreground px-2 py-0.5 rounded">{reg.mode_of_meeting}</span>
                <span className="text-xs bg-muted text-muted-foreground px-2 py-0.5 rounded">{reg.day_choice_1} {reg.time_choice_1}</span>
              </div>
            </div>
          </div>
          <div className="flex gap-2 shrink-0">
            <Button variant="outline" size="sm" onClick={onAssign}>
              <UserCheck className="h-4 w-4 mr-1.5" /> Assign
            </Button>
            <Button variant="outline" size="sm" onClick={onView}>
              <Eye className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={onDelete}>
              <Trash2 className="h-4 w-4 text-destructive" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="font-semibold text-foreground mb-2 pb-1 border-b border-border">{title}</p>
      <div className="space-y-1.5">{children}</div>
    </div>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex gap-2">
      <span className="text-muted-foreground w-36 shrink-0">{label}</span>
      <span className="text-foreground">{value}</span>
    </div>
  )
}
