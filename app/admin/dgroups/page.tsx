'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Users, Eye, Trash2, CheckCircle2 } from 'lucide-react'

type DGroupReg = {
  id: string
  ccf_attendee: string
  joining_through: string
  privacy_agreed: boolean
  first_name: string
  last_name: string
  mobile_number: string
  email: string
  facebook: string | null
  age: number | null
  gender: string
  campus: string
  day_choice_1: string
  time_choice_1: string
  day_choice_2: string | null
  time_choice_2: string | null
  mode_of_meeting: string
  language: string
  preferred_campus: string
  landmark: string | null
  is_first_time: boolean
  remarks: string | null
  created_at: string
}

export default function AdminDGroupsPage() {
  const supabase = createClient()
  const [registrations, setRegistrations] = useState<DGroupReg[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selected, setSelected] = useState<DGroupReg | null>(null)

  const fetchData = async () => {
    const { data } = await supabase
      .from('dgroup_registrations')
      .select('*')
      .order('created_at', { ascending: false })
    if (data) setRegistrations(data as DGroupReg[])
    setIsLoading(false)
  }

  useEffect(() => { fetchData() }, [])

  const deleteReg = async (id: string) => {
    if (!confirm('Delete this registration?')) return
    await supabase.from('dgroup_registrations').delete().eq('id', id)
    fetchData()
  }

  return (
    <div className="pt-14 md:pt-0">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Discipleship Groups</h1>
          <p className="text-muted-foreground">DGroup connection requests from members</p>
        </div>
        <span className="text-sm text-muted-foreground bg-muted px-3 py-1.5 rounded-full">
          {registrations.length} total
        </span>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="pt-5">
                <div className="h-5 bg-muted rounded w-1/3 mb-2" />
                <div className="h-4 bg-muted rounded w-1/2" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : registrations.length === 0 ? (
        <Card className="p-12 text-center">
          <Users className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground">No DGroup registrations yet.</p>
        </Card>
      ) : (
        <div className="space-y-3">
          {registrations.map(reg => (
            <Card key={reg.id}>
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
                    <Button variant="outline" size="sm" onClick={() => setSelected(reg)}>
                      <Eye className="h-4 w-4 mr-1.5" /> View
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => deleteReg(reg.id)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Detail Dialog */}
      <Dialog open={!!selected} onOpenChange={open => { if (!open) setSelected(null) }}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selected?.first_name} {selected?.last_name}</DialogTitle>
          </DialogHeader>
          {selected && (
            <div className="space-y-5 text-sm">
              <Section title="CCF Info">
                <Row label="CCF Attendee" value={selected.ccf_attendee} />
                <Row label="Joining Through" value={selected.joining_through} />
                <Row label="Privacy Agreed" value={selected.privacy_agreed ? '✓ Agreed' : '✗ Did not agree'} />
              </Section>
              <Section title="Personal Details">
                <Row label="Name" value={`${selected.first_name} ${selected.last_name}`} />
                <Row label="Mobile" value={selected.mobile_number} />
                <Row label="Email" value={selected.email} />
                {selected.facebook && <Row label="Facebook" value={selected.facebook} />}
                <Row label="Age" value={selected.age?.toString() ?? '—'} />
                <Row label="Gender" value={selected.gender} />
                <Row label="Campus" value={selected.campus} />
              </Section>
              <Section title="DGroup Preferences">
                <Row label="1st Choice" value={`${selected.day_choice_1}, ${selected.time_choice_1}`} />
                {selected.day_choice_2 && <Row label="2nd Choice" value={`${selected.day_choice_2}, ${selected.time_choice_2}`} />}
                <Row label="Mode" value={selected.mode_of_meeting} />
                <Row label="Language" value={selected.language} />
                <Row label="Preferred Campus" value={selected.preferred_campus} />
                {selected.landmark && <Row label="Landmark" value={selected.landmark} />}
                <Row label="First Time in DGroup" value={selected.is_first_time ? 'Yes' : 'No'} />
                {selected.remarks && <Row label="Remarks" value={selected.remarks} />}
              </Section>
              <p className="text-xs text-muted-foreground">
                Submitted {new Date(selected.created_at).toLocaleString()}
              </p>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
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
