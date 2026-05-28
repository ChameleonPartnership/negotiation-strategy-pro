'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'
import { Loader2, ArrowLeft } from 'lucide-react'

export default function NewStrategyPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    name: '',
    negotiation_for: '',
    stakeholders: '',
  })

  function update(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.name.trim()) {
      toast.error('Project name is required')
      return
    }
    setLoading(true)
    try {
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) {
        router.push('/auth/login')
        return
      }

      const { data, error } = await supabase
        .from('strategy_projects')
        .insert({
          user_id: user.id,
          name: form.name,
          negotiation_for: form.negotiation_for || null,
          stakeholders: form.stakeholders || null,
          status: 'in_progress',
        })
        .select('id')
        .single()

      if (error) throw error
      toast.success('Strategy project created!')
      router.push(`/strategy/${data.id}/setup`)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to create project')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'var(--brand-navy)' }}>
      <header className="border-b border-white/10 bg-black/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center">
          <Link
            href="/dashboard"
            className="flex items-center gap-2 text-white/60 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm">Dashboard</span>
          </Link>
        </div>
      </header>

      <main className="flex-1 flex items-start justify-center px-4 py-16">
        <div className="w-full max-w-lg">
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-white mb-2">New Strategy Project</h1>
            <p className="text-white/50 text-sm">
              Set up your negotiation strategy project. You can fill in more details in the next
              step.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="nsp-card rounded-xl p-6 space-y-5">
              <div className="space-y-1.5">
                <Label htmlFor="name" className="text-white/80">
                  Project Name <span className="text-teal-400">*</span>
                </Label>
                <Input
                  id="name"
                  value={form.name}
                  onChange={(e) => update('name', e.target.value)}
                  placeholder="e.g. 2025 Supplier Contract Renewal"
                  required
                  className="bg-white/5 border-white/10 text-white placeholder:text-white/30"
                />
                <p className="text-white/30 text-xs">Give this negotiation a clear, memorable name</p>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="negotiation_for" className="text-white/80">
                  Negotiation For
                </Label>
                <Input
                  id="negotiation_for"
                  value={form.negotiation_for}
                  onChange={(e) => update('negotiation_for', e.target.value)}
                  placeholder="e.g. Acme Corp — new 3-year IT services agreement"
                  className="bg-white/5 border-white/10 text-white placeholder:text-white/30"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="stakeholders" className="text-white/80">
                  Key Stakeholders
                </Label>
                <Textarea
                  id="stakeholders"
                  value={form.stakeholders}
                  onChange={(e) => update('stakeholders', e.target.value)}
                  placeholder="e.g. John Smith (CEO), Sarah Jones (Procurement Director)"
                  rows={3}
                  className="bg-white/5 border-white/10 text-white placeholder:text-white/30 resize-none"
                />
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Button
                type="submit"
                disabled={loading}
                className="flex-1 bg-teal-600 hover:bg-teal-500 text-white"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                Create & Start Strategy
              </Button>
              <Link href="/dashboard">
                <Button
                  type="button"
                  variant="ghost"
                  className="text-white/50 hover:text-white/80"
                >
                  Cancel
                </Button>
              </Link>
            </div>
          </form>
        </div>
      </main>
    </div>
  )
}
