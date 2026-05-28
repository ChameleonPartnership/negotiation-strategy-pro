'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { WizardLayout, WizardPage } from '@/components/wizard/WizardLayout'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'
import { useAutoSave } from '@/hooks/useAutoSave'
import { Loader2, ChevronRight, ChevronLeft } from 'lucide-react'

interface FormState {
  internal_stakeholders: string
  external_stakeholders: string
  preferred_approach: string
  our_outcomes: string
  their_outcomes: string
  main_issues: string
}

export default function ScopingPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter()
  const [id, setId] = useState('')
  const [projectName, setProjectName] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [scopingId, setScopingId] = useState<string | null>(null)
  const [form, setForm] = useState<FormState>({
    internal_stakeholders: '',
    external_stakeholders: '',
    preferred_approach: '',
    our_outcomes: '',
    their_outcomes: '',
    main_issues: '',
  })

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

    const [{ data: project }, { data: scoping }] = await Promise.all([
      supabase.from('strategy_projects').select('name').eq('id', pid).single(),
      supabase.from('scoping').select('*').eq('project_id', pid).maybeSingle(),
    ])

    if (!project) { router.push('/dashboard'); return }
    setProjectName(project.name)
    if (scoping) {
      setScopingId(scoping.id)
      setForm({
        internal_stakeholders: scoping.internal_stakeholders || '',
        external_stakeholders: scoping.external_stakeholders || '',
        preferred_approach: scoping.preferred_approach || '',
        our_outcomes: scoping.our_outcomes || '',
        their_outcomes: scoping.their_outcomes || '',
        main_issues: scoping.main_issues || '',
      })
    }
    setLoading(false)
  }

  const doSave = useCallback(async (data: FormState) => {
    if (!id) return
    setSaving(true)
    const supabase = createClient()
    if (scopingId) {
      await supabase.from('scoping').update(data).eq('id', scopingId)
    } else {
      const { data: inserted } = await supabase
        .from('scoping')
        .upsert({ project_id: id, ...data }, { onConflict: 'project_id' })
        .select('id')
        .single()
      if (inserted) setScopingId(inserted.id)
    }
    setSaving(false)
  }, [id, scopingId])

  const autoSave = useAutoSave(doSave, 800)

  function update(field: keyof FormState, value: string) {
    const next = { ...form, [field]: value }
    setForm(next)
    autoSave(next)
  }

  async function handleNext() {
    await doSave(form)
    router.push(`/strategy/${id}/orientation`)
  }

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--brand-navy)' }}>
      <Loader2 className="w-6 h-6 animate-spin text-teal-400" />
    </div>
  )

  return (
    <WizardLayout projectId={id} projectName={projectName} currentStep={2} completedSteps={[1]}>
      <WizardPage
        title="Initial Scoping"
        description="Define the scope of your negotiation — who's involved, what you want, and the key issues."
        step={2}
        actions={
          <>
            <Link href={`/strategy/${id}/setup`}>
              <Button variant="ghost" className="text-white/50 hover:text-white/80">
                <ChevronLeft className="w-4 h-4 mr-1" /> Setup
              </Button>
            </Link>
            <Button onClick={handleNext} disabled={saving} className="bg-teal-600 hover:bg-teal-500 text-white">
              {saving && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
              Next: Orientation <ChevronRight className="ml-2 w-4 h-4" />
            </Button>
          </>
        }
      >
        <div className="nsp-card rounded-xl p-6 space-y-5">
          <div className="grid sm:grid-cols-2 gap-5">
            <div className="space-y-1.5">
              <Label className="text-white/70">Internal Stakeholders</Label>
              <Textarea
                value={form.internal_stakeholders}
                onChange={(e) => update('internal_stakeholders', e.target.value)}
                placeholder="Who from your organisation is involved?"
                rows={3}
                className="bg-white/5 border-white/10 text-white placeholder:text-white/30 resize-none"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-white/70">External Stakeholders</Label>
              <Textarea
                value={form.external_stakeholders}
                onChange={(e) => update('external_stakeholders', e.target.value)}
                placeholder="Who from the other party is involved?"
                rows={3}
                className="bg-white/5 border-white/10 text-white placeholder:text-white/30 resize-none"
              />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label className="text-white/70">Preferred Approach</Label>
              <Textarea
                value={form.preferred_approach}
                onChange={(e) => update('preferred_approach', e.target.value)}
                placeholder="What is your initial preferred approach to this negotiation?"
                rows={3}
                className="bg-white/5 border-white/10 text-white placeholder:text-white/30 resize-none"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-white/70">Our Desired Outcomes</Label>
              <Textarea
                value={form.our_outcomes}
                onChange={(e) => update('our_outcomes', e.target.value)}
                placeholder="What does a successful outcome look like for you?"
                rows={4}
                className="bg-white/5 border-white/10 text-white placeholder:text-white/30 resize-none"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-white/70">Their Likely Outcomes</Label>
              <Textarea
                value={form.their_outcomes}
                onChange={(e) => update('their_outcomes', e.target.value)}
                placeholder="What is the other party likely seeking?"
                rows={4}
                className="bg-white/5 border-white/10 text-white placeholder:text-white/30 resize-none"
              />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label className="text-white/70">Main Issues / Variables</Label>
              <Textarea
                value={form.main_issues}
                onChange={(e) => update('main_issues', e.target.value)}
                placeholder="List the key issues, variables and trade-offs in this negotiation"
                rows={4}
                className="bg-white/5 border-white/10 text-white placeholder:text-white/30 resize-none"
              />
            </div>
          </div>
        </div>
        {saving && <p className="text-white/40 text-xs flex items-center gap-1"><Loader2 className="w-3 h-3 animate-spin" /> Auto-saving...</p>}
      </WizardPage>
    </WizardLayout>
  )
}
