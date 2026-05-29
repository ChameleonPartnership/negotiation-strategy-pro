import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'
import { WIZARD_STEPS } from '@/lib/decision-tree'
import { CheckCircle, Circle, ArrowRight, ChevronLeft, FileText } from 'lucide-react'

export default async function StrategyHubPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/auth/login')

  const { data: project } = await supabase
    .from('strategy_projects')
    .select('*')
    .eq('id', id)
    .eq('user_id', user.id)
    .single()

  if (!project) notFound()

  // Check which steps have data
  const [scoping, orientation, approach, power, strategy, scenarios, ppa, triggers] = await Promise.all([
    supabase.from('scoping').select('id').eq('project_id', id).maybeSingle(),
    supabase.from('orientation').select('id,result').eq('project_id', id).maybeSingle(),
    supabase.from('approach').select('id,result').eq('project_id', id).maybeSingle(),
    supabase.from('power_state').select('id,power_state').eq('project_id', id).maybeSingle(),
    supabase.from('strategy_selection').select('id,final_strategy').eq('project_id', id).maybeSingle(),
    supabase.from('scenarios').select('id').eq('project_id', id),
    supabase.from('ppa').select('id').limit(1),
    supabase.from('triggers').select('id').eq('project_id', id).maybeSingle(),
  ])

  const completedSteps: number[] = []
  if (project.name) completedSteps.push(1)
  if (scoping.data) completedSteps.push(2)
  if (orientation.data?.result) completedSteps.push(3)
  if (approach.data?.result) completedSteps.push(4)
  if (power.data?.power_state) completedSteps.push(5)
  if (strategy.data?.final_strategy) completedSteps.push(6)
  if ((scenarios.data?.length ?? 0) > 0) completedSteps.push(7)
  if ((ppa.data?.length ?? 0) > 0) completedSteps.push(8)
  if (triggers.data) completedSteps.push(9)

  const overallPct = Math.round((completedSteps.length / WIZARD_STEPS.length) * 100)

  return (
    <div className="min-h-screen" style={{ background: 'var(--brand-navy)' }}>
      <header className="border-b border-white/10 bg-black/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between">
          <Link
            href="/dashboard"
            className="flex items-center gap-2 text-white/60 hover:text-white transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            <span className="text-sm">Dashboard</span>
          </Link>
          <Link href={`/strategy/${id}/report`}>
            <Button
              size="sm"
              variant="outline"
              className="border-teal-500/30 text-teal-400 hover:bg-teal-500/10"
            >
              <FileText className="w-4 h-4 mr-2" />
              View Report
            </Button>
          </Link>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Project header */}
        <div className="mb-10">
          <h1 className="text-3xl font-bold text-white">{project.name}</h1>
          {project.negotiation_for && (
            <p className="text-white/50 mt-1">{project.negotiation_for}</p>
          )}

          {/* Progress bar */}
          <div className="mt-6 nsp-card rounded-xl p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-white/70 text-sm font-medium">Overall Progress</span>
              <span className="text-teal-400 font-bold text-sm">{overallPct}%</span>
            </div>
            <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{ width: `${overallPct}%`, background: 'var(--brand-teal)' }}
              />
            </div>
            <div className="flex items-center gap-2 mt-3">
              {power.data?.power_state && (
                <span className="text-xs bg-white/10 text-white/60 px-2 py-0.5 rounded-full capitalize">
                  Power: {power.data.power_state}
                </span>
              )}
              {strategy.data?.final_strategy && (
                <span className="text-xs bg-teal-500/20 text-teal-300 px-2 py-0.5 rounded-full">
                  Strategy: {strategy.data.final_strategy}
                </span>
              )}
              {orientation.data?.result && (
                <span className="text-xs bg-white/10 text-white/60 px-2 py-0.5 rounded-full capitalize">
                  {orientation.data.result}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Steps grid */}
        <div className="grid sm:grid-cols-2 gap-3">
          {WIZARD_STEPS.map((step) => {
            const isComplete = completedSteps.includes(step.step)
            const isNext = !isComplete && step.step === (completedSteps.length + 1)
            return (
              <Link key={step.key} href={`/strategy/${id}/${step.path}`}>
                <div
                  className={`nsp-card rounded-xl p-4 flex items-center gap-3 transition-all hover:scale-[1.01] cursor-pointer ${
                    isNext ? 'border border-teal-500/40 bg-teal-500/5' : ''
                  }`}
                >
                  <div className="flex-shrink-0">
                    {isComplete ? (
                      <CheckCircle className="w-5 h-5 text-teal-400" />
                    ) : isNext ? (
                      <div className="w-5 h-5 rounded-full border-2 border-teal-400 flex items-center justify-center">
                        <div className="w-2 h-2 rounded-full bg-teal-400" />
                      </div>
                    ) : (
                      <Circle className="w-5 h-5 text-white/20" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-white/40 text-xs w-5">
                        {step.step}
                      </span>
                      <span
                        className={`text-sm font-medium ${
                          isComplete
                            ? 'text-teal-300'
                            : isNext
                            ? 'text-white'
                            : 'text-white/60'
                        }`}
                      >
                        {step.label}
                      </span>
                    </div>
                  </div>
                  <ArrowRight
                    className={`w-4 h-4 flex-shrink-0 ${
                      isNext ? 'text-teal-400' : 'text-white/20'
                    }`}
                  />
                </div>
              </Link>
            )
          })}
        </div>

        {/* Report CTA */}
        <div className="mt-8 nsp-card rounded-xl p-5 flex items-center justify-between">
          <div>
            <div className="text-white font-medium">Final Report & PDF Export</div>
            <div className="text-white/40 text-sm">
              Generate your complete negotiation strategy document
            </div>
          </div>
          <Link href={`/strategy/${id}/report`}>
            <Button className="bg-teal-600 hover:bg-teal-500 text-white">
              <FileText className="w-4 h-4 mr-2" />
              View Report
            </Button>
          </Link>
        </div>
      </main>
    </div>
  )
}
