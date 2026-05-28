'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { WizardLayout, WizardPage } from '@/components/wizard/WizardLayout'
import { Button } from '@/components/ui/button'
import { Slider } from '@/components/ui/slider'
import {
  POWER_STATE_QUESTIONS,
  POWER_STATE_RANGES,
  calculatePowerState,
  type PowerStateScores,
} from '@/lib/decision-tree'
import { Loader2, ChevronRight, ChevronLeft } from 'lucide-react'

export default function PowerPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter()
  const [id, setId] = useState('')
  const [projectName, setProjectName] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [scores, setScores] = useState<PowerStateScores>({})

  useEffect(() => {
    params.then(({ id: pid }) => { setId(pid); loadData(pid) })
  }, [params])

  async function loadData(pid: string) {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/auth/login'); return }
    const [{ data: project }, { data: ps }] = await Promise.all([
      supabase.from('strategy_projects').select('name').eq('id', pid).single(),
      supabase.from('power_state').select('*').eq('project_id', pid).maybeSingle(),
    ])
    if (!project) { router.push('/dashboard'); return }
    setProjectName(project.name)
    if (ps?.scores) setScores(ps.scores as PowerStateScores)
    setLoading(false)
  }

  const answeredCount = Object.keys(scores).length
  const totalScore = Object.values(scores).reduce((s, v) => s + (v || 0), 0)
  const result = answeredCount === 10 ? calculatePowerState(scores) : null

  function setScore(qKey: string, value: number) {
    const next = { ...scores, [qKey]: value }
    setScores(next)
    const r = Object.keys(next).length === 10 ? calculatePowerState(next) : null
    setTimeout(() => {
      const supabase = createClient()
      supabase.from('power_state').upsert(
        { project_id: id, scores: next, total_score: r?.totalScore || null, power_state: r?.powerState || null },
        { onConflict: 'project_id' }
      ).then(() => {})
    }, 800)
  }

  async function handleNext() {
    setSaving(true)
    const supabase = createClient()
    const r = answeredCount === 10 ? calculatePowerState(scores) : null
    await supabase.from('power_state').upsert(
      { project_id: id, scores, total_score: r?.totalScore || null, power_state: r?.powerState || null },
      { onConflict: 'project_id' }
    )
    setSaving(false)
    router.push(`/strategy/${id}/strategy`)
  }

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--brand-navy)' }}>
      <Loader2 className="w-6 h-6 animate-spin text-teal-400" />
    </div>
  )

  return (
    <WizardLayout projectId={id} projectName={projectName} currentStep={5} completedSteps={[1,2,3,4]}>
      <WizardPage
        title="Power State Assessment"
        description="Score each dimension 0–10. 10 = strongly in your favour; 0 = strongly against."
        step={5}
        actions={
          <>
            <Link href={`/strategy/${id}/approach`}>
              <Button variant="ghost" className="text-white/50 hover:text-white/80">
                <ChevronLeft className="w-4 h-4 mr-1" /> Approach
              </Button>
            </Link>
            <Button onClick={handleNext} disabled={saving} className="bg-teal-600 hover:bg-teal-500 text-white">
              {saving && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
              Next: Strategy <ChevronRight className="ml-2 w-4 h-4" />
            </Button>
          </>
        }
      >
        {/* Questions */}
        <div className="nsp-card rounded-xl p-6 space-y-6">
          {POWER_STATE_QUESTIONS.map((q, i) => {
            const key = `q${i + 1}`
            const val = scores[key] ?? 5
            return (
              <div key={key} className="space-y-2">
                <div className="flex items-start justify-between gap-4">
                  <div className="text-white/80 text-sm leading-snug flex-1">
                    <span className="text-white/40 mr-2">{i + 1}.</span>{q}
                  </div>
                  <div className="text-teal-400 font-bold text-lg w-8 text-right flex-shrink-0">
                    {scores[key] ?? '–'}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-white/30 text-xs w-4">0</span>
                  <Slider
                    value={[scores[key] ?? 5]}
                    min={0}
                    max={10}
                    step={1}
                    onValueChange={(vals) => setScore(key, Array.isArray(vals) ? (vals as number[])[0] : vals as number)}
                    className="flex-1"
                  />
                  <span className="text-white/30 text-xs w-5">10</span>
                </div>
              </div>
            )
          })}
        </div>

        {/* Score gauge */}
        {answeredCount > 0 && (
          <div className="nsp-card rounded-xl p-5">
            <div className="flex items-center justify-between mb-4">
              <span className="text-white/60 text-sm">Total Score</span>
              <span className="text-3xl font-bold text-white">{totalScore}</span>
            </div>
            {/* Range bar */}
            <div className="relative h-6 rounded-full overflow-hidden flex">
              {POWER_STATE_RANGES.map((range) => (
                <div
                  key={range.state}
                  style={{
                    width: `${((range.max - range.min + 1) / 101) * 100}%`,
                    background: range.state === result?.powerState
                      ? result.colour
                      : 'rgba(255,255,255,0.08)',
                  }}
                  className="h-full flex items-center justify-center transition-all"
                  title={`${range.label}: ${range.min}–${range.max}`}
                />
              ))}
              {/* Score marker */}
              <div
                className="absolute top-0 w-1 h-full bg-white rounded-full shadow-lg transition-all duration-300"
                style={{ left: `${(totalScore / 100) * 100}%` }}
              />
            </div>
            {/* Labels */}
            <div className="flex justify-between mt-1">
              {POWER_STATE_RANGES.map((range) => (
                <span
                  key={range.state}
                  className="text-[10px] text-white/30 text-center"
                  style={{ width: `${((range.max - range.min + 1) / 101) * 100}%` }}
                >
                  {range.label}
                </span>
              ))}
            </div>

            {result && (
              <div
                className="mt-4 rounded-lg p-4 border"
                style={{
                  background: `${result.colour}15`,
                  borderColor: `${result.colour}40`,
                }}
              >
                <div className="font-bold text-lg capitalize" style={{ color: result.colour }}>
                  {result.powerState}
                </div>
                <div className="text-white/60 text-sm mt-0.5">{result.description}</div>
              </div>
            )}
          </div>
        )}

        <div className="text-sm text-white/40">{answeredCount} of 10 scored</div>
      </WizardPage>
    </WizardLayout>
  )
}
