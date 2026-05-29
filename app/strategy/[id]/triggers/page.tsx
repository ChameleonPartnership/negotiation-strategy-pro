'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { WizardLayout, WizardPage } from '@/components/wizard/WizardLayout'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Loader2, ChevronRight, ChevronLeft, Plus, Trash2, AlertCircle, ArrowDown } from 'lucide-react'
import {
  STANDARD_TRIGGERS,
  SCENARIO_PHASE_NAMES,
  getScenarioStrategies,
  type StrategyName,
} from '@/lib/decision-tree'

type TransitionKey = 'A_to_B' | 'B_to_C' | 'C_to_D'
const TRANSITIONS: TransitionKey[] = ['A_to_B', 'B_to_C', 'C_to_D']

const TRANSITION_LABELS: Record<TransitionKey, { from: string; to: string; label: string }> = {
  A_to_B: { from: 'A', to: 'B', label: 'Escalate A → B' },
  B_to_C: { from: 'B', to: 'C', label: 'Escalate B → C' },
  C_to_D: { from: 'C', to: 'D', label: 'Escalate C → D (Exit)' },
}

type ScenarioKey = 'A' | 'B' | 'C' | 'D'

const SCENARIO_COLORS: Record<ScenarioKey, { bg: string; border: string; text: string }> = {
  A: { bg: 'rgba(3, 83, 106, 0.35)', border: 'rgba(129, 230, 217, 0.4)', text: '#81E6D9' },
  B: { bg: 'rgba(239, 65, 54, 0.2)', border: 'rgba(239, 65, 54, 0.35)', text: '#EF4136' },
  C: { bg: 'rgba(212, 175, 55, 0.2)', border: 'rgba(212, 175, 55, 0.35)', text: '#D4AF37' },
  D: { bg: 'rgba(74, 85, 104, 0.25)', border: 'rgba(74, 85, 104, 0.35)', text: '#94a3b8' },
}

const TRANSITION_COLORS: Record<TransitionKey, { bg: string; border: string; text: string }> = {
  A_to_B: { bg: 'rgba(3, 83, 106, 0.15)', border: 'rgba(129, 230, 217, 0.2)', text: '#81E6D9' },
  B_to_C: { bg: 'rgba(239, 65, 54, 0.1)', border: 'rgba(239, 65, 54, 0.2)', text: '#EF4136' },
  C_to_D: { bg: 'rgba(212, 175, 55, 0.1)', border: 'rgba(212, 175, 55, 0.2)', text: '#D4AF37' },
}

interface TriggerItem {
  key: string
  text: string
  active: boolean
  notes: string
  isCustom?: boolean
  weeksThreshold?: number
}

interface TriggerGroup {
  standardTriggers: TriggerItem[]
  customTriggers: TriggerItem[]
  weeksThreshold: number | ''
  useWeeksTrigger: boolean
}

function defaultGroup(transition: TransitionKey): TriggerGroup {
  return {
    standardTriggers: STANDARD_TRIGGERS[transition].map((text, i) => ({
      key: `std_${i}`,
      text,
      active: false,
      notes: '',
    })),
    customTriggers: [],
    weeksThreshold: '',
    useWeeksTrigger: false,
  }
}

export default function TriggersPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter()
  const [id, setId] = useState('')
  const [projectName, setProjectName] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [finalStrategy, setFinalStrategy] = useState<StrategyName>('Defend')
  const [groups, setGroups] = useState<Record<TransitionKey, TriggerGroup>>({
    A_to_B: defaultGroup('A_to_B'),
    B_to_C: defaultGroup('B_to_C'),
    C_to_D: defaultGroup('C_to_D'),
  })

  useEffect(() => {
    params.then(({ id: pid }) => { setId(pid); loadData(pid) })
  }, [params])

  async function loadData(pid: string) {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/auth/login'); return }

    const [{ data: project }, { data: ss }, { data: trig }] = await Promise.all([
      supabase.from('strategy_projects').select('name').eq('id', pid).single(),
      supabase.from('strategy_selection').select('final_strategy').eq('project_id', pid).maybeSingle(),
      supabase.from('triggers').select('*').eq('project_id', pid).maybeSingle(),
    ])
    if (!project) { router.push('/dashboard'); return }
    setProjectName(project.name)

    const strategy = (ss?.final_strategy as StrategyName) || 'Defend'
    setFinalStrategy(strategy)

    if (trig?.trigger_data) {
      const saved = trig.trigger_data as Record<TransitionKey, Partial<TriggerGroup>>
      const restored: Record<TransitionKey, TriggerGroup> = {
        A_to_B: defaultGroup('A_to_B'),
        B_to_C: defaultGroup('B_to_C'),
        C_to_D: defaultGroup('C_to_D'),
      }
      for (const tk of TRANSITIONS) {
        if (saved[tk]) {
          const s = saved[tk]
          restored[tk] = {
            standardTriggers: defaultGroup(tk).standardTriggers.map((st, i) => ({
              ...st,
              active: s.standardTriggers?.[i]?.active ?? false,
              notes: s.standardTriggers?.[i]?.notes ?? '',
            })),
            customTriggers: s.customTriggers || [],
            weeksThreshold: s.weeksThreshold ?? '',
            useWeeksTrigger: s.useWeeksTrigger ?? false,
          }
        }
      }
      setGroups(restored)
    }
    setLoading(false)
  }

  function toggleStandard(transition: TransitionKey, idx: number) {
    setGroups((prev) => ({
      ...prev,
      [transition]: {
        ...prev[transition],
        standardTriggers: prev[transition].standardTriggers.map((t, i) =>
          i === idx ? { ...t, active: !t.active } : t
        ),
      },
    }))
  }

  function setStandardNotes(transition: TransitionKey, idx: number, notes: string) {
    setGroups((prev) => ({
      ...prev,
      [transition]: {
        ...prev[transition],
        standardTriggers: prev[transition].standardTriggers.map((t, i) =>
          i === idx ? { ...t, notes } : t
        ),
      },
    }))
  }

  function addCustom(transition: TransitionKey) {
    setGroups((prev) => ({
      ...prev,
      [transition]: {
        ...prev[transition],
        customTriggers: [
          ...prev[transition].customTriggers,
          { key: `custom_${Date.now()}`, text: '', active: true, notes: '', isCustom: true },
        ],
      },
    }))
  }

  function updateCustom(transition: TransitionKey, idx: number, field: 'text' | 'notes', value: string) {
    setGroups((prev) => ({
      ...prev,
      [transition]: {
        ...prev[transition],
        customTriggers: prev[transition].customTriggers.map((t, i) =>
          i === idx ? { ...t, [field]: value } : t
        ),
      },
    }))
  }

  function removeCustom(transition: TransitionKey, idx: number) {
    setGroups((prev) => ({
      ...prev,
      [transition]: {
        ...prev[transition],
        customTriggers: prev[transition].customTriggers.filter((_, i) => i !== idx),
      },
    }))
  }

  function updateWeeks(transition: TransitionKey, value: string) {
    setGroups((prev) => ({
      ...prev,
      [transition]: {
        ...prev[transition],
        weeksThreshold: value === '' ? '' : Number(value),
      },
    }))
  }

  function toggleWeeks(transition: TransitionKey) {
    setGroups((prev) => ({
      ...prev,
      [transition]: {
        ...prev[transition],
        useWeeksTrigger: !prev[transition].useWeeksTrigger,
      },
    }))
  }

  async function handleNext() {
    setSaving(true)
    const supabase = createClient()
    await supabase.from('triggers').upsert(
      { project_id: id, trigger_data: groups, notes: null },
      { onConflict: 'project_id' }
    )
    setSaving(false)
    router.push(`/strategy/${id}/report`)
  }

  if (loading)
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#012A36' }}>
        <Loader2 className="w-6 h-6 animate-spin" style={{ color: '#81E6D9' }} />
      </div>
    )

  const [stratA, stratB, stratC, stratD] = getScenarioStrategies(finalStrategy)
  const strategies: Record<ScenarioKey, StrategyName> = { A: stratA, B: stratB, C: stratC, D: stratD }
  const scenarioKeys: ScenarioKey[] = ['A', 'B', 'C', 'D']

  const totalActive = TRANSITIONS.reduce((sum, tk) => {
    const g = groups[tk]
    return (
      sum +
      g.standardTriggers.filter((t) => t.active).length +
      g.customTriggers.filter((t) => t.text).length +
      (g.useWeeksTrigger ? 1 : 0)
    )
  }, 0)

  return (
    <WizardLayout
      projectId={id}
      projectName={projectName}
      currentStep={9}
      completedSteps={[1, 2, 3, 4, 5, 6, 7, 8]}
    >
      <WizardPage
        title="Triggers & Escalation"
        description="Define when you escalate from one scenario to the next. Triggers should be specific and time-bound where possible."
        step={9}
        actions={
          <>
            <Link href={`/strategy/${id}/ppa`}>
              <Button variant="ghost" className="text-white/50 hover:text-white/80">
                <ChevronLeft className="w-4 h-4 mr-1" /> PPA
              </Button>
            </Link>
            <Button
              onClick={handleNext}
              disabled={saving}
              style={{ background: '#EF4136', color: '#F7FAFC' }}
              className="hover:opacity-90"
            >
              {saving && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
              View Report <ChevronRight className="ml-2 w-4 h-4" />
            </Button>
          </>
        }
      >
        {/* Advisory */}
        <div
          className="flex items-start gap-3 rounded-xl px-4 py-3"
          style={{ background: 'rgba(239, 65, 54, 0.08)', border: '1px solid rgba(239, 65, 54, 0.2)' }}
        >
          <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: '#EF4136' }} />
          <p className="text-sm leading-relaxed" style={{ color: 'rgba(239, 65, 54, 0.85)' }}>
            Ensure triggers are time-related and as specific as possible — these act as the prompt to adopt a
            change in your strategy. Agree escalation triggers with your team before entering the negotiation.
          </p>
        </div>

        {/* Visual cascade diagram */}
        <div className="nsp-card rounded-xl p-5">
          <div className="text-white/50 text-xs uppercase tracking-wider mb-4">Escalation Cascade</div>
          <div className="space-y-1">
            {scenarioKeys.map((key, i) => {
              const col = SCENARIO_COLORS[key]
              const phases = SCENARIO_PHASE_NAMES[key]
              const strat = strategies[key]
              return (
                <div key={key}>
                  {/* Scenario row */}
                  <div
                    className="rounded-lg p-3 flex items-center gap-3"
                    style={{ background: col.bg, border: `1px solid ${col.border}` }}
                  >
                    <div
                      className="w-8 h-8 rounded-md flex items-center justify-center text-sm font-bold flex-shrink-0"
                      style={{ background: `${col.text}22`, color: col.text }}
                    >
                      {key}
                    </div>
                    <div className="flex-1">
                      <div className="text-xs font-bold mb-1" style={{ color: col.text }}>
                        Scenario {key} — {strat}
                      </div>
                      {/* Chevron phases */}
                      <div className="flex items-center gap-1 overflow-x-auto pb-1">
                        {phases.map((phase, pi) => (
                          <div key={phase} className="flex items-center gap-1 flex-shrink-0">
                            <div
                              className="text-xs px-2 py-0.5 rounded"
                              style={{ background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.6)' }}
                            >
                              {phase}
                            </div>
                            {pi < phases.length - 1 && (
                              <span className="text-white/20 text-xs">›</span>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Arrow between scenarios (not after last) */}
                  {i < scenarioKeys.length - 1 && (
                    <div className="flex items-center justify-center py-2">
                      <div className="flex flex-col items-center gap-1">
                        <ArrowDown className="w-4 h-4 text-white/30" />
                        <span className="text-white/30 text-xs">Escalate?</span>
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {/* Active trigger count */}
        <div className="text-white/40 text-sm">
          {totalActive} trigger{totalActive !== 1 ? 's' : ''} configured
        </div>

        {/* Trigger groups */}
        <div className="space-y-6">
          {TRANSITIONS.map((tk) => {
            const tl = TRANSITION_LABELS[tk]
            const col = TRANSITION_COLORS[tk]
            const g = groups[tk]
            const activeCount =
              g.standardTriggers.filter((t) => t.active).length +
              g.customTriggers.filter((t) => t.text).length +
              (g.useWeeksTrigger ? 1 : 0)

            return (
              <div key={tk} className="nsp-card rounded-xl overflow-hidden">
                {/* Group header */}
                <div
                  className="px-5 py-3.5 flex items-center gap-3 border-b border-white/10"
                  style={{ background: col.bg }}
                >
                  <div
                    className="text-xs font-bold uppercase tracking-wider px-2.5 py-1 rounded"
                    style={{ background: `${col.text}22`, color: col.text, border: `1px solid ${col.border}` }}
                  >
                    {tl.label}
                  </div>
                  <div className="text-white/50 text-xs">
                    From Scenario {tl.from} ({strategies[tl.from as ScenarioKey]}) → Scenario {tl.to} ({strategies[tl.to as ScenarioKey]})
                  </div>
                  <div className="ml-auto text-white/30 text-xs">{activeCount} active</div>
                </div>

                <div className="p-5 space-y-4">
                  {/* Standard triggers */}
                  <div>
                    <div className="text-white/50 text-xs uppercase tracking-wider mb-3">Standard Triggers</div>
                    <div className="space-y-2">
                      {g.standardTriggers.map((trigger, ti) => (
                        <div key={trigger.key}>
                          <div
                            className="flex items-start gap-3 rounded-lg px-3 py-2.5 transition-all"
                            style={
                              trigger.active
                                ? { background: `${col.text}0f`, border: `1px solid ${col.text}33` }
                                : { background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }
                            }
                          >
                            <button
                              onClick={() => toggleStandard(tk, ti)}
                              className="flex-shrink-0 w-5 h-5 rounded border-2 flex items-center justify-center transition-all mt-0.5"
                              style={
                                trigger.active
                                  ? { background: col.text, borderColor: col.text }
                                  : { borderColor: 'rgba(255,255,255,0.25)' }
                              }
                            >
                              {trigger.active && (
                                <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                </svg>
                              )}
                            </button>
                            <div className="flex-1 space-y-2">
                              <div
                                className="text-sm leading-snug"
                                style={{ color: trigger.active ? '#F7FAFC' : 'rgba(255,255,255,0.5)' }}
                              >
                                {trigger.text}
                              </div>
                              {trigger.active && (
                                <Input
                                  value={trigger.notes}
                                  onChange={(e) => setStandardNotes(tk, ti, e.target.value)}
                                  placeholder="Response notes..."
                                  className="bg-white/5 border-white/10 text-white/70 placeholder:text-white/25 text-xs h-7"
                                />
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Time-based trigger */}
                  <div
                    className="rounded-lg px-4 py-3 flex items-center gap-4"
                    style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}
                  >
                    <button
                      onClick={() => toggleWeeks(tk)}
                      className="flex-shrink-0 w-5 h-5 rounded border-2 flex items-center justify-center transition-all"
                      style={
                        g.useWeeksTrigger
                          ? { background: col.text, borderColor: col.text }
                          : { borderColor: 'rgba(255,255,255,0.25)' }
                      }
                    >
                      {g.useWeeksTrigger && (
                        <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </button>
                    <span className="text-white/60 text-sm">If</span>
                    <Input
                      type="number"
                      min="1"
                      max="52"
                      value={g.weeksThreshold}
                      onChange={(e) => updateWeeks(tk, e.target.value)}
                      placeholder="X"
                      className="w-16 bg-white/5 border-white/10 text-white/80 text-sm h-8 text-center"
                      onClick={() => !g.useWeeksTrigger && toggleWeeks(tk)}
                    />
                    <span className="text-white/60 text-sm">weeks pass without meaningful progress</span>
                  </div>

                  {/* Custom triggers */}
                  {g.customTriggers.length > 0 && (
                    <div>
                      <div className="text-white/50 text-xs uppercase tracking-wider mb-3">Custom Triggers</div>
                      <div className="space-y-2">
                        {g.customTriggers.map((ct, ci) => (
                          <div key={ct.key} className="flex items-start gap-2">
                            <Input
                              value={ct.text}
                              onChange={(e) => updateCustom(tk, ci, 'text', e.target.value)}
                              placeholder="Describe custom trigger condition..."
                              className="flex-1 bg-white/5 border-white/10 text-white/80 placeholder:text-white/25 text-sm"
                            />
                            <Input
                              value={ct.notes}
                              onChange={(e) => updateCustom(tk, ci, 'notes', e.target.value)}
                              placeholder="Notes..."
                              className="w-40 bg-white/5 border-white/10 text-white/80 placeholder:text-white/25 text-sm"
                            />
                            <button
                              onClick={() => removeCustom(tk, ci)}
                              className="flex-shrink-0 text-white/20 hover:text-red-400 transition-colors mt-2"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Add custom button */}
                  <button
                    onClick={() => addCustom(tk)}
                    className="flex items-center gap-2 text-sm transition-colors"
                    style={{ color: col.text }}
                  >
                    <Plus className="w-4 h-4" /> Add custom trigger
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      </WizardPage>
    </WizardLayout>
  )
}
