import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Plus, ArrowRight, ExternalLink, Calendar, Clock, Trash2 } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import type { StrategyProject } from '@/lib/supabase/types'

export default async function DashboardPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/auth/login')

  const { data: projects } = await supabase
    .from('strategy_projects')
    .select('*')
    .eq('user_id', user.id)
    .order('updated_at', { ascending: false })
    .returns<StrategyProject[]>()

  return (
    <div className="min-h-screen" style={{ background: 'var(--brand-navy)' }}>
      {/* Header */}
      <header className="border-b border-white/10 bg-black/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div>
            <div className="text-white font-bold text-lg">Negotiation Strategy Pro</div>
            <div className="text-teal-400 text-xs tracking-widest uppercase">
              Chameleon Partnership
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-white/40 text-sm hidden sm:inline">{user.email}</span>
            <form action="/auth/signout" method="post">
              <Button
                variant="ghost"
                size="sm"
                className="text-white/50 hover:text-white/80"
                formAction="/api/auth/signout"
              >
                Sign Out
              </Button>
            </form>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* NNP Banner */}
        <Link
          href={process.env.NEXT_PUBLIC_NNP_URL || 'https://www.negotiation-navigator.pro'}
          target="_blank"
          className="flex items-center justify-between nsp-card rounded-xl px-5 py-3.5 mb-8 hover:bg-teal-500/10 transition-colors group"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-teal-500/20 flex items-center justify-center">
              <ArrowRight className="w-4 h-4 text-teal-400" />
            </div>
            <div>
              <div className="text-white/90 text-sm font-medium">
                Need a tactical plan?
              </div>
              <div className="text-white/40 text-xs">
                Negotiation Navigator Pro — session-level tactical guidance
              </div>
            </div>
          </div>
          <ExternalLink className="w-4 h-4 text-teal-400 group-hover:text-teal-300 transition-colors" />
        </Link>

        {/* Page title + CTA */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-white">Strategy Projects</h1>
            <p className="text-white/50 text-sm mt-1">
              {projects?.length || 0} project{(projects?.length || 0) !== 1 ? 's' : ''}
            </p>
          </div>
          <Link href="/strategy/new">
            <Button className="bg-teal-600 hover:bg-teal-500 text-white">
              <Plus className="w-4 h-4 mr-2" />
              New Strategy
            </Button>
          </Link>
        </div>

        {/* Projects grid */}
        {!projects || projects.length === 0 ? (
          <div className="text-center py-20 nsp-card rounded-2xl">
            <div className="text-white/20 text-6xl mb-4">📋</div>
            <h2 className="text-white/60 text-lg font-medium mb-2">No strategies yet</h2>
            <p className="text-white/40 text-sm mb-6">
              Create your first negotiation strategy to get started
            </p>
            <Link href="/strategy/new">
              <Button className="bg-teal-600 hover:bg-teal-500 text-white">
                <Plus className="w-4 h-4 mr-2" />
                Create Strategy
              </Button>
            </Link>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {projects.map((project) => (
              <ProjectCard key={project.id} project={project} />
            ))}
          </div>
        )}
      </main>
    </div>
  )
}

function ProjectCard({ project }: { project: StrategyProject }) {
  const p = project

  const statusLabel = p.status === 'complete' ? 'Complete' : 'In Progress'
  const statusColor = p.status === 'complete' ? 'bg-teal-500/20 text-teal-300' : 'bg-yellow-500/20 text-yellow-300'

  return (
    <div className="nsp-card rounded-xl p-5 flex flex-col gap-4 hover:bg-white/[0.06] transition-colors">
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <h3 className="text-white font-semibold truncate">{p.name}</h3>
          {p.negotiation_for && (
            <p className="text-white/50 text-xs mt-0.5 truncate">{p.negotiation_for}</p>
          )}
        </div>
        <span className={`text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0 ${statusColor}`}>
          {statusLabel}
        </span>
      </div>

      <div className="flex items-center gap-4 text-white/40 text-xs">
        <div className="flex items-center gap-1">
          <Clock className="w-3 h-3" />
          <span>{formatDistanceToNow(new Date(p.updated_at))} ago</span>
        </div>
        {p.start_date && (
          <div className="flex items-center gap-1">
            <Calendar className="w-3 h-3" />
            <span>{new Date(p.start_date).toLocaleDateString()}</span>
          </div>
        )}
      </div>

      <div className="flex items-center gap-2 mt-auto">
        <Link href={`/strategy/${p.id}`} className="flex-1">
          <Button
            variant="outline"
            size="sm"
            className="w-full border-white/10 text-white/80 hover:bg-white/10 hover:border-white/20"
          >
            Open Strategy
          </Button>
        </Link>
        <Link href={`/strategy/${p.id}/report`}>
          <Button
            variant="ghost"
            size="sm"
            className="text-teal-400 hover:text-teal-300 hover:bg-teal-500/10"
          >
            Report
          </Button>
        </Link>
      </div>
    </div>
  )
}
