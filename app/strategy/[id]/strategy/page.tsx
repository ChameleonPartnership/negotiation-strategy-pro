'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { WizardLayout, WizardPage } from '@/components/wizard/WizardLayout'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { toast } from 'sonner'
import {
  STRATEGY_QUESTIONS,
  STRATEGY_DESCRIPTIONS,
  ALL_STRATEGIES,
  SUGGESTED_STRATEGIES,
  calculateStrategy,
  isStrategyTooAggressive,
  type StrategyAnswers,
  type StrategyAnswer,
  type StrategyName,
  type PowerStateName,
} from '@/lib/decision-tree'
import { Loader2, ChevronRight, ChevronLeft, AlertTriangle, Zap } from 'lucide-react'

const ANSWER_OPTIONS: { value: StrategyAnswer; label: string }[] = [
  { value: 'agree', label: 'Agree' },
  { value: 'indifferent', label: 'Indifferent' },
  { value: 'disagree', label: 'Disagree' },
]

const POWER_STATE_LABELS: Record<PowerStateName, string> = {
  recessive: 'Recessive — significantly less power',
  passive: 'Passive — considerably less power',
  yielding: 'Yielding — somewhat less power',
  static: 'Static — broadly balanced power',
  assertive: 'Assertive — somewhat more power',
  active: 'Active — considerable power advantage',
  dominant: 'Dominant — significantly more power',
}

export default function StrategyPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter()
  const [id, setId] = useState('')
  const [projectName, setProjectName] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [powerState, setPowerState] = useState<PowerStateName>('static')
  const [answers, setAnswers] = useState<StrategyAnswers>({})
  const [override, setOverride] = useState<StrategyName | ''>('')
  const [pendingOverride, setPendingOverride] = useState<StrategyName | null>(null)
  const [showWarning, setShowWarning] = useState(false)

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
  const suggestedStrategy =
    answeredCount === questions.length
      ? calculateStrategy(answers, powerState)
      : SUGGESTED_STRATEGIES[powerState][0]
  const finalStrategy = override || suggestedStrategy

  function setAnswer(qKey: string, value: StrategyAnswer) {
    const next = { ...answers, [qKey]: value }
    setAnswers(next)
    const suggested =
      Object.keys(next).length === questions.length
        ? calculateStrategy(next, powerState)
        : suggestedStrategy
    setTimeout(() => {
      const supabase = createClient()
      supabase
        .from('strategy_selection')
        .upsert(
          {
            project_id: id,
            answers: next,
            suggested_strategy: suggested,
            final_strategy: override || suggested,
          },
          { onConflict: 'project_id' }
        )
        .then(() => {})
    }, 800)
  }

  function handleOverrideSelect(s: StrategyName) {
    // Toggle off if already selected
    if (override === s) {
      setOverride('')
      const supabase = createClient()
      supabase
        .from('strategy_selection')
        .upsert(
          { project_id: id, answers, suggested_strategy: suggestedStrategy, final_strategy: suggestedStrategy },
          { onConflict: 'project_id' }
        )
        .then(() => {})
      return
    }
    // Check if too aggressive
    if (isStrategyTooAggressive(s, powerState)) {
      setPendingOverride(s)
      setShowWarning(true)
      return
    }
    applyOverride(s)
  }

  function applyOverride(s: StrategyName) {
    setOverride(s)
    const supabase = createClient()
    supabase
      .from('strategy_selection')
      .upsert(
        { project_id: id, answers, suggested_strategy: suggestedStrategy, final_strategy: s },
        { onConflict: 'project_id' }
      )
      .then(() => {})
  }

  function confirmOverride() {
    if (pendingOverride) {
      applyOverride(pendingOverride)
      setPendingOverride(null)
    }
    setShowWarning(false)
  }

  function useRecommended() {
    setPendingOverride(null)
    setShowWarning(false)
  }

  async function handleNext() {
    if (answeredCount < questions.length) {
      toast.error('Please answer all questions for your power state')
      return
    }
    setSaving(true)
    const supabase = createClient()
    await supabase.from('strategy_selection').upsert(
      { project_id: id, answers, suggested_strategy: suggestedStrategy, final_strategy: finalStrategy },
      { onConflict: 'project_id' }
    )
    setSaving(false)
    router.push(`/strategy/${id}/scenarios`)
  }

  if (loading)
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#012A36' }}>
        <Loader2 className="w-6 h-6 animate-spin" style={{ color: '#81E6D9' }} />
      </div>
    )

  return (
    <WizardLayout projectId={id} projectName={projectName} currentStep={6} completedSteps={[1, 2, 3, 4, 5]}>
      <WizardPage
        title="Strategy Selection"
        description="Based on your power position, rate each statement below to determine your recommended strategy."
        step={6}
        actions={
          <>
            <Link href={`/strategy/${id}/power`}>
              <Button variant="ghost" className="text-white/50 hover:text-white/80">
                <ChevronLeft className="w-4 h-4 mr-1" /> Power
              </Button>
            </Link>
            <Button
              onClick={handleNext}
              disabled={saving}
              style={{ background: '#03536A', color: '#F7FAFC' }}
              className="hover:opacity-90"
            >
              {saving && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
              Next: Scenarios <ChevronRight className="ml-2 w-4 h-4" />
            </Button>
          </>
        }
      >
        {/* Power state + recommended strategy banner */}
        <div
          className="rounded-xl p-4 flex items-center gap-4"
          style={{ background: 'rgba(3, 83, 106, 0.3)', border: '1px solid rgba(129, 230, 217, 0.25)' }}
        >
          <div className="flex-1">
            <div className="text-xs uppercase tracking-wider mb-1" style={{ color: '#81E6D9' }}>
              Your Power State
            </div>
            <div className="text-white font-semibold capitalize">{powerState}</div>
            <div className="text-white/50 text-xs mt-0.5">{POWER_STATE_LABELS[powerState]}</div>
          </div>
          <div className="h-12 w-px bg-white/10" />
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <Zap className="w-3 h-3" style={{ color: '#81E6D9' }} />
              <div className="text-xs uppercase tracking-wider" style={{ color: '#81E6D9' }}>
                Recommended Strategy
              </div>
            </div>
            <div className="text-white font-bold text-lg">{suggestedStrategy}</div>
            <div className="text-white/50 text-xs mt-0.5 leading-snug">
              {STRATEGY_DESCRIPTIONS[suggestedStrategy]}
            </div>
          </div>
          {override && override !== suggestedStrategy && (
            <>
              <div className="h-12 w-px bg-white/10" />
              <div className="flex-1">
                <div className="text-xs uppercase tracking-wider mb-1" style={{ color: '#EF4136' }}>
                  Override Selected
                </div>
                <div className="font-bold text-lg" style={{ color: '#EF4136' }}>{override}</div>
                <div className="text-white/50 text-xs mt-0.5">{STRATEGY_DESCRIPTIONS[override as StrategyName]}</div>
              </div>
            </>
          )}
        </div>

        {/* Questions */}
        <div className="nsp-card rounded-xl overflow-hidden">
          <div
            className="grid grid-cols-[1fr_repeat(3,90px)] border-b border-white/10"
            style={{ background: 'rgba(3, 83, 106, 0.15)' }}
          >
            <div className="px-5 py-3 text-white/50 text-xs uppercase tracking-wider">
              Statement — {powerState} power state
            </div>
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
              <div
                key={key}
                className="grid grid-cols-[1fr_repeat(3,90px)] border-b border-white/5 hover:bg-white/[0.02]"
              >
                <div className="px-5 py-3.5 text-white/80 text-sm leading-snug">{q}</div>
                {ANSWER_OPTIONS.map((o) => (
                  <div key={o.value} className="flex items-center justify-center px-2 py-3.5">
                    <button
                      onClick={() => setAnswer(key, o.value)}
                      className={`w-7 h-7 rounded-full border-2 transition-all text-xs font-bold ${
                        val === o.value
                          ? 'border-transparent text-white'
                          : 'border-white/20 text-white/30 hover:border-white/40'
                      }`}
                      style={val === o.value ? { background: '#03536A' } : {}}
                    >
                      {o.label[0]}
                    </button>
                  </div>
                ))}
              </div>
            )
          })}
        </div>

        {/* Progress */}
        <div className="flex items-center gap-3">
          <div className="flex-1 h-1.5 rounded-full bg-white/10 overflow-hidden">
            <div
              className="h-full rounded-full transition-all"
              style={{
                width: `${questions.length ? (answeredCount / questions.length) * 100 : 0}%`,
                background: '#81E6D9',
              }}
            />
          </div>
          <span className="text-sm text-white/40">{answeredCount} of {questions.length} answered</span>
        </div>

        {/* Strategy override selector */}
        <div className="nsp-card rounded-xl p-5">
          <div className="text-white/50 text-xs uppercase tracking-wider mb-1">Select Final Strategy</div>
          <div className="text-white/40 text-xs mb-4">
            The recommended strategy is pre-selected. Override only if you have specific reasons.
          </div>
          <div className="grid sm:grid-cols-3 gap-2">
            {ALL_STRATEGIES.map((s) => {
              const isSelected = finalStrategy === s
              const isRecommended = s === suggestedStrategy && !override
              const isOverride = override === s
              return (
                <button
                  key={s}
                  onClick={() => handleOverrideSelect(s)}
                  className="px-3 py-2.5 rounded-lg text-sm border transition-all text-left"
                  style={
                    isSelected
                      ? { background: 'rgba(3, 83, 106, 0.3)', borderColor: 'rgba(129, 230, 217, 0.4)', color: '#81E6D9' }
                      : isOverride
                      ? { background: 'rgba(239, 65, 54, 0.15)', borderColor: 'rgba(239, 65, 54, 0.4)', color: '#EF4136' }
                      : { borderColor: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.5)' }
                  }
                >
                  <div className="font-medium flex items-center gap-1.5">
                    {s}
                    {isRecommended && (
                      <span className="text-xs px-1.5 py-0.5 rounded" style={{ background: 'rgba(129,230,217,0.2)', color: '#81E6D9' }}>
                        Recommended
                      </span>
                    )}
                  </div>
                  <div className="text-xs mt-0.5 leading-snug opacity-60">{STRATEGY_DESCRIPTIONS[s]}</div>
                </button>
              )
            })}
          </div>
        </div>
      </WizardPage>

      {/* Override warning dialog */}
      <Dialog open={showWarning} onOpenChange={setShowWarning}>
        <DialogContent
          className="border-white/10 max-w-lg"
          style={{ background: '#012A36' }}
        >
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-white">
              <AlertTriangle className="w-5 h-5" style={{ color: '#EF4136' }} />
              Strategy Mismatch Warning
            </DialogTitle>
            <DialogDescription className="text-white/60 text-sm space-y-3 mt-3">
              <span className="block">
                You are selecting{' '}
                <strong className="text-white">&apos;{pendingOverride}&apos;</strong> however your Power
                State assessment indicates{' '}
                <strong className="text-white capitalize">&apos;{powerState}&apos;</strong> power.
              </span>
              <span className="block">
                This strategy is typically used by negotiators with significantly more power. Proceeding
                with this strategy may:
              </span>
              <ul className="space-y-1.5 pl-2">
                <li className="flex items-start gap-2">
                  <span style={{ color: '#EF4136' }}>•</span>
                  Damage the relationship irreparably
                </li>
                <li className="flex items-start gap-2">
                  <span style={{ color: '#EF4136' }}>•</span>
                  Undermine your credibility if they call your bluff
                </li>
                <li className="flex items-start gap-2">
                  <span style={{ color: '#EF4136' }}>•</span>
                  Escalate the negotiation beyond your control
                </li>
              </ul>
              <span className="block font-medium text-white/80">
                Are you sure you want to override the recommended strategy?
              </span>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex gap-3 mt-4">
            <Button
              variant="outline"
              onClick={useRecommended}
              className="flex-1 border-white/10 text-white/70 hover:bg-white/5"
            >
              Use Recommended Strategy
            </Button>
            <Button
              onClick={confirmOverride}
              className="flex-1 text-white hover:opacity-90"
              style={{ background: '#EF4136' }}
            >
              Override Anyway
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </WizardLayout>
  )
}
