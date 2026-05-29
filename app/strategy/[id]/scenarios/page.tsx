'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { WizardLayout, WizardPage } from '@/components/wizard/WizardLayout'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Loader2, ChevronRight, ChevronLeft, Info } from 'lucide-react'
import {
  STRATEGY_DESCRIPTIONS,
  ACTION_PLANNER_GUIDANCE,
  SCENARIO_PHASE_NAMES,
  SCENARIO_LABELS,
  ALL_STRATEGIES,
  getScenarioStrategies,
  type StrategyName,
} from '@/lib/decision-tree'

type ScenarioKey = 'A' | 'B' | 'C' | 'D'
const SCENARIO_KEYS: ScenarioKey[] = ['A', 'B', 'C', 'D']
const SCENARIO_NUMBERS: Record<ScenarioKey, number> = { A: 1, B: 2, C: 3, D: 4 }

const SCENARIO_COLORS: Record<ScenarioKey, { bg: string; border: string; text: string }> = {
  A: { bg: 'rgba(3, 83, 106, 0.25)', border: 'rgba(129, 230, 217, 0.3)', text: '#81E6D9' },
  B: { bg: 'rgba(239, 65, 54, 0.15)', border: 'rgba(239, 65, 54, 0.3)', text: '#EF4136' },
  C: { bg: 'rgba(212, 175, 55, 0.15)', border: 'rgba(212, 175, 55, 0.3)', text: '#D4AF37' },
  D: { bg: 'rgba(74, 85, 104, 0.25)', border: 'rgba(74, 85, 104, 0.3)', text: '#94a3b8' },
}

interface ScenarioPhaseData {
  dbScenarioId?: string
  dbPlannerId?: string
  phaseNotes: Record<string, string> // keyed by phase_1 .. phase_5
}

export default function ScenariosPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter()
  const [id, setId] = useState('')
  const [projectName, setProjectName] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [finalStrategy, setFinalStrategy] = useState<StrategyName>('Defend')
  const [activeTab, setActiveTab] = useState<ScenarioKey>('A')
  const [phaseData, setPhaseData] = useState<Record<ScenarioKey, ScenarioPhaseData>>({
    A: { phaseNotes: {} },
    B: { phaseNotes: {} },
    C: { phaseNotes: {} },
    D: { phaseNotes: {} },
  })
  // B/C/D strategies can be overridden; A is always the chosen strategy from Step 6
  const [scenarioStrategyOverrides, setScenarioStrategyOverrides] = useState<Partial<Record<ScenarioKey, StrategyName>>>({})

  useEffect(() => {
    params.then(({ id: pid }) => {
      setId(pid)
      loadData(pid)
    })
  }, [params])

  async function loadData(pid: string) {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/auth/login'); return }

    const [{ data: project }, { data: ss }, { data: scens }] = await Promise.all([
      supabase.from('strategy_projects').select('name').eq('id', pid).single(),
      supabase.from('strategy_selection').select('final_strategy').eq('project_id', pid).maybeSingle(),
      supabase.from('scenarios').select('*').eq('project_id', pid).order('scenario_number'),
    ])
    if (!project) { router.push('/dashboard'); return }
    setProjectName(project.name)

    const strategy = (ss?.final_strategy as StrategyName) || 'Defend'
    setFinalStrategy(strategy)

    const [stratA, stratB, stratC, stratD] = getScenarioStrategies(strategy)
    const strategies: Record<ScenarioKey, StrategyName> = { A: stratA, B: stratB, C: stratC, D: stratD }

    const newPhaseData: Record<ScenarioKey, ScenarioPhaseData> = {
      A: { phaseNotes: {} },
      B: { phaseNotes: {} },
      C: { phaseNotes: {} },
      D: { phaseNotes: {} },
    }

    if (scens && scens.length > 0) {
      const plannerResults = await Promise.all(
        scens.map((s) =>
          supabase.from('phase_planners').select('*').eq('scenario_id', s.id).maybeSingle()
        )
      )
      scens.forEach((s, i) => {
        const key = SCENARIO_KEYS[s.scenario_number - 1] as ScenarioKey
        if (key) {
          newPhaseData[key] = {
            dbScenarioId: s.id,
            dbPlannerId: plannerResults[i].data?.id,
            phaseNotes: (plannerResults[i].data?.phase_data as Record<string, string>) || {},
          }
        }
      })
    } else {
      // Pre-populate with guidance
      SCENARIO_KEYS.forEach((key) => {
        const strat = strategies[key]
        const guidance = ACTION_PLANNER_GUIDANCE[strat]
        if (guidance) {
          newPhaseData[key].phaseNotes = {
            phase_1: guidance.phase_1,
            phase_2: guidance.phase_2,
            phase_3: guidance.phase_3,
            phase_4: guidance.phase_4,
            phase_5: guidance.phase_5,
          }
        }
      })
    }

    setPhaseData(newPhaseData)
    setLoading(false)
  }

  function updatePhaseNote(scenarioKey: ScenarioKey, phaseKey: string, value: string) {
    setPhaseData((prev) => ({
      ...prev,
      [scenarioKey]: {
        ...prev[scenarioKey],
        phaseNotes: { ...prev[scenarioKey].phaseNotes, [phaseKey]: value },
      },
    }))
  }

  async function handleNext() {
    setSaving(true)
    const supabase = createClient()
    const [stratA, stratB, stratC, stratD] = getScenarioStrategies(finalStrategy)
    const autoS: Record<ScenarioKey, StrategyName> = { A: stratA, B: stratB, C: stratC, D: stratD }
    const strategies: Record<ScenarioKey, StrategyName> = {
      A: autoS.A,
      B: scenarioStrategyOverrides.B ?? autoS.B,
      C: scenarioStrategyOverrides.C ?? autoS.C,
      D: scenarioStrategyOverrides.D ?? autoS.D,
    }

    for (const key of SCENARIO_KEYS) {
      const data = phaseData[key]
      const scenNum = SCENARIO_NUMBERS[key]
      const strat = strategies[key]

      let scenarioId = data.dbScenarioId
      if (!scenarioId) {
        const { data: inserted } = await supabase
          .from('scenarios')
          .upsert(
            {
              project_id: id,
              scenario_number: scenNum,
              name: `Scenario ${key}`,
              strategy: strat,
            },
            { onConflict: 'project_id,scenario_number' }
          )
          .select('id')
          .single()
        scenarioId = inserted?.id
      } else {
        await supabase
          .from('scenarios')
          .update({ name: `Scenario ${key}`, strategy: strat })
          .eq('id', scenarioId)
      }

      if (scenarioId) {
        await supabase.from('phase_planners').upsert(
          {
            scenario_id: scenarioId,
            phase_data: data.phaseNotes,
          },
          { onConflict: 'scenario_id' }
        )
        setPhaseData((prev) => ({
          ...prev,
          [key]: { ...prev[key], dbScenarioId: scenarioId },
        }))
      }
    }

    setSaving(false)
    router.push(`/strategy/${id}/ppa`)
  }

  if (loading)
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#012A36' }}>
        <Loader2 className="w-6 h-6 animate-spin" style={{ color: '#81E6D9' }} />
      </div>
    )

  const [stratA, stratB, stratC, stratD] = getScenarioStrategies(finalStrategy)
  const autoStrategies: Record<ScenarioKey, StrategyName> = { A: stratA, B: stratB, C: stratC, D: stratD }
  const strategies: Record<ScenarioKey, StrategyName> = {
    A: autoStrategies.A,
    B: scenarioStrategyOverrides.B ?? autoStrategies.B,
    C: scenarioStrategyOverrides.C ?? autoStrategies.C,
    D: scenarioStrategyOverrides.D ?? autoStrategies.D,
  }

  function overrideScenarioStrategy(key: ScenarioKey, strat: StrategyName) {
    if (key === 'A') return
    setScenarioStrategyOverrides((prev) => ({ ...prev, [key]: strat }))
    // Pre-populate phase notes with new guidance only if phases are still empty
    const guidance = ACTION_PLANNER_GUIDANCE[strat]
    if (guidance) {
      setPhaseData((prev) => ({
        ...prev,
        [key]: {
          ...prev[key],
          phaseNotes: {
            phase_1: prev[key].phaseNotes.phase_1 || guidance.phase_1,
            phase_2: prev[key].phaseNotes.phase_2 || guidance.phase_2,
            phase_3: prev[key].phaseNotes.phase_3 || guidance.phase_3,
            phase_4: prev[key].phaseNotes.phase_4 || guidance.phase_4,
            phase_5: prev[key].phaseNotes.phase_5 || guidance.phase_5,
          },
        },
      }))
    }
  }

  return (
    <WizardLayout projectId={id} projectName={projectName} currentStep={7} completedSteps={[1, 2, 3, 4, 5, 6]}>
      <WizardPage
        title="Scenario Planning"
        description="Your chosen strategy becomes Scenario A. Scenarios B, C, and D are auto-generated as escalation fallbacks."
        step={7}
        actions={
          <>
            <Link href={`/strategy/${id}/strategy`}>
              <Button variant="ghost" className="text-white/50 hover:text-white/80">
                <ChevronLeft className="w-4 h-4 mr-1" /> Strategy
              </Button>
            </Link>
            <Button
              onClick={handleNext}
              disabled={saving}
              style={{ background: '#03536A', color: '#F7FAFC' }}
              className="hover:opacity-90"
            >
              {saving && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
              Next: PPA <ChevronRight className="ml-2 w-4 h-4" />
            </Button>
          </>
        }
      >
        {/* Scenario cascade overview */}
        <div className="grid grid-cols-4 gap-2 mb-2">
          {SCENARIO_KEYS.map((key, i) => {
            const col = SCENARIO_COLORS[key]
            const strat = strategies[key]
            return (
              <div
                key={key}
                className="rounded-lg p-3 text-center relative"
                style={{ background: col.bg, border: `1px solid ${col.border}` }}
              >
                {i > 0 && (
                  <div className="absolute -left-3 top-1/2 -translate-y-1/2 text-white/30 text-xs font-bold z-10">
                    ↓
                  </div>
                )}
                <div className="text-xs font-bold mb-1" style={{ color: col.text }}>
                  Scenario {key}
                </div>
                <div className="text-white text-xs font-semibold">{strat}</div>
                <div className="text-white/40 text-xs mt-0.5 leading-snug hidden sm:block">
                  {key === 'D' ? 'Exit' : key === 'C' ? 'Escalate down' : key === 'B' ? 'Fallback' : 'Primary'}
                </div>
              </div>
            )
          })}
        </div>

        {/* Info note */}
        <div
          className="flex items-start gap-3 rounded-xl px-4 py-3"
          style={{ background: 'rgba(3, 83, 106, 0.15)', border: '1px solid rgba(129,230,217,0.15)' }}
        >
          <Info className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: '#81E6D9' }} />
          <p className="text-white/60 text-sm leading-relaxed">
            Each scenario has 5 phases with pre-populated guidance. Edit to match your specific negotiation.
            Notes are saved automatically when you click Next.
          </p>
        </div>

        {/* Scenario tabs */}
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as ScenarioKey)}>
          <TabsList className="bg-white/5 border border-white/10 mb-5 h-auto flex-wrap gap-1 p-1">
            {SCENARIO_KEYS.map((key) => {
              const col = SCENARIO_COLORS[key]
              return (
                <TabsTrigger
                  key={key}
                  value={key}
                  className="data-[state=active]:text-white text-white/50 px-4 py-2"
                  style={activeTab === key ? { background: col.bg, color: col.text } : {}}
                >
                  <span className="font-semibold">Scenario {key}</span>
                  <span className="ml-2 text-xs hidden sm:inline opacity-70">— {strategies[key]}</span>
                </TabsTrigger>
              )
            })}
          </TabsList>

          {SCENARIO_KEYS.map((key) => {
            const col = SCENARIO_COLORS[key]
            const strat = strategies[key]
            const phaseNames = SCENARIO_PHASE_NAMES[key]
            const data = phaseData[key]
            const guidance = ACTION_PLANNER_GUIDANCE[strat]

            return (
              <TabsContent key={key} value={key} className="space-y-5">
                {/* Scenario header */}
                <div
                  className="rounded-xl p-4"
                  style={{ background: col.bg, border: `1px solid ${col.border}` }}
                >
                  <div className="text-xs uppercase tracking-wider mb-1 font-semibold" style={{ color: col.text }}>
                    {SCENARIO_LABELS[key]}
                  </div>
                  <div className="flex items-baseline gap-3">
                    <span className="text-white text-xl font-bold">{strat}</span>
                    <span className="text-white/50 text-sm">{STRATEGY_DESCRIPTIONS[strat]}</span>
                  </div>
                </div>

                {/* Phase grid */}
                {/* Strategy selector — locked for A, dropdown for B/C/D */}
                {key !== 'A' ? (
                  <div
                    className="flex items-center gap-3 rounded-xl px-4 py-3"
                    style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)' }}
                  >
                    <span className="text-white/50 text-sm flex-shrink-0">Strategy:</span>
                    <select
                      value={strategies[key]}
                      onChange={(e) => overrideScenarioStrategy(key, e.target.value as StrategyName)}
                      className="flex-1 text-white text-sm outline-none cursor-pointer rounded px-2 py-1"
                      style={{ background: 'rgba(3,83,106,0.4)', border: '1px solid rgba(129,230,217,0.2)' }}
                    >
                      {ALL_STRATEGIES.map((s) => (
                        <option key={s} value={s} style={{ background: '#012A36', color: '#F7FAFC' }}>
                          {s}{s === autoStrategies[key] ? ' ✓ recommended' : ''}
                        </option>
                      ))}
                    </select>
                    {scenarioStrategyOverrides[key] && scenarioStrategyOverrides[key] !== autoStrategies[key] && (
                      <button
                        onClick={() => setScenarioStrategyOverrides((p) => { const n = { ...p }; delete n[key]; return n })}
                        className="text-xs flex-shrink-0 px-2 py-1 rounded"
                        style={{ color: 'var(--cp-orange)', border: '1px solid rgba(239,65,54,0.3)' }}
                      >
                        Reset
                      </button>
                    )}
                  </div>
                ) : (
                  <div
                    className="flex items-center gap-2 rounded-xl px-4 py-3"
                    style={{ background: 'rgba(3,83,106,0.15)', border: '1px solid rgba(129,230,217,0.15)' }}
                  >
                    <span className="text-white/40 text-sm">Strategy locked to Step 6 selection:</span>
                    <span className="text-white font-semibold text-sm" style={{ color: col.text }}>{strategies.A}</span>
                  </div>
                )}

                <div className="nsp-card rounded-xl p-5">
                  <div className="text-white/60 text-sm font-medium mb-4">Phase Planning</div>
                  <div className="grid sm:grid-cols-5 gap-3">
                    {phaseNames.map((phaseName, pi) => {
                      const phaseKey = `phase_${pi + 1}`
                      const placeholder = guidance
                        ? (guidance as Record<string, string>)[phaseKey] || `${phaseName} actions...`
                        : `${phaseName} actions...`
                      return (
                        <div key={phaseKey} className="space-y-2">
                          <div
                            className="text-xs font-semibold uppercase tracking-wide"
                            style={{ color: col.text }}
                          >
                            {pi + 1}. {phaseName}
                          </div>
                          <Textarea
                            value={data.phaseNotes[phaseKey] || ''}
                            onChange={(e) => updatePhaseNote(key, phaseKey, e.target.value)}
                            placeholder={placeholder}
                            rows={6}
                            className="bg-white/5 border-white/10 text-white/80 placeholder:text-white/20 resize-none text-xs leading-relaxed"
                          />
                        </div>
                      )
                    })}
                  </div>
                </div>

                {/* Guidance reference */}
                {guidance && (
                  <div className="nsp-card rounded-xl p-4">
                    <div className="text-white/40 text-xs uppercase tracking-wider mb-3">
                      Methodology Guidance — {strat}
                    </div>
                    <div className="grid sm:grid-cols-5 gap-3">
                      {phaseNames.map((phaseName, pi) => {
                        const phaseKey = `phase_${pi + 1}` as keyof typeof guidance
                        return (
                          <div key={phaseKey} className="space-y-1">
                            <div className="text-xs text-white/30 font-medium">{phaseName}</div>
                            <div className="text-white/40 text-xs leading-relaxed">{guidance[phaseKey]}</div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}
              </TabsContent>
            )
          })}
        </Tabs>
      </WizardPage>
    </WizardLayout>
  )
}
