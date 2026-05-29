'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { WizardLayout, WizardPage } from '@/components/wizard/WizardLayout'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Loader2, ChevronRight, ChevronLeft, Plus, Trash2, AlertCircle } from 'lucide-react'
import {
  getScenarioStrategies,
  type StrategyName,
} from '@/lib/decision-tree'

type ScenarioKey = 'A' | 'B' | 'C' | 'D'
const SCENARIO_KEYS: ScenarioKey[] = ['A', 'B', 'C', 'D']
const SCENARIO_NUMBERS: Record<ScenarioKey, number> = { A: 1, B: 2, C: 3, D: 4 }
const LEVELS = ['Low', 'Medium', 'High'] as const
type Level = (typeof LEVELS)[number]

interface PPARow {
  tactic: string
  probability: Level
  seriousness: Level
  preventative_action: string
  contingency_action: string
}

interface ScenarioPPA {
  dbScenarioId?: string
  dbPPAId?: string
  rows: PPARow[]
}

function riskScore(prob: Level, ser: Level): number {
  const v: Record<Level, number> = { Low: 1, Medium: 2, High: 3 }
  return v[prob] * v[ser]
}

function riskColor(score: number): { bg: string; text: string; label: string } {
  if (score >= 6) return { bg: 'rgba(239, 65, 54, 0.2)', text: '#EF4136', label: 'High' }
  if (score >= 3) return { bg: 'rgba(212, 175, 55, 0.2)', text: '#D4AF37', label: 'Medium' }
  return { bg: 'rgba(34, 197, 94, 0.15)', text: '#22c55e', label: 'Low' }
}

function levelColor(level: Level, field: 'probability' | 'seriousness'): string {
  const colors: Record<Level, string> = {
    Low: '#22c55e',
    Medium: '#D4AF37',
    High: '#EF4136',
  }
  return colors[level]
}

function emptyRow(): PPARow {
  return { tactic: '', probability: 'Low', seriousness: 'Low', preventative_action: '', contingency_action: '' }
}

const SCENARIO_COLORS: Record<ScenarioKey, string> = {
  A: '#81E6D9',
  B: '#EF4136',
  C: '#D4AF37',
  D: '#94a3b8',
}

export default function PPAPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter()
  const [id, setId] = useState('')
  const [projectName, setProjectName] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [finalStrategy, setFinalStrategy] = useState<StrategyName>('Defend')
  const [activeTab, setActiveTab] = useState<ScenarioKey>('A')
  const [ppaData, setPpaData] = useState<Record<ScenarioKey, ScenarioPPA>>({
    A: { rows: [emptyRow()] },
    B: { rows: [emptyRow()] },
    C: { rows: [emptyRow()] },
    D: { rows: [emptyRow()] },
  })

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

    const strategy = (ss?.final_strategy as StrategyName) || 'Defend'
    setFinalStrategy(strategy)

    const newPPAData: Record<ScenarioKey, ScenarioPPA> = {
      A: { rows: [emptyRow()] },
      B: { rows: [emptyRow()] },
      C: { rows: [emptyRow()] },
      D: { rows: [emptyRow()] },
    }

    if (scens && scens.length > 0) {
      await Promise.all(
        scens.map(async (s) => {
          const key = SCENARIO_KEYS[s.scenario_number - 1] as ScenarioKey
          if (!key) return
          // Load PPA data for this scenario (using variant 'A' as primary per scenario)
          const { data: ppa } = await supabase
            .from('ppa')
            .select('*')
            .eq('scenario_id', s.id)
            .eq('variant', 'A')
            .maybeSingle()
          newPPAData[key] = {
            dbScenarioId: s.id,
            dbPPAId: ppa?.id,
            rows: (ppa?.rows as PPARow[]) || [emptyRow()],
          }
        })
      )
    }

    setPpaData(newPPAData)
    setLoading(false)
  }

  function addRow(key: ScenarioKey) {
    setPpaData((prev) => ({
      ...prev,
      [key]: { ...prev[key], rows: [...prev[key].rows, emptyRow()] },
    }))
  }

  function removeRow(key: ScenarioKey, idx: number) {
    setPpaData((prev) => ({
      ...prev,
      [key]: {
        ...prev[key],
        rows: prev[key].rows.filter((_, i) => i !== idx),
      },
    }))
  }

  function updateRow(key: ScenarioKey, idx: number, field: keyof PPARow, value: string) {
    setPpaData((prev) => ({
      ...prev,
      [key]: {
        ...prev[key],
        rows: prev[key].rows.map((r, i) => (i === idx ? { ...r, [field]: value } : r)),
      },
    }))
  }

  async function handleNext() {
    setSaving(true)
    const supabase = createClient()
    const [stratA, stratB, stratC, stratD] = getScenarioStrategies(finalStrategy)
    const strategies: Record<ScenarioKey, StrategyName> = { A: stratA, B: stratB, C: stratC, D: stratD }

    for (const key of SCENARIO_KEYS) {
      const data = ppaData[key]
      const scenNum = SCENARIO_NUMBERS[key]

      let scenarioId = data.dbScenarioId
      if (!scenarioId) {
        const { data: sc } = await supabase
          .from('scenarios')
          .upsert(
            { project_id: id, scenario_number: scenNum, name: `Scenario ${key}`, strategy: strategies[key] },
            { onConflict: 'project_id,scenario_number' }
          )
          .select('id')
          .single()
        scenarioId = sc?.id
      }

      if (scenarioId) {
        await supabase.from('ppa').upsert(
          { scenario_id: scenarioId, variant: 'A', rows: data.rows },
          { onConflict: 'scenario_id,variant' }
        )
      }
    }
    setSaving(false)
    router.push(`/strategy/${id}/triggers`)
  }

  if (loading)
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#012A36' }}>
        <Loader2 className="w-6 h-6 animate-spin" style={{ color: '#81E6D9' }} />
      </div>
    )

  const [stratA, stratB, stratC, stratD] = getScenarioStrategies(finalStrategy)
  const strategies: Record<ScenarioKey, StrategyName> = { A: stratA, B: stratB, C: stratC, D: stratD }

  return (
    <WizardLayout projectId={id} projectName={projectName} currentStep={8} completedSteps={[1, 2, 3, 4, 5, 6, 7]}>
      <WizardPage
        title="Potential Problem Analysis"
        description="For each scenario, identify tactics they may use and plan your responses. Risk is scored by probability × seriousness."
        step={8}
        actions={
          <>
            <Link href={`/strategy/${id}/scenarios`}>
              <Button variant="ghost" className="text-white/50 hover:text-white/80">
                <ChevronLeft className="w-4 h-4 mr-1" /> Scenarios
              </Button>
            </Link>
            <Button
              onClick={handleNext}
              disabled={saving}
              style={{ background: '#03536A', color: '#F7FAFC' }}
              className="hover:opacity-90"
            >
              {saving && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
              Next: Triggers <ChevronRight className="ml-2 w-4 h-4" />
            </Button>
          </>
        }
      >
        {/* Advisory */}
        <div
          className="flex items-start gap-3 rounded-xl px-4 py-3"
          style={{ background: 'rgba(212, 175, 55, 0.1)', border: '1px solid rgba(212, 175, 55, 0.2)' }}
        >
          <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: '#D4AF37' }} />
          <p className="text-sm leading-relaxed" style={{ color: 'rgba(212, 175, 55, 0.9)' }}>
            Analyse each scenario separately. Focus on tactics the other party may deploy if you escalate or
            de-escalate to that scenario.
          </p>
        </div>

        {/* Risk legend */}
        <div className="flex items-center gap-4 text-xs text-white/40">
          <span>Risk Score:</span>
          {[
            { label: 'Low (1-2)', color: '#22c55e' },
            { label: 'Medium (3-4)', color: '#D4AF37' },
            { label: 'High (6-9)', color: '#EF4136' },
          ].map((r) => (
            <div key={r.label} className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full" style={{ background: r.color }} />
              <span>{r.label}</span>
            </div>
          ))}
        </div>

        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as ScenarioKey)}>
          <TabsList className="bg-white/5 border border-white/10 mb-5 p-1 h-auto">
            {SCENARIO_KEYS.map((key) => (
              <TabsTrigger
                key={key}
                value={key}
                className="data-[state=active]:text-white text-white/50 px-4 py-2"
                style={activeTab === key ? { background: `${SCENARIO_COLORS[key]}22`, color: SCENARIO_COLORS[key] } : {}}
              >
                <span className="font-semibold">Scenario {key}</span>
                <span className="ml-2 text-xs hidden sm:inline opacity-70">— {strategies[key]}</span>
              </TabsTrigger>
            ))}
          </TabsList>

          {SCENARIO_KEYS.map((key) => {
            const data = ppaData[key]
            const col = SCENARIO_COLORS[key]
            return (
              <TabsContent key={key} value={key}>
                {/* Scenario label */}
                <div
                  className="rounded-lg px-4 py-2.5 mb-4 flex items-center gap-3"
                  style={{ background: `${col}18`, border: `1px solid ${col}33` }}
                >
                  <span className="text-xs font-bold uppercase tracking-wider" style={{ color: col }}>
                    Scenario {key}
                  </span>
                  <span className="text-white/70 text-sm font-semibold">{strategies[key]}</span>
                  <span className="text-white/40 text-xs ml-auto">{data.rows.length} row{data.rows.length !== 1 ? 's' : ''}</span>
                </div>

                <div className="nsp-card rounded-xl overflow-hidden">
                  {/* Header */}
                  <div
                    className="grid gap-0 border-b border-white/10"
                    style={{
                      gridTemplateColumns: '2fr 90px 90px 70px 1.5fr 1.5fr 36px',
                      background: 'rgba(3, 83, 106, 0.15)',
                    }}
                  >
                    {[
                      'Potential Problem / Tactic',
                      'Probability',
                      'Seriousness',
                      'Risk',
                      'Preventative Action',
                      'Contingency Action',
                      '',
                    ].map((h) => (
                      <div key={h} className="px-3 py-2.5 text-white/40 text-xs font-medium">
                        {h}
                      </div>
                    ))}
                  </div>

                  {data.rows.map((row, ri) => {
                    const score = riskScore(row.probability, row.seriousness)
                    const rc = riskColor(score)
                    return (
                      <div
                        key={ri}
                        className="grid gap-0 border-b border-white/5 hover:bg-white/[0.02]"
                        style={{ gridTemplateColumns: '2fr 90px 90px 70px 1.5fr 1.5fr 36px' }}
                      >
                        {/* Tactic */}
                        <div className="px-3 py-2">
                          <Input
                            value={row.tactic}
                            onChange={(e) => updateRow(key, ri, 'tactic', e.target.value)}
                            placeholder="Describe potential tactic..."
                            className="bg-transparent border-0 text-white/80 placeholder:text-white/20 text-sm p-0 h-auto focus-visible:ring-0"
                          />
                        </div>
                        {/* Probability */}
                        <div className="px-2 py-2 flex items-center">
                          <select
                            value={row.probability}
                            onChange={(e) => updateRow(key, ri, 'probability', e.target.value)}
                            className="w-full rounded text-xs px-1.5 py-1 focus:outline-none"
                            style={{
                              background: 'rgba(255,255,255,0.05)',
                              border: '1px solid rgba(255,255,255,0.1)',
                              color: levelColor(row.probability, 'probability'),
                            }}
                          >
                            {LEVELS.map((l) => (
                              <option key={l} value={l} style={{ background: '#012A36', color: '#F7FAFC' }}>
                                {l}
                              </option>
                            ))}
                          </select>
                        </div>
                        {/* Seriousness */}
                        <div className="px-2 py-2 flex items-center">
                          <select
                            value={row.seriousness}
                            onChange={(e) => updateRow(key, ri, 'seriousness', e.target.value)}
                            className="w-full rounded text-xs px-1.5 py-1 focus:outline-none"
                            style={{
                              background: 'rgba(255,255,255,0.05)',
                              border: '1px solid rgba(255,255,255,0.1)',
                              color: levelColor(row.seriousness, 'seriousness'),
                            }}
                          >
                            {LEVELS.map((l) => (
                              <option key={l} value={l} style={{ background: '#012A36', color: '#F7FAFC' }}>
                                {l}
                              </option>
                            ))}
                          </select>
                        </div>
                        {/* Risk score */}
                        <div className="px-2 py-2 flex items-center justify-center">
                          <span
                            className="px-2 py-0.5 rounded text-xs font-bold"
                            style={{ background: rc.bg, color: rc.text }}
                          >
                            {rc.label}
                          </span>
                        </div>
                        {/* Preventative */}
                        <div className="px-3 py-2">
                          <Input
                            value={row.preventative_action}
                            onChange={(e) => updateRow(key, ri, 'preventative_action', e.target.value)}
                            placeholder="Prevent this..."
                            className="bg-transparent border-0 text-white/80 placeholder:text-white/20 text-sm p-0 h-auto focus-visible:ring-0"
                          />
                        </div>
                        {/* Contingency */}
                        <div className="px-3 py-2">
                          <Input
                            value={row.contingency_action}
                            onChange={(e) => updateRow(key, ri, 'contingency_action', e.target.value)}
                            placeholder="If it happens..."
                            className="bg-transparent border-0 text-white/80 placeholder:text-white/20 text-sm p-0 h-auto focus-visible:ring-0"
                          />
                        </div>
                        {/* Delete */}
                        <div className="px-2 py-2 flex items-center justify-center">
                          <button
                            onClick={() => removeRow(key, ri)}
                            className="text-white/20 hover:text-red-400 transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    )
                  })}

                  <div className="px-4 py-3">
                    <button
                      onClick={() => addRow(key)}
                      className="flex items-center gap-2 text-sm transition-colors"
                      style={{ color: '#81E6D9' }}
                    >
                      <Plus className="w-4 h-4" /> Add Row
                    </button>
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
