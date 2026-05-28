'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { WizardLayout, WizardPage } from '@/components/wizard/WizardLayout'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Loader2, ChevronRight, ChevronLeft, Plus, Trash2 } from 'lucide-react'

interface PPARow {
  tactic: string
  probability: 'Low' | 'Medium' | 'High'
  seriousness: 'Low' | 'Medium' | 'High'
  preventative_action: string
  contingency_action: string
}

type Variant = 'A' | 'B' | 'C' | 'D'
interface VariantData { id?: string; rows: PPARow[] }
interface ScenarioInfo { id: string; name: string }

const VARIANTS: Variant[] = ['A', 'B', 'C', 'D']
const LEVELS = ['Low', 'Medium', 'High'] as const

export default function PPAPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter()
  const [id, setId] = useState('')
  const [projectName, setProjectName] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [scenarios, setScenarios] = useState<ScenarioInfo[]>([])
  const [activeScenario, setActiveScenario] = useState('')
  const [activeVariant, setActiveVariant] = useState<Variant>('A')
  const [ppaData, setPpaData] = useState<Record<string, Record<Variant, VariantData>>>({})

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

    const scenList: ScenarioInfo[] = (scens || []).map((s) => ({ id: s.id, name: s.name || `Scenario ${s.scenario_number}` }))
    setScenarios(scenList)
    if (scenList.length > 0) setActiveScenario(scenList[0].id)

    const pMap: Record<string, Record<Variant, VariantData>> = {}
    for (const s of scenList) {
      const { data: ppas } = await supabase.from('ppa').select('*').eq('scenario_id', s.id)
      const vData = {} as Record<Variant, VariantData>
      for (const v of VARIANTS) {
        const existing = ppas?.find((p) => p.variant === v)
        vData[v] = { id: existing?.id, rows: (existing?.rows as PPARow[]) || [emptyRow()] }
      }
      pMap[s.id] = vData
    }
    setPpaData(pMap)
    setLoading(false)
  }

  function emptyRow(): PPARow {
    return { tactic: '', probability: 'Low', seriousness: 'Low', preventative_action: '', contingency_action: '' }
  }

  function addRow(scenId: string, variant: Variant) {
    setPpaData((prev) => ({
      ...prev,
      [scenId]: {
        ...prev[scenId],
        [variant]: { ...prev[scenId][variant], rows: [...prev[scenId][variant].rows, emptyRow()] },
      },
    }))
  }

  function removeRow(scenId: string, variant: Variant, rowIdx: number) {
    setPpaData((prev) => ({
      ...prev,
      [scenId]: {
        ...prev[scenId],
        [variant]: { ...prev[scenId][variant], rows: prev[scenId][variant].rows.filter((_, i) => i !== rowIdx) },
      },
    }))
  }

  function updateRow(scenId: string, variant: Variant, rowIdx: number, field: keyof PPARow, value: string) {
    setPpaData((prev) => ({
      ...prev,
      [scenId]: {
        ...prev[scenId],
        [variant]: {
          ...prev[scenId][variant],
          rows: prev[scenId][variant].rows.map((r, i) => i === rowIdx ? { ...r, [field]: value } : r),
        },
      },
    }))
  }

  async function handleNext() {
    setSaving(true)
    const supabase = createClient()
    for (const [scenId, variants] of Object.entries(ppaData)) {
      for (const [v, data] of Object.entries(variants) as [Variant, VariantData][]) {
        await supabase.from('ppa').upsert(
          { scenario_id: scenId, variant: v, rows: data.rows },
          { onConflict: 'scenario_id,variant' }
        )
      }
    }
    setSaving(false)
    router.push(`/strategy/${id}/triggers`)
  }

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--brand-navy)' }}>
      <Loader2 className="w-6 h-6 animate-spin text-teal-400" />
    </div>
  )

  const currentVariants = ppaData[activeScenario]

  return (
    <WizardLayout projectId={id} projectName={projectName} currentStep={9} completedSteps={[1,2,3,4,5,6,7,8]}>
      <WizardPage
        title="Potential Problem Analysis"
        description="Identify tactics they may use and plan your responses. 4 variants per scenario."
        step={9}
        actions={
          <>
            <Link href={`/strategy/${id}/actions`}>
              <Button variant="ghost" className="text-white/50 hover:text-white/80">
                <ChevronLeft className="w-4 h-4 mr-1" /> Actions
              </Button>
            </Link>
            <Button onClick={handleNext} disabled={saving} className="bg-teal-600 hover:bg-teal-500 text-white">
              {saving && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
              Next: Triggers <ChevronRight className="ml-2 w-4 h-4" />
            </Button>
          </>
        }
      >
        {/* Scenario selector */}
        {scenarios.length > 1 && (
          <div className="flex gap-2 mb-2">
            {scenarios.map((s) => (
              <button
                key={s.id}
                onClick={() => setActiveScenario(s.id)}
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

        {currentVariants && (
          <Tabs value={activeVariant} onValueChange={(v) => setActiveVariant(v as Variant)}>
            <TabsList className="bg-white/5 border border-white/10 mb-5">
              {VARIANTS.map((v) => (
                <TabsTrigger key={v} value={v} className="data-[state=active]:bg-teal-500/20 data-[state=active]:text-teal-300">
                  Variant {v}
                </TabsTrigger>
              ))}
            </TabsList>

            {VARIANTS.map((v) => {
              const varData = currentVariants[v]
              return (
                <TabsContent key={v} value={v}>
                  <div className="nsp-card rounded-xl overflow-hidden">
                    <div className="grid grid-cols-[2fr_80px_80px_1.5fr_1.5fr_40px] gap-0 border-b border-white/10 bg-white/5">
                      {['Tactics They May Employ', 'Probability', 'Seriousness', 'Preventative Actions', 'Contingency Actions', ''].map((h) => (
                        <div key={h} className="px-3 py-2.5 text-white/40 text-xs font-medium">{h}</div>
                      ))}
                    </div>

                    {varData.rows.map((row, ri) => (
                      <div key={ri} className="grid grid-cols-[2fr_80px_80px_1.5fr_1.5fr_40px] gap-0 border-b border-white/5 hover:bg-white/[0.02]">
                        <div className="px-3 py-2">
                          <Input
                            value={row.tactic}
                            onChange={(e) => updateRow(activeScenario, v, ri, 'tactic', e.target.value)}
                            placeholder="Tactic..."
                            className="bg-transparent border-0 text-white/80 placeholder:text-white/20 text-sm p-0 h-auto focus-visible:ring-0"
                          />
                        </div>
                        {(['probability', 'seriousness'] as const).map((field) => (
                          <div key={field} className="px-2 py-2 flex items-center">
                            <select
                              value={row[field]}
                              onChange={(e) => updateRow(activeScenario, v, ri, field, e.target.value)}
                              className="w-full bg-white/5 border border-white/10 rounded text-white/80 text-xs px-1.5 py-1"
                            >
                              {LEVELS.map((l) => <option key={l} value={l}>{l}</option>)}
                            </select>
                          </div>
                        ))}
                        {(['preventative_action', 'contingency_action'] as const).map((field) => (
                          <div key={field} className="px-3 py-2">
                            <Input
                              value={row[field]}
                              onChange={(e) => updateRow(activeScenario, v, ri, field, e.target.value)}
                              placeholder="Action..."
                              className="bg-transparent border-0 text-white/80 placeholder:text-white/20 text-sm p-0 h-auto focus-visible:ring-0"
                            />
                          </div>
                        ))}
                        <div className="px-2 py-2 flex items-center justify-center">
                          <button
                            onClick={() => removeRow(activeScenario, v, ri)}
                            className="text-white/20 hover:text-red-400 transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}

                    <div className="px-4 py-3">
                      <button
                        onClick={() => addRow(activeScenario, v)}
                        className="flex items-center gap-2 text-teal-400 hover:text-teal-300 text-sm transition-colors"
                      >
                        <Plus className="w-4 h-4" /> Add Row
                      </button>
                    </div>
                  </div>
                </TabsContent>
              )
            })}
          </Tabs>
        )}
      </WizardPage>
    </WizardLayout>
  )
}
