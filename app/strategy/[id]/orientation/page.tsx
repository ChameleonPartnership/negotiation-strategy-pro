'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { WizardLayout, WizardPage } from '@/components/wizard/WizardLayout'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import {
  ORIENTATION_QUESTIONS,
  calculateOrientation,
  type OrientationAnswers,
} from '@/lib/decision-tree'
import { Loader2, ChevronRight, ChevronLeft, Users, Swords } from 'lucide-react'

export default function OrientationPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter()
  const [id, setId] = useState('')
  const [projectName, setProjectName] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [answers, setAnswers] = useState<OrientationAnswers>({})

  useEffect(() => {
    params.then(({ id: pid }) => { setId(pid); loadData(pid) })
  }, [params])

  async function loadData(pid: string) {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/auth/login'); return }

    const [{ data: project }, { data: orientation }] = await Promise.all([
      supabase.from('strategy_projects').select('name').eq('id', pid).single(),
      supabase.from('orientation').select('*').eq('project_id', pid).maybeSingle(),
    ])
    if (!project) { router.push('/dashboard'); return }
    setProjectName(project.name)
    if (orientation?.answers) setAnswers(orientation.answers as OrientationAnswers)
    setLoading(false)
  }

  const answeredCount = Object.keys(answers).length
  const result = answeredCount === 12 ? calculateOrientation(answers) : null

  async function doSave(a: OrientationAnswers) {
    if (!id) return
    setSaving(true)
    const supabase = createClient()
    const res = answeredCount === 12 ? calculateOrientation(a) : null
    await supabase.from('orientation').upsert(
      { project_id: id, answers: a, result: res?.result || null },
      { onConflict: 'project_id' }
    )
    setSaving(false)
  }

  function setAnswer(qKey: string, value: 'yes' | 'no') {
    const next = { ...answers, [qKey]: value }
    setAnswers(next)
    // auto-save debounced
    const t = setTimeout(() => doSave(next).catch(console.error), 800)
    return () => clearTimeout(t)
  }

  async function handleNext() {
    if (answeredCount < 12) { toast.error('Please answer all 12 questions'); return }
    await doSave(answers)
    router.push(`/strategy/${id}/approach`)
  }

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--brand-navy)' }}>
      <Loader2 className="w-6 h-6 animate-spin text-teal-400" />
    </div>
  )

  return (
    <WizardLayout projectId={id} projectName={projectName} currentStep={3} completedSteps={[1, 2]}>
      <WizardPage
        title="Orientation Assessment"
        description="Answer Yes or No to each statement. Yes → Cooperative; No → Competitive."
        step={3}
        actions={
          <>
            <Link href={`/strategy/${id}/scoping`}>
              <Button variant="ghost" className="text-white/50 hover:text-white/80">
                <ChevronLeft className="w-4 h-4 mr-1" /> Scoping
              </Button>
            </Link>
            <Button onClick={handleNext} disabled={saving} className="bg-teal-600 hover:bg-teal-500 text-white">
              {saving && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
              Next: Approach <ChevronRight className="ml-2 w-4 h-4" />
            </Button>
          </>
        }
      >
        {/* Column headers */}
        <div className="nsp-card rounded-xl overflow-hidden">
          <div className="grid grid-cols-[1fr_80px_80px] gap-0 border-b border-white/10">
            <div className="px-5 py-3 text-white/50 text-xs uppercase tracking-wider">Statement</div>
            <div className="px-3 py-3 text-center text-teal-400 text-xs uppercase tracking-wider flex items-center justify-center gap-1">
              <Users className="w-3 h-3" /> Yes
            </div>
            <div className="px-3 py-3 text-center text-orange-400 text-xs uppercase tracking-wider flex items-center justify-center gap-1">
              <Swords className="w-3 h-3" /> No
            </div>
          </div>

          {ORIENTATION_QUESTIONS.map((q, i) => {
            const key = `q${i + 1}`
            const val = answers[key]
            return (
              <div
                key={key}
                className="grid grid-cols-[1fr_80px_80px] gap-0 border-b border-white/5 hover:bg-white/[0.02] transition-colors"
              >
                <div className="px-5 py-3.5 text-white/80 text-sm leading-snug">{q}</div>
                <div className="flex items-center justify-center px-3 py-3.5">
                  <button
                    onClick={() => setAnswer(key, 'yes')}
                    className={`w-8 h-8 rounded-full border-2 transition-all text-xs font-bold ${
                      val === 'yes'
                        ? 'bg-teal-500 border-teal-500 text-white'
                        : 'border-white/20 text-white/30 hover:border-teal-500/50 hover:text-teal-400/70'
                    }`}
                  >
                    Y
                  </button>
                </div>
                <div className="flex items-center justify-center px-3 py-3.5">
                  <button
                    onClick={() => setAnswer(key, 'no')}
                    className={`w-8 h-8 rounded-full border-2 transition-all text-xs font-bold ${
                      val === 'no'
                        ? 'bg-orange-500 border-orange-500 text-white'
                        : 'border-white/20 text-white/30 hover:border-orange-500/50 hover:text-orange-400/70'
                    }`}
                  >
                    N
                  </button>
                </div>
              </div>
            )
          })}
        </div>

        {/* Result */}
        {result && (
          <div
            className={`rounded-xl p-5 border ${
              result.result === 'cooperative'
                ? 'bg-teal-500/10 border-teal-500/30'
                : 'bg-orange-500/10 border-orange-500/30'
            }`}
          >
            <div className="flex items-center gap-3">
              {result.result === 'cooperative' ? (
                <Users className="w-6 h-6 text-teal-400" />
              ) : (
                <Swords className="w-6 h-6 text-orange-400" />
              )}
              <div>
                <div className={`font-bold text-lg capitalize ${result.result === 'cooperative' ? 'text-teal-300' : 'text-orange-300'}`}>
                  {result.result} Orientation
                </div>
                <div className="text-white/60 text-sm">
                  {result.yesCount} Yes ({result.result === 'cooperative' ? 'Cooperative' : 'Competitive'}) ·{' '}
                  {result.noCount} No
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="flex items-center justify-between text-sm text-white/40">
          <span>{answeredCount} of 12 answered</span>
          {saving && <span className="flex items-center gap-1"><Loader2 className="w-3 h-3 animate-spin" /> Saving...</span>}
        </div>
      </WizardPage>
    </WizardLayout>
  )
}
