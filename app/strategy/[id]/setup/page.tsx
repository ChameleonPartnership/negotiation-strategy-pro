'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { WizardLayout, WizardPage } from '@/components/wizard/WizardLayout'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'
import { useAutoSave } from '@/hooks/useAutoSave'
import { Loader2, ChevronRight } from 'lucide-react'

interface FormState {
  name: string
  negotiation_for: string
  stakeholders: string
  draft_date: string
  sign_off: string
  start_date: string
  contingency_dates: string
}

export default function SetupPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter()
  const [id, setId] = useState('')
  const [project, setProject] = useState<Record<string, unknown> | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState<FormState>({
    name: '',
    negotiation_for: '',
    stakeholders: '',
    draft_date: '',
    sign_off: '',
    start_date: '',
    contingency_dates: '',
  })

  useEffect(() => {
    params.then(({ id: pid }) => {
      setId(pid)
      loadData(pid)
    })
  }, [params])

  async function loadData(pid: string) {
    const supabase = createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) { router.push('/auth/login'); return }

    const { data } = await supabase
      .from('strategy_projects')
      .select('*')
      .eq('id', pid)
      .eq('user_id', user.id)
      .single()

    if (!data) { router.push('/dashboard'); return }
    setProject(data)
    setForm({
      name: (data.name as string) || '',
      negotiation_for: (data.negotiation_for as string) || '',
      stakeholders: (data.stakeholders as string) || '',
      draft_date: (data.draft_date as string) || '',
      sign_off: (data.sign_off as string) || '',
      start_date: (data.start_date as string) || '',
      contingency_dates: (data.contingency_dates as string) || '',
    })
    setLoading(false)
  }

  const doSave = useCallback(
    async (data: FormState) => {
      if (!id) return
      setSaving(true)
      const supabase = createClient()
      const { error } = await supabase
        .from('strategy_projects')
        .update({
          name: data.name,
          negotiation_for: data.negotiation_for || null,
          stakeholders: data.stakeholders || null,
          draft_date: data.draft_date || null,
          sign_off: data.sign_off || null,
          start_date: data.start_date || null,
          contingency_dates: data.contingency_dates || null,
        })
        .eq('id', id)
      setSaving(false)
      if (error) toast.error('Failed to save')
    },
    [id]
  )

  const autoSave = useAutoSave(doSave, 800)

  function update(field: keyof FormState, value: string) {
    const next = { ...form, [field]: value }
    setForm(next)
    autoSave(next)
  }

  async function handleNext() {
    if (!form.name.trim()) { toast.error('Project name is required'); return }
    await doSave(form)
    router.push(`/strategy/${id}/scoping`)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--brand-navy)' }}>
        <Loader2 className="w-6 h-6 animate-spin text-teal-400" />
      </div>
    )
  }

  return (
    <WizardLayout projectId={id} projectName={project?.name as string} currentStep={1} completedSteps={[]}>
      <WizardPage
        title="Project Setup"
        description="Set the foundational details for this negotiation strategy."
        step={1}
        actions={
          <>
            <Link href={`/strategy/${id}`}>
              <Button variant="ghost" className="text-white/50 hover:text-white/80">
                ← Hub
              </Button>
            </Link>
            <Button
              onClick={handleNext}
              disabled={saving}
              className="bg-teal-600 hover:bg-teal-500 text-white"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Next: Scoping <ChevronRight className="ml-2 w-4 h-4" />
            </Button>
          </>
        }
      >
        <div className="nsp-card rounded-xl p-6 space-y-5">
          <div className="grid sm:grid-cols-2 gap-5">
            <div className="space-y-1.5 sm:col-span-2">
              <Label className="text-white/70">Project Name <span className="text-teal-400">*</span></Label>
              <Input
                value={form.name}
                onChange={(e) => update('name', e.target.value)}
                placeholder="e.g. 2025 Supplier Contract Renewal"
                className="bg-white/5 border-white/10 text-white placeholder:text-white/30"
              />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label className="text-white/70">Negotiation For</Label>
              <Input
                value={form.negotiation_for}
                onChange={(e) => update('negotiation_for', e.target.value)}
                placeholder="e.g. New 3-year IT services agreement with Acme Corp"
                className="bg-white/5 border-white/10 text-white placeholder:text-white/30"
              />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label className="text-white/70">Key Stakeholders</Label>
              <Textarea
                value={form.stakeholders}
                onChange={(e) => update('stakeholders', e.target.value)}
                placeholder="List key internal and external stakeholders"
                rows={3}
                className="bg-white/5 border-white/10 text-white placeholder:text-white/30 resize-none"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-white/70">Draft Date</Label>
              <Input
                type="date"
                value={form.draft_date}
                onChange={(e) => update('draft_date', e.target.value)}
                className="bg-white/5 border-white/10 text-white"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-white/70">Negotiation Start Date</Label>
              <Input
                type="date"
                value={form.start_date}
                onChange={(e) => update('start_date', e.target.value)}
                className="bg-white/5 border-white/10 text-white"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-white/70">Sign-Off By</Label>
              <Input
                value={form.sign_off}
                onChange={(e) => update('sign_off', e.target.value)}
                placeholder="e.g. CEO approval required"
                className="bg-white/5 border-white/10 text-white placeholder:text-white/30"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-white/70">Contingency Dates</Label>
              <Input
                value={form.contingency_dates}
                onChange={(e) => update('contingency_dates', e.target.value)}
                placeholder="e.g. Contract must be signed by 31 March"
                className="bg-white/5 border-white/10 text-white placeholder:text-white/30"
              />
            </div>
          </div>
        </div>
        {saving && (
          <p className="text-white/40 text-xs flex items-center gap-1">
            <Loader2 className="w-3 h-3 animate-spin" /> Auto-saving...
          </p>
        )}
      </WizardPage>
    </WizardLayout>
  )
}
