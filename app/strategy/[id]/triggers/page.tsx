'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { WizardLayout, WizardPage } from '@/components/wizard/WizardLayout'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Loader2, ChevronRight, ChevronLeft, AlertCircle } from 'lucide-react'

const STANDARD_TRIGGERS = [
  'They are using delaying tactics',
  'Discussions been escalated to a higher level',
  'They have dis-empowered themselves',
  'They have presented no alternatives',
  'They have only presented win/lose proposals',
  'They have introduced time related deadlines',
  'They have formally withdrawn from discussions',
  'They have rejected any attempt to create ongoing dialogue',
  'They are demonstrating indifference/intransigence',
  'They have introduced threats or deadlines',
]

interface TriggerEntry { active: boolean; notes: string }

export default function TriggersPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter()
  const [id, setId] = useState('')
  const [projectName, setProjectName] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [triggers, setTriggers] = useState<Record<string, TriggerEntry>>({})
  const [generalNotes, setGeneralNotes] = useState('')

  useEffect(() => {
    params.then(({ id: pid }) => { setId(pid); loadData(pid) })
  }, [params])

  async function loadData(pid: string) {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/auth/login'); return }
    const [{ data: project }, { data: trig }] = await Promise.all([
      supabase.from('strategy_projects').select('name').eq('id', pid).single(),
      supabase.from('triggers').select('*').eq('project_id', pid).maybeSingle(),
    ])
    if (!project) { router.push('/dashboard'); return }
    setProjectName(project.name)
    if (trig?.trigger_data) setTriggers(trig.trigger_data as Record<string, TriggerEntry>)
    if (trig?.notes) setGeneralNotes(trig.notes)
    setLoading(false)
  }

  function toggle(key: string) {
    setTriggers((prev) => ({
      ...prev,
      [key]: { active: !prev[key]?.active, notes: prev[key]?.notes || '' },
    }))
  }

  function setNotes(key: string, notes: string) {
    setTriggers((prev) => ({
      ...prev,
      [key]: { active: prev[key]?.active || false, notes },
    }))
  }

  async function handleNext() {
    setSaving(true)
    const supabase = createClient()
    await supabase.from('triggers').upsert(
      { project_id: id, trigger_data: triggers, notes: generalNotes || null },
      { onConflict: 'project_id' }
    )
    setSaving(false)
    router.push(`/strategy/${id}/report`)
  }

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--brand-navy)' }}>
      <Loader2 className="w-6 h-6 animate-spin text-teal-400" />
    </div>
  )

  const activeCount = Object.values(triggers).filter((t) => t.active).length

  return (
    <WizardLayout projectId={id} projectName={projectName} currentStep={10} completedSteps={[1,2,3,4,5,6,7,8,9]}>
      <WizardPage
        title="Contingency Triggers"
        description="Flag which triggers apply to your negotiation and add notes on how to respond."
        step={10}
        actions={
          <>
            <Link href={`/strategy/${id}/ppa`}>
              <Button variant="ghost" className="text-white/50 hover:text-white/80">
                <ChevronLeft className="w-4 h-4 mr-1" /> PPA
              </Button>
            </Link>
            <Button onClick={handleNext} disabled={saving} className="bg-teal-600 hover:bg-teal-500 text-white">
              {saving && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
              View Report <ChevronRight className="ml-2 w-4 h-4" />
            </Button>
          </>
        }
      >
        {/* Advisory note */}
        <div className="flex items-start gap-3 bg-amber-500/10 border border-amber-500/20 rounded-xl px-4 py-3">
          <AlertCircle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
          <p className="text-amber-200/80 text-sm leading-relaxed">
            Ensure triggers are time-related and as specific as possible — these will act as the prompt to adopt a change in your strategy.
          </p>
        </div>

        <div className="text-white/50 text-sm">{activeCount} trigger{activeCount !== 1 ? 's' : ''} active</div>

        {/* Triggers list */}
        <div className="space-y-3">
          {STANDARD_TRIGGERS.map((trigger, i) => {
            const key = `t${i + 1}`
            const entry = triggers[key]
            const isActive = entry?.active || false
            return (
              <div
                key={key}
                className={`nsp-card rounded-xl p-4 border transition-all ${
                  isActive ? 'border-teal-500/40 bg-teal-500/5' : 'border-white/[0.06]'
                }`}
              >
                <div className="flex items-start gap-3">
                  <button
                    onClick={() => toggle(key)}
                    className={`flex-shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all mt-0.5 ${
                      isActive ? 'border-teal-500 bg-teal-500' : 'border-white/30 hover:border-teal-400/50'
                    }`}
                  >
                    {isActive && <div className="w-2 h-2 rounded-full bg-white" />}
                  </button>
                  <div className="flex-1 space-y-2">
                    <div className={`text-sm leading-snug ${isActive ? 'text-white' : 'text-white/60'}`}>
                      {trigger}
                    </div>
                    {isActive && (
                      <Textarea
                        value={entry?.notes || ''}
                        onChange={(e) => setNotes(key, e.target.value)}
                        placeholder="Notes on how to respond when this trigger occurs..."
                        rows={2}
                        className="bg-white/5 border-white/10 text-white/80 placeholder:text-white/30 resize-none text-sm"
                      />
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {/* General notes */}
        <div className="nsp-card rounded-xl p-5 space-y-2">
          <Label className="text-white/60 text-sm">General Trigger Notes</Label>
          <Textarea
            value={generalNotes}
            onChange={(e) => setGeneralNotes(e.target.value)}
            placeholder="Any additional notes on contingency triggers and strategy change protocols..."
            rows={4}
            className="bg-white/5 border-white/10 text-white/80 placeholder:text-white/30 resize-none"
          />
        </div>
      </WizardPage>
    </WizardLayout>
  )
}
