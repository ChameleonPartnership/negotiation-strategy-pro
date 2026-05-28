'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { WizardLayout, WizardPage } from '@/components/wizard/WizardLayout'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import {
  APPROACH_STATEMENTS,
  APPROACH_DESCRIPTIONS,
  ALL_STRATEGIES,
  calculateApproach,
  type ApproachAnswers,
  type ApproachAnswer,
  type ApproachResult,
  type OrientationResult,
} from '@/lib/decision-tree'
import { Loader2, ChevronRight, ChevronLeft } from 'lucide-react'

const ANSWER_OPTIONS: { value: ApproachAnswer; label: string }[] = [
  { value: 'agree', label: 'Agree' },
  { value: 'neither', label: 'Neither' },
  { value: 'disagree', label: 'Disagree' },
]

export default function ApproachPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter()
  const [id, setId] = useState('')
  const [projectName, setProjectName] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [orientation, setOrientation] = useState<OrientationResult>('cooperative')
  const [answers, setAnswers] = useState<ApproachAnswers>({})
  const [override, setOverride] = useState<ApproachResult | ''>('')

  useEffect(() => {
    params.then(({ id: pid }) => { setId(pid); loadData(pid) })
  }, [params])

  async function loadData(pid: string) {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/auth/login'); return }

    const [{ data: project }, { data: orient }, { data: approach }] = await Promise.all([
      supabase.from('strategy_projects').select('name').eq('id', pid).single(),
      supabase.from('orientation').select('result').eq('project_id', pid).maybeSingle(),
      supabase.from('approach').select('*').eq('project_id', pid).maybeSingle(),
    ])
    if (!project) { router.push('/dashboard'); return }
    setProjectName(project.name)
    if (orient?.result) setOrientation(orient.result as OrientationResult)
    if (approach?.answers) setAnswers(approach.answers as ApproachAnswers)
    if (approach?.override) setOverride(approach.override as ApproachResult)
    setLoading(false)
  }

  const answeredCount = Object.keys(answers).length
  const result = answeredCount === 6 ? calculateApproach(answers, orientation) : null
  const finalResult = (override || result) as ApproachResult | null

  function setAnswer(qKey: string, value: ApproachAnswer) {
    const next = { ...answers, [qKey]: value }
    setAnswers(next)
    const r = Object.keys(next).length === 6 ? calculateApproach(next, orientation) : null
    setTimeout(() => {
      const supabase = createClient()
      supabase.from('approach').upsert(
        { project_id: id, answers: next, result: r || null, override: override || null },
        { onConflict: 'project_id' }
      ).then(() => {})
    }, 800)
  }

  async function doSave() {
    setSaving(true)
    const supabase = createClient()
    await supabase.from('approach').upsert(
      { project_id: id, answers, result: result || null, override: override || null },
      { onConflict: 'project_id' }
    )
    setSaving(false)
  }

  async function handleNext() {
    if (answeredCount < 6) { toast.error('Please answer all 6 statements'); return }
    await doSave()
    router.push(`/strategy/${id}/power`)
  }

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--brand-navy)' }}>
      <Loader2 className="w-6 h-6 animate-spin text-teal-400" />
    </div>
  )

  return (
    <WizardLayout projectId={id} projectName={projectName} currentStep={4} completedSteps={[1,2,3]}>
      <WizardPage
        title="Approach Determination"
        description={`Based on your ${orientation} orientation, rate each statement below.`}
        step={4}
        actions={
          <>
            <Link href={`/strategy/${id}/orientation`}>
              <Button variant="ghost" className="text-white/50 hover:text-white/80">
                <ChevronLeft className="w-4 h-4 mr-1" /> Orientation
              </Button>
            </Link>
            <Button onClick={handleNext} disabled={saving} className="bg-teal-600 hover:bg-teal-500 text-white">
              {saving && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
              Next: Power State <ChevronRight className="ml-2 w-4 h-4" />
            </Button>
          </>
        }
      >
        <div className="nsp-card rounded-xl overflow-hidden">
          <div className="grid grid-cols-[1fr_repeat(3,90px)] border-b border-white/10">
            <div className="px-5 py-3 text-white/50 text-xs uppercase tracking-wider">Statement</div>
            {ANSWER_OPTIONS.map((o) => (
              <div key={o.value} className="px-2 py-3 text-center text-white/50 text-xs uppercase tracking-wider">
                {o.label}
              </div>
            ))}
          </div>
          {APPROACH_STATEMENTS.map((stmt, i) => {
            const key = `s${i + 1}`
            const val = answers[key]
            return (
              <div key={key} className="grid grid-cols-[1fr_repeat(3,90px)] border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                <div className="px-5 py-3.5 text-white/80 text-sm leading-snug">{stmt}</div>
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

        {/* Result */}
        {result && (
          <div className="nsp-card rounded-xl p-5">
            <div className="text-white/50 text-xs uppercase tracking-wider mb-2">Suggested Approach</div>
            <div className="text-teal-300 font-bold text-xl capitalize mb-1">{result}</div>
            <div className="text-white/60 text-sm">{APPROACH_DESCRIPTIONS[result]}</div>
          </div>
        )}

        {/* Manual override */}
        <div className="nsp-card rounded-xl p-5">
          <div className="text-white/50 text-xs uppercase tracking-wider mb-3">Manual Override (optional)</div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => { setOverride(''); doSave() }}
              className={`px-3 py-1.5 rounded-lg text-sm border transition-all ${
                !override ? 'bg-teal-500/20 border-teal-500/40 text-teal-300' : 'border-white/10 text-white/40 hover:border-white/20'
              }`}
            >
              Auto
            </button>
            {(['share', 'create', 'give', 'take', 'protect'] as ApproachResult[]).map((opt) => (
              <button
                key={opt}
                onClick={() => { setOverride(opt); doSave() }}
                className={`px-3 py-1.5 rounded-lg text-sm capitalize border transition-all ${
                  override === opt ? 'bg-teal-500/20 border-teal-500/40 text-teal-300' : 'border-white/10 text-white/40 hover:border-white/20 hover:text-white/60'
                }`}
              >
                {opt}
              </button>
            ))}
          </div>
          {finalResult && (
            <div className="mt-3 text-sm text-white/60">
              Final: <span className="text-teal-300 font-medium capitalize">{finalResult}</span>
              {' — '}{APPROACH_DESCRIPTIONS[finalResult]}
            </div>
          )}
        </div>

        <div className="text-sm text-white/40">{answeredCount} of 6 answered</div>
      </WizardPage>
    </WizardLayout>
  )
}
