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
import { Loader2, ChevronRight, ChevronLeft, Plus } from 'lucide-react'

interface ScenarioData {
  id?: string
  scenario_number: number
  name: string
  strategy: string
  phase_data: Record<string, string>
  trigger_a: string
  trigger_b: string
  trigger_c: string
  trigger_d: string
}

export default function PhasesPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter()
  const [id, setId] = useState('')
  const [projectName, setProjectName] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [finalStrategy, setFinalStrategy] = useState('')
  const [scenarios, setScenarios] = useState<ScenarioData[]>([])
  const [activeTab, setActiveTab] = useState('1')

  useEffect(() => {
    params.then(({ id: pid }) => { setId(pid); loadData(pid) })
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
    setFinalStrategy(ss?.final_strategy || '')

    if (scens && scens.length > 0) {
      // Load phase planners
      const planners = await Promise.all(
        scens.map((s) => supabase.from('phase_planners').select('*').eq('scenario_id', s.id).maybeSingle())
      )
      const enriched: ScenarioData[] = scens.map((s, i) => ({
        id: s.id,
        scenario_number: s.scenario_number,
        name: s.name || '',
        strategy: s.strategy || ss?.final_strategy || '',
        phase_data: (planners[i].data?.phase_data as Record<string, string>) || {},
        trigger_a: planners[i].data?.trigger_a || '',
        trigger_b: planners[i].data?.trigger_b || '',
        trigger_c: planners[i].data?.trigger_c || '',
        trigger_d: planners[i].data?.trigger_d || '',
      }))
      setScenarios(enriched)
    } else {
      // Default: 1 scenario
      setScenarios([{
        scenario_number: 1,
        name: 'Scenario A',
        strategy: ss?.final_strategy || '',
        phase_data: {},
        trigger_a: '',
        trigger_b: '',
        trigger_c: '',
        trigger_d: '',
      }])
    }
    setLoading(false)
  }

  function updateScenario(index: number, field: string, value: string) {
    const next = scenarios.map((s, i) => i === index ? { ...s, [field]: value } : s)
    setScenarios(next)
  }

  function updatePhaseData(index: number, field: string, value: string) {
    const next = scenarios.map((s, i) => i === index ? { ...s, phase_data: { ...s.phase_data, [field]: value } } : s)
    setScenarios(next)
  }

  function addScenario() {
    if (scenarios.length >= 3) return
    setScenarios([...scenarios, {
      scenario_number: scenarios.length + 1,
      name: `Scenario ${String.fromCharCode(64 + scenarios.length + 1)}`,
      strategy: finalStrategy || '',
      phase_data: {},
      trigger_a: '',
      trigger_b: '',
      trigger_c: '',
      trigger_d: '',
    }])
    setActiveTab(String(scenarios.length + 1))
  }

  async function handleNext() {
    setSaving(true)
    const supabase = createClient()
    for (const s of scenarios) {
      let scenarioId = s.id
      if (!scenarioId) {
        const { data } = await supabase.from('scenarios').upsert(
          { project_id: id, scenario_number: s.scenario_number, name: s.name, strategy: s.strategy },
          { onConflict: 'project_id,scenario_number' }
        ).select('id').single()
        scenarioId = data?.id
      } else {
        await supabase.from('scenarios').update({ name: s.name, strategy: s.strategy }).eq('id', scenarioId)
      }
      if (scenarioId) {
        await supabase.from('phase_planners').upsert(
          { scenario_id: scenarioId, phase_data: s.phase_data, trigger_a: s.trigger_a, trigger_b: s.trigger_b, trigger_c: s.trigger_c, trigger_d: s.trigger_d },
          { onConflict: 'scenario_id' }
        )
      }
    }
    setSaving(false)
    router.push(`/strategy/${id}/actions`)
  }

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--brand-navy)' }}>
      <Loader2 className="w-6 h-6 animate-spin text-teal-400" />
    </div>
  )

  const PHASES = ['Preparation', 'Opening', 'Proposal', 'Bargaining', 'Closing']

  return (
    <WizardLayout projectId={id} projectName={projectName} currentStep={7} completedSteps={[1,2,3,4,5,6]}>
      <WizardPage
        title="Strategic Phase Planner"
        description="Plan your strategic phases for each negotiation scenario (up to 3)."
        step={7}
        actions={
          <>
            <Link href={`/strategy/${id}/strategy`}>
              <Button variant="ghost" className="text-white/50 hover:text-white/80">
                <ChevronLeft className="w-4 h-4 mr-1" /> Strategy
              </Button>
            </Link>
            <Button onClick={handleNext} disabled={saving} className="bg-teal-600 hover:bg-teal-500 text-white">
              {saving && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
              Next: Actions <ChevronRight className="ml-2 w-4 h-4" />
            </Button>
          </>
        }
      >
        <div className="flex items-center justify-between mb-4">
          <div className="text-white/50 text-sm">{scenarios.length} scenario{scenarios.length !== 1 ? 's' : ''} configured</div>
          {scenarios.length < 3 && (
            <Button variant="ghost" size="sm" onClick={addScenario} className="text-teal-400 hover:text-teal-300 hover:bg-teal-500/10">
              <Plus className="w-4 h-4 mr-1" /> Add Scenario
            </Button>
          )}
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="bg-white/5 border border-white/10 mb-5">
            {scenarios.map((s) => (
              <TabsTrigger key={s.scenario_number} value={String(s.scenario_number)} className="data-[state=active]:bg-teal-500/20 data-[state=active]:text-teal-300">
                Scenario {s.scenario_number}
              </TabsTrigger>
            ))}
          </TabsList>

          {scenarios.map((s, idx) => (
            <TabsContent key={s.scenario_number} value={String(s.scenario_number)}>
              <div className="space-y-5">
                <div className="nsp-card rounded-xl p-5 grid sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-white/70">Scenario Name</Label>
                    <Input
                      value={s.name}
                      onChange={(e) => updateScenario(idx, 'name', e.target.value)}
                      placeholder="e.g. Optimistic / Realistic / Fallback"
                      className="bg-white/5 border-white/10 text-white placeholder:text-white/30"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-white/70">Strategy for this Scenario</Label>
                    <Input
                      value={s.strategy}
                      onChange={(e) => updateScenario(idx, 'strategy', e.target.value)}
                      placeholder="e.g. Hold, Position, Compromise..."
                      className="bg-white/5 border-white/10 text-white placeholder:text-white/30"
                    />
                  </div>
                </div>

                {/* Phase planning grid */}
                <div className="nsp-card rounded-xl p-5">
                  <div className="text-white/60 text-sm font-medium mb-4">Phase Planning</div>
                  <div className="grid sm:grid-cols-5 gap-3">
                    {PHASES.map((phase, pi) => (
                      <div key={phase} className="space-y-2">
                        <div className="text-xs text-teal-400 font-medium uppercase tracking-wide">{phase}</div>
                        <Textarea
                          value={s.phase_data[`phase_${pi + 1}`] || ''}
                          onChange={(e) => updatePhaseData(idx, `phase_${pi + 1}`, e.target.value)}
                          placeholder={`${phase} actions...`}
                          rows={5}
                          className="bg-white/5 border-white/10 text-white/80 placeholder:text-white/20 resize-none text-xs"
                        />
                      </div>
                    ))}
                  </div>
                </div>

                {/* Triggers */}
                <div className="nsp-card rounded-xl p-5">
                  <div className="text-white/60 text-sm font-medium mb-4">Scenario Triggers (when to adopt this scenario)</div>
                  <div className="grid sm:grid-cols-2 gap-3">
                    {(['trigger_a', 'trigger_b', 'trigger_c', 'trigger_d'] as const).map((t, ti) => (
                      <div key={t} className="space-y-1.5">
                        <Label className="text-white/50 text-xs uppercase tracking-wider">Trigger {String.fromCharCode(65 + ti)}</Label>
                        <Input
                          value={s[t]}
                          onChange={(e) => updateScenario(idx, t, e.target.value)}
                          placeholder={`Trigger condition ${String.fromCharCode(65 + ti)}...`}
                          className="bg-white/5 border-white/10 text-white placeholder:text-white/30 text-sm"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </TabsContent>
          ))}
        </Tabs>
      </WizardPage>
    </WizardLayout>
  )
}
