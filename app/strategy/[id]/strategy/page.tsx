'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { WizardLayout, WizardPage } from '@/components/wizard/WizardLayout'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import {
  STRATEGY_QUESTIONS,
  STRATEGY_DESCRIPTIONS,
  ALL_STRATEGIES,
  SUGGESTED_STRATEGIES,
  calculateStrategy,
  type StrategyAnswers,
  type StrategyAnswer,
  type StrategyName,
  type PowerStateName,
} from '@/lib/decision-tree'
import { Loader2, ChevronRight, ChevronLeft } from 'lucide-react'

const ANSWER_OPTIONS: { value: StrategyAnswer; label: string }[] = [
  { value: 'agree', label: 'Agree' },
  { value: 'indifferent', label: 'Indifferent' },
  { value: 'disagree', label: 'Disagree' },
]

export default function StrategyPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter()
  const [id, setId] = useState('')
  const [projectName, setProjectName] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [powerState, setPowerState] = useState<PowerStateName>('static')
  const [answers, setAnswers] = useState<StrategyAnswers>({})
  const [override, setOverride] = useState<StrategyName | ''>('')

  useEffect(() => {
    params.then(({ id: pid }) => { setId(pid); loadData(pid) })
  }, [params])

  async function loadData(pid: string) {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/auth/login'); return }
    const [{ data: project }, { data: ps }, { data: ss }] = await Promise.all([
      supabase.from('strategy_projects').select('name').eq('id', pid).single(),
      supabase.from('power_state').select('power_state').eq('project_id', pid).maybeSingle(),
      supabase.from('strategy_selection').select('*').eq('project_id', pid).maybeSingle(),
    ])
    if (!project) { router.push('/dashboard'); return }
    setProjectName(project.name)
    if (ps?.power_state) setPowerState(ps.power_state as PowerStateName)
    if (ss?.answers) setAnswers(ss.answers as StrategyAnswers)
    if (ss?.final_strategy) setOverride(ss.final_strategy as StrategyName)
    setLoading(false)
  }

  const questions = STRATEGY_QUESTIONS[powerState] || []
  const answeredCount = Object.keys(answers).length
  const suggestedStrategy = answeredCount === questions.length ? calculateStrategy(answers, powerState) : SUGGESTED_STRATEGIES[powerState][0]
  const finalStrategy = override || suggestedStrategy

  function setAnswer(qKey: string, value: StrategyAnswer) {
    const next = { ...answers, [qKey]: value }
    setAnswers(next)
    const suggested = Object.keys(next).length === questions.length ? calculateStrategy(next, powerState) : suggestedStrategy
    setTimeout(() => {
      const supabase = createClient()
      supabase.from('strategy_selection').upsert(
        { project_id: id, answers: next, suggested_strategy: suggested, final_strategy: override || suggested },
        { onConflict: 'project_id' }
      ).then(() => {})
    }, 800)
  }

  async function handleNext() {
    if (answeredCount < questions.length) { toast.error('Please answer all questions for your power state'); return }
    setSaving(true)
    const supabase = createClient()
    await supabase.from('strategy_selection').upsert(
      { project_id: id, answers, suggested_strategy: suggestedStrategy, final_strategy: finalStrategy },
      { onConflict: 'project_id' }
    )
    setSaving(false)
    router.push(`/strategy/${id}/phases`)
  }

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--brand-navy)' }}>
      <Loader2 className="w-6 h-6 animate-spin text-teal-400" />
    </div>
  )

  return (
    <WizardLayout projectId={id} projectName={projectName} currentStep={6} completedSteps={[1,2,3,4,5]}>
      <WizardPage
        title="Strategy Selection"
        description={`Based on your ${powerState} power state, rate each statement below.`}
        step={6}
        actions={
          <>
            <Link href={`/strategy/${id}/power`}>
              <Button variant="ghost" className="text-white/50 hover:text-white/80">
                <ChevronLeft className="w-4 h-4 mr-1" /> Power
              </Button>
            </Link>
            <Button onClick={handleNext} disabled={saving} className="bg-teal-600 hover:bg-teal-500 text-white">
              {saving && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
              Next: Phases <ChevronRight className="ml-2 w-4 h-4" />
            </Button>
          </>
        }
      >
        {/* Power state badge */}
        <div className="nsp-card rounded-xl p-4 flex items-center gap-3">
          <div className="w-2 h-8 rounded-full bg-teal-500" />
          <div>
            <div className="text-white/50 text-xs uppercase tracking-wider">Your Power State</div>
            <div className="text-white font-semibold capitalize">{powerState}</div>
          </div>
          <div className="ml-auto text-white/50 text-xs">
            Suggested: <span className="text-teal-300">{suggestedStrategy}</span>
          </div>
        </div>

        {/* Questions */}
        <div className="nsp-card rounded-xl overflow-hidden">
          <div className="grid grid-cols-[1fr_repeat(3,90px)] border-b border-white/10">
            <div className="px-5 py-3 text-white/50 text-xs uppercase tracking-wider">Statement</div>
            {ANSWER_OPTIONS.map((o) => (
              <div key={o.value} className="px-2 py-3 text-center text-white/50 text-xs uppercase tracking-wider">
                {o.label}
              </div>
            ))}
          </div>
          {questions.map((q, i) => {
            const key = `q${i + 1}`
            const val = answers[key]
            return (
              <div key={key} className="grid grid-cols-[1fr_repeat(3,90px)] border-b border-white/5 hover:bg-white/[0.02]">
                <div className="px-5 py-3.5 text-white/80 text-sm leading-snug">{q}</div>
                {ANSWER_OPTIONS.map((o) => (
                  <div key={o.value} className="flex items-center justify-center px-2 py-3.5">
                    <button
                      onClick={() => setAnswer(key, o.value)}
                      className={`w-7 h-7 rounded-full border-2 transition-all text-xs font-bold ${
                        val === o.value
                          ? 'bg-teal-500 border-teal-500 text-white'
                          : 'border-white/20 text-white/30 hover:border-teal-500/50'
                      }`}
                    >
                      {o.label[0]}
                    </button>
                  </div>
                ))}
              </div>
            )
          })}
        </div>

        {/* Override */}
        <div className="nsp-card rounded-xl p-5">
          <div className="text-white/50 text-xs uppercase tracking-wider mb-3">Select Final Strategy</div>
          <div className="grid sm:grid-cols-3 gap-2">
            {ALL_STRATEGIES.map((s) => (
              <button
                key={s}
                onClick={() => {
                  const newOverride = override === s ? '' : s
                  setOverride(newOverride as StrategyName | '')
                  const supabase = createClient()
                  supabase.from('strategy_selection').upsert(
                    { project_id: id, answers, suggested_strategy: suggestedStrategy, final_strategy: newOverride || suggestedStrategy },
                    { onConflict: 'project_id' }
                  ).then(() => {})
                }}
                className={`px-3 py-2.5 rounded-lg text-sm border transition-all text-left ${
                  finalStrategy === s
                    ? 'bg-teal-500/20 border-teal-500/50 text-teal-300'
                    : s === suggestedStrategy && !override
                    ? 'bg-white/10 border-white/20 text-white'
                    : 'border-white/10 text-white/50 hover:border-white/20 hover:text-white/70'
                }`}
              >
                <div className="font-medium">{s}</div>
                <div className="text-xs text-white/40 mt-0.5 leading-snug">{STRATEGY_DESCRIPTIONS[s]}</div>
              </button>
            ))}
          </div>
        </div>

        <div className="text-sm text-white/40">{answeredCount} of {questions.length} answered</div>
      </WizardPage>
    </WizardLayout>
  )
}
