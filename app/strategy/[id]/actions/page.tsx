'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { WizardLayout, WizardPage } from '@/components/wizard/WizardLayout'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ACTION_PLANNER_GUIDANCE, ALL_STRATEGIES, type StrategyName } from '@/lib/decision-tree'
import { Loader2, ChevronRight, ChevronLeft } from 'lucide-react'

interface ActionPlanner {
  id?: string
  scenario_id: string
  planner_number: number
  strategy_label: string
  start_date: string
  phase_1: string
  phase_2: string
  phase_3: string
  phase_4: string
  phase_5: string
  notes: string
}

interface ScenarioInfo { id: string; name: string; strategy: string }

export default function ActionsPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter()
  const [id, setId] = useState('')
  const [projectName, setProjectName] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [scenarios, setScenarios] = useState<ScenarioInfo[]>([])
  const [planners, setPlanners] = useState<Record<string, ActionPlanner[]>>({})
  const [activeScenario, setActiveScenario] = useState('')
  const [activePlanner, setActivePlanner] = useState('1')

  useEffect(() => {
    params.then(({ id: pid }) => { setId(pid); loadData(pid) })
  }, [params])

  async function loadData(pid: string) {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/auth/login'); return }

    const [{ data: project }, { data: scens }] = await Promise.all([
      supabase.from('strategy_projects').select('name').eq('id', pid).single(),
      supabase.from('scenarios').select('*').eq('project_id', pid).order('scenario_number'),
    ])
    if (!project) { router.push('/dashboard'); return }
    setProjectName(project.name)

    const scenList: ScenarioInfo[] = (scens || []).map((s) => ({
      id: s.id,
      name: s.name || `Scenario ${s.scenario_number}`,
      strategy: s.strategy || '',
    }))
    setScenarios(scenList)
    if (scenList.length > 0) setActiveScenario(scenList[0].id)

    const plannerMap: Record<string, ActionPlanner[]> = {}
    for (const s of scenList) {
      const { data: ap } = await supabase.from('action_planners').select('*').eq('scenario_id', s.id).order('planner_number')
      const defaultPlanners = Array.from({ length: 5 }, (_, i) => {
        const existing = ap?.find((p) => p.planner_number === i + 1)
        const strat = (existing?.strategy_label || s.strategy || '') as StrategyName
        const guidance = ACTION_PLANNER_GUIDANCE[strat as StrategyName] || null
        return {
          id: existing?.id,
          scenario_id: s.id,
          planner_number: i + 1,
          strategy_label: existing?.strategy_label || s.strategy || '',
          start_date: existing?.start_date || '',
          phase_1: existing?.phase_1 || guidance?.phase_1 || '',
          phase_2: existing?.phase_2 || guidance?.phase_2 || '',
          phase_3: existing?.phase_3 || guidance?.phase_3 || '',
          phase_4: existing?.phase_4 || guidance?.phase_4 || '',
          phase_5: existing?.phase_5 || guidance?.phase_5 || '',
          notes: existing?.notes || '',
        }
      })
      plannerMap[s.id] = defaultPlanners
    }
    setPlanners(plannerMap)
    setLoading(false)
  }

  function updatePlanner(scenId: string, plannerNum: number, field: string, value: string) {
    setPlanners((prev) => ({
      ...prev,
      [scenId]: prev[scenId].map((p) =>
        p.planner_number === plannerNum ? { ...p, [field]: value } : p
      ),
    }))
  }

  function applyGuidance(scenId: string, plannerNum: number, stratLabel: string) {
    const guidance = ACTION_PLANNER_GUIDANCE[stratLabel as StrategyName]
    if (!guidance) return
    setPlanners((prev) => ({
      ...prev,
      [scenId]: prev[scenId].map((p) =>
        p.planner_number === plannerNum
          ? { ...p, strategy_label: stratLabel, phase_1: guidance.phase_1, phase_2: guidance.phase_2, phase_3: guidance.phase_3, phase_4: guidance.phase_4, phase_5: guidance.phase_5 }
          : p
      ),
    }))
  }

  async function handleNext() {
    setSaving(true)
    const supabase = createClient()
    for (const [, ps] of Object.entries(planners)) {
      for (const p of ps) {
        await supabase.from('action_planners').upsert(
          { scenario_id: p.scenario_id, planner_number: p.planner_number, strategy_label: p.strategy_label, start_date: p.start_date || null, phase_1: p.phase_1, phase_2: p.phase_2, phase_3: p.phase_3, phase_4: p.phase_4, phase_5: p.phase_5, notes: p.notes },
          { onConflict: 'scenario_id,planner_number' }
        )
      }
    }
    setSaving(false)
    router.push(`/strategy/${id}/ppa`)
  }

  const PHASES = ['Preparation', 'Opening', 'Proposal', 'Bargaining', 'Closing']

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--brand-navy)' }}>
      <Loader2 className="w-6 h-6 animate-spin text-teal-400" />
    </div>
  )

  const currentPlanners = planners[activeScenario] || []
  const currentPlanner = currentPlanners.find((p) => p.planner_number === parseInt(activePlanner))

  return (
    <WizardLayout projectId={id} projectName={projectName} currentStep={8} completedSteps={[1,2,3,4,5,6,7]}>
      <WizardPage
        title="Action Planners"
        description="5 action planners per scenario — mapped to each negotiation phase."
        step={8}
        actions={
          <>
            <Link href={`/strategy/${id}/phases`}>
              <Button variant="ghost" className="text-white/50 hover:text-white/80">
                <ChevronLeft className="w-4 h-4 mr-1" /> Phases
              </Button>
            </Link>
            <Button onClick={handleNext} disabled={saving} className="bg-teal-600 hover:bg-teal-500 text-white">
              {saving && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
              Next: PPA <ChevronRight className="ml-2 w-4 h-4" />
            </Button>
          </>
        }
      >
        {/* Scenario selector */}
        {scenarios.length > 1 && (
          <div className="flex gap-2">
            {scenarios.map((s) => (
              <button
                key={s.id}
                onClick={() => { setActiveScenario(s.id); setActivePlanner('1') }}
                className={`px-4 py-2 rounded-lg text-sm border transition-all ${
                  activeScenario === s.id
                    ? 'bg-teal-500/20 border-teal-500/40 text-teal-300'
                    : 'border-white/10 text-white/50 hover:border-white/20 hover:text-white/70'
                }`}
              >
                {s.name}
              </button>
            ))}
          </div>
        )}

        <Tabs value={activePlanner} onValueChange={setActivePlanner}>
          <TabsList className="bg-white/5 border border-white/10 mb-5 flex-wrap h-auto">
            {Array.from({ length: 5 }, (_, i) => (
              <TabsTrigger key={i + 1} value={String(i + 1)} className="data-[state=active]:bg-teal-500/20 data-[state=active]:text-teal-300">
                Planner {i + 1}
              </TabsTrigger>
            ))}
          </TabsList>

          {Array.from({ length: 5 }, (_, i) => {
            const p = currentPlanners[i]
            if (!p) return null
            return (
              <TabsContent key={i + 1} value={String(i + 1)}>
                <div className="space-y-4">
                  <div className="nsp-card rounded-xl p-5 grid sm:grid-cols-3 gap-4">
                    <div className="space-y-1.5">
                      <Label className="text-white/70">Strategy</Label>
                      <select
                        value={p.strategy_label}
                        onChange={(e) => {
                          updatePlanner(activeScenario, p.planner_number, 'strategy_label', e.target.value)
                          applyGuidance(activeScenario, p.planner_number, e.target.value)
                        }}
                        className="w-full h-9 rounded-md bg-white/5 border border-white/10 text-white px-3 text-sm"
                      >
                        <option value="">Select strategy...</option>
                        {ALL_STRATEGIES.map((s) => (
                          <option key={s} value={s}>{s}</option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-white/70">Start Date</Label>
                      <Input
                        type="date"
                        value={p.start_date}
                        onChange={(e) => updatePlanner(activeScenario, p.planner_number, 'start_date', e.target.value)}
                        className="bg-white/5 border-white/10 text-white"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-white/70">Notes</Label>
                      <Input
                        value={p.notes}
                        onChange={(e) => updatePlanner(activeScenario, p.planner_number, 'notes', e.target.value)}
                        placeholder="Additional notes..."
                        className="bg-white/5 border-white/10 text-white placeholder:text-white/30"
                      />
                    </div>
                  </div>

                  <div className="nsp-card rounded-xl p-5">
                    <div className="text-white/60 text-sm font-medium mb-4">Phase Actions</div>
                    <div className="grid sm:grid-cols-5 gap-3">
                      {PHASES.map((phase, pi) => (
                        <div key={phase} className="space-y-2">
                          <div className="text-xs text-teal-400 font-medium uppercase tracking-wide">{phase}</div>
                          <Textarea
                            value={(p as unknown as Record<string, string>)[`phase_${pi + 1}`] || ''}
                            onChange={(e) => updatePlanner(activeScenario, p.planner_number, `phase_${pi + 1}`, e.target.value)}
                            rows={6}
                            className="bg-white/5 border-white/10 text-white/80 placeholder:text-white/20 resize-none text-xs"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </TabsContent>
            )
          })}
        </Tabs>
      </WizardPage>
    </WizardLayout>
  )
}
